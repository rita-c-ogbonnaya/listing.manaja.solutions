import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Loader2, Sparkles, Clock, Percent, MessageSquare, Users, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SectionWrapper } from "@/components/SectionWrapper";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ZAPIER_WEBHOOK_URL = "https://hooks.zapier.com/hooks/catch/27159483/u787tej/";

const moduleOptions = [
  "CRM & Client Management",
  "HR & Payroll",
  "Inventory & Procurement",
  "Accounting & Finance",
  "Real Estate & Facilities",
  "Compliance & Risk",
  "Projects & Tasks",
  "Analytics & Automation",
  "Other",
];

const perks = [
  { icon: Clock, title: "Priority Access", description: "Be among the first to use Manaja before the public launch." },
  { icon: Percent, title: "Founding Member Pricing", description: "Lock in special pricing that will never be available again." },
  { icon: MessageSquare, title: "Direct Feedback Line", description: "Shape the product roadmap with your input and suggestions." },
  { icon: Users, title: "Dedicated Onboarding", description: "Get personalized setup assistance from our expert team." },
  { icon: Gift, title: "Exclusive Features", description: "Access beta features before they roll out to everyone else." },
  { icon: Sparkles, title: "Lifetime Benefits", description: "Keep your early adopter perks for as long as you're a customer." },
];

export default function EarlyAccessPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [otherText, setOtherText] = useState("");
  const { toast } = useToast();

  const toggleModule = (mod: string) => {
    setSelectedModules((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  const allNonOtherModules = moduleOptions.filter((m) => m !== "Other");
  const allSelected = allNonOtherModules.every((m) => selectedModules.includes(m));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedModules((prev) => prev.filter((m) => m === "Other" && prev.includes("Other")));
    } else {
      setSelectedModules((prev) => {
        const hasOther = prev.includes("Other");
        return hasOther ? [...allNonOtherModules, "Other"] : [...allNonOtherModules];
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      company: formData.get("company") as string,
      industry: formData.get("industry") as string,
      companySize: formData.get("companySize") as string,
      role: formData.get("role") as string,
      modules: selectedModules.map(m => m === "Other" ? `Other: ${otherText}` : m),
      timestamp: new Date().toISOString(),
      source: window.location.origin,
    };

    try {
      // Send to Zapier
      if (ZAPIER_WEBHOOK_URL) {
        fetch(ZAPIER_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          mode: "no-cors",
          body: JSON.stringify(data),
        }).catch(console.error);
      }

      // Send email notification + auto-responder
      const { error } = await supabase.functions.invoke("send-early-access-email", {
        body: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || undefined,
          company: data.company,
          industry: data.industry || undefined,
          companySize: data.companySize || undefined,
          role: data.role || undefined,
          modules: data.modules,
        },
      });
      if (error) throw error;

      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <SectionWrapper className="pt-32">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto text-center p-12 rounded-2xl border border-border bg-card">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">You're on the list!</h3>
          <p className="text-muted-foreground mb-2">Thank you for joining our early access program. We'll be in touch soon with your exclusive invitation.</p>
          <p className="text-sm text-muted-foreground">Check your inbox for a confirmation email.</p>
        </motion.div>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper className="pt-32">
      <div className="grid lg:grid-cols-2 gap-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Get Early Access to{" "}
            <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">Manaja</span>
          </h1>
          <p className="text-muted-foreground mb-8">
            Be among the first to experience the future of AI-driven enterprise management. Collaborate with us to innovate and scale your operations.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>First Name</Label><Input name="firstName" placeholder="John" required className="bg-background" /></div>
              <div><Label>Last Name</Label><Input name="lastName" placeholder="Doe" required className="bg-background" /></div>
            </div>
            <div><Label>Work Email</Label><Input name="email" type="email" placeholder="you@company.com" required className="bg-background" /></div>
            <div><Label>Phone Number</Label><Input name="phone" type="tel" placeholder="+1 (555) 000-0000" className="bg-background" /></div>
            <div><Label>Company Name</Label><Input name="company" placeholder="Your company" required className="bg-background" /></div>
            <div><Label>Industry</Label><Input name="industry" placeholder="e.g., Finance, Healthcare, Technology" className="bg-background" /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Company Size</Label>
                <select name="companySize" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>1-10 employees</option>
                  <option>11-50 employees</option>
                  <option>51-200 employees</option>
                  <option>201-500 employees</option>
                  <option>500+ employees</option>
                </select>
              </div>
              <div>
                <Label>Your Role</Label>
                <select name="role" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>CEO / Founder</option>
                  <option>CTO / Technical</option>
                  <option>CFO / Finance</option>
                  <option>Operations</option>
                  <option>HR / People</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="mb-3 block">Which modules interest you most?</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                  <span className="text-sm font-semibold text-foreground">Select All</span>
                </label>
                {moduleOptions.map((mod) => (
                  <label key={mod} className="flex items-center gap-3 cursor-pointer">
                    <Checkbox checked={selectedModules.includes(mod)} onCheckedChange={() => toggleModule(mod)} />
                    <span className="text-sm text-foreground">{mod}</span>
                  </label>
                ))}
              </div>
              {selectedModules.includes("Other") && (
                <div className="mt-3">
                  <Input placeholder="Please specify..." value={otherText} onChange={(e) => setOtherText(e.target.value)} className="bg-background" />
                </div>
              )}
            </div>

            <Button type="submit" size="lg" disabled={isSubmitting} className="w-full btn-glass-primary text-primary-foreground border-0 h-12 font-medium">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : <>Request Early Access <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              By submitting, you accept our{" "}
              <Link to="/terms-of-use" className="text-primary hover:underline">terms of use</Link> and{" "}
              <Link to="/privacy-policy" className="text-primary hover:underline">privacy policy</Link>.
            </p>
          </form>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:sticky lg:top-24 self-start">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            Early Adopter Benefits
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Why Join Early Access?</h2>
          <p className="text-muted-foreground mb-8">Early adopters get exclusive benefits that won't be available after launch.</p>

          <div className="space-y-4">
            {perks.map((p, i) => (
              <motion.div key={p.title} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <p.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{p.title}</h3>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 p-6 rounded-xl glass">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><div className="text-2xl font-bold text-foreground">500+</div><div className="text-xs text-muted-foreground">Waitlist</div></div>
              <div><div className="text-2xl font-bold text-foreground">50</div><div className="text-xs text-muted-foreground">Spots Left</div></div>
              <div><div className="text-2xl font-bold text-foreground">Q2</div><div className="text-xs text-muted-foreground">Launch</div></div>
            </div>
          </div>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
