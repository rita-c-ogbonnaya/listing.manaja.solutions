import { motion } from "framer-motion";
import { ShieldCheck, Lock, BadgeCheck, KeyRound } from "lucide-react";
import { SectionWrapper } from "@/components/SectionWrapper";

const items = [
  { icon: BadgeCheck, title: "NDPC Certified", body: "Officially recognised by the Nigeria Data Protection Commission." },
  { icon: Lock, title: "Security Guaranteed", body: "Built to keep business data trusted, protected, and compliant." },
  { icon: KeyRound, title: "Protected Access", body: "Role-based controls help ensure only approved people access sensitive data." },
];

export function SecurityBadge() {
  return (
    <SectionWrapper className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-border bg-gradient-to-br from-primary/5 via-card to-accent/5 p-8 sm:p-12"
        >
          <div className="grid lg:grid-cols-[auto_1fr] gap-8 lg:gap-12 items-center">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Trusted & Compliant</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-1">Security Guaranteed</h2>
              </div>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed">
              Manaja SaaS is proudly certified by the <strong className="text-foreground">Nigeria Data Protection
              Commission (NDPC)</strong> — giving your business trusted, secure, and compliant data protection.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mt-10">
            {items.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-border bg-background/40 backdrop-blur p-5">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{body}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
