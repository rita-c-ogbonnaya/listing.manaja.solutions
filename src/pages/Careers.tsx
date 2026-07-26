import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Briefcase, Heart, Lightbulb, Users, Zap, MapPin, Clock, Send, ArrowRight, Upload, Check, Loader2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionWrapper } from "@/components/SectionWrapper";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Seo } from "@/components/Seo";

const perks = [
  { icon: Lightbulb, title: "Innovation-Driven", description: "Work on cutting-edge AI-powered enterprise software that shapes how businesses operate." },
  { icon: Users, title: "Collaborative Culture", description: "Join a diverse, supportive team where every voice matters and ideas are celebrated." },
  { icon: Heart, title: "Growth & Learning", description: "Continuous development opportunities, mentorship, and room to grow your career." },
  { icon: Zap, title: "Flexible Work", description: "Remote-friendly environment with flexible hours that respect your work-life balance." },
];

type Vacancy = {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  description: string;
};

function ApplicationModal({ position, onClose }: { position: string; onClose: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      toast({ title: "Please upload your CV/Resume", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      // Upload resume to storage
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("resumes").upload(path, file);
      if (uploadError) throw uploadError;

      // Send application via edge function
      const { error } = await supabase.functions.invoke("send-application", {
        body: {
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          email: formData.get("email"),
          phone: formData.get("phone") || undefined,
          position,
          coverLetter: formData.get("coverLetter") || undefined,
          resumePath: path,
        },
      });
      if (error) throw error;
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to submit application. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-24 pb-8 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Apply: {position}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        {isSubmitted ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <Check className="h-7 w-7 text-green-500" />
            </div>
            <h4 className="text-lg font-bold text-foreground mb-2">Application Submitted!</h4>
            <p className="text-muted-foreground text-sm mb-4">Thank you! We've sent a confirmation to your email. Our team will review your application and get back to you within 5-7 business days.</p>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>First Name</Label><Input name="firstName" placeholder="John" required className="bg-background" /></div>
              <div><Label>Last Name</Label><Input name="lastName" placeholder="Doe" required className="bg-background" /></div>
            </div>
            <div><Label>Email</Label><Input name="email" type="email" placeholder="you@email.com" required className="bg-background" /></div>
            <div><Label>Phone</Label><Input name="phone" type="tel" placeholder="+1 (555) 000-0000" className="bg-background" /></div>
            <div>
              <Label>CV / Resume</Label>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <div
                onClick={() => fileRef.current?.click()}
                className="mt-1 flex items-center gap-3 p-3 rounded-lg border border-dashed border-input bg-background cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Upload className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground truncate">
                  {file ? file.name : "Click to upload PDF, DOC, or DOCX (max 10MB)"}
                </span>
              </div>
            </div>
            <div>
              <Label>Cover Letter (Optional)</Label>
              <textarea name="coverLetter" className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Tell us why you're a great fit..." />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full btn-glass-primary text-primary-foreground border-0 h-11 font-medium">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : <><Send className="mr-2 h-4 w-4" /> Submit Application</>}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              By submitting, you accept our{" "}
              <Link to="/privacy-policy" className="text-primary hover:underline">privacy policy</Link>.
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export default function Careers() {
  const [applyingFor, setApplyingFor] = useState<string | null>(null);
  const [openPositions, setOpenPositions] = useState<Vacancy[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    supabase
      .from("vacancies")
      .select("id,title,department,location,employment_type,description")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        setOpenPositions((data as Vacancy[]) ?? []);
        setLoadingJobs(false);
      });
  }, []);

  return (
    <div className="pt-20">
      <Seo
        title="Careers at Manaja — Join Our Team Building Enterprise SaaS"
        description="Explore open roles at Manaja Solutions. Help build the AI-powered platform unifying HR, CRM, Accounting, Inventory, Property, Projects, Compliance and Analytics."
        path="/careers"
        keywords="Manaja careers, jobs, tech jobs Africa, SaaS careers, remote jobs"
      />
      {/* Hero */}
      <SectionWrapper className="py-20 md:py-28">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">We're Hiring</span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Build the Future of <span className="text-primary">Enterprise Software</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Join Manaja Solutions and help us empower businesses with intelligent, modular tools. We're looking for passionate people who want to make a real impact.
            </p>
            <a href="#open-positions">
              <Button className="btn-glass-gold rounded-full px-8 h-12 text-base font-semibold border-0">
                View Open Positions <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </motion.div>
        </div>
      </SectionWrapper>

      {/* Why Join Us */}
      <SectionWrapper className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why Join Manaja?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">We're building more than software — we're building a culture where talented people thrive.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {perks.map((perk, i) => (
              <motion.div key={perk.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4"><perk.icon className="h-6 w-6 text-primary" /></div>
                <h3 className="font-semibold text-foreground mb-2">{perk.title}</h3>
                <p className="text-sm text-muted-foreground">{perk.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* Open Positions */}
      <SectionWrapper className="py-16" id="open-positions">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Open Positions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Find your next role and help us shape the future of enterprise operations.</p>
          </motion.div>
          <div className="max-w-3xl mx-auto space-y-4">
            {loadingJobs ? (
              <div className="p-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
            ) : openPositions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-10 rounded-2xl bg-card border border-dashed border-border text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No open vacancies right now</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  We don't have any open roles at the moment, but we're always excited to meet great people. Send us your CV and we'll reach out when something matches.
                </p>
                <Button
                  className="btn-glass-gold rounded-full px-6 h-11 font-semibold border-0"
                  onClick={() => setApplyingFor("General Application")}
                >
                  Send Your CV <Send className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            ) : (
              openPositions.map((job, i) => (
              <motion.div key={job.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{job.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{job.description}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Briefcase className="h-3.5 w-3.5" /> {job.department}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {job.employment_type}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-full shrink-0" onClick={() => setApplyingFor(job.title)}>
                    Apply <Send className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
              ))
            )}
          </div>
        </div>
      </SectionWrapper>

      {/* General Application CTA */}
      <SectionWrapper className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold text-foreground mb-4">Don't See Your Role?</h2>
            <p className="text-muted-foreground mb-8">We're always looking for exceptional talent. Send us your CV and tell us how you'd contribute to Manaja's mission.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button className="btn-glass-gold rounded-full px-8 h-12 text-base font-semibold border-0" onClick={() => setApplyingFor("General Application")}>
                Send Your CV <Send className="ml-2 h-4 w-4" />
              </Button>
              <Link to="/contact">
                <Button variant="outline" className="rounded-full px-8 h-12 text-base">Get in Touch</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </SectionWrapper>

      {applyingFor && <ApplicationModal position={applyingFor} onClose={() => setApplyingFor(null)} />}
    </div>
  );
}
