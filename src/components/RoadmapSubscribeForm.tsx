import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Loader2, CheckCircle2, Bell } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  subscribeToRoadmapUpdates,
  OfflineQueuedError,
} from "@/lib/form-submissions";

const emailSchema = z
  .string()
  .trim()
  .min(1, { message: "Please enter your email" })
  .max(255, { message: "Email is too long" })
  .email({ message: "Please enter a valid email" });

export function RoadmapSubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [hp, setHp] = useState("");
  const mountedAt = useRef<number>(Date.now());
  const { toast } = useToast();

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;

    if (hp.trim().length > 0) {
      setStatus("success");
      return;
    }
    if (Date.now() - mountedAt.current < 1500) {
      toast({
        title: "Hang on",
        description: "Please take a moment before submitting.",
        variant: "destructive",
      });
      return;
    }

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast({
        title: "Invalid email",
        description: parsed.error.issues[0]?.message ?? "Please check your email",
        variant: "destructive",
      });
      return;
    }

    setStatus("loading");
    try {
      const result = await subscribeToRoadmapUpdates(parsed.data);

      setStatus("success");
      setEmail("");
      toast({
        title: result.alreadySubscribed
          ? "You're already on the list ✓"
          : "Subscribed ✓ — confirmation email sent",
        description: result.alreadySubscribed
          ? "We'll keep you posted on roadmap updates."
          : result.delivery === "email-fallback"
            ? "We've queued you up via our support inbox until the database sync finishes. Check your email for confirmation."
            : "We've sent a confirmation email and you'll hear from us whenever we ship something new.",
      });
    } catch (error) {
      console.error(error);
      setStatus("idle");
      if (error instanceof OfflineQueuedError) {
        toast({
          title: "You're offline — we saved it",
          description:
            "We'll subscribe you automatically as soon as you're back online.",
        });
        setStatus("success");
        setEmail("");
      } else {
        toast({
          title: "Something went wrong",
          description:
            "We tried a few times and couldn't reach our servers. Please try again in a moment.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="relative max-w-2xl mx-auto p-8 sm:p-10 rounded-3xl border border-border bg-card overflow-hidden"
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <span className="text-sm font-medium text-primary">Stay in the loop</span>
      </div>

      <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
        Get roadmap updates by email
      </h3>
      <p className="text-muted-foreground mb-6">
        We'll send you a short note whenever we ship something new. No spam, ever.
      </p>

      {status === "success" ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            You're on the list — check your inbox for a confirmation email.
          </p>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3" noValidate>
          {/* Honeypot */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "-10000px",
              width: "1px",
              height: "1px",
              overflow: "hidden",
            }}
          >
            <label htmlFor="roadmap-website">Leave this field empty</label>
            <input
              id="roadmap-website"
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
            />
          </div>

          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="email"
              required
              maxLength={255}
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading"}
              className="pl-10 h-12 rounded-full bg-background/60"
              aria-label="Email address"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={status === "loading"}
            className="btn-glass-gold rounded-full px-7 font-semibold border-0 h-12"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subscribing
              </>
            ) : (
              "Notify me"
            )}
          </Button>
        </form>
      )}
    </motion.div>
  );
}
