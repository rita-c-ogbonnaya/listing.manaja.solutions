import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform, useInView } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  Rocket,
  Sparkles,
  Layers,
  Globe,
  Bot,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Circle,
  Loader2,
  Calendar,
  Users,
  UserCog,
  Calculator,
  Package,
  FolderKanban,
  BarChart3,
  Lock,
  Zap,
  Plug,
  Languages,
  Quote,
} from "lucide-react";
import { SectionWrapper } from "@/components/SectionWrapper";
import { RoadmapSubscribeForm } from "@/components/RoadmapSubscribeForm";
import { cn } from "@/lib/utils";
import { Seo } from "@/components/Seo";

type Status = "completed" | "in-progress" | "planned";

interface Feature {
  icon: typeof Rocket;
  label: string;
  detail: string;
}

interface Milestone {
  id: string;
  quarter: string;
  year: string;
  title: string;
  status: Status;
  icon: typeof Rocket;
  tagline: string;
  story: string;          // longer, narrative paragraph
  outcome: string;        // "what this unlocks for customers"
  features: Feature[];
  progress: number;
}

const roadmap: Milestone[] = [
  {
    id: "q4-2025",
    quarter: "Q4",
    year: "2025",
    title: "Foundation & Early Access",
    status: "completed",
    icon: Sparkles,
    tagline: "Where it all began",
    story:
      "Manaja started with a simple frustration: growing African businesses were stitching together five, sometimes ten disconnected tools just to run the basics. We spent Q4 2025 designing the architecture, the brand, and the cloud foundations — and quietly opened the doors to our first early-access partners.",
    outcome:
      "A solid, secure platform foundation and a community of early believers helping us shape what comes next.",
    features: [
      { icon: Globe, label: "Public website launch", detail: "Manaja.solutions goes live with the full vision." },
      { icon: Users, label: "Early access program", detail: "First 50 organizations onboarded as design partners." },
      { icon: Sparkles, label: "Brand & design system", detail: "A unified visual language across every module." },
      { icon: ShieldCheck, label: "Cloud infrastructure", detail: "Enterprise-grade, multi-tenant, ready to scale." },
    ],
    progress: 100,
  },
  {
    id: "q1-2026",
    quarter: "Q1",
    year: "2026",
    title: "Core Modules Launch",
    status: "in-progress",
    icon: Layers,
    tagline: "First customers go live",
    story:
      "Right now, our team is shipping the first production modules — the ones our early-access partners told us they need on day one. CRM to track every client conversation, HR & Payroll to stop juggling spreadsheets, and a unified identity layer so every team member sees exactly what they should.",
    outcome:
      "Real businesses running real operations on Manaja for the very first time.",
    features: [
      { icon: Users, label: "CRM & Client Management", detail: "Pipelines, contacts, and a 360° view of every customer." },
      { icon: UserCog, label: "HR & Payroll essentials", detail: "Employees, leaves, payslips — done in minutes, not days." },
      { icon: Lock, label: "Unified auth & roles", detail: "One login, granular permissions across every module." },
      { icon: BarChart3, label: "Real-time activity feed", detail: "Watch your business breathe in real time." },
    ],
    progress: 65,
  },
  {
    id: "q2-2026",
    quarter: "Q2",
    year: "2026",
    title: "Finance, Inventory & Projects",
    status: "in-progress",
    icon: Building2,
    tagline: "A unified back-office",
    story:
      "Q2 is when Manaja becomes a true back-office. Accounting that talks to your CRM. Inventory that updates the moment a sale closes. Projects that pull billable hours straight into invoices. No more copy-paste between tools — your business finally moves as one system.",
    outcome:
      "End-to-end operations from quote to cash, all under one roof.",
    features: [
      { icon: Calculator, label: "Accounting & Finance", detail: "Invoicing, expenses, reports — built for African tax realities." },
      { icon: Package, label: "Inventory & Procurement", detail: "Live stock levels, purchase orders, and supplier tracking." },
      { icon: FolderKanban, label: "Projects & Tasks", detail: "Boards, time tracking, and budgets that flow into finance." },
      { icon: BarChart3, label: "Cross-module reporting", detail: "One dashboard. Every number. Every department." },
    ],
    progress: 30,
  },
  {
    id: "q3-2026",
    quarter: "Q3",
    year: "2026",
    title: "AI Insights & Automation",
    status: "planned",
    icon: Bot,
    tagline: "Manaja gets smart",
    story:
      "By Q3 2026, Manaja stops being a system you operate — and becomes a system that helps you operate. AI that reads your data and tells you what's quietly going wrong. Automations you can build by describing them in plain English. The work that used to take hours, done while you sleep.",
    outcome:
      "Smaller teams running bigger operations, with AI quietly carrying the weight.",
    features: [
      { icon: BarChart3, label: "Cross-module analytics", detail: "Auto-generated dashboards for every role and team." },
      { icon: Bot, label: "AI assistant", detail: "Ask questions, draft documents, summarize anything." },
      { icon: Zap, label: "No-code workflow automation", detail: "If-this-then-that for your entire business." },
      { icon: Sparkles, label: "Anomaly detection", detail: "Get alerted before problems become crises." },
    ],
    progress: 0,
  },
  {
    id: "q4-2026",
    quarter: "Q4",
    year: "2026",
    title: "Compliance, Real Estate & Marketplace",
    status: "planned",
    icon: ShieldCheck,
    tagline: "Vertical depth",
    story:
      "We're going deep, not just wide. Industry-specific modules for compliance and real estate. And — for the first time — a marketplace where partners and developers can extend Manaja, ship their own modules, and reach our entire customer base.",
    outcome:
      "An ecosystem, not just a product.",
    features: [
      { icon: ShieldCheck, label: "Compliance & Risk", detail: "Audit trails, controls, and regulatory reporting." },
      { icon: Building2, label: "Real Estate & Facilities", detail: "Properties, tenants, leases, and maintenance." },
      { icon: Plug, label: "Integrations marketplace", detail: "Plug into the tools your team already loves." },
      { icon: Layers, label: "Custom modules SDK", detail: "Build your own modules on top of Manaja." },
    ],
    progress: 0,
  },
  {
    id: "2027",
    quarter: "2027",
    year: "& Beyond",
    title: "Global Scale",
    status: "planned",
    icon: Globe,
    tagline: "Going worldwide",
    story:
      "Built in Africa, ready for the world. By 2027, Manaja runs in regional data centers across continents, speaks your customers' languages, prices in their currencies, and meets the toughest enterprise security bars on the planet.",
    outcome:
      "An African platform that competes — and wins — globally.",
    features: [
      { icon: Globe, label: "Multi-region residency", detail: "Your data stays in your region, by law and by design." },
      { icon: Languages, label: "Localization & multi-currency", detail: "Built for every market we serve." },
      { icon: Lock, label: "Enterprise SSO & governance", detail: "SAML, SCIM, audit logs, retention policies." },
      { icon: ShieldCheck, label: "SOC 2 & ISO 27001", detail: "Independently certified, top to bottom." },
    ],
    progress: 0,
  },
];

const statusMeta: Record<
  Status,
  {
    label: string;
    icon: typeof CheckCircle2;
    chipClass: string;
    dot: string;
    ring: string;
    text: string;
    glow: string;
  }
> = {
  completed: {
    label: "Shipped",
    icon: CheckCircle2,
    chipClass: "bg-primary/10 text-primary border-primary/20",
    dot: "bg-primary",
    ring: "ring-primary/30",
    text: "text-primary",
    glow: "bg-primary/30",
  },
  "in-progress": {
    label: "In Progress",
    icon: Loader2,
    chipClass:
      "bg-accent/15 text-accent-foreground border-accent/30 dark:text-accent",
    dot: "bg-accent",
    ring: "ring-accent/40",
    text: "text-accent dark:text-accent",
    glow: "bg-accent/30",
  },
  planned: {
    label: "Planned",
    icon: Circle,
    chipClass: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground/40",
    ring: "ring-muted-foreground/20",
    text: "text-muted-foreground",
    glow: "bg-muted-foreground/10",
  },
};

/* ── Single milestone with reveal-on-scroll ── */
function MilestoneCard({
  item,
  index,
}: {
  item: Milestone;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px -15% 0px" });
  // Light the dot the moment the scrolling line reaches it. The line fills
  // against viewport offsets ["start 60%", "end 50%"], so we mirror that:
  // fire when the dot's center crosses ~60% down the viewport.
  const dotLit = useInView(dotRef, { once: true, margin: "-60% 0px -40% 0px" });
  const meta = statusMeta[item.status];
  const StatusIcon = meta.icon;
  const Icon = item.icon;
  const isLeft = index % 2 === 0;

  return (
    <div
      ref={ref}
      className={cn(
        "relative grid sm:grid-cols-2 gap-6 sm:gap-12 items-center",
        !isLeft && "sm:[&>*:first-child]:order-2"
      )}
    >
      {/* Card side */}
      <motion.div
        initial={{ opacity: 0, x: isLeft ? -40 : 40, filter: "blur(8px)" }}
        animate={
          inView
            ? { opacity: 1, x: 0, filter: "blur(0px)" }
            : { opacity: 0, x: isLeft ? -40 : 40, filter: "blur(8px)" }
        }
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={cn("pl-10 sm:pl-0 min-w-0", isLeft ? "sm:text-right" : "")}
      >
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="group relative inline-block w-full text-left p-5 sm:p-7 rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300"
        >
          <div
            className={cn(
              "absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-50 group-hover:opacity-90 transition-opacity",
              meta.glow
            )}
          />

          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border mb-4",
              meta.chipClass
            )}
          >
            <StatusIcon
              className={cn(
                "h-3 w-3",
                item.status === "in-progress" && "animate-spin"
              )}
            />
            {meta.label}
          </div>

          <div className="flex items-start gap-3 mb-3">
            <div
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ring-4",
                "bg-primary/10",
                meta.ring
              )}
            >
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                <Calendar className="h-3 w-3" />
                {item.quarter} {item.year}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground leading-tight">
                {item.title}
              </h3>
              <p className="text-sm text-primary font-medium mt-0.5">
                {item.tagline}
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            {item.story}
          </p>

          {/* Outcome callout */}
          <div className="flex gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10 mb-5">
            <Quote className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground italic">{item.outcome}</p>
          </div>

          {item.status !== "planned" && (
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                <span className="text-muted-foreground">Progress</span>
                <span className={meta.text}>{item.progress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={inView ? { width: `${item.progress}%` } : { width: 0 }}
                  transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full",
                    item.status === "completed" ? "bg-primary" : "bg-accent"
                  )}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2">
            {item.features.map((feature, i) => {
              const FIcon = feature.icon;
              return (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  transition={{ delay: 0.4 + i * 0.08, duration: 0.4 }}
                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <FIcon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{feature.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      {feature.detail}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>

      {/* Timeline dot — sits ON the line (mobile: left-4, sm+: center) */}
      <div
        ref={dotRef}
        className="absolute left-3 sm:left-1/2 top-8 -translate-x-1/2 z-10 w-4 h-4"
      >
        {/* Dim base dot — visible before the line reaches it */}
        <div className="absolute inset-0 rounded-full bg-border ring-4 ring-background" />
        {/* Lit dot — fades in the moment the scroll line touches it */}
        <motion.div
          aria-hidden
          initial={false}
          animate={dotLit ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "absolute inset-0 rounded-full ring-4 ring-background shadow-[0_0_16px_hsl(var(--primary)/0.7)]",
            meta.dot
          )}
        >
          {item.status === "in-progress" && (
            <span className={cn("absolute inset-0 rounded-full animate-ping opacity-60", meta.dot)} />
          )}
        </motion.div>
      </div>

      {/* Empty side spacer */}
      <div className="hidden sm:block" />
    </div>
  );
}

/* ── Closing star — sits ON the timeline line, lights up when scroll touches it ── */
function ClosingStar() {
  const starRef = useRef<HTMLDivElement>(null);
  const lit = useInView(starRef, { once: true, margin: "-55% 0px -45% 0px" });

  return (
    <div className="relative mt-16 pb-2">
      {/* The star — centered on the line (left-4 mobile, center sm+) */}
      <div
        ref={starRef}
        className="absolute left-3 sm:left-1/2 -translate-x-1/2 -top-2 z-10 w-7 h-7"
      >
        {/* Dim base star */}
        <div className="absolute inset-0 rounded-full bg-border ring-8 ring-background flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground/60" />
        </div>
        {/* Lit star */}
        <motion.div
          aria-hidden
          initial={false}
          animate={lit ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 rounded-full bg-primary ring-8 ring-background flex items-center justify-center shadow-[0_0_24px_hsl(var(--primary)/0.8)]"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
        </motion.div>
      </div>

      <p className="pt-12 text-center text-sm text-muted-foreground italic">
        …and the story keeps being written.
      </p>
    </div>
  );
}

export default function RoadmapPage() {
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [overrides, setOverrides] = useState<Record<string, { status?: Status; progress?: number; title?: string; tagline?: string }>>({});
  const [dbMilestones, setDbMilestones] = useState<Milestone[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Map icon names (string from DB) → lucide components used here
  const iconMap: Record<string, typeof Rocket> = {
    Rocket, Sparkles, Layers, Globe, Bot, Building2, ShieldCheck, CheckCircle2,
    Calendar, Users, UserCog, Calculator, Package, FolderKanban, BarChart3,
    Lock, Zap, Plug, Languages,
  };
  const resolveIcon = (name?: string | null) =>
    (name && iconMap[name]) || Sparkles;

  useEffect(() => {
    // Legacy overrides (kept for back-compat)
    supabase
      .from("roadmap_overrides")
      .select("milestone_id,status,progress,title,tagline")
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, { status?: Status; progress?: number; title?: string; tagline?: string }> = {};
        for (const r of data as any[]) {
          map[r.milestone_id] = {
            status: (r.status as Status) ?? undefined,
            progress: r.progress ?? undefined,
            title: r.title ?? undefined,
            tagline: r.tagline ?? undefined,
          };
        }
        setOverrides(map);
      });

    // Live milestones + features from CMS
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const { data: ms, error: msErr } = await supabase
          .from("milestones")
          .select("id, milestone_key, quarter, year, title, tagline, story, outcome, icon_name, status, progress, sort_order, published")
          .eq("published", true)
          .order("sort_order", { ascending: true });
        if (msErr) throw msErr;
        if (!ms || ms.length === 0) {
          setDbMilestones(null);
          return;
        }
        const { data: feats, error: fErr } = await supabase
          .from("milestone_features")
          .select("milestone_id, label, detail, icon_name, sort_order")
          .order("sort_order", { ascending: true });
        if (fErr) throw fErr;
        const featByMs: Record<string, Feature[]> = {};
        for (const f of (feats ?? []) as any[]) {
          (featByMs[f.milestone_id] ||= []).push({
            icon: resolveIcon(f.icon_name),
            label: f.label,
            detail: f.detail,
          });
        }
        const built: Milestone[] = (ms as any[]).map((m) => ({
          id: m.milestone_key || m.id,
          quarter: m.quarter || "",
          year: m.year || "",
          title: m.title,
          status: ((["completed","in-progress","planned"].includes(m.status) ? m.status : "planned") as Status),
          icon: resolveIcon(m.icon_name),
          tagline: m.tagline || "",
          story: m.story || "",
          outcome: m.outcome || "",
          features: featByMs[m.id] || [],
          progress: m.progress ?? 0,
        }));
        setDbMilestones(built);
      } catch (e: any) {
        console.error("roadmap fetch failed", e);
        setLoadError(e?.message || "Could not load the roadmap.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const merged = useMemo<Milestone[]>(
    () => {
      const base = dbMilestones && dbMilestones.length > 0 ? dbMilestones : roadmap;
      return base.map((m) => {
        const o = overrides[m.id];
        if (!o) return m;
        return {
          ...m,
          status: o.status ?? m.status,
          progress: o.progress ?? m.progress,
          title: o.title ?? m.title,
          tagline: o.tagline ?? m.tagline,
        };
      });
    },
    [overrides, dbMilestones]
  );

  // Top page progress bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Timeline line that "lights up" as you scroll through the timeline section
  const timelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: timelineProgress } = useScroll({
    target: timelineRef,
    offset: ["start 60%", "end 50%"],
  });
  const lineHeight = useTransform(timelineProgress, [0, 1], ["0%", "100%"]);
  const lineOpacity = useTransform(timelineProgress, [0, 0.05, 1], [0, 1, 1]);

  const counts = useMemo(
    () => ({
      all: merged.length,
      completed: merged.filter((r) => r.status === "completed").length,
      "in-progress": merged.filter((r) => r.status === "in-progress").length,
      planned: merged.filter((r) => r.status === "planned").length,
    }),
    [merged]
  );

  const visible = useMemo(
    () => (filter === "all" ? merged : merged.filter((m) => m.status === filter)),
    [filter, merged]
  );

  const filters: { value: "all" | Status; label: string }[] = [
    { value: "all", label: "All" },
    { value: "completed", label: "Shipped" },
    { value: "in-progress", label: "In Progress" },
    { value: "planned", label: "Planned" },
  ];

  return (
    <div className="pt-24 relative">
      <Seo
        title="Product Roadmap — Manaja Enterprise SaaS Platform"
        description="See what's shipping and what's next across Manaja modules: HR & Payroll, CRM, Accounting, Inventory & Procurement, Property, Projects, Compliance and Analytics."
        path="/roadmap"
        keywords="Manaja roadmap, product roadmap, upcoming features, SaaS roadmap"
      />
      {/* Top scroll progress bar */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-0.5 bg-primary origin-left z-50"
      />

      {/* Hero */}
      <section className="relative pt-12 sm:pt-20 pb-8 sm:pb-12 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[700px] rounded-full bg-primary/15 dark:bg-primary/20 blur-[160px]" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-accent/10 blur-[120px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass text-xs sm:text-sm font-medium mb-4 sm:mb-6"
            >
              <Rocket className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              The Manaja Roadmap
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 leading-[1.1] tracking-tight text-balance"
            >
              The story of{" "}
              <span className="bg-primary bg-clip-text text-transparent">
                what we're building
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-5 sm:mb-6 text-pretty"
            >
              Scroll down to walk through every chapter — from where Manaja started, to where it's headed next.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex items-center justify-center gap-2 text-xs text-muted-foreground"
            >
              <span className="inline-block w-8 h-px bg-border" />
              Begin the story
              <span className="inline-block w-8 h-px bg-border" />
            </motion.div>

            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="mt-6 mx-auto w-6 h-10 rounded-full border-2 border-muted-foreground/40 flex items-start justify-center p-1.5"
            >
              <span className="w-1 h-2 rounded-full bg-muted-foreground/60" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Filter chips — sticky */}
      <div className="sticky top-16 z-30 backdrop-blur-md bg-background/80 border-y border-border/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto scrollbar-none snap-x snap-mandatory -mx-4 sm:mx-0 px-4 sm:px-0">
            {filters.map((f) => {
              const isActive = filter === f.value;
              const count = counts[f.value];
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "snap-start relative flex items-center gap-1.5 sm:gap-2 shrink-0 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-muted/50"
                  )}
                >
                  <span className="relative">{f.label}</span>
                  <span
                    className={cn(
                      "relative inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-semibold",
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Timeline — story unfolds as you scroll */}
      <SectionWrapper className="py-16">
        <div ref={timelineRef} className="relative max-w-5xl mx-auto">
          {/* Dim background line (the "track") — ends exactly at the star center */}
          <div
            aria-hidden
            className="absolute left-3 sm:left-1/2 top-0 bottom-[88px] w-px bg-border/40 sm:-translate-x-1/2"
          />
          {/* Lit progress line that fills as user scrolls — capped to the star */}
          <motion.div
            aria-hidden
            style={{ height: lineHeight, opacity: lineOpacity }}
            className="absolute left-3 sm:left-1/2 top-0 w-[2px] sm:-translate-x-1/2 bg-gradient-to-b from-primary via-primary to-accent shadow-[0_0_12px_hsl(var(--primary)/0.6)] rounded-full max-h-[calc(100%-88px)]"
          />

          <div className="space-y-20 sm:space-y-32">
            {loading && !dbMilestones && (
              <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm">Loading the latest roadmap…</span>
              </div>
            )}
            {loadError && (
              <div className="text-center py-10 text-sm text-destructive">
                {loadError} <span className="text-muted-foreground">— showing the last known roadmap.</span>
              </div>
            )}
            {!loading && visible.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                No milestones in this view yet.
              </div>
            )}

            {visible.map((item, index) => (
              <MilestoneCard key={item.id} item={item} index={index} />
            ))}
          </div>

          {/* Closing star — sits ON the line; line ends here; lights up when scroll reaches it */}
          <ClosingStar />
        </div>
      </SectionWrapper>

      {/* Subscribe CTA */}
      <SectionWrapper className="pt-4 pb-24">
        <RoadmapSubscribeForm />
      </SectionWrapper>
    </div>
  );
}
