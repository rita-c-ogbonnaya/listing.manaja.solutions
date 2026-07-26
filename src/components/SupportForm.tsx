import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  submitSupportRequest,
  OfflineQueuedError,
} from "@/lib/form-submissions";

export type RequestType =
  | "integration"
  | "migration"
  | "bug"
  | "feature"
  | "escalation";

interface ExtraField {
  name: "currentTool" | "teamSize" | "timeline" | "priority";
  label: string;
  placeholder?: string;
  type?: "text";
  required?: boolean;
}

interface SupportFormProps {
  type: RequestType;
  title: string;
  description: string;
  submitLabel?: string;
  extraFields?: ExtraField[];
  defaultSubject?: string;
  initialMessage?: string;
  transcript?: string;
}

const fieldSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your full name (at least 2 characters)")
    .max(100, "Name must be under 100 characters")
    .regex(/^[\p{L}][\p{L}\s'.-]*$/u, "Please enter a valid name"),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email")
    .max(255, "Email is too long")
    .email("Please enter a valid email address"),
  company: z
    .string()
    .trim()
    .max(150, "Company name is too long")
    .optional(),
  subject: z
    .string()
    .trim()
    .min(3, "Subject should be at least 3 characters")
    .max(200, "Subject is too long"),
  message: z
    .string()
    .trim()
    .min(20, "Please share at least 20 characters so we can help")
    .max(5000, "Message is too long"),
});

type FieldErrors = Partial<Record<keyof z.infer<typeof fieldSchema>, string>>;

export function SupportForm({
  type,
  title,
  description,
  submitLabel = "Submit request",
  extraFields = [],
  defaultSubject = "",
  initialMessage = "",
  transcript,
}: SupportFormProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(initialMessage);
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  // Honeypot field — bots fill all fields, humans never see this.
  const [hp, setHp] = useState("");
  // Timing — bots submit in <1s after render.
  const mountedAt = useRef<number>(Date.now());

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;

    // Anti-bot: honeypot
    if (hp.trim().length > 0) {
      // Pretend success silently
      setStatus("success");
      return;
    }
    // Anti-bot: minimum render-to-submit time
    if (Date.now() - mountedAt.current < 1500) {
      toast({
        title: "Please take a moment to review your details",
        description: "The form was submitted too quickly.",
        variant: "destructive",
      });
      return;
    }

    const parsed = fieldSchema.safeParse({
      name,
      email,
      company: company || undefined,
      subject,
      message,
    });

    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast({
        title: "Please check your details",
        description:
          parsed.error.issues[0]?.message ?? "Some fields need attention.",
        variant: "destructive",
      });
      return;
    }

    setErrors({});
    const validated = parsed.data;
    setStatus("loading");

    try {
      await submitSupportRequest({
        type,
        name: validated.name,
        email: validated.email,
        company: validated.company,
        subject: validated.subject,
        message: validated.message,
        meta: {
          ...extras,
          ...(transcript ? { transcript } : {}),
        },
      });

      setStatus("success");
      toast({
        title: "Request sent ✓",
        description:
          "We'll send you a confirmation email and reply within 24 business hours.",
      });
    } catch (err) {
      console.error(err);
      setStatus("idle");
      if (err instanceof OfflineQueuedError) {
        toast({
          title: "You're offline — we saved it",
          description:
            "We'll automatically send your request as soon as you're back online.",
        });
        // Treat as success-ish so the user gets a confirmation screen
        setStatus("success");
      } else {
        toast({
          title: "Couldn't send your request",
          description:
            "We tried a few times and it didn't go through. Please try again or email support@manaja.solutions directly.",
          variant: "destructive",
        });
      }
    }
  };

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center"
      >
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">
          Got it — we're on it.
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your request landed in our inbox. We've sent a confirmation email and a
          real human from the Manaja team will reply within 24 business hours.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="mb-6">
        <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Honeypot — visually hidden from humans */}
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
          <label htmlFor={`${type}-website`}>Leave this field empty</label>
          <input
            id={`${type}-website`}
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`${type}-name`}>Full name *</Label>
            <Input
              id={`${type}-name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? `${type}-name-err` : undefined}
              className="mt-1.5"
            />
            {errors.name && (
              <p id={`${type}-name-err`} className="mt-1 text-xs text-destructive">
                {errors.name}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor={`${type}-email`}>Work email *</Label>
            <Input
              id={`${type}-email`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              required
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? `${type}-email-err` : undefined}
              className="mt-1.5"
            />
            {errors.email && (
              <p id={`${type}-email-err`} className="mt-1 text-xs text-destructive">
                {errors.email}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor={`${type}-company`}>Company</Label>
          <Input
            id={`${type}-company`}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            maxLength={150}
            aria-invalid={!!errors.company}
            className="mt-1.5"
          />
          {errors.company && (
            <p className="mt-1 text-xs text-destructive">{errors.company}</p>
          )}
        </div>

        <div>
          <Label htmlFor={`${type}-subject`}>Subject *</Label>
          <Input
            id={`${type}-subject`}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={200}
            required
            aria-invalid={!!errors.subject}
            aria-describedby={errors.subject ? `${type}-subject-err` : undefined}
            className="mt-1.5"
          />
          {errors.subject && (
            <p id={`${type}-subject-err`} className="mt-1 text-xs text-destructive">
              {errors.subject}
            </p>
          )}
        </div>

        {extraFields.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-4">
            {extraFields.map((f) => (
              <div key={f.name}>
                <Label htmlFor={`${type}-${f.name}`}>{f.label}</Label>
                <Input
                  id={`${type}-${f.name}`}
                  value={extras[f.name] || ""}
                  onChange={(e) =>
                    setExtras((prev) => ({ ...prev, [f.name]: e.target.value }))
                  }
                  placeholder={f.placeholder}
                  maxLength={150}
                  className="mt-1.5"
                />
              </div>
            ))}
          </div>
        )}

        <div>
          <Label htmlFor={`${type}-message`}>Tell us more *</Label>
          <Textarea
            id={`${type}-message`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={5000}
            required
            rows={5}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? `${type}-message-err` : undefined}
            className="mt-1.5 resize-none"
          />
          <div className="mt-1 flex items-center justify-between gap-2">
            {errors.message ? (
              <p id={`${type}-message-err`} className="text-xs text-destructive">
                {errors.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Minimum 20 characters
              </p>
            )}
            <p className="text-xs text-muted-foreground tabular-nums">
              {message.length}/5000
            </p>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={status === "loading"}
          className="btn-glass-gold rounded-full px-7 font-semibold border-0 w-full sm:w-auto"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </form>
    </div>
  );
}
