import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  AlertCircle,
  UserRoundCheck,
  Heart,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };

interface SupportChatProps {
  onEscalate: (transcript: string) => void;
}

const BOT_NAME = "Ọ̀rẹ́";
const SESSION_KEY = "manaja:chat:session";
const VISITOR_KEY = "manaja:chat:visitor";
const CONV_KEY = "manaja:chat:conv";

const STARTERS = [
  "What modules does Manaja offer?",
  "How do I join early access?",
  "Can I migrate from another platform?",
  "Is my data secure?",
];

async function streamSupportChat(messages: Msg[], visitor?: { name?: string; email?: string }) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

  if (!supabaseUrl || !publishableKey) {
    throw new Error("Assistant is not configured.");
  }

  return fetch(`${supabaseUrl}/functions/v1/support-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
    },
    body: JSON.stringify({ messages: messages.slice(-12), visitor }),
  });
}

function getSessionId() {
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = (crypto as any).randomUUID?.() || `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}
function getStoredVisitor(): { name?: string; email?: string } | null {
  try { return JSON.parse(localStorage.getItem(VISITOR_KEY) || "null"); } catch { return null; }
}

function buildIntro(name?: string) {
  const first = name?.trim().split(" ")[0];
  if (first) {
    return `Báwo ni, **${first}** 👋 Welcome back — I'm **${BOT_NAME}**. What can I help you with today?`;
  }
  return `Báwo ni 👋 I'm **${BOT_NAME}** — your friend at Manaja. Ask me anything: modules, security, pricing, or how to get started. What's on your mind?`;
}

function newUuid() {
  return (crypto as any).randomUUID?.() || `c_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function SupportChat({ onEscalate }: SupportChatProps) {
  const stored = typeof window !== "undefined" ? getStoredVisitor() : null;
  const [introOpen, setIntroOpen] = useState(!stored);
  const [visitorName, setVisitorName] = useState(stored?.name || "");
  const [visitorEmail, setVisitorEmail] = useState(stored?.email || "");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: buildIntro(stored?.name) },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string | null>(typeof window !== "undefined" ? sessionStorage.getItem(CONV_KEY) : null);
  const messageCountRef = useRef(0);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  // Generate conversation id client-side so we don't need SELECT RLS on chat_conversations
  async function ensureConversation() {
    if (conversationIdRef.current) return conversationIdRef.current;
    const cid = newUuid();
    const sid = getSessionId();
    try {
      const { error } = await supabase.from("chat_conversations").insert({
        id: cid,
        session_id: sid,
        visitor_name: visitorName || null,
        visitor_email: visitorEmail || null,
      });
      if (error) throw error;
      conversationIdRef.current = cid;
      sessionStorage.setItem(CONV_KEY, cid);
      return cid;
    } catch (e) {
      console.warn("conv create failed", e);
      return null;
    }
  }

  async function persistMessage(role: "user" | "assistant", content: string) {
    const cid = await ensureConversation();
    if (!cid) return;
    messageCountRef.current += 1;
    try {
      await supabase.from("chat_messages").insert({ conversation_id: cid, role, content });
      await supabase.from("chat_conversations").update({
        last_message_at: new Date().toISOString(),
        message_count: messageCountRef.current,
        visitor_name: visitorName || null,
        visitor_email: visitorEmail || null,
      }).eq("id", cid);
    } catch (e) { console.warn("persist message failed", e); }
  }

  function saveVisitor() {
    if (!visitorName.trim()) return;
    const first = visitorName.trim().split(" ")[0];
    localStorage.setItem(VISITOR_KEY, JSON.stringify({ name: visitorName.trim(), email: visitorEmail.trim() || undefined }));
    setIntroOpen(false);
    setMessages((prev) => [
      prev[0],
      { role: "assistant", content: `Nice to meet you, **${first}**! How can I help today?` },
    ]);
  }

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setError(null);
    setInput("");

    const userMsg: Msg = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    void persistMessage("user", trimmed);
    setIsLoading(true);

    try {
      const resp = await streamSupportChat(next, { name: visitorName || undefined, email: visitorEmail || undefined });
      if (!resp.ok || !resp.body) {
        setError("Live AI is temporarily unavailable. Please try again in a moment.");
        setIsLoading(false);
        return;
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = ""; let assistantSoFar = ""; let started = false; let done = false;
      const updateAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        const isFirstChunk = !started;
        if (isFirstChunk) {
          started = true;
          setError(null);
        }
        setMessages((prev) => {
          if (isFirstChunk) { return [...prev, { role: "assistant", content: assistantSoFar }]; }
          const copy = [...prev]; copy[copy.length - 1] = { role: "assistant", content: assistantSoFar }; return copy;
        });
      };
      while (!done) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl); buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.trim() || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const choice = parsed.choices?.[0];
            const delta = choice?.delta ?? choice?.message ?? {};
            let content = "";
            if (typeof delta?.content === "string") content = delta.content;
            else if (Array.isArray(delta?.content)) content = delta.content.map((c: any) => c?.text || "").join("");
            else if (Array.isArray(delta?.parts)) content = delta.parts.map((p: any) => p?.text || "").join("");
            if (content) updateAssistant(content);
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }
      if (started && assistantSoFar) void persistMessage("assistant", assistantSoFar);
      if (!assistantSoFar.trim()) setError("Ọ̀rẹ́ did not receive a reply yet. Please try again or tap 'Talk to a human'.");
    } catch (e) {
      console.error(e);
      setError("Connection error. Please try again in a moment.");
    } finally { setIsLoading(false); }
  };

  const handleEscalate = async () => {
    const transcript = messages.map((m) => `${m.role === "user" ? "User" : BOT_NAME}: ${m.content}`).join("\n\n");
    const cid = await ensureConversation();
    if (cid) { try { await supabase.from("chat_conversations").update({ escalated: true }).eq("id", cid); } catch {} }
    onEscalate(transcript);
  };

  return (
    <div className="flex flex-col h-[600px] rounded-2xl border border-border bg-card overflow-hidden shadow-lg relative">
      {/* Intro overlay */}
      <AnimatePresence>
        {introOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-card/95 backdrop-blur-sm flex flex-col items-center justify-center p-6"
          >
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-4 shadow-lg">
              <Heart className="h-7 w-7 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-1">Báwo ni — I'm {BOT_NAME}</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-5">
              I'm Manaja's friendly AI assistant. Tell me your name so I can help you better.
            </p>
            <div className="w-full max-w-sm space-y-3">
              <div>
                <Label htmlFor="cv-name" className="text-xs">Your name *</Label>
                <Input id="cv-name" autoFocus value={visitorName} onChange={(e) => setVisitorName(e.target.value)} placeholder="Adaeze" />
              </div>
              <div>
                <Label htmlFor="cv-email" className="text-xs">Email (optional)</Label>
                <Input id="cv-email" type="email" value={visitorEmail} onChange={(e) => setVisitorEmail(e.target.value)} placeholder="you@company.com" />
              </div>
              <Button className="w-full btn-glass-primary text-primary-foreground border-0" onClick={saveVisitor} disabled={!visitorName.trim()}>
                Start chatting
              </Button>
              <button onClick={() => setIntroOpen(false)} className="w-full text-xs text-muted-foreground hover:text-foreground">
                Skip — chat anonymously
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-3 p-4 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 ring-2 ring-card" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{BOT_NAME}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 shrink-0 text-primary" />
              <span className="truncate">Manaja AI assistant · live</span>
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleEscalate} className="h-8 rounded-full text-xs">
          <UserRoundCheck className="mr-1.5 h-3.5 w-3.5" />
          Talk to a human
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-muted/20 p-4">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
              className={cn("flex max-w-[85%] gap-2.5", m.role === "user" ? "ml-auto flex-row-reverse" : "")}
            >
              <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                m.role === "user" ? "bg-foreground text-background" : "bg-primary text-primary-foreground")}
              >
                {m.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>
              <div className={cn("whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                m.role === "user" ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm border border-border bg-card")}
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:mt-2 prose-headings:mb-1 prose-pre:my-2 prose-pre:bg-muted prose-pre:text-foreground prose-code:text-primary prose-code:before:content-none prose-code:after:content-none prose-a:text-primary prose-a:underline-offset-2 hover:prose-a:opacity-80 prose-strong:text-foreground">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ href, children, ...props }) => (<a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>) }}>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                ) : m.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex max-w-[85%] gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Bot className="h-3.5 w-3.5" /></div>
            <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-2.5 text-sm">
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0.3s]" />
              </span>
            </div>
          </motion.div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p>{error}</p>
          </div>
        )}

        {messages.length <= 2 && !isLoading && !introOpen && (
          <div className="pt-2">
            <p className="mb-2 px-1 text-xs text-muted-foreground">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2 border-t border-border bg-background p-3">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Type a message to ${BOT_NAME}…`} disabled={isLoading || introOpen} maxLength={1000} className="flex-1 rounded-full border-border bg-muted/40 focus-visible:ring-1" />
        <Button type="submit" disabled={isLoading || !input.trim() || introOpen} size="icon" className="btn-glass-gold h-10 w-10 shrink-0 rounded-full border-0">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
