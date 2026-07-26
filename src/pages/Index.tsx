import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { ArrowRight, Play, Users, UserCog, Package, Calculator, Building2, Shield, FolderKanban, BarChart3, Zap, Lock, Globe, Layers, Sparkles, HeartHandshake, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionWrapper } from "@/components/SectionWrapper";
import { HeroParticles } from "@/components/HeroParticles";
import { supabase } from "@/integrations/supabase/client";
import DashboardImg from "@/assets/Screenshot 2026-04-01 125016.png";
import { ModuleWaitlistDialog } from "@/components/ModuleWaitlistDialog";
import { SecurityBadge } from "@/components/SecurityBadge";
import { Seo } from "@/components/Seo";


/* ─── Counter Hook ─── */
function useCounter(end: number, duration = 2000, suffix = "") {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const step = end / (duration / 16);
          const timer = setInterval(() => {
            start += step;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return { count, ref, display: `${count}${suffix}` };
}

/* ─── Hero Section ─── */
function HeroSection() {
  const stats = [
    useCounter(8, 1500, "+"),
    useCounter(100, 2000, "%"),
    useCounter(99, 2000, ".9%"),
  ];
  const statLabels = ["Integrated Modules", "Cloud Native", "Uptime SLA"];

  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Hero Particles (dark mode only) */}
      <HeroParticles />
      {/* Hero Glow — dramatic radial spotlight */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[700px] rounded-full bg-primary/15 dark:bg-primary/20 blur-[160px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full bg-accent/8 dark:bg-primary/10 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium mb-6"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            Now accepting early access signups
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground mb-6 text-balance leading-tight tracking-tight"
          >
            Unify Your Business
            <br />
            <span className="bg-primary bg-clip-text text-transparent">
              Operations
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty"
          >
            Manaja brings together CRM, HR, finance, inventory, and project management
            into one AI-powered platform built to scale with mid-size and growing organizations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-14"
          >
            <Link to="/early-access">
              <Button size="lg" className="btn-glass-gold rounded-full px-8 font-semibold border-0 text-base h-12">
                Join Early Access
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/modules">
              <Button variant="outline" size="lg" className="rounded-full px-8 h-12 border-border/50 dark:border-border dark:bg-card/50 dark:hover:bg-card text-foreground hover:text-foreground dark:text-foreground dark:hover:text-foreground">
                <Play className="mr-2 h-4 w-4" />
                Explore Modules
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-3 gap-8 max-w-lg mx-auto"
          >
            {stats.map((stat, index) => (
              <div key={index} ref={stat.ref} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  {stat.display}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{statLabels[index]}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Laptop Scroll Section ─── */
function LaptopScrollSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [heroImg, setHeroImg] = useState<string>(DashboardImg);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  useEffect(() => {
    (supabase as any)
      .from("site_settings")
      .select("hero_dashboard_image_url")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.hero_dashboard_image_url) setHeroImg(data.hero_dashboard_image_url);
      });
  }, []);

  const lidRotation = useTransform(scrollYProgress, [0.15, 0.4], [60, 0]);
  const opacity = useTransform(scrollYProgress, [0.15, 0.25], [0, 1]);

  return (
    <section ref={sectionRef} className="relative h-[100vh] sm:h-[120vh]">
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden pt-24 sm:pt-28">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[400px] rounded-full bg-primary/10 dark:bg-primary/15 blur-[120px]" />
        </div>

        <div className="w-full max-w-3xl mx-auto px-4 relative">
          <div className="text-center mb-6 sm:mb-10">
            <span className="text-sm font-medium text-primary">Your Command Center</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-2">
              One dashboard to run it all
            </h2>
          </div>

          <motion.div style={{ opacity, perspective: 1200 }} className="relative">
            <motion.div
              style={{ rotateX: lidRotation, transformOrigin: "bottom center" }}
              className="relative bg-gradient-to-b from-[hsl(220,20%,18%)] to-[hsl(220,20%,12%)] dark:from-[hsl(220,30%,12%)] dark:to-[hsl(220,30%,8%)] border border-border/50 rounded-t-2xl p-2 sm:p-3 pb-0 -mb-1 shadow-2xl"
            >
              <div className="relative rounded-t-lg overflow-hidden bg-muted aspect-video">
                <img
                  src={heroImg}
                  alt="Manaja Dashboard Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
              </div>
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-muted-foreground/20" />
            </motion.div>

            <div className="relative bg-gradient-to-b from-[hsl(220,15%,22%)] to-[hsl(220,15%,18%)] dark:from-[hsl(220,20%,14%)] dark:to-[hsl(220,20%,10%)] border border-border/50 rounded-b-2xl p-2 pt-0 shadow-lg">
              <div className="h-3 sm:h-4 bg-muted-foreground/5 rounded-b-xl" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-muted-foreground/10 rounded-b" />
            </div>
          </motion.div>

          <p className="text-center mt-6 sm:mt-8 text-muted-foreground text-sm">
            Your AI-driven command center — innovate, collaborate, and scale forward.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── Modules Preview ─── */
type ModulePreview = {
  slug?: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  status: "live" | "in_progress" | "coming_soon";
  status_label?: string | null;
};

const fallbackModules: ModulePreview[] = [
  { slug: "crm", icon: Users, title: "CRM & Client Management", description: "Manage leads, contacts, and customer relationships with AI-powered insights.", color: "text-blue-500", bgColor: "bg-blue-500/10", status: "coming_soon" },
  { slug: "hr", icon: UserCog, title: "HR & Payroll", description: "Streamline employee management, attendance, and payroll with smart automation.", color: "text-emerald-500", bgColor: "bg-emerald-500/10", status: "coming_soon" },
  { slug: "inventory", icon: Package, title: "Inventory & Procurement", description: "Track inventory levels, manage suppliers, and automate purchasing at scale.", color: "text-orange-500", bgColor: "bg-orange-500/10", status: "coming_soon" },
  { slug: "finance", icon: Calculator, title: "Accounting & Finance", description: "Complete financial management with real-time reporting and compliance tools.", color: "text-violet-500", bgColor: "bg-violet-500/10", status: "coming_soon" },
  { slug: "real-estate", icon: Building2, title: "Real Estate & Facilities", description: "Manage properties, leases, maintenance, and facility operations seamlessly.", color: "text-rose-500", bgColor: "bg-rose-500/10", status: "coming_soon" },
  { slug: "compliance", icon: Shield, title: "Compliance & Risk", description: "Stay compliant with automated risk assessment and comprehensive audit trails.", color: "text-amber-500", bgColor: "bg-amber-500/10", status: "coming_soon" },
  { slug: "projects", icon: FolderKanban, title: "Projects & Tasks", description: "Collaborate on projects with forward-thinking task management tools.", color: "text-cyan-500", bgColor: "bg-cyan-500/10", status: "coming_soon" },
  { slug: "analytics", icon: BarChart3, title: "Analytics & Automation", description: "Gain customer-centric insights with dashboards and automate workflows.", color: "text-pink-500", bgColor: "bg-pink-500/10", status: "coming_soon" },
];

const STATUS_BADGE: Record<ModulePreview["status"], { label: string; className: string }> = {
  live: { label: "Live", className: "bg-emerald-500 text-white" },
  in_progress: { label: "In Progress", className: "bg-amber-100 text-amber-800 border border-amber-200" },
  coming_soon: { label: "Coming Soon", className: "bg-accent/90 text-accent-foreground" },
};

const ICON_BY_SLUG: Record<string, any> = {
  crm: Users, hr: UserCog, inventory: Package, finance: Calculator,
  "real-estate": Building2, compliance: Shield, projects: FolderKanban, analytics: BarChart3,
};
const COLOR_BY_SLUG: Record<string, { color: string; bgColor: string }> = {
  crm: { color: "text-blue-500", bgColor: "bg-blue-500/10" },
  hr: { color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  inventory: { color: "text-orange-500", bgColor: "bg-orange-500/10" },
  finance: { color: "text-violet-500", bgColor: "bg-violet-500/10" },
  "real-estate": { color: "text-rose-500", bgColor: "bg-rose-500/10" },
  compliance: { color: "text-amber-500", bgColor: "bg-amber-500/10" },
  projects: { color: "text-cyan-500", bgColor: "bg-cyan-500/10" },
  analytics: { color: "text-pink-500", bgColor: "bg-pink-500/10" },
};

function ModulesPreview() {
  const [modules, setModules] = useState<ModulePreview[]>(fallbackModules);
  const [waitlistFor, setWaitlistFor] = useState<{ slug: string; title: string } | null>(null);

  useEffect(() => {
    supabase
      .from("modules")
      .select("slug,title,icon_name,description,status,status_label,sort_order")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        setModules((data as any[]).map((m) => {
          const colors = COLOR_BY_SLUG[m.slug] || { color: "text-primary", bgColor: "bg-primary/10" };
          const Icon = (LucideIcons as any)[m.icon_name] || ICON_BY_SLUG[m.slug] || Layers;
          const rawStatus = (m.status || "coming_soon").replace("-", "_");
          const status = (["live", "in_progress", "coming_soon"].includes(rawStatus) ? rawStatus : "coming_soon") as ModulePreview["status"];
          return { slug: m.slug, title: m.title, description: m.description, icon: Icon, ...colors, status, status_label: m.status_label };
        }));
      });
  }, []);

  return (
    <SectionWrapper className="py-0">
      <div className="relative z-10">
        <div className="text-center mb-12">
          <span className="text-sm font-medium text-primary">Comprehensive Suite</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-2 mb-4">
            Everything You Need, In One Platform
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
           Powerful modules working seamlessly together to drive your business forward through technology and innovation. Choose what you need, scale as you grow.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((mod) => {
            const badge = STATUS_BADGE[mod.status];
            const isLive = mod.status === "live";
            return (
              <motion.div
                key={mod.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group relative p-6 rounded-2xl border border-border bg-card hover-lift cursor-pointer overflow-hidden"
              >
                {/* Subtle status label — top-right, always present, brightens on hover */}
                <span
                  className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide opacity-60 group-hover:opacity-100 transition-opacity duration-300 ${badge.className}`}
                >
                  {mod.status_label || badge.label}
                </span>

                <div className={`w-12 h-12 rounded-xl ${mod.bgColor} flex items-center justify-center mb-4`}>
                  <mod.icon className={`h-6 w-6 ${mod.color}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-2 pr-16">{mod.title}</h3>
                <p className="text-sm text-muted-foreground">{mod.description}</p>

                {/* CTA reveal at bottom on hover — does not cover content */}
                <div className="mt-4 max-h-0 overflow-hidden group-hover:max-h-20 transition-all duration-300 opacity-0 group-hover:opacity-100">
                  {isLive ? (
                    <Button asChild size="sm" className="rounded-full btn-glass-gold border-0 font-semibold w-full">
                      <Link to="/early-access">Login / Sign in</Link>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); setWaitlistFor({ slug: mod.slug, title: mod.title }); }}
                      className="rounded-full btn-glass-gold border-0 font-semibold w-full"
                    >
                      Get early access
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link to="/modules">
            <Button variant="outline" className="rounded-full px-6">
              Explore All Modules <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {waitlistFor && (
        <ModuleWaitlistDialog
          open={!!waitlistFor}
          onOpenChange={(v) => { if (!v) setWaitlistFor(null); }}
          moduleSlug={waitlistFor.slug}
          moduleTitle={waitlistFor.title}
        />
      )}
    </SectionWrapper>
  );
}


/* ─── Benefits Section ─── */
const benefits = [
  { icon: Zap, title: "Lightning Fast", description: "Built on modern cloud infrastructure for instant response times and seamless performance at any scale." },
  { icon: Lock, title: "Enterprise Security", description: "Bank-grade encryption, role-based access, and comprehensive audit logs to protect your data." },
  { icon: Globe, title: "Work From Anywhere", description: "Access your business data securely from any device, anywhere in the world, anytime." },
  { icon: Layers, title: "Modular Architecture", description: "Start with what you need and add modules as your business grows. Pay only for what you use." },
  { icon: Sparkles, title: "AI-Powered Insights", description: "Smart, AI-driven recommendations and automated workflows help you innovate and make better decisions faster." },
  { icon: HeartHandshake, title: "Customer-Centric Support", description: "Our dedicated team provides personalized onboarding and 24/7 service to help you succeed." },
];

function BenefitsSection() {
  return (
    <SectionWrapper>
      <div className="relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <span className="text-sm font-medium text-primary">Why Manaja</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-2 mb-4">
              Built for the Way Modern Teams Collaborate
            </h2>
            <p className="text-muted-foreground mb-6">
              We've reimagined enterprise software from the ground up with forward-thinking technology.
              No more juggling disconnected tools. Manaja delivers a unified, AI-powered experience
              that empowers your team to code, innovate, and scale.
            </p>
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">One Platform, Zero Silos</h4>
                  <p className="text-sm text-muted-foreground">
                    All your business data flows seamlessly between modules, giving you a complete picture of your operations in real-time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-5 rounded-xl border border-border bg-card hover-lift"
              >
                <b.icon className="h-5 w-5 text-primary mb-3" />
                <h4 className="font-semibold text-foreground mb-1 text-sm">{b.title}</h4>
                <p className="text-xs text-muted-foreground">{b.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}

/* ─── Testimonials ─── */
const testimonials = [
  { quote: "Manaja transformed how we operate. Having everything in one place has saved us countless hours and eliminated data entry errors.", author: "Sarah Mitchell", role: "Operations Director", company: "GrowthTech Solutions" },
  { quote: "The modular approach is brilliant. We started with HR and finance, then added inventory as we grew. It scales seamlessly.", author: "Ahmed Hassan", role: "CEO", company: "Nexus Enterprises" },
  { quote: "Finally, an enterprise platform that doesn't require a PhD to configure. Our team was productive from day one.", author: "Lisa Chen", role: "Head of Technology", company: "Momentum Partners" },
];

function TestimonialsSection() {
  return (
    <SectionWrapper className="py-4">
      <div className="relative z-10">
        <div className="text-center mb-12">
          <span className="text-sm font-medium text-primary">Testimonials</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-2 mb-4">
            Trusted by Growing Businesses
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl border border-border bg-card"
            >
              <Quote className="h-5 w-5 text-primary/30 mb-4" />
              <p className="text-sm text-foreground mb-6 italic">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">
                    {t.author.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.author}</p>
                  <p className="text-xs text-muted-foreground">{t.role}, {t.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}

/* ─── CTA Section ─── */
function CTASection() {
  return (
    <SectionWrapper className="py-4">
      <div className="relative z-10">
        <div className="relative rounded-3xl overflow-hidden p-8 sm:p-12 lg:p-16 bg-gradient-to-br from-[hsl(220,80%,60%)] via-[hsl(220,75%,55%)] to-[hsl(230,70%,50%)] border border-white/10">
          {/* Soft radial glow overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.15)_0%,_transparent_70%)] pointer-events-none" />
          <div className="max-w-2xl mx-auto text-center relative z-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs font-medium mb-6">
              <Sparkles className="h-3 w-3" />
              Limited Early Access Spots Available
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Ready to Transform Your Business Operations?
            </h2>
            <p className="text-white/75 mb-8 max-w-xl mx-auto">
              Join our early access program and be among the first to experience the future of enterprise management. Get exclusive benefits and shape the product roadmap.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link to="/early-access">
                <Button size="lg" className="btn-glass-gold rounded-full px-8 font-semibold border-0">
                  Get Early Access <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="ghost" size="lg" className="rounded-full px-8 text-white hover:bg-white/10 hover:text-white">
                  Talk to Sales
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-white/60 text-sm">
              <span className="flex items-center gap-1.5">✓ No credit card required</span>
              <span className="flex items-center gap-1.5">✓ 90-day free trial</span>
              <span className="flex items-center gap-1.5">✓ Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}

/* ─── Home Page ─── */
export default function Index() {
  return (
    <>
      <Seo
        title="Manaja | All-in-One Business Management Software — HR, Payroll, CRM, Accounting, Inventory, Property & Project Management"
        description="Unify HR & Payroll, CRM & Client Management, Accounting & Finance, Sales, Inventory & Procurement, Property Management, Projects & Tasks, Compliance & Risk, and Analytics & Automation in one AI-powered platform."
        path="/"
        keywords="business management software, ERP, HR software, payroll, CRM, client management, accounting software, sales, inventory management, procurement, property management, property listing, project management, task management, compliance and risk, analytics and automation, workflow automation, Manaja"
      />
      <HeroSection />
      <LaptopScrollSection />
      <ModulesPreview />
      <BenefitsSection />
      <TestimonialsSection />
      <SecurityBadge />
      <CTASection />
    </>
  );
}
