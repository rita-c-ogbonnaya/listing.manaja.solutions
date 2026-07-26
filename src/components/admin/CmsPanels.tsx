import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Save, X, Image as ImageIcon, Upload, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

type Entity =
  | "vacancies"
  | "blog_posts"
  | "team_members"
  | "roadmap_overrides"
  | "modules"
  | "milestones"
  | "milestone_features";

async function callCms<T = any>(password: string, action: string, entity?: Entity, payload?: any): Promise<T> {
  const { data, error } = await supabase.functions.invoke("admin-cms", {
    body: { password, action, ...(entity ? { entity } : {}), ...payload },
  });
  if (error) throw new Error(error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

async function uploadToBucket(bucket: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

function ModalShell({ children, onClose, wide = false }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-24 pb-8 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className={`bg-card border border-border rounded-2xl w-full ${wide ? "max-w-3xl" : "max-w-lg"} p-6 space-y-3 max-h-[85vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

/* ---------- Vacancies ---------- */
export function VacanciesPanel({ password }: { password: string }) {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const r = await callCms<{ data: any[] }>(password, "list", "vacancies");
      setItems(r.data);
    } catch (e: any) {
      toast({ title: "Failed to load", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); /* eslint-disable-next-line */ }, []);

  async function save(record: any) {
    try {
      await callCms(password, "upsert", "vacancies", { record });
      toast({ title: "Saved" }); setEditing(null); await refresh();
    } catch (e: any) { toast({ title: "Save failed", description: e.message, variant: "destructive" }); }
  }
  async function remove(id: string) {
    if (!confirm("Delete this vacancy?")) return;
    try { await callCms(password, "delete", "vacancies", { id }); await refresh(); }
    catch (e: any) { toast({ title: "Delete failed", description: e.message, variant: "destructive" }); }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Vacancies ({items.length})</h2>
        <Button onClick={() => setEditing({ title: "", department: "Engineering", location: "Remote", employment_type: "Full-time", description: "", published: true, sort_order: items.length + 1 })}>
          <Plus className="h-4 w-4 mr-1" /> New vacancy
        </Button>
      </div>
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="p-4 rounded-xl border border-border bg-card flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium text-foreground">{it.title}</span>
                  <Badge variant={it.published ? "default" : "secondary"}>{it.published ? "Published" : "Draft"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{it.department} · {it.location} · {it.employment_type}</p>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{it.description}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => setEditing(it)}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ModalShell onClose={() => setEditing(null)}>
          <h3 className="font-bold text-foreground">{editing.id ? "Edit vacancy" : "New vacancy"}</h3>
          <div><Label>Title</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Department</Label><Input value={editing.department} onChange={(e) => setEditing({ ...editing, department: e.target.value })} /></div>
            <div><Label>Location</Label><Input value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Type</Label><Input value={editing.employment_type} onChange={(e) => setEditing({ ...editing, employment_type: e.target.value })} /></div>
            <div><Label>Sort order</Label><Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></div>
          </div>
          <div><Label>Description</Label><textarea className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
          <div className="flex items-center gap-2"><Switch checked={editing.published} onCheckedChange={(v) => setEditing({ ...editing, published: v })} /><Label>Published</Label></div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => save(editing)}><Save className="h-4 w-4 mr-1" /> Save</Button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

/* ---------- Team ---------- */
export function TeamPanel({ password }: { password: string }) {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const r = await callCms<{ data: any[] }>(password, "list", "team_members");
      setItems(r.data);
    } catch (e: any) {
      toast({ title: "Failed to load", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); /* eslint-disable-next-line */ }, []);

  async function save(r: any) {
    if (!r.initials && r.name) r.initials = r.name.split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase();
    try {
      await callCms(password, "upsert", "team_members", { record: r });
      toast({ title: "Saved" }); setEditing(null); await refresh();
    } catch (e: any) { toast({ title: "Save failed", description: e.message, variant: "destructive" }); }
  }
  async function remove(id: string) {
    if (!confirm("Remove this team member?")) return;
    try { await callCms(password, "delete", "team_members", { id }); await refresh(); }
    catch (e: any) { toast({ title: "Delete failed", description: e.message, variant: "destructive" }); }
  }

  async function handleImageFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadToBucket("team-images", file);
      setEditing({ ...editing, image_url: url, display_mode: "image" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally { setUploading(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Team members ({items.length})</h2>
        <Button onClick={() => setEditing({ name: "", role: "", bio: "", initials: "", image_url: "", display_mode: "initials", sort_order: items.length + 1, published: true })}>
          <Plus className="h-4 w-4 mr-1" /> New member
        </Button>
      </div>
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map((it) => (
            <div key={it.id} className="p-4 rounded-xl border border-border bg-card flex items-start gap-3">
              {it.display_mode === "image" && it.image_url ? (
                <img src={it.image_url} alt={it.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">{it.initials}</div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">{it.name}</span>
                  <Badge variant={it.published ? "default" : "secondary"}>{it.published ? "Live" : "Hidden"}</Badge>
                </div>
                <p className="text-xs text-primary">{it.role}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{it.bio}</p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing({ display_mode: "initials", ...it })}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ModalShell onClose={() => setEditing(null)}>
          <h3 className="font-bold text-foreground">{editing.id ? "Edit member" : "New member"}</h3>
          <div><Label>Name</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Role</Label><Input value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} /></div>
            <div><Label>Initials</Label><Input maxLength={3} value={editing.initials ?? ""} onChange={(e) => setEditing({ ...editing, initials: e.target.value.toUpperCase() })} placeholder="Auto" /></div>
          </div>
          <div><Label>Bio</Label><textarea className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={editing.bio} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} /></div>

          <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/30">
            <Label>Avatar</Label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditing({ ...editing, display_mode: "initials" })} className={`flex-1 px-3 py-2 rounded-md text-xs font-medium border ${editing.display_mode !== "image" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input"}`}>Use initials</button>
              <button type="button" onClick={() => setEditing({ ...editing, display_mode: "image" })} className={`flex-1 px-3 py-2 rounded-md text-xs font-medium border ${editing.display_mode === "image" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input"}`}>Use photo</button>
            </div>
            {editing.display_mode === "image" && (
              <>
                <div className="flex gap-2 items-center">
                  <Input value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} placeholder="https://… or upload" />
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleImageFile(f); }} />
                    <span className="inline-flex items-center gap-1 px-3 h-10 rounded-md border border-input bg-background text-sm whitespace-nowrap"><Upload className="h-3.5 w-3.5" />{uploading ? "Uploading…" : "Upload"}</span>
                  </label>
                  {editing.image_url && (
                    <Button type="button" size="sm" variant="ghost" onClick={() => setEditing({ ...editing, image_url: "" })}><X className="h-4 w-4" /></Button>
                  )}
                </div>
                {editing.image_url && <img src={editing.image_url} alt="" className="mt-2 h-20 w-20 rounded-full object-cover border border-border" />}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 items-end">
            <div><Label>Sort order</Label><Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></div>
            <div className="flex items-center gap-2 pb-2"><Switch checked={editing.published} onCheckedChange={(v) => setEditing({ ...editing, published: v })} /><Label>Published</Label></div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => save(editing)}><Save className="h-4 w-4 mr-1" /> Save</Button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

/* ---------- Blog ---------- */
export function BlogPanel({ password }: { password: string }) {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const r = await callCms<{ data: any[] }>(password, "list", "blog_posts");
      setItems(r.data);
    } catch (e: any) {
      toast({ title: "Failed to load", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); /* eslint-disable-next-line */ }, []);

  async function save(r: any) {
    if (!r.slug) r.slug = slugify(r.title);
    try {
      await callCms(password, "upsert", "blog_posts", { record: r });
      toast({ title: "Saved" }); setEditing(null); await refresh();
    } catch (e: any) { toast({ title: "Save failed", description: e.message, variant: "destructive" }); }
  }
  async function remove(id: string) {
    if (!confirm("Delete this post?")) return;
    try { await callCms(password, "delete", "blog_posts", { id }); await refresh(); }
    catch (e: any) { toast({ title: "Delete failed", description: e.message, variant: "destructive" }); }
  }

  async function handleImageFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadToBucket("blog-images", file);
      setEditing({ ...editing, cover_image_url: url });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally { setUploading(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Blog posts ({items.length})</h2>
        <Button onClick={() => setEditing({ title: "", slug: "", excerpt: "", cover_image_url: "", body_html: "", author: "Manaja Team", published: false })}>
          <Plus className="h-4 w-4 mr-1" /> New post
        </Button>
      </div>
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : items.length === 0 ? (
        <p className="text-sm text-muted-foreground p-6 border border-dashed border-border rounded-xl text-center">No posts yet. Create your first one.</p>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="p-4 rounded-xl border border-border bg-card flex items-start gap-3">
              {it.cover_image_url ? (
                <img src={it.cover_image_url} alt="" className="w-16 h-16 rounded-md object-cover shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center shrink-0"><ImageIcon className="h-5 w-5 text-muted-foreground" /></div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">{it.title}</span>
                  <Badge variant={it.published ? "default" : "secondary"}>{it.published ? "Published" : "Draft"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">/blog/{it.slug} · {it.author}</p>
                {it.excerpt && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{it.excerpt}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => setEditing(it)}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ModalShell onClose={() => setEditing(null)} wide>
          <h3 className="font-bold text-foreground">{editing.id ? "Edit post" : "New post"}</h3>
          <div><Label>Title</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.slug || slugify(e.target.value) })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Slug</Label><Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} /></div>
            <div><Label>Author</Label><Input value={editing.author ?? ""} onChange={(e) => setEditing({ ...editing, author: e.target.value })} /></div>
          </div>
          <div><Label>Excerpt</Label><textarea className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={editing.excerpt ?? ""} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} /></div>

          <div>
            <Label>Cover image</Label>
            <div className="flex gap-2 items-center">
              <Input value={editing.cover_image_url ?? ""} onChange={(e) => setEditing({ ...editing, cover_image_url: e.target.value })} placeholder="https://… or upload" />
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleImageFile(f); }} />
                <span className="inline-flex items-center gap-1 px-3 h-10 rounded-md border border-input bg-background text-sm whitespace-nowrap"><Upload className="h-3.5 w-3.5" />{uploading ? "Uploading…" : "Upload"}</span>
              </label>
              {editing.cover_image_url && (
                <Button type="button" size="sm" variant="ghost" onClick={() => setEditing({ ...editing, cover_image_url: "" })}><X className="h-4 w-4" /></Button>
              )}
            </div>
            {editing.cover_image_url && <img src={editing.cover_image_url} alt="" className="mt-2 max-h-32 rounded-md border border-border" />}
          </div>

          <div>
            <Label>Body</Label>
            <div className="bg-background rounded-md border border-input quill-dark">
              <ReactQuill
                theme="snow"
                value={editing.body_html}
                onChange={(v) => setEditing({ ...editing, body_html: v })}
                modules={{
                  toolbar: [
                    [{ header: [2, 3, false] }],
                    ["bold", "italic", "underline", "strike", "blockquote"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["link", "image"],
                    ["clean"],
                  ],
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2"><Switch checked={editing.published} onCheckedChange={(v) => setEditing({ ...editing, published: v })} /><Label>Published</Label></div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => save(editing)}><Save className="h-4 w-4 mr-1" /> Save</Button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

/* ---------- Modules ---------- */
const COLOR_PRESETS = [
  "from-blue-500 to-blue-600", "from-emerald-500 to-emerald-600", "from-orange-500 to-orange-600",
  "from-violet-500 to-violet-600", "from-rose-500 to-rose-600", "from-amber-500 to-amber-600",
  "from-cyan-500 to-cyan-600", "from-pink-500 to-pink-600", "from-indigo-500 to-indigo-600",
];

export function ModulesPanel({ password }: { password: string }) {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const r = await callCms<{ data: any[] }>(password, "list", "modules");
      setItems(r.data);
    } catch (e: any) { toast({ title: "Failed to load", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); /* eslint-disable-next-line */ }, []);

  async function save(r: any) {
    if (!r.slug) r.slug = slugify(r.title);
    if (typeof r.features === "string") {
      r.features = r.features.split("\n").map((s: string) => s.trim()).filter(Boolean);
    }
    try {
      await callCms(password, "upsert", "modules", { record: r });
      toast({ title: "Saved" }); setEditing(null); await refresh();
    } catch (e: any) { toast({ title: "Save failed", description: e.message, variant: "destructive" }); }
  }
  async function remove(id: string) {
    if (!confirm("Delete this module?")) return;
    try { await callCms(password, "delete", "modules", { id }); await refresh(); }
    catch (e: any) { toast({ title: "Delete failed", description: e.message, variant: "destructive" }); }
  }

  async function handleImageFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadToBucket("module-images", file);
      setEditing({ ...editing, image_url: url });
    } catch (e: any) { toast({ title: "Upload failed", description: e.message, variant: "destructive" }); }
    finally { setUploading(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Modules ({items.length})</h2>
        <Button onClick={() => setEditing({ slug: "", title: "", icon_name: "Layers", description: "", features: [], color: COLOR_PRESETS[0], light_bg: "bg-blue-50 dark:bg-blue-950/20", image_url: "", status: "coming_soon", status_label: "", sort_order: items.length + 1, published: true })}>
          <Plus className="h-4 w-4 mr-1" /> New module
        </Button>
      </div>
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map((it) => (
            <div key={it.id} className="p-4 rounded-xl border border-border bg-card flex items-start gap-3">
              {it.image_url ? (
                <img src={it.image_url} alt="" className="w-16 h-16 rounded-md object-cover shrink-0" />
              ) : (
                <div className={`w-16 h-16 rounded-md bg-gradient-to-br ${it.color} flex items-center justify-center shrink-0`}>
                  <ImageIcon className="h-5 w-5 text-white" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">{it.title}</span>
                  <Badge variant={it.published ? "default" : "secondary"}>{it.published ? "Live" : "Hidden"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">/{it.slug} · icon: {it.icon_name}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{it.description}</p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing({ ...it, features: (it.features || []).join("\n") })}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ModalShell onClose={() => setEditing(null)} wide>
          <h3 className="font-bold text-foreground">{editing.id ? "Edit module" : "New module"}</h3>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Title</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.slug || slugify(e.target.value) })} /></div>
            <div><Label>Slug</Label><Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Icon (lucide name)</Label>
              <Input value={editing.icon_name} onChange={(e) => setEditing({ ...editing, icon_name: e.target.value })} placeholder="e.g. Users, Package, BarChart3" />
            </div>
            <div><Label>Sort order</Label><Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></div>
          </div>
          <div><Label>Description</Label><textarea className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
          <div><Label>Features (one per line)</Label><textarea className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={editing.features} onChange={(e) => setEditing({ ...editing, features: e.target.value })} /></div>

          <div>
            <Label>Color gradient</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {COLOR_PRESETS.map((c) => (
                <button key={c} type="button" onClick={() => setEditing({ ...editing, color: c })} className={`w-8 h-8 rounded-md bg-gradient-to-br ${c} ring-2 ${editing.color === c ? "ring-primary" : "ring-transparent"}`} title={c} />
              ))}
            </div>
          </div>

          <div>
            <Label>Dashboard image</Label>
            <div className="flex gap-2 items-center">
              <Input value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} placeholder="https://… or upload" />
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleImageFile(f); }} />
                <span className="inline-flex items-center gap-1 px-3 h-10 rounded-md border border-input bg-background text-sm whitespace-nowrap"><Upload className="h-3.5 w-3.5" />{uploading ? "Uploading…" : "Upload"}</span>
              </label>
              {editing.image_url && (
                <Button type="button" size="sm" variant="ghost" onClick={() => setEditing({ ...editing, image_url: "" })}><X className="h-4 w-4" /></Button>
              )}
            </div>
            {editing.image_url && <img src={editing.image_url} alt="" className="mt-2 max-h-40 rounded-md border border-border" />}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Status badge</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-2 text-sm" value={editing.status ?? "coming_soon"} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                <option value="live">Live</option>
                <option value="in_progress">In Progress</option>
                <option value="coming_soon">Coming Soon</option>
              </select>
            </div>
            <div>
              <Label>Custom badge label (optional)</Label>
              <Input value={editing.status_label ?? ""} onChange={(e) => setEditing({ ...editing, status_label: e.target.value })} placeholder="Overrides default text" />
            </div>
          </div>

          <div className="flex items-center gap-2"><Switch checked={editing.published} onCheckedChange={(v) => setEditing({ ...editing, published: v })} /><Label>Published</Label></div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => save(editing)}><Save className="h-4 w-4 mr-1" /> Save</Button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

/* ---------- Roadmap (Milestones with features) ---------- */
const STATUS_OPTIONS = ["completed", "in-progress", "planned"];

export function RoadmapPanel({ password }: { password: string }) {
  const { toast } = useToast();
  const [milestones, setMilestones] = useState<any[]>([]);
  const [features, setFeatures] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [editingFeature, setEditingFeature] = useState<{ milestone_id: string; feature: any } | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  async function refresh() {
    setLoading(true);
    try {
      const r = await callCms<{ data: any[] }>(password, "list", "milestones");
      setMilestones(r.data);
      const fmap: Record<string, any[]> = {};
      for (const m of r.data) {
        const fr = await callCms<{ data: any[] }>(password, "list", "milestone_features", { milestone_id: m.id });
        fmap[m.id] = fr.data;
      }
      setFeatures(fmap);
    } catch (e: any) { toast({ title: "Failed to load", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); /* eslint-disable-next-line */ }, []);

  async function saveMilestone(r: any) {
    try {
      await callCms(password, "upsert", "milestones", { record: r });
      toast({ title: "Saved" }); setEditing(null); await refresh();
    } catch (e: any) { toast({ title: "Save failed", description: e.message, variant: "destructive" }); }
  }
  async function removeMilestone(id: string) {
    if (!confirm("Delete this milestone and all its features?")) return;
    try { await callCms(password, "delete", "milestones", { id }); await refresh(); }
    catch (e: any) { toast({ title: "Delete failed", description: e.message, variant: "destructive" }); }
  }
  async function saveFeature(milestone_id: string, f: any) {
    try {
      await callCms(password, "upsert", "milestone_features", { record: { ...f, milestone_id } });
      toast({ title: "Saved" }); setEditingFeature(null); await refresh();
    } catch (e: any) { toast({ title: "Save failed", description: e.message, variant: "destructive" }); }
  }
  async function removeFeature(id: string) {
    if (!confirm("Delete this feature?")) return;
    try { await callCms(password, "delete", "milestone_features", { id }); await refresh(); }
    catch (e: any) { toast({ title: "Delete failed", description: e.message, variant: "destructive" }); }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Roadmap milestones ({milestones.length})</h2>
        <Button onClick={() => setEditing({ milestone_key: "", quarter: "", year: "", title: "", tagline: "", story: "", outcome: "", icon_name: "Sparkles", status: "planned", progress: 0, sort_order: milestones.length + 1, published: true })}>
          <Plus className="h-4 w-4 mr-1" /> New milestone
        </Button>
      </div>

      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
        <div className="space-y-3">
          {milestones.map((m) => {
            const isOpen = expanded[m.id] ?? false;
            const flist = features[m.id] || [];
            return (
              <div key={m.id} className="rounded-xl border border-border bg-card">
                <div className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{m.quarter} {m.year}</span>
                      <Badge variant="outline">{m.status}</Badge>
                      <Badge variant={m.published ? "default" : "secondary"}>{m.published ? "Live" : "Hidden"}</Badge>
                      <span className="text-xs text-muted-foreground">{m.progress}%</span>
                    </div>
                    <h3 className="font-medium text-foreground mt-1">{m.title}</h3>
                    <p className="text-xs text-primary">{m.tagline}</p>
                  </div>
                  <div className="flex gap-2 shrink-0 items-center">
                    <div className="flex items-center gap-1.5 px-2 h-9 rounded-md border border-input bg-background" title="Toggle publish">
                      <Switch checked={!!m.published} onCheckedChange={async (v) => { await callCms(password, "upsert", "milestones", { record: { ...m, published: v } }); await refresh(); }} />
                      <span className="text-xs text-muted-foreground">{m.published ? "Live" : "Hidden"}</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setExpanded({ ...expanded, [m.id]: !isOpen })}>{isOpen ? "Hide" : "Features"} ({flist.length})</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(m)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => removeMilestone(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t border-border p-4 space-y-2 bg-muted/20">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">Features inside this milestone</span>
                      <Button size="sm" variant="outline" onClick={() => setEditingFeature({ milestone_id: m.id, feature: { icon_name: "CheckCircle2", label: "", detail: "", sort_order: flist.length + 1 } })}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add feature
                      </Button>
                    </div>
                    {flist.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No features yet.</p>
                    ) : flist.map((f) => (
                      <div key={f.id} className="p-3 rounded-md border border-border bg-card flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground">{f.label} <span className="text-xs text-muted-foreground font-normal">· {f.icon_name}</span></div>
                          <p className="text-xs text-muted-foreground">{f.detail}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="sm" variant="ghost" onClick={() => setEditingFeature({ milestone_id: m.id, feature: f })}>Edit</Button>
                          <Button size="sm" variant="ghost" onClick={() => removeFeature(f.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <ModalShell onClose={() => setEditing(null)} wide>
          <h3 className="font-bold text-foreground">{editing.id ? "Edit milestone" : "New milestone"}</h3>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Key (unique)</Label><Input value={editing.milestone_key} onChange={(e) => setEditing({ ...editing, milestone_key: e.target.value })} placeholder="e.g. q1-2027" /></div>
            <div><Label>Quarter</Label><Input value={editing.quarter} onChange={(e) => setEditing({ ...editing, quarter: e.target.value })} placeholder="Q1" /></div>
            <div><Label>Year</Label><Input value={editing.year} onChange={(e) => setEditing({ ...editing, year: e.target.value })} placeholder="2027" /></div>
          </div>
          <div><Label>Title</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
          <div><Label>Tagline</Label><Input value={editing.tagline} onChange={(e) => setEditing({ ...editing, tagline: e.target.value })} /></div>
          <div><Label>Story</Label><textarea className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={editing.story} onChange={(e) => setEditing({ ...editing, story: e.target.value })} /></div>
          <div><Label>Outcome</Label><textarea className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={editing.outcome} onChange={(e) => setEditing({ ...editing, outcome: e.target.value })} /></div>
          <div className="grid grid-cols-4 gap-2">
            <div><Label>Icon</Label><Input value={editing.icon_name} onChange={(e) => setEditing({ ...editing, icon_name: e.target.value })} /></div>
            <div>
              <Label>Status</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-2 text-sm" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><Label>Progress %</Label><Input type="number" min={0} max={100} value={editing.progress} onChange={(e) => setEditing({ ...editing, progress: Number(e.target.value) })} /></div>
            <div><Label>Sort</Label><Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></div>
          </div>
          <div className="flex items-center gap-2"><Switch checked={editing.published} onCheckedChange={(v) => setEditing({ ...editing, published: v })} /><Label>Published</Label></div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => saveMilestone(editing)}><Save className="h-4 w-4 mr-1" /> Save</Button>
          </div>
        </ModalShell>
      )}

      {editingFeature && (
        <ModalShell onClose={() => setEditingFeature(null)}>
          <h3 className="font-bold text-foreground">{editingFeature.feature.id ? "Edit feature" : "New feature"}</h3>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Icon (lucide)</Label><Input value={editingFeature.feature.icon_name} onChange={(e) => setEditingFeature({ ...editingFeature, feature: { ...editingFeature.feature, icon_name: e.target.value } })} /></div>
            <div><Label>Sort order</Label><Input type="number" value={editingFeature.feature.sort_order} onChange={(e) => setEditingFeature({ ...editingFeature, feature: { ...editingFeature.feature, sort_order: Number(e.target.value) } })} /></div>
          </div>
          <div><Label>Label</Label><Input value={editingFeature.feature.label} onChange={(e) => setEditingFeature({ ...editingFeature, feature: { ...editingFeature.feature, label: e.target.value } })} /></div>
          <div><Label>Detail</Label><textarea className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={editingFeature.feature.detail} onChange={(e) => setEditingFeature({ ...editingFeature, feature: { ...editingFeature.feature, detail: e.target.value } })} /></div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditingFeature(null)}>Cancel</Button>
            <Button onClick={() => saveFeature(editingFeature.milestone_id, editingFeature.feature)}><Save className="h-4 w-4 mr-1" /> Save</Button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

/* ---------- Settings (recovery email + change password) ---------- */
export function AdminSettingsPanel({ password }: { password: string }) {
  const { toast } = useToast();
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [newPw, setNewPw] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await callCms<{ recovery_email: string }>(password, "get_recovery_email");
        setRecoveryEmail(r.recovery_email || "");
      } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
      finally { setLoading(false); }
    })();
    // eslint-disable-next-line
  }, []);

  async function saveEmail() {
    setSaving(true);
    try {
      await callCms(password, "update_recovery_email", undefined, { recovery_email: recoveryEmail });
      toast({ title: "Recovery email updated" });
    } catch (e: any) { toast({ title: "Save failed", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  }
  async function changePw() {
    if (newPw.length < 8) { toast({ title: "Too short", description: "Use at least 8 characters." }); return; }
    setSaving(true);
    try {
      await callCms(password, "change_password", undefined, { new_password: newPw });
      toast({ title: "Password updated", description: "Use the new password next time you sign in." });
      setNewPw("");
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  }

  if (loading) return <Loader2 className="h-5 w-5 animate-spin" />;

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><Settings className="h-4 w-4" /> Admin settings</h2>
        <p className="text-sm text-muted-foreground">Manage where password reset emails are sent and change the dashboard password.</p>
      </div>
      <div className="p-4 rounded-xl border border-border bg-card space-y-3">
        <div>
          <Label>Recovery email address</Label>
          <p className="text-xs text-muted-foreground mb-2">Password reset links are sent to this address. Default is <code>feedback@manaja.solutions</code>.</p>
          <div className="flex gap-2">
            <Input type="email" value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)} placeholder="admin@manaja.solutions" />
            <Button onClick={saveEmail} disabled={saving}>Save</Button>
          </div>
        </div>
      </div>
      <div className="p-4 rounded-xl border border-border bg-card space-y-3">
        <div>
          <Label>Change dashboard password</Label>
          <p className="text-xs text-muted-foreground mb-2">Setting a new password here overrides the original backend secret.</p>
          <div className="flex gap-2">
            <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="At least 8 characters" />
            <Button onClick={changePw} disabled={saving || !newPw}>Update</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Popup (welcome modal) ---------- */
export function PopupPanel({ password }: { password: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [s, setS] = useState<any>({
    popup_enabled: true,
    popup_image_url: "",
    popup_title: "",
    popup_body: "",
    popup_cta_label: "",
    popup_cta_url: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const r = await callCms<{ data: any }>(password, "get_site_settings");
        if (r?.data) setS(r.data);
      } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
      finally { setLoading(false); }
    })();
    // eslint-disable-next-line
  }, []);

  async function save(extra?: Partial<typeof s>) {
    setSaving(true);
    try {
      const settings = { ...s, ...(extra || {}) };
      const r = await callCms<{ data: any }>(password, "update_site_settings", undefined, { settings });
      if (r?.data) setS(r.data);
      toast({ title: "Popup updated" });
    } catch (e: any) { toast({ title: "Save failed", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  }

  async function onPickImage(file: File) {
    setUploading(true);
    try {
      const url = await uploadToBucket("popup-images", file);
      await save({ popup_image_url: url });
    } catch (e: any) { toast({ title: "Upload failed", description: e.message, variant: "destructive" }); }
    finally { setUploading(false); }
  }

  async function removeImage() {
    await save({ popup_image_url: null as any });
  }

  async function onPickHeroImage(file: File) {
    setUploading(true);
    try {
      const url = await uploadToBucket("popup-images", file);
      await save({ hero_dashboard_image_url: url });
    } catch (e: any) { toast({ title: "Upload failed", description: e.message, variant: "destructive" }); }
    finally { setUploading(false); }
  }

  if (loading) return <Loader2 className="h-5 w-5 animate-spin" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Website popup</h2>
        <p className="text-sm text-muted-foreground">Shown to visitors every time they open the website. Toggle it off, swap the image, or change the message.</p>
      </div>

      <div className="p-4 rounded-xl border border-border bg-card space-y-3">
        <Label>Homepage laptop image</Label>
        <p className="text-xs text-muted-foreground">The dashboard screenshot shown inside the laptop mockup on the homepage.</p>
        {s.hero_dashboard_image_url ? (
          <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
            <img src={s.hero_dashboard_image_url} alt="Homepage laptop" className="w-full max-h-64 object-contain bg-black" />
          </div>
        ) : (
          <div className="text-sm text-muted-foreground italic">Using default image.</div>
        )}
        <label className="inline-flex">
          <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickHeroImage(f); }} />
          <span className={`inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 h-9 text-sm cursor-pointer hover:bg-accent ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Uploading…" : "Upload new image"}
          </span>
        </label>
      </div>

      <div className="p-4 rounded-xl border border-border bg-card space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label className="text-base">Show popup to visitors</Label>
            <p className="text-xs text-muted-foreground">When off, no one sees the welcome modal.</p>
          </div>
          <Switch checked={!!s.popup_enabled} onCheckedChange={(v) => { setS({ ...s, popup_enabled: v }); save({ popup_enabled: v }); }} />
        </div>
      </div>

      <div className="p-4 rounded-xl border border-border bg-card space-y-3">
        <Label>Popup image</Label>
        {s.popup_image_url ? (
          <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
            <img src={s.popup_image_url} alt="Popup" className="w-full max-h-64 object-contain bg-black" />
          </div>
        ) : (
          <div className="text-sm text-muted-foreground italic">No image set.</div>
        )}
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex">
            <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickImage(f); }} />
            <span className={`inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 h-9 text-sm cursor-pointer hover:bg-accent ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading…" : "Upload new image"}
            </span>
          </label>
          {s.popup_image_url && (
            <Button variant="outline" onClick={removeImage} disabled={saving}>
              <Trash2 className="h-4 w-4 mr-1" /> Remove image
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 rounded-xl border border-border bg-card space-y-3">
        <div>
          <Label>Title</Label>
          <Input value={s.popup_title || ""} onChange={(e) => setS({ ...s, popup_title: e.target.value })} />
        </div>
        <div>
          <Label>Body text</Label>
          <textarea
            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={s.popup_body || ""}
            onChange={(e) => setS({ ...s, popup_body: e.target.value })}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Button label</Label>
            <Input value={s.popup_cta_label || ""} onChange={(e) => setS({ ...s, popup_cta_label: e.target.value })} placeholder="Join early access" />
          </div>
          <div>
            <Label>Button link</Label>
            <Input value={s.popup_cta_url || ""} onChange={(e) => setS({ ...s, popup_cta_url: e.target.value })} placeholder="/early-access" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => save()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
