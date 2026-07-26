import { useState } from "react";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  moduleSlug: string;
  moduleTitle: string;
}

export function ModuleWaitlistDialog({ open, onOpenChange, moduleSlug, moduleTitle }: Props) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("module_waitlist").insert({
        module_slug: moduleSlug,
        module_title: moduleTitle,
        email: email.trim().toLowerCase(),
        name: name.trim() || null,
        company: company.trim() || null,
        source: "homepage_card",
      });
      if (error && !/duplicate key/i.test(error.message)) throw error;
      setDone(true);
      toast({ title: "You're on the list!", description: `We'll let you know the moment ${moduleTitle} is ready.` });
    } catch (err: any) {
      toast({ title: "Couldn't add you", description: err.message, variant: "destructive" });
    } finally { setBusy(false); }
  }

  function reset() { setName(""); setEmail(""); setCompany(""); setDone(false); onOpenChange(false); }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); else onOpenChange(true); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle>Get early access to {moduleTitle}</DialogTitle>
          <DialogDescription>
            Join the waitlist for this module. We'll send you an invitation the moment it goes live.
          </DialogDescription>
        </DialogHeader>
        {done ? (
          <div className="text-center py-6 space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
            <p className="font-semibold text-foreground">You're on the list 🎉</p>
            <p className="text-sm text-muted-foreground">We'll be in touch as soon as {moduleTitle} is ready.</p>
            <Button onClick={reset} className="mt-3">Done</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label htmlFor="mw-name">Name</Label>
              <Input id="mw-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
            </div>
            <div>
              <Label htmlFor="mw-email">Work email *</Label>
              <Input id="mw-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            </div>
            <div>
              <Label htmlFor="mw-company">Company</Label>
              <Input id="mw-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Optional" />
            </div>
            <Button type="submit" disabled={busy || !email.trim()} className="w-full btn-glass-gold border-0 font-semibold">
              {busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Joining…</> : "Join the waitlist"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
