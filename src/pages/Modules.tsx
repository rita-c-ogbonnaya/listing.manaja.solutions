import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { ArrowRight, Puzzle, Layers, Users, UserCog, Package, Calculator, Building2, Shield, FolderKanban, BarChart3, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionWrapper } from "@/components/SectionWrapper";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";
import CrmImg from "@/assets/crm.png";
import HrImg from "@/assets/hr.png";
import InventoryImg from "@/assets/inventory.png";
import FinanceImg from "@/assets/finance.png";
import RealEstateImg from "@/assets/real-estate.png";
import ComplianceImg from "@/assets/compliance.png";
import ProjectsImg from "@/assets/projects.png";
import AnalyticsImg from "@/assets/analytics.png";

type ModuleItem = {
  slug: string; title: string; icon: any; image: string; description: string;
  features: string[]; color: string; lightBg: string;
};

const fallbackImagesBySlug: Record<string, string> = {
  crm: CrmImg, hr: HrImg, inventory: InventoryImg, finance: FinanceImg,
  "real-estate": RealEstateImg, compliance: ComplianceImg, projects: ProjectsImg, analytics: AnalyticsImg,
};

const fallbackModules: ModuleItem[] = [
  { slug: "crm", icon: Users, title: "CRM & Client Management", image: CrmImg, description: "Build stronger customer-centric relationships with intelligent CRM. Track interactions, manage pipelines, and never miss an opportunity.", features: ["360-degree customer view", "Sales pipeline management", "Lead scoring and tracking", "Email integration", "Activity timeline", "Custom fields and tags"], color: "from-blue-500 to-blue-600", lightBg: "bg-blue-50 dark:bg-blue-950/20" },
  { slug: "hr", icon: UserCog, title: "HR & Payroll", image: HrImg, description: "Streamline HR with AI-powered automation from hiring to retirement. Collaborate across teams and scale your people operations.", features: ["Employee self-service portal", "Automated payroll processing", "Leave management", "Performance reviews", "Recruitment pipeline", "Training and development"], color: "from-emerald-500 to-emerald-600", lightBg: "bg-emerald-50 dark:bg-emerald-950/20" },
  { slug: "inventory", icon: Package, title: "Inventory & Procurement", image: InventoryImg, description: "Take control of your supply chain with real-time, technology-driven inventory tracking and intelligent procurement workflows.", features: ["Real-time stock levels", "Automated reorder points", "Supplier management", "Purchase order workflows", "Barcode scanning", "Multi-warehouse support"], color: "from-orange-500 to-orange-600", lightBg: "bg-orange-50 dark:bg-orange-950/20" },
  { slug: "finance", icon: Calculator, title: "Accounting & Finance", image: FinanceImg, description: "Complete financial management with real-time reporting, compliance, and AI-driven insights to innovate your finance operations.", features: ["General ledger", "Accounts payable/receivable", "Bank reconciliation", "Financial reporting", "Multi-currency support", "Tax compliance"], color: "from-violet-500 to-violet-600", lightBg: "bg-violet-50 dark:bg-violet-950/20" },
  { slug: "real-estate", icon: Building2, title: "Real Estate & Facilities", image: RealEstateImg, description: "Manage properties, leases, and facility operations efficiently with forward-thinking tools built to scale.", features: ["Property portfolio management", "Lease tracking", "Maintenance scheduling", "Space planning", "Utility management", "Tenant portal"], color: "from-rose-500 to-rose-600", lightBg: "bg-rose-50 dark:bg-rose-950/20" },
  { slug: "compliance", icon: Shield, title: "Compliance & Risk", image: ComplianceImg, description: "Stay compliant with automated risk assessment and comprehensive audit trails. Code confidence into your operations.", features: ["Risk assessment tools", "Compliance tracking", "Audit trail logging", "Policy management", "Incident reporting", "Regulatory updates"], color: "from-amber-700 to-amber-800", lightBg: "bg-amber-50 dark:bg-amber-950/20" },
  { slug: "projects", icon: FolderKanban, title: "Projects & Tasks", image: ProjectsImg, description: "Plan, execute, and track projects with collaborative task management. Innovate how your teams work together.", features: ["Kanban and Gantt views", "Task dependencies", "Time tracking", "Team collaboration", "Resource allocation", "Project templates"], color: "from-cyan-500 to-cyan-600", lightBg: "bg-cyan-50 dark:bg-cyan-950/20" },
  { slug: "analytics", icon: BarChart3, title: "Analytics & Automation", image: AnalyticsImg, description: "Gain actionable, AI-powered insights from your data and automate repetitive workflows to scale faster.", features: ["Custom dashboards", "Real-time analytics", "Workflow automation", "Scheduled reports", "KPI tracking", "Data visualization"], color: "from-pink-500 to-pink-600", lightBg: "bg-pink-50 dark:bg-pink-950/20" },
];

function resolveIcon(name: string): any {
  return (LucideIcons as any)[name] || Layers;
}

export default function ModulesPage() {
  const [modules, setModules] = useState<ModuleItem[]>(fallbackModules);

  useEffect(() => {
    supabase
      .from("modules")
      .select("slug,title,icon_name,description,features,color,light_bg,image_url,sort_order")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        setModules(
          (data as any[]).map((m) => ({
            slug: m.slug,
            title: m.title,
            icon: resolveIcon(m.icon_name),
            image: m.image_url || fallbackImagesBySlug[m.slug] || CrmImg,
            description: m.description,
            features: Array.isArray(m.features) ? m.features : [],
            color: m.color,
            lightBg: m.light_bg,
          }))
        );
      });
  }, []);

  return (
    <>
      <Seo
        title="Modules — HR & Payroll, CRM, Accounting, Inventory, Property, Projects, Compliance & Analytics | Manaja"
        description="Explore Manaja's modular business software: HR & Payroll, CRM & Client Management, Accounting & Finance, Sales, Inventory & Procurement, Property Management & Listings, Projects & Tasks, Compliance & Risk, and Analytics & Automation."
        path="/modules"
        keywords="HR software, payroll software, CRM, client management, accounting software, finance software, sales, inventory management, procurement software, property management, property listing, project management, task management, compliance and risk, analytics and automation"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Manaja Modules",
          itemListElement: modules.map((m, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: m.title,
            url: `https://manaja.solutions/modules#${m.slug}`,
            description: m.description,
          })),
        }}
      />
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <Layers className="h-8 w-8 text-primary" />
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Powerful Modules,{" "}
              <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">Seamless Integration</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-lg text-muted-foreground">
              Each module is designed to work independently or as part of your complete business ecosystem. Collaborate, innovate, and scale with technology built for the future.
            </motion.p>
          </div>
        </div>
      </section>

      <SectionWrapper>
        <div className="relative z-10 space-y-16">
          {modules.map((mod, index) => (
            <motion.div
              key={mod.slug}
              id={mod.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`grid lg:grid-cols-2 gap-8 items-center`}
              style={{ direction: index % 2 === 1 ? "rtl" : "ltr" }}
            >
              <div style={{ direction: "ltr" }}>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mod.color} flex items-center justify-center mb-4`}>
                  <mod.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">{mod.title}</h3>
                <p className="text-muted-foreground mb-6">{mod.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  {mod.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> {f}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ direction: "ltr" }} className={`${mod.lightBg} rounded-2xl p-8 flex items-center justify-center min-h-[250px]`}>
                <img src={mod.image} alt={`${mod.title} Dashboard`} className="w-full rounded-xl shadow-lg" />
              </div>
            </motion.div>
          ))}
        </div>
      </SectionWrapper>

      <SectionWrapper>
        <div className="text-center">
          <Puzzle className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-foreground mb-4">Build Your Perfect Stack</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Start with the modules you need most and expand over time. Every module integrates seamlessly through our forward-thinking technology, so you'll never worry about data silos.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/early-access"><Button size="lg" className="btn-glass-gold rounded-full px-8 font-semibold border-0">Get Early Access <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link to="/contact"><Button variant="outline" size="lg" className="rounded-full px-8">Contact Sales</Button></Link>
          </div>
        </div>
      </SectionWrapper>
    </>
  );
}
