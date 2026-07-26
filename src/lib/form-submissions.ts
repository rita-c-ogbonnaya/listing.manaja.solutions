import { supabase } from "@/integrations/supabase/client";

type ContactEmailPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
};

type SupportRequestPayload = {
  type: "integration" | "migration" | "bug" | "feature" | "escalation";
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
  meta?: Record<string, string | undefined>;
};

type RoadmapSubscriptionPayload = {
  email: string;
  name?: string;
};

const REQUEST_TYPE_LABELS: Record<SupportRequestPayload["type"], string> = {
  integration: "Integration request",
  migration: "Migration request",
  bug: "Bug report",
  feature: "Feature request",
  escalation: "Live agent escalation",
};

const OFFLINE_QUEUE_KEY = "manaja:pending-submissions";
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 600;

type QueuedJob = {
  id: string;
  kind: "support" | "roadmap";
  payload: SupportRequestPayload | RoadmapSubscriptionPayload;
  attempts: number;
  queuedAt: number;
};

function readQueue(): QueuedJob[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedJob[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(jobs: QueuedJob[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(jobs));
  } catch {
    /* ignore quota errors */
  }
}

function enqueue(job: Omit<QueuedJob, "id" | "attempts" | "queuedAt">) {
  const jobs = readQueue();
  jobs.push({
    ...job,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    attempts: 0,
    queuedAt: Date.now(),
  });
  writeQueue(jobs);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isOnline() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}

function toNameParts(value: string) {
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (!cleaned) {
    return { firstName: "There", lastName: "Friend" };
  }
  const [firstName, ...rest] = cleaned.split(" ");
  return { firstName, lastName: rest.join(" ") || "Support" };
}

function deriveNameFromEmail(email: string) {
  const localPart = email.split("@")[0] ?? "subscriber";
  const tokens = localPart
    .split(/[._-]+/)
    .map((token) => token.replace(/\d+/g, "").trim())
    .filter(Boolean);
  const titleCase = (token: string) =>
    token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
  return {
    firstName: titleCase(tokens[0] ?? "there"),
    lastName: titleCase(tokens.slice(1).join(" ") || "Subscriber"),
  };
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === MAX_RETRIES) break;
      const delay = RETRY_BASE_MS * Math.pow(2, attempt) + Math.random() * 200;
      console.warn(`[${label}] attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms`, err);
      await sleep(delay);
    }
  }
  throw lastErr;
}

async function sendViaContactEmail(payload: ContactEmailPayload) {
  return withRetry(async () => {
    const { error } = await supabase.functions.invoke("send-contact-email", {
      body: payload,
    });
    if (error) throw new Error(error.message || "Failed to send request");
  }, "send-contact-email");
}

async function insertSupportRequest(payload: SupportRequestPayload) {
  const { error } = await (supabase as any).from("support_requests").insert({
    type: payload.type,
    name: payload.name,
    email: payload.email.trim().toLowerCase(),
    company: payload.company ?? null,
    subject: payload.subject,
    message: payload.message,
    meta: payload.meta ?? {},
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
  });
  if (error) {
    // Table may not exist yet — don't block the user-visible email path.
    const missingTable =
      error.code === "PGRST205" ||
      /support_requests|schema cache/i.test(error.message ?? "");
    if (!missingTable) {
      console.warn("support_requests insert failed", error);
    }
  }
}

async function performSupportRequest(payload: SupportRequestPayload) {
  const { firstName, lastName } = toNameParts(payload.name);
  const details = [
    `Support request type: ${REQUEST_TYPE_LABELS[payload.type]}`,
    payload.company ? `Company: ${payload.company}` : null,
    ...Object.entries(payload.meta ?? {})
      .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
      .map(([key, value]) => `${key}: ${value}`),
    "",
    payload.message,
  ]
    .filter(Boolean)
    .join("\n");

  await sendViaContactEmail({
    firstName,
    lastName,
    email: payload.email,
    subject: `[${REQUEST_TYPE_LABELS[payload.type]}] ${payload.subject}`,
    message: details,
  });

  // Best-effort log insert (non-blocking on error)
  insertSupportRequest(payload).catch((err) =>
    console.warn("support log insert failed", err)
  );
}

export async function submitSupportRequest(payload: SupportRequestPayload) {
  if (!isOnline()) {
    enqueue({ kind: "support", payload });
    throw new OfflineQueuedError("support");
  }
  try {
    await performSupportRequest(payload);
  } catch (err) {
    enqueue({ kind: "support", payload });
    throw err;
  }
}

async function performRoadmapSubscription(payload: RoadmapSubscriptionPayload) {
  const normalizedEmail = payload.email.trim().toLowerCase();

  const insertResult = await (supabase as any)
    .from("roadmap_subscribers")
    .insert({
      email: normalizedEmail,
      name: payload.name ?? null,
      source: "website",
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });

  if (!insertResult.error) {
    // Send a confirmation email so user knows we got it.
    const { firstName, lastName } = payload.name
      ? toNameParts(payload.name)
      : deriveNameFromEmail(normalizedEmail);
    sendViaContactEmail({
      firstName,
      lastName,
      email: normalizedEmail,
      subject: "Roadmap updates subscription confirmed",
      message:
        "Thanks for subscribing to Manaja roadmap updates. We'll email you whenever we ship something new. (You can unsubscribe at any time by replying to any of our emails.)",
    }).catch((err) => console.warn("roadmap confirmation email failed", err));
    return { alreadySubscribed: false, delivery: "database" as const };
  }

  if (insertResult.error.code === "23505") {
    return { alreadySubscribed: true, delivery: "database" as const };
  }

  const missingTable =
    insertResult.error.code === "PGRST205" ||
    /roadmap_subscribers|schema cache/i.test(insertResult.error.message ?? "");

  if (!missingTable) {
    throw new Error(insertResult.error.message || "Failed to save subscription");
  }

  const { firstName, lastName } = deriveNameFromEmail(normalizedEmail);
  await sendViaContactEmail({
    firstName,
    lastName,
    email: normalizedEmail,
    subject: "Roadmap updates request",
    message:
      "Please add this email address to the Manaja roadmap updates list and send future product update announcements here.",
  });

  return { alreadySubscribed: false, delivery: "email-fallback" as const };
}

export async function subscribeToRoadmapUpdates(
  emailOrPayload: string | RoadmapSubscriptionPayload
) {
  const payload: RoadmapSubscriptionPayload =
    typeof emailOrPayload === "string"
      ? { email: emailOrPayload }
      : emailOrPayload;

  if (!isOnline()) {
    enqueue({ kind: "roadmap", payload });
    throw new OfflineQueuedError("roadmap");
  }
  try {
    return await performRoadmapSubscription(payload);
  } catch (err) {
    enqueue({ kind: "roadmap", payload });
    throw err;
  }
}

export class OfflineQueuedError extends Error {
  kind: "support" | "roadmap";
  constructor(kind: "support" | "roadmap") {
    super("Submission queued offline");
    this.kind = kind;
    this.name = "OfflineQueuedError";
  }
}

let flushing = false;
export async function flushPendingSubmissions(): Promise<{
  flushed: number;
  remaining: number;
}> {
  if (flushing) return { flushed: 0, remaining: readQueue().length };
  if (!isOnline()) return { flushed: 0, remaining: readQueue().length };
  flushing = true;
  let flushed = 0;
  try {
    let jobs = readQueue();
    const survivors: QueuedJob[] = [];
    for (const job of jobs) {
      try {
        if (job.kind === "support") {
          await performSupportRequest(job.payload as SupportRequestPayload);
        } else {
          await performRoadmapSubscription(
            job.payload as RoadmapSubscriptionPayload
          );
        }
        flushed += 1;
      } catch (err) {
        console.warn("queued job failed", err);
        const next = { ...job, attempts: job.attempts + 1 };
        if (next.attempts < 6) survivors.push(next);
      }
    }
    writeQueue(survivors);
    return { flushed, remaining: survivors.length };
  } finally {
    flushing = false;
  }
}

export function installOfflineQueueListener() {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    flushPendingSubmissions().catch(() => {});
  };
  window.addEventListener("online", handler);
  // Try once on install in case there are stale jobs from a previous session.
  if (isOnline()) handler();
  return () => window.removeEventListener("online", handler);
}

export function getPendingSubmissionsCount() {
  return readQueue().length;
}
