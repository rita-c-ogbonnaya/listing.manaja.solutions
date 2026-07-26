import { useEffect, useMemo, useState } from "react";

import { Loader2, Lock, RefreshCw, Mail, MessageSquare, Eye, EyeOff, Briefcase, Users, BookOpen, Map, Layers, Settings as SettingsIcon, KeyRound, Bot, Sparkles, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  VacanciesPanel,
  BlogPanel,
  TeamPanel,
  RoadmapPanel,
  ModulesPanel,
  AdminSettingsPanel,
  PopupPanel,
} from "@/components/admin/CmsPanels";
import { SupportPanel } from "@/components/admin/SupportPanel";

type RoadmapRow = {
  id: string; email: string; name: string | null; status: string; source: string | null; created_at: string;
};
type SupportRow = {
  id: string; type: string; name: string; email: string; company: string | null; subject: string; status: string; created_at: string;
};
type ChatRow = {
  id: string; session_id: string; visitor_name: string | null; visitor_email: string | null;
  escalated: boolean; message_count: number; last_message_at: string; created_at: string;
};
type WaitRow = {
  id: string; module_slug: string; module_title: string; email: string; name: string | null; company: string | null; source: string | null; created_at: string;
};
type ChatMessage = { id: string; role: string; content: string; created_at: string };

const STORAGE_KEY = "manaja:admin-token";

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

export default function AdminSubmissions() {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapRow[]>([]);
  const [support, setSupport] = useState<SupportRow[]>([]);
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [waitlist, setWaitlist] = useState<WaitRow[]>([]);
  const [activeChat, setActiveChat] = useState<ChatRow | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState<"roadmap" | "support" | "chats" | "waitlist" | "vacancies" | "blog" | "team" | "modules" | "roadmap-cms" | "popup" | "settings">("roadmap");
  const [showPw, setShowPw] = useState(false);
  const [idleWarn, setIdleWarn] = useState(false);

  // Forgot/Reset state
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSending, setForgotSending] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetTokenValid, setResetTokenValid] = useState<boolean | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    document.title = "Admin · Submissions Log | Manaja";
    let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robots) {
      robots = document.createElement("meta"); robots.name = "robots"; document.head.appendChild(robots);
    }
    const prev = robots.content; robots.content = "noindex,nofollow";
    return () => { if (robots) robots.content = prev; };
  }, []);

  // Detect ?reset=TOKEN in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("reset");
    if (token) {
      setResetToken(token);
      void (async () => {
        try {
          const { data } = await supabase.functions.invoke("admin-cms", {
            body: { action: "verify_reset_token", token },
          });
          setResetTokenValid(!!(data as any)?.valid);
        } catch { setResetTokenValid(false); }
      })();
    }
  }, []);

  useEffect(() => {
    if (resetToken) return; // don't auto-login during reset
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) { setPassword(stored); void fetchData(stored, true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetToken]);

  function logout(reason?: string) {
    setAuthed(false);
    setPassword("");
    setIdleWarn(false);
    sessionStorage.removeItem(STORAGE_KEY);
    if (reason) toast({ title: "Signed out", description: reason });
  }

  // Auto-logout after inactivity: warn at 4 min, logout at 5 min
  useEffect(() => {
    if (!authed) return;
    let warnTimer: number | undefined;
    let logoutTimer: number | undefined;
    const reset = () => {
      setIdleWarn(false);
      window.clearTimeout(warnTimer);
      window.clearTimeout(logoutTimer);
      warnTimer = window.setTimeout(() => setIdleWarn(true), 4 * 60 * 1000);
      logoutTimer = window.setTimeout(() => logout("You were signed out after 5 minutes of inactivity."), 5 * 60 * 1000);
    };
    const events: (keyof WindowEventMap)[] = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      window.clearTimeout(warnTimer);
      window.clearTimeout(logoutTimer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  async function fetchData(pw: string, silent = false) {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-list-submissions", { body: { password: pw, type: "all", limit: 300 } });
      if (error || (data && (data as any).error)) {
        const msg = (data as any)?.error || error?.message || "Could not load data";
        if (/Unauthorized/i.test(msg)) {
          setAuthed(false); sessionStorage.removeItem(STORAGE_KEY);
          if (!silent) toast({ title: "Wrong password", description: "Please try again.", variant: "destructive" });
          return;
        }
        if (!silent) toast({ title: "Couldn't load submissions", description: msg, variant: "destructive" });
        return;
      }
      const payload = data as { roadmap: RoadmapRow[]; support: SupportRow[]; chats?: ChatRow[]; waitlist?: WaitRow[] };
      setRoadmap(payload.roadmap ?? []); setSupport(payload.support ?? []);
      setChats(payload.chats ?? []); setWaitlist(payload.waitlist ?? []);
      setAuthed(true); sessionStorage.setItem(STORAGE_KEY, pw);
    } catch (err) {
      console.error(err);
      if (!silent) toast({ title: "Network error", description: "Please try again.", variant: "destructive" });
    } finally { setLoading(false); }
  }

  async function handleForgot() {
    setForgotSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-cms", { body: { action: "request_password_reset" } });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      toast({
        title: "Reset link sent",
        description: `Check the recovery inbox (${(data as any)?.sent_to_masked || ""}).`,
      });
      setForgotMode(false);
    } catch (e: any) {
      toast({ title: "Failed to send", description: e.message, variant: "destructive" });
    } finally { setForgotSending(false); }
  }

  async function handleReset() {
    if (newPassword.length < 8) { toast({ title: "Too short", description: "Use at least 8 characters." }); return; }
    if (newPassword !== confirmPassword) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    setResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-cms", { body: { action: "consume_reset_token", token: resetToken, new_password: newPassword } });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      toast({ title: "Password updated", description: "You can now sign in." });
      // Clear token from URL
      window.history.replaceState({}, "", "/admin/submissions");
      setResetToken(null); setResetTokenValid(null); setNewPassword(""); setConfirmPassword("");
    } catch (e: any) {
      toast({ title: "Reset failed", description: e.message, variant: "destructive" });
    } finally { setResetting(false); }
  }

  const filteredRoadmap = useMemo(() => roadmap.filter((r) => filter ? `${r.email} ${r.name ?? ""}`.toLowerCase().includes(filter.toLowerCase()) : true), [roadmap, filter]);
  const filteredSupport = useMemo(() => support.filter((r) => filter ? `${r.email} ${r.name} ${r.subject} ${r.type}`.toLowerCase().includes(filter.toLowerCase()) : true), [support, filter]);
  const filteredChats = useMemo(() => chats.filter((r) => filter ? `${r.visitor_email ?? ""} ${r.visitor_name ?? ""} ${r.session_id}`.toLowerCase().includes(filter.toLowerCase()) : true), [chats, filter]);
  const filteredWaitlist = useMemo(() => waitlist.filter((r) => filter ? `${r.email} ${r.name ?? ""} ${r.module_title} ${r.module_slug}`.toLowerCase().includes(filter.toLowerCase()) : true), [waitlist, filter]);

  async function openChat(c: ChatRow) {
    setActiveChat(c); setChatMessages([]); setChatLoading(true);
    try {
      const { data } = await supabase.functions.invoke("admin-list-submissions", {
        body: { password, type: "chat_messages", conversation_id: c.id },
      });
      setChatMessages(((data as any)?.messages ?? []) as ChatMessage[]);
    } catch (e: any) {
      toast({ title: "Couldn't load chat", description: e.message, variant: "destructive" });
    } finally { setChatLoading(false); }
  }

  // ---- Reset password screen (when ?reset= in URL) ----
  if (resetToken) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 pt-32 pb-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><KeyRound className="h-5 w-5 text-primary" /></div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Reset admin password</h1>
              <p className="text-sm text-muted-foreground">Set a new password for the dashboard.</p>
            </div>
          </div>
          {resetTokenValid === null ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Verifying link…</div>
          ) : !resetTokenValid ? (
            <div className="text-sm text-destructive">This reset link is invalid or has expired. Please request a new one.</div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); void handleReset(); }} className="space-y-3">
              <div><Label>New password</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoFocus minLength={8} required /></div>
              <div><Label>Confirm new password</Label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} required /></div>
              <Button type="submit" disabled={resetting} className="btn-glass-primary text-primary-foreground border-0 w-full h-11">
                {resetting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating…</> : "Set new password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ---- Sign-in screen ----
  if (!authed) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 pt-32 pb-12">
        <form
          onSubmit={(e) => { e.preventDefault(); if (forgotMode) { void handleForgot(); } else if (password.trim()) { void fetchData(password.trim()); } }}
          className="w-full max-w-md rounded-2xl border border-border bg-card p-8 space-y-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Lock className="h-5 w-5 text-primary" /></div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Admin Submissions Log</h1>
              <p className="text-sm text-muted-foreground">Restricted area · enter the dashboard password</p>
            </div>
          </div>

          {forgotMode ? (
            <>
              <p className="text-sm text-muted-foreground">We'll email a one-time reset link to the recovery address on file. The link expires in 30 minutes.</p>
              <Button type="submit" disabled={forgotSending} className="btn-glass-primary text-primary-foreground border-0 w-full h-11">
                {forgotSending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</> : "Send reset link"}
              </Button>
              <button type="button" onClick={() => setForgotMode(false)} className="text-xs text-muted-foreground hover:text-foreground w-full text-center">Back to sign in</button>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="admin-password">Dashboard password</Label>
                <div className="relative">
                  <Input id="admin-password" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required autoFocus className="pr-10" />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground" aria-label={showPw ? "Hide password" : "Show password"}>
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading || !password.trim()} className="btn-glass-primary text-primary-foreground border-0 w-full h-11">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking…</> : "Sign in"}
              </Button>
              <button type="button" onClick={() => setForgotMode(true)} className="text-xs text-primary hover:underline w-full text-center">Forgot password?</button>
            </>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-32 pb-12 max-w-6xl">
      {idleWarn && (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-foreground">
          <span>You've been inactive. You'll be signed out in about a minute for security.</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setIdleWarn(false)}>Stay signed in</Button>
            <Button size="sm" variant="ghost" onClick={() => logout()}>Sign out now</Button>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Submissions Log</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {roadmap.length} roadmap · {support.length} support · {chats.length} chat{chats.length === 1 ? "" : "s"} · {waitlist.length} waitlist
          </p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Filter by email, name…" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full sm:w-64" />
          <Button variant="outline" onClick={() => void fetchData(password)} disabled={loading} aria-label="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" onClick={() => logout()} aria-label="Sign out">Sign out</Button>
        </div>
      </div>

      <div className="flex gap-1 mb-4 border-b border-border overflow-x-auto">
        {[
          { id: "roadmap", icon: Mail, label: `Roadmap (${filteredRoadmap.length})` },
          { id: "support", icon: MessageSquare, label: `Support (${support.length})` },
          { id: "chats", icon: Bot, label: `Chats (${chats.length})` },
          { id: "waitlist", icon: Sparkles, label: `Waitlist (${waitlist.length})` },
          { id: "vacancies", icon: Briefcase, label: "Vacancies" },
          { id: "blog", icon: BookOpen, label: "Blog" },
          { id: "team", icon: Users, label: "Team" },
          { id: "modules", icon: Layers, label: "Modules" },
          { id: "roadmap-cms", icon: Map, label: "Roadmap CMS" },
          { id: "popup", icon: ImageIcon, label: "Popup" },
          { id: "settings", icon: SettingsIcon, label: "Settings" },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id as typeof tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 whitespace-nowrap ${tab === id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "vacancies" ? <VacanciesPanel password={password} />
        : tab === "blog" ? <BlogPanel password={password} />
        : tab === "team" ? <TeamPanel password={password} />
        : tab === "modules" ? <ModulesPanel password={password} />
        : tab === "roadmap-cms" ? <RoadmapPanel password={password} />
        : tab === "popup" ? <PopupPanel password={password} />
        : tab === "settings" ? <AdminSettingsPanel password={password} />
        : tab === "support" ? <SupportPanel password={password} />
        : tab === "chats" ? (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="text-left p-3">Last activity</th><th className="text-left p-3">Visitor</th><th className="text-left p-3">Email</th><th className="text-left p-3">Messages</th><th className="text-left p-3">Escalated</th><th className="text-left p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChats.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No chatbot conversations yet.</td></tr>
                  ) : filteredChats.map((c) => (
                    <tr key={c.id} className="border-t border-border/60 hover:bg-muted/30 cursor-pointer" onClick={() => openChat(c)}>
                      <td className="p-3 whitespace-nowrap text-muted-foreground">{fmtDate(c.last_message_at)}</td>
                      <td className="p-3 text-foreground">{c.visitor_name ?? <span className="italic text-muted-foreground">Anonymous</span>}</td>
                      <td className="p-3 font-medium text-foreground">{c.visitor_email ?? "—"}</td>
                      <td className="p-3 text-muted-foreground">{c.message_count}</td>
                      <td className="p-3">{c.escalated ? <Badge variant="default">escalated</Badge> : <Badge variant="outline">no</Badge>}</td>
                      <td className="p-3 text-right"><Button size="sm" variant="outline">View</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
        : tab === "waitlist" ? (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="text-left p-3">Timestamp</th><th className="text-left p-3">Module</th><th className="text-left p-3">Email</th><th className="text-left p-3">Name</th><th className="text-left p-3">Company</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWaitlist.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No module waitlist signups yet.</td></tr>
                  ) : filteredWaitlist.map((r) => (
                    <tr key={r.id} className="border-t border-border/60">
                      <td className="p-3 whitespace-nowrap text-muted-foreground">{fmtDate(r.created_at)}</td>
                      <td className="p-3"><Badge variant="secondary">{r.module_title}</Badge></td>
                      <td className="p-3 font-medium text-foreground">{r.email}</td>
                      <td className="p-3 text-muted-foreground">{r.name ?? "—"}</td>
                      <td className="p-3 text-muted-foreground">{r.company ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
        : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {tab === "roadmap" ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="text-left p-3">Timestamp</th><th className="text-left p-3">Email</th><th className="text-left p-3">Name</th><th className="text-left p-3">Source</th><th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoadmap.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No roadmap signups yet.</td></tr>
                    ) : filteredRoadmap.map((r) => (
                      <tr key={r.id} className="border-t border-border/60">
                        <td className="p-3 whitespace-nowrap text-muted-foreground">{fmtDate(r.created_at)}</td>
                        <td className="p-3 font-medium text-foreground">{r.email}</td>
                        <td className="p-3 text-muted-foreground">{r.name ?? "—"}</td>
                        <td className="p-3 text-muted-foreground">{r.source ?? "—"}</td>
                        <td className="p-3"><Badge variant="secondary">{r.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="text-left p-3">Timestamp</th><th className="text-left p-3">Type</th><th className="text-left p-3">Name</th><th className="text-left p-3">Email</th><th className="text-left p-3">Company</th><th className="text-left p-3">Subject</th><th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSupport.length === 0 ? (
                      <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No support requests yet.</td></tr>
                    ) : filteredSupport.map((r) => (
                      <tr key={r.id} className="border-t border-border/60">
                        <td className="p-3 whitespace-nowrap text-muted-foreground">{fmtDate(r.created_at)}</td>
                        <td className="p-3"><Badge variant="outline">{r.type}</Badge></td>
                        <td className="p-3 text-foreground">{r.name}</td>
                        <td className="p-3 font-medium text-foreground">{r.email}</td>
                        <td className="p-3 text-muted-foreground">{r.company ?? "—"}</td>
                        <td className="p-3 text-muted-foreground max-w-[260px] truncate">{r.subject}</td>
                        <td className="p-3"><Badge variant="secondary">{r.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      {activeChat && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-24 pb-8 bg-black/60 backdrop-blur-sm" onClick={() => setActiveChat(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-foreground text-lg">Chat with {activeChat.visitor_name ?? "Anonymous visitor"}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeChat.visitor_email ?? "no email"} · session {activeChat.session_id.slice(0, 8)}… · {activeChat.message_count} message{activeChat.message_count === 1 ? "" : "s"}
                  {activeChat.escalated && <Badge className="ml-2" variant="default">escalated</Badge>}
                </p>
                <p className="text-[11px] text-muted-foreground">First seen {fmtDate(activeChat.created_at)} · last activity {fmtDate(activeChat.last_message_at)}</p>
              </div>
              <button onClick={() => setActiveChat(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="border border-border rounded-lg divide-y divide-border bg-background">
              {chatLoading ? <div className="p-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
                : chatMessages.length === 0 ? <div className="p-4 text-sm text-muted-foreground italic">No messages.</div>
                : chatMessages.map((m) => (
                  <div key={m.id} className={`p-3 ${m.role === "assistant" ? "bg-primary/5" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] py-0 capitalize">{m.role === "assistant" ? "Ọ̀rẹ́" : m.role}</Badge>
                      <span className="text-[11px] text-muted-foreground">{fmtDate(m.created_at)}</span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

