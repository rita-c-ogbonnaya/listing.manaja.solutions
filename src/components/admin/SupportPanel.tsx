import { useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2, MessageSquare, Send, Trash2, X, Mail, Search, CheckCircle2,
  AlertCircle, Clock, UserPlus, History, RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Ticket = {
  id: string; type: string; name: string; email: string; company: string | null;
  phone: string | null; subject: string; message: string; status: string;
  priority: string; source: string | null; internal_notes: string | null;
  assignee: string | null; first_response_at: string | null; sla_due_at: string | null;
  created_at: string; updated_at: string;
};
type Reply = {
  id: string; ticket_id: string; direction: "inbound" | "outbound";
  author: string | null; body: string; is_internal: boolean;
  email_message_id: string | null; created_at: string;
};
type SendAttempt = {
  id: string; ticket_id: string; reply_id: string | null;
  status: "sent" | "failed"; provider_message_id: string | null;
  error: string | null; body_preview: string | null;
  attempted_by: string | null; created_at: string;
};

const STATUSES = ["new", "in_progress", "resolved", "closed"];
const PRIORITIES = ["low", "normal", "high", "urgent"];
const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  in_progress: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  resolved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  closed: "bg-muted text-muted-foreground border-border",
};
const REPLY_MAX = 5000;
const COMMON_ASSIGNEES = ["Unassigned", "Support Team", "Engineering", "Founders"];

async function callSupport<T = any>(password: string, action: string, payload?: any): Promise<T> {
  const { data, error } = await supabase.functions.invoke("admin-support", {
    body: { password, action, ...(payload || {}) },
  });
  if (error) throw new Error(error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}
function fmt(iso: string) { try { return new Date(iso).toLocaleString(); } catch { return iso; } }
function fmtRelative(iso: string | null): { label: string; tone: "ok" | "warn" | "danger" } {
  if (!iso) return { label: "—", tone: "ok" };
  const ms = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(ms);
  const mins = Math.round(abs / 60000);
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  const label = hrs > 0 ? `${hrs}h ${remainMins}m` : `${mins}m`;
  if (ms < 0) return { label: `${label} overdue`, tone: "danger" };
  if (ms < 60 * 60 * 1000) return { label: `${label} left`, tone: "warn" };
  return { label: `${label} left`, tone: "ok" };
}
const slaToneClass = (tone: "ok" | "warn" | "danger") =>
  tone === "danger" ? "bg-destructive/15 text-destructive border-destructive/30"
  : tone === "warn" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
  : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";

export function SupportPanel({ password }: { password: string }) {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const [active, setActive] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [attempts, setAttempts] = useState<SendAttempt[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [threadLoading, setThreadLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [draftDirty, setDraftDirty] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [lastDelivery, setLastDelivery] = useState<{ ok: boolean; messageId?: string; error?: string; body?: string } | null>(null);
  const [, force] = useState(0);

  // Re-render every 60s so SLA timers update live
  useEffect(() => { const id = setInterval(() => force((x) => x + 1), 60_000); return () => clearInterval(id); }, []);

  async function refresh() {
    setLoading(true);
    try {
      const r = await callSupport<{ data: Ticket[] }>(password, "list");
      setTickets(r.data || []);
    } catch (e: any) {
      toast({ title: "Failed to load tickets", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); /* eslint-disable-next-line */ }, []);

  async function openTicket(t: Ticket) {
    setActive(t); setReplies([]); setAttempts([]); setShowHistory(false);
    setLastDelivery(null); setReply(""); setDraftDirty(false); setDraftSavedAt(null);
    setNote(t.internal_notes ?? "");
    setThreadLoading(true);
    try {
      const [thread, draftRes, attemptsRes] = await Promise.all([
        callSupport<{ ticket: Ticket; replies: Reply[] }>(password, "thread", { ticket_id: t.id }),
        callSupport<{ draft: { body: string; updated_at: string; updated_by: string | null } | null }>(password, "get_draft", { ticket_id: t.id }),
        callSupport<{ data: SendAttempt[] }>(password, "send_attempts", { ticket_id: t.id }),
      ]);
      setReplies(thread.replies);
      setActive(thread.ticket);
      setNote(thread.ticket.internal_notes ?? "");
      if (draftRes.draft?.body) {
        setReply(draftRes.draft.body);
        setDraftSavedAt(draftRes.draft.updated_at);
      }
      setAttempts(attemptsRes.data || []);
    } catch (e: any) {
      toast({ title: "Failed to load thread", description: e.message, variant: "destructive" });
    } finally { setThreadLoading(false); }
  }

  // Debounced server-side draft save
  const draftTimer = useRef<number | null>(null);
  useEffect(() => {
    if (!active || !draftDirty) return;
    if (draftTimer.current) window.clearTimeout(draftTimer.current);
    draftTimer.current = window.setTimeout(async () => {
      try {
        await callSupport(password, "save_draft", { ticket_id: active.id, body: reply });
        setDraftSavedAt(new Date().toISOString());
        setDraftDirty(false);
      } catch (e: any) {
        // Soft-fail; keep dirty so we retry on next change
        console.warn("draft save failed", e);
      }
    }, 800);
    return () => { if (draftTimer.current) window.clearTimeout(draftTimer.current); };
  }, [reply, draftDirty, active, password]);

  function closeModal() { setActive(null); setLastDelivery(null); }

  async function setField(t: Ticket, patch: Partial<Ticket>) {
    try {
      const { data } = await callSupport<{ data: Ticket }>(password, "update", { id: t.id, ...patch });
      setTickets((prev) => prev.map((x) => x.id === t.id ? { ...x, ...data } : x));
      if (active?.id === t.id) setActive({ ...active, ...data });
    } catch (e: any) { toast({ title: "Update failed", description: e.message, variant: "destructive" }); }
  }
  async function saveNote() {
    if (!active) return;
    try {
      await callSupport(password, "update", { id: active.id, internal_notes: note });
      toast({ title: "Note saved" });
      setActive({ ...active, internal_notes: note });
    } catch (e: any) { toast({ title: "Save failed", description: e.message, variant: "destructive" }); }
  }

  async function doSend(text: string) {
    if (!active || !text.trim() || sending) return;
    setSending(true); setLastDelivery(null);
    try {
      const res = await callSupport<{ ok: boolean; message_id?: string }>(password, "reply", { ticket_id: active.id, body: text.trim() });
      const messageId = res?.message_id;
      setLastDelivery({ ok: true, messageId, body: text.trim() });
      toast({ title: "Reply sent", description: `Email delivered to ${active.email}${messageId ? ` · id ${messageId.slice(0, 8)}…` : ""}` });
      setReply(""); setDraftDirty(false); setDraftSavedAt(null);
      await openTicket(active);
      await refresh();
    } catch (e: any) {
      const msg = e?.message || "Unknown error";
      setLastDelivery({ ok: false, error: msg, body: text });
      toast({ title: "Reply failed", description: msg, variant: "destructive" });
      // Reload attempts so the failure shows up in history
      try {
        const r = await callSupport<{ data: SendAttempt[] }>(password, "send_attempts", { ticket_id: active.id });
        setAttempts(r.data || []);
      } catch { /* ignore */ }
    } finally { setSending(false); }
  }
  function sendReply() { void doSend(reply); }
  function retryFailed() { if (lastDelivery?.body) { setReply(lastDelivery.body); void doSend(lastDelivery.body); } }

  async function remove(t: Ticket) {
    if (!confirm(`Delete ticket from ${t.name}? This cannot be undone.`)) return;
    try {
      await callSupport(password, "delete", { id: t.id });
      if (active?.id === t.id) closeModal();
      setSelected((prev) => { const n = new Set(prev); n.delete(t.id); return n; });
      await refresh();
    } catch (e: any) { toast({ title: "Delete failed", description: e.message, variant: "destructive" }); }
  }

  // ---- Filters ----
  const types = useMemo(() => Array.from(new Set(tickets.map((t) => t.type))).sort(), [tickets]);
  const assignees = useMemo(() => Array.from(new Set(tickets.map((t) => t.assignee).filter(Boolean) as string[])).sort(), [tickets]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromTs = dateFrom ? new Date(dateFrom + "T00:00:00").getTime() : null;
    const toTs = dateTo ? new Date(dateTo + "T23:59:59").getTime() : null;
    return tickets.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (assigneeFilter !== "all") {
        if (assigneeFilter === "__unassigned__") { if (t.assignee) return false; }
        else if (t.assignee !== assigneeFilter) return false;
      }
      if (fromTs || toTs) {
        const ts = new Date(t.created_at).getTime();
        if (fromTs && ts < fromTs) return false;
        if (toTs && ts > toTs) return false;
      }
      if (q) {
        const hay = `${t.subject} ${t.name} ${t.email} ${t.company ?? ""} ${t.message} ${t.assignee ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tickets, statusFilter, typeFilter, priorityFilter, assigneeFilter, search, dateFrom, dateTo]);

  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: tickets.filter((t) => t.status === s).length }), { all: tickets.length } as Record<string, number>);

  // ---- Bulk ----
  const visibleIds = visible.map((t) => t.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  function toggleAllVisible() {
    setSelected((prev) => {
      const n = new Set(prev);
      if (allVisibleSelected) visibleIds.forEach((id) => n.delete(id));
      else visibleIds.forEach((id) => n.add(id));
      return n;
    });
  }
  function toggleOne(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  async function bulkUpdate(patch: { status?: string; priority?: string; assignee?: string }) {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      await callSupport(password, "bulk_update", { ids, ...patch });
      toast({ title: `Updated ${ids.length} ticket(s)` });
      await refresh();
    } catch (e: any) {
      toast({ title: "Bulk update failed", description: e.message, variant: "destructive" });
    } finally { setBulkBusy(false); }
  }
  async function bulkDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} ticket(s)? This cannot be undone.`)) return;
    setBulkBusy(true);
    try {
      await callSupport(password, "bulk_delete", { ids });
      toast({ title: `Deleted ${ids.length} ticket(s)` });
      setSelected(new Set());
      await refresh();
    } catch (e: any) {
      toast({ title: "Bulk delete failed", description: e.message, variant: "destructive" });
    } finally { setBulkBusy(false); }
  }

  // ---- UI helpers ----
  const replyLen = reply.length;
  const overLimit = replyLen > REPLY_MAX;
  const hasFilters = statusFilter !== "all" || typeFilter !== "all" || priorityFilter !== "all" || assigneeFilter !== "all" || search || dateFrom || dateTo;
  function clearFilters() {
    setStatusFilter("all"); setTypeFilter("all"); setPriorityFilter("all");
    setAssigneeFilter("all"); setSearch(""); setDateFrom(""); setDateTo("");
  }
  const assigneeOptions = Array.from(new Set([...COMMON_ASSIGNEES, ...assignees])).filter((x) => x !== "Unassigned");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Support tickets ({tickets.length})</h2>
        <div className="flex gap-1 flex-wrap">
          {(["all", ...STATUSES] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}>
              {s.replace("_", " ")} <span className="opacity-60">({(counts as any)[s] ?? 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search + filters */}
      <div className="grid gap-2 md:grid-cols-[1fr_auto_auto_auto_auto_auto_auto] items-end">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subject, name, email, company, assignee…" className="pl-9" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-2 text-sm">
          <option value="all">All types</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-2 text-sm">
          <option value="all">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-2 text-sm">
          <option value="all">All assignees</option>
          <option value="__unassigned__">Unassigned</option>
          {assignees.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <div>
          <Label className="text-[10px] uppercase text-muted-foreground">From</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-10" />
        </div>
        <div>
          <Label className="text-[10px] uppercase text-muted-foreground">To</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-10" />
        </div>
        <Button variant="outline" onClick={clearFilters} disabled={!hasFilters}>Clear</Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
        <Checkbox checked={allVisibleSelected} onCheckedChange={toggleAllVisible} aria-label="Select all visible" />
        <span>{visible.length} of {tickets.length} shown · {selected.size} selected</span>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl border border-primary/30 bg-primary/5">
          <span className="text-xs font-medium text-foreground">{selected.size} selected</span>
          <select disabled={bulkBusy} onChange={(e) => { if (e.target.value) { void bulkUpdate({ status: e.target.value }); e.target.value = ""; } }} className="h-9 rounded-md border border-input bg-background px-2 text-xs">
            <option value="">Set status…</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
          <select disabled={bulkBusy} onChange={(e) => { if (e.target.value) { void bulkUpdate({ priority: e.target.value }); e.target.value = ""; } }} className="h-9 rounded-md border border-input bg-background px-2 text-xs">
            <option value="">Set priority…</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select disabled={bulkBusy} onChange={(e) => { if (e.target.value) { void bulkUpdate({ assignee: e.target.value === "__none__" ? "" : e.target.value }); e.target.value = ""; } }} className="h-9 rounded-md border border-input bg-background px-2 text-xs">
            <option value="">Assign to…</option>
            <option value="__none__">Unassign</option>
            {assigneeOptions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => void bulkUpdate({ status: "resolved" })}>Mark resolved</Button>
          <Button size="sm" variant="outline" disabled={bulkBusy} onClick={bulkDelete}><Trash2 className="h-3.5 w-3.5 mr-1" />Delete</Button>
          <Button size="sm" variant="ghost" disabled={bulkBusy} onClick={() => setSelected(new Set())}>Clear</Button>
          {bulkBusy && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
      )}

      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground p-6 border border-dashed border-border rounded-xl text-center">No tickets match these filters.</p>
      ) : (
        <div className="space-y-2">
          {visible.map((t) => {
            const sla = fmtRelative(t.sla_due_at);
            const isClosedish = t.status === "resolved" || t.status === "closed";
            return (
              <div key={t.id} className="p-4 rounded-xl border border-border bg-card flex items-start justify-between gap-3">
                <div className="pt-1"><Checkbox checked={selected.has(t.id)} onCheckedChange={() => toggleOne(t.id)} aria-label="Select ticket" /></div>
                <button className="min-w-0 text-left flex-1" onClick={() => openTicket(t)}>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-foreground">{t.subject}</span>
                    <Badge variant="outline" className={`${STATUS_COLORS[t.status] || ""} text-xs`}>{t.status.replace("_", " ")}</Badge>
                    <Badge variant="outline" className="text-xs">{t.type}</Badge>
                    <Badge variant="outline" className="text-xs">{t.priority}</Badge>
                    {!isClosedish && (
                      <Badge variant="outline" className={`text-xs inline-flex items-center gap-1 ${slaToneClass(sla.tone)}`}>
                        <Clock className="h-3 w-3" /> {sla.label}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs inline-flex items-center gap-1">
                      <UserPlus className="h-3 w-3" /> {t.assignee || "Unassigned"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.name} · {t.email}{t.company ? ` · ${t.company}` : ""} · {fmt(t.created_at)}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{t.message}</p>
                </button>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => openTicket(t)}><Mail className="h-3.5 w-3.5 mr-1" /> Open</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(t)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {active && (() => {
        const sla = fmtRelative(active.sla_due_at);
        const isClosedish = active.status === "resolved" || active.status === "closed";
        return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-24 pb-8 bg-black/60 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-foreground text-lg">{active.subject}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">From <span className="text-foreground">{active.name}</span> &lt;{active.email}&gt;{active.company ? ` · ${active.company}` : ""}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Label className="text-xs">Status:</Label>
                  <select value={active.status} onChange={(e) => setField(active, { status: e.target.value })} className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </select>
                  <Label className="text-xs ml-2">Priority:</Label>
                  <select value={active.priority} onChange={(e) => setField(active, { priority: e.target.value })} className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <Label className="text-xs ml-2">Assignee:</Label>
                  <select value={active.assignee || ""} onChange={(e) => setField(active, { assignee: e.target.value })} className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                    <option value="">Unassigned</option>
                    {assigneeOptions.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <Badge variant="outline" className="text-xs">{active.type}</Badge>
                  {!isClosedish && (
                    <Badge variant="outline" className={`text-xs inline-flex items-center gap-1 ${slaToneClass(sla.tone)}`}>
                      <Clock className="h-3 w-3" /> SLA {sla.label}
                    </Badge>
                  )}
                  {active.first_response_at && (
                    <span className="text-[11px] text-muted-foreground">First response {fmt(active.first_response_at)}</span>
                  )}
                </div>
              </div>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>

            <div className="border border-border rounded-lg divide-y divide-border bg-background">
              {threadLoading ? <div className="p-4"><Loader2 className="h-4 w-4 animate-spin" /></div> : replies.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground italic">No messages yet.</div>
              ) : replies.map((r) => (
                <div key={r.id} className={`p-4 ${r.direction === "outbound" ? "bg-primary/5" : ""} ${r.is_internal ? "bg-amber-500/5" : ""}`}>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-medium text-foreground">{r.author || (r.direction === "inbound" ? active.name : "Manaja Support")}</span>
                    <Badge variant="outline" className="text-[10px] py-0">{r.direction === "inbound" ? "Client" : r.is_internal ? "Internal note" : "Reply"}</Badge>
                    <span className="text-[11px] text-muted-foreground">{fmt(r.created_at)}</span>
                    {r.email_message_id && (
                      <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1" title={`Provider message id: ${r.email_message_id}`}>
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" /> id {r.email_message_id.slice(0, 8)}…
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{r.body}</p>
                </div>
              ))}
            </div>

            {/* Delivery history */}
            <div className="border border-border rounded-lg bg-background">
              <button type="button" onClick={() => setShowHistory((s) => !s)} className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50">
                <span className="inline-flex items-center gap-2"><History className="h-4 w-4" /> Delivery history ({attempts.length})</span>
                <span className="text-xs text-muted-foreground">{showHistory ? "Hide" : "Show"}</span>
              </button>
              {showHistory && (
                attempts.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-muted-foreground italic">No send attempts recorded yet.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {attempts.map((a) => (
                      <li key={a.id} className="px-4 py-2 text-xs flex items-start gap-3">
                        {a.status === "sent" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" /> : <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-foreground capitalize">{a.status}</span>
                            <span className="text-muted-foreground">{fmt(a.created_at)}</span>
                            <span className="text-muted-foreground">by {a.attempted_by || "—"}</span>
                            {a.provider_message_id && <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{a.provider_message_id}</code>}
                          </div>
                          {a.error && <p className="text-destructive mt-0.5">{a.error}</p>}
                          {a.body_preview && <p className="text-muted-foreground mt-0.5 line-clamp-2">{a.body_preview}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Reply to client (sends an email)</Label>
                <span className={`text-[11px] ${overLimit ? "text-destructive" : "text-muted-foreground"}`}>{replyLen.toLocaleString()} / {REPLY_MAX.toLocaleString()}</span>
              </div>
              <textarea
                disabled={sending}
                className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"
                value={reply}
                onChange={(e) => { setReply(e.target.value); setDraftDirty(true); }}
                placeholder={`Hi ${active.name}, thanks for reaching out…`}
              />
              {lastDelivery && (
                lastDelivery.ok ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-md px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Email delivered to <span className="font-medium">{active.email}</span>{lastDelivery.messageId ? <> · provider id <code className="text-[10px]">{lastDelivery.messageId}</code></> : null}</span>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span className="min-w-0">Send failed: {lastDelivery.error}</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={retryFailed} disabled={sending} className="shrink-0">
                      <RotateCw className="h-3.5 w-3.5 mr-1" /> Retry
                    </Button>
                  </div>
                )
              )}
              <div className="flex justify-between items-center gap-2">
                <span className="text-[11px] text-muted-foreground">
                  {draftDirty ? "Saving draft…" : draftSavedAt ? `Draft saved ${fmt(draftSavedAt)} (synced across devices)` : reply ? "Draft auto-saves to server" : "\u00A0"}
                </span>
                <Button onClick={sendReply} disabled={sending || !reply.trim() || overLimit}>
                  {sending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Sending…</> : <><Send className="h-4 w-4 mr-1" /> Send reply</>}
                </Button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <Label>Internal notes (only visible to admins)</Label>
              <textarea disabled={sending} className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60" value={note} onChange={(e) => setNote(e.target.value)} />
              <div className="flex justify-end">
                <Button variant="outline" onClick={saveNote} disabled={sending}>Save note</Button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
