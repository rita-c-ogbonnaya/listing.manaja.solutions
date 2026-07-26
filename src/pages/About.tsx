import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building, Target, Eye, Compass, Heart, Lightbulb, Users, Zap, Shield, Infinity, ArrowRight, Linkedin, Twitter } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SectionWrapper } from "@/components/SectionWrapper";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";

const missionItems = [
  { icon: Target, title: "Our Mission", description: "To empower mid-size and growing organizations with unified, AI-powered software that eliminates operational complexity. We collaborate with our customers to innovate and deliver technology that lets teams focus on what matters most.", color: "from-blue-500 to-blue-600" },
  { icon: Eye, title: "Our Vision", description: "A world where every business, regardless of size, has access to enterprise-grade, forward-thinking tools that are intuitive, affordable, and built to scale with their ambitions.", color: "from-emerald-500 to-emerald-600" },
  { icon: Compass, title: "Our Purpose", description: "We believe great software should simplify, not complicate. Every feature we code is designed to save time, reduce friction, and deliver real, customer-centric business value through innovative technology.", color: "from-violet-500 to-violet-600" },
];

const values = [
  { icon: Heart, title: "Customer First", description: "Every decision starts with our customers. Their success drives our service and innovation." },
  { icon: Lightbulb, title: "Innovation", description: "We challenge conventions and constantly seek better, AI-driven ways to solve problems." },
  { icon: Users, title: "Collaboration", description: "Great products come from diverse teams working together toward shared goals." },
  { icon: Zap, title: "Excellence", description: "We hold ourselves to the highest standards in everything we create and deliver." },
  { icon: Shield, title: "Integrity", description: "We are transparent, honest, and always do what is right for our customers." },
  { icon: Infinity, title: "Persistence", description: "We are committed for the long haul, building lasting solutions and forward-thinking relationships." },
];

const fallbackTeam = [
  { name: "Blossom Johnson", role: "Chief Technology Officer", bio: "Customer-centric technology leader driving Manaja's AI-first architecture — collaborating across teams to code resilient, modular systems that scale.", initials: "BJ" },
  { name: "Chidozie V. Nwabuko", role: "Chief Operating Officer", bio: "Operations strategist who collaborates across functions to scale how we build, ship and serve customers — turning technology into measurable outcomes.", initials: "CN" },
  { name: "Inene Israel", role: "Team Lead", bio: "People-first team lead aligning engineering, design and delivery to code customer-centric features that ship on time and scale gracefully.", initials: "II" },
  { name: "Victor Asama", role: "Developer", bio: "Full-stack developer who collaborates across the stack to code reliable, performant technology powering core Manaja workflows every day.", initials: "VA" },
  { name: "Oludolapo Akinbinu", role: "Software Developer", bio: "Software developer focused on clean code, customer-centric UX and shipping modules that scale confidently with our growing customers.", initials: "OA" },
  { name: "Rita C. Onyegbule", role: "Account Manager", bio: "Trusted partner to our customers — collaborating closely to ensure every account gets the customer-centric attention, insight and support they deserve.", initials: "RM" },
];

type TeamMember = { name: string; role: string; bio: string; initials: string; image_url?: string | null; display_mode?: string | null };

export default function AboutPage() {
  const [team, setTeam] = useState<TeamMember[]>(fallbackTeam);
  useEffect(() => {
    supabase
      .from("team_members")
      .select("name,role,bio,initials,sort_order,image_url,display_mode")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setTeam(data as TeamMember[]);
      });
  }, []);
  return (
    <>
      <Seo
        title="About Manaja — Enterprise SaaS Built in Africa for Growing Organizations"
        description="Manaja Solutions builds AI-powered enterprise software — HR, Payroll, CRM, Accounting, Inventory, Property, Projects, Compliance and Analytics — for mid-size and growing organizations worldwide."
        path="/about"
        keywords="about Manaja, Manaja Solutions, enterprise SaaS, business software company, ERP company Africa"
      />
      {/* Hero */}
      <section className="relative pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <Building className="h-8 w-8 text-primary" />
            </motion.div>
            {/* <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium mb-6">
              A Badij Technologies Product
            </motion.div> */}
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Built in Africa,{" "} <br />
              <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">Engineered for the world…</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg text-muted-foreground">
              We are a team of passionate technologists, designers, and business experts on a mission to simplify enterprise operations through AI-powered technology and customer-centric service.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <SectionWrapper>
        <div className="grid md:grid-cols-3 gap-6">
          {missionItems.map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="p-6 rounded-2xl border border-border bg-card">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4`}>
                <item.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
              <p className="text-muted-foreground text-sm">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </SectionWrapper>

      {/* Values */}
      <SectionWrapper>
        <div className="text-center mb-12">
          <span className="text-sm font-medium text-primary">Our Values</span>
          <h2 className="text-3xl font-bold text-foreground mt-2 mb-4">What Drives Us Every Day</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">These core values guide our decisions and define how we collaborate and serve our customers.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {values.map((v, i) => (
            <motion.div key={v.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="p-5 rounded-xl border border-border bg-card">
              <v.icon className="h-5 w-5 text-primary mb-3" />
              <h4 className="font-semibold text-foreground mb-1">{v.title}</h4>
              <p className="text-sm text-muted-foreground">{v.description}</p>
            </motion.div>
          ))}
        </div>
      </SectionWrapper>

      {/* Team */}
      <SectionWrapper>
        <div className="text-center mb-12">
          <span className="text-sm font-medium text-primary">Our Team</span>
          <h2 className="text-3xl font-bold text-foreground mt-2 mb-4">Meet the People Behind Manaja</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map((m, i) => (
            <motion.div key={m.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center p-6 rounded-2xl border border-border bg-card">
              {m.display_mode === "image" && m.image_url ? (
                <img src={m.image_url} alt={m.name} className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border border-border" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-primary-foreground">{m.initials}</span>
                </div>
              )}
              <h4 className="font-semibold text-foreground">{m.name}</h4>
              <p className="text-xs text-primary mb-2">{m.role}</p>
              <p className="text-sm text-muted-foreground">{m.bio}</p>
              <div className="flex justify-center gap-2 mt-3">
                {/* <a href="#" className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"><Linkedin className="h-4 w-4" /></a>
                <a href="#" className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"><Twitter className="h-4 w-4" /></a> */}
              </div>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="/careers">
            <Button variant="outline" className="rounded-full px-6">View Open Positions <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </SectionWrapper>
    </>
  );
}
