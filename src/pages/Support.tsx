import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  LifeBuoy,
  MessageSquare,
  Plug,
  ArrowRightLeft,
  Bug,
  HelpCircle,
  Mail,
  Search,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionWrapper } from "@/components/SectionWrapper";
import { SupportChat } from "@/components/SupportChat";
import { SupportForm } from "@/components/SupportForm";
import { cn } from "@/lib/utils";
import { Seo } from "@/components/Seo";

type TabKey = "chat" | "integration" | "migration" | "bug" | "faq";

const tabs: { key: TabKey; label: string; icon: typeof MessageSquare; description: string }[] = [
  {
    key: "chat",
    label: "Live Chat",
    icon: MessageSquare,
    description: "Get instant answers — escalate to a human anytime.",
  },
  {
    key: "integration",
    label: "Request Integration",
    icon: Plug,
    description: "Need Manaja to connect with another tool?",
  },
  {
    key: "migration",
    label: "Migration Request",
    icon: ArrowRightLeft,
    description: "Switching from another platform? We'll guide you.",
  },
  {
    key: "bug",
    label: "Bug / Feature",
    icon: Bug,
    description: "Found something off, or have a feature in mind?",
  },
  {
    key: "faq",
    label: "FAQ",
    icon: HelpCircle,
    description: "Quick answers to the most common questions.",
  },
];

interface FAQ {
  q: string;
  a: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    category: "Getting started",
    q: "What is Manaja Solutions?",
    a: "Manaja is a unified, cloud-native business operations platform built primarily for African organizations. It brings CRM, HR & Payroll, Accounting, Inventory, Projects, and more under one login — so your business runs as one connected system.",
  },
  {
    category: "Getting started",
    q: "How do I get started?",
    a: "We're currently in early access. Head over to our Early Access page to request an invite — our team will reach out to onboard you and tailor a setup that fits your business.",
  },
  {
    category: "Getting started",
    q: "Do I need technical skills to use Manaja?",
    a: "No. Manaja is designed for everyday business users. The interface is intuitive, and our team helps with setup and training during onboarding.",
  },
  {
    category: "Modules",
    q: "Which modules are available right now?",
    a: "Our first wave includes CRM & Client Management, HR & Payroll essentials, and unified authentication. Finance, Inventory, and Projects are shipping in Q2 2026 — see the Roadmap for the full timeline.",
  },
  {
    category: "Modules",
    q: "Can I use only the modules I need?",
    a: "Yes. Manaja is fully modular — turn on only what you need today and add more as your business grows. Modules share data so everything stays connected.",
  },
  {
    category: "Pricing & billing",
    q: "How much does Manaja cost?",
    a: "Pricing will be announced when we move out of early access. Early access partners get preferential pricing — join the program to lock it in.",
  },
  {
    category: "Pricing & billing",
    q: "Is there a free trial?",
    a: "Early access partners get an extended trial period and white-glove onboarding from our team.",
  },
  {
    category: "Security & data",
    q: "Where is my data stored?",
    a: "Your data is hosted on enterprise-grade cloud infrastructure with encryption at rest and in transit. We're working toward multi-region data residency by 2027 — including African regional hosting.",
  },
  {
    category: "Security & data",
    q: "Who can see my data?",
    a: "Only people you explicitly grant access to. Manaja uses role-based access control across every module, with full audit logs.",
  },
  {
    category: "Security & data",
    q: "Are you SOC 2 / ISO certified?",
    a: "We are working toward SOC 2 and ISO 27001 certifications as part of our 2027 roadmap. In the meantime, our infrastructure follows industry best practices for security and privacy.",
  },
  {
    category: "Integrations & migration",
    q: "Can I migrate from my current platform?",
    a: "Yes. Use the Migration Request form on this page — tell us your current stack and our team will scope a migration plan and timeline with you.",
  },
  {
    category: "Integrations & migration",
    q: "Does Manaja integrate with [tool]?",
    a: "Our integrations marketplace launches in Q4 2026. If you need a specific integration sooner, submit an Integration Request — popular requests get prioritized.",
  },
  {
    category: "Support",
    q: "How fast do you respond to support requests?",
    a: "We respond to all requests within 24 business hours. Live agent escalations and bugs are prioritized.",
  },
];

const CATEGORIES = Array.from(new Set(faqs.map((f) => f.category)));

export default function SupportPage() {
  const [tab, setTab] = useState<TabKey>("chat");
  const [search, setSearch] = useState("");
  const [escalationTranscript, setEscalationTranscript] = useState<string | undefined>(undefined);
  const formAnchorRef = useRef<HTMLDivElement>(null);

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase())
  );

  const handleEscalate = (transcript: string) => {
    setEscalationTranscript(transcript);
    setTab("bug");
    setTimeout(() => {
      formAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  // Reset escalation transcript when leaving escalation tab
  useEffect(() => {
    if (tab !== "bug") setEscalationTranscript(undefined);
  }, [tab]);

  return (
    <div className="pt-24 relative">
      <Seo
        title="Support — Live Chat, Integrations & FAQs | Manaja"
        description="Get support for Manaja — live AI chat, human escalation, integration and migration requests, bug reports and frequently asked questions."
        path="/support"
        keywords="Manaja support, live chat, help center, business software support"
      />
      {/* Hero */}
      <section className="relative pt-10 sm:pt-16 pb-8 sm:pb-10 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-primary/15 dark:bg-primary/20 blur-[160px]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass text-xs sm:text-sm font-medium mb-4 sm:mb-6"
            >
              <LifeBuoy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              Support
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 leading-[1.1] tracking-tight text-balance"
            >
              How can we{" "}
              <span className="bg-primary bg-clip-text text-transparent">help you?</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto text-pretty"
            >
              Chat with our AI assistant for instant answers, request a new integration,
              plan a migration, or talk to a human — all in one place.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Tab nav */}
      <div className="sticky top-16 z-30 backdrop-blur-md bg-background/80 border-y border-border/50">
        <div className="container mx-auto px-4 py-3">
          {/* Mobile: dropdown */}
          <div className="sm:hidden">
            <Select value={tab} onValueChange={(v) => setTab(v as TabKey)}>
              <SelectTrigger className="w-full h-11 rounded-full bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {tabs.map((t) => {
                  const Icon = t.icon;
                  return (
                    <SelectItem key={t.key} value={t.key} className="rounded-lg">
                      <span className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                        {t.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop / tablet: chips */}
          <div className="hidden sm:flex items-center gap-2 overflow-x-auto scrollbar-none -mx-1 px-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "flex items-center gap-2 shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-muted/50"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <SectionWrapper className="py-12">
        <div ref={formAnchorRef} className="max-w-3xl mx-auto">
          {/* Sub-description */}
          <motion.p
            key={tab + "-desc"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-muted-foreground mb-8"
          >
            {tabs.find((t) => t.key === tab)?.description}
          </motion.p>

          {tab === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <SupportChat onEscalate={handleEscalate} />
              <p className="text-xs text-muted-foreground text-center mt-4">
                Tip: click "Talk to a human" anytime to escalate your conversation.
              </p>
            </motion.div>
          )}

          {tab === "integration" && (
            <motion.div key="integration" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <SupportForm
                type="integration"
                title="Request a new integration"
                description="Tell us which tool you'd like Manaja to connect with. Popular requests get prioritized."
                submitLabel="Submit integration request"
                extraFields={[
                  { name: "currentTool", label: "Tool to integrate with", placeholder: "e.g. Slack, QuickBooks, Shopify" },
                  { name: "priority", label: "Priority", placeholder: "Nice-to-have / Important / Blocking" },
                ]}
                defaultSubject="Integration request"
              />
            </motion.div>
          )}

          {tab === "migration" && (
            <motion.div key="migration" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <SupportForm
                type="migration"
                title="Plan your migration"
                description="Switching from another platform? Tell us about your setup and we'll scope a migration plan with you."
                submitLabel="Request migration plan"
                extraFields={[
                  { name: "currentTool", label: "Current platform", placeholder: "e.g. Zoho, Odoo, in-house tool" },
                  { name: "teamSize", label: "Team size", placeholder: "e.g. 25 employees" },
                  { name: "timeline", label: "Ideal timeline", placeholder: "e.g. Within 3 months" },
                ]}
                defaultSubject="Migration request"
              />
            </motion.div>
          )}

          {tab === "bug" && (
            <motion.div key="bug" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              {escalationTranscript && (
                <div className="mb-4 p-4 rounded-xl border border-primary/20 bg-primary/5 text-sm text-foreground">
                  <p className="font-medium mb-1">Escalating from chat 👋</p>
                  <p className="text-muted-foreground">
                    Your conversation with the AI assistant has been attached. Just tell our
                    team how they can help and we'll take it from here.
                  </p>
                </div>
              )}
              <SupportForm
                type={escalationTranscript ? "escalation" : "bug"}
                title={escalationTranscript ? "Talk to a human" : "Report a bug or request a feature"}
                description={
                  escalationTranscript
                    ? "Leave your details and a member of our team will reply within 24 business hours."
                    : "Found something broken or have an idea that would make Manaja better? We're listening."
                }
                submitLabel={escalationTranscript ? "Connect me with the team" : "Submit"}
                extraFields={[
                  { name: "priority", label: "Priority", placeholder: "Low / Medium / High" },
                ]}
                defaultSubject={escalationTranscript ? "Live agent request" : ""}
                transcript={escalationTranscript}
              />
            </motion.div>
          )}

          {tab === "faq" && (
            <motion.div key="faq" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search frequently asked questions…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-11 h-12 rounded-full"
                />
              </div>

              {filteredFaqs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No matches. Try the live chat or one of the request forms above.
                </div>
              ) : (
                <div className="space-y-8">
                  {CATEGORIES.map((cat) => {
                    const items = filteredFaqs.filter((f) => f.category === cat);
                    if (items.length === 0) return null;
                    return (
                      <div key={cat}>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
                          {cat}
                        </h3>
                        <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
                          {items.map((f, i) => (
                            <AccordionItem
                              key={`${cat}-${i}`}
                              value={`${cat}-${i}`}
                              className="border-0 px-5"
                            >
                              <AccordionTrigger className="text-left text-foreground font-medium hover:no-underline">
                                {f.q}
                              </AccordionTrigger>
                              <AccordionContent className="text-muted-foreground leading-relaxed">
                                {f.a}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-10 p-6 rounded-2xl border border-border bg-card text-center">
                <Mail className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="font-semibold text-foreground mb-1">Still need help?</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Chat with our AI assistant or talk to a human — we'll get back to you fast.
                </p>
                <button
                  onClick={() => setTab("chat")}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  Open live chat <MessageSquare className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </SectionWrapper>
    </div>
  );
}
