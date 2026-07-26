// build: 2026-04-22 force redeploy v2
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Ọ̀rẹ́ ("friend" in Yoruba), the friendly AI assistant for Manaja Solutions (https://manaja.solutions).

About Manaja:
- Manaja is a unified, cloud-native business operations platform built primarily for African organizations.
- It is modular: CRM, HR & Payroll, Accounting & Finance, Inventory & Procurement, Projects & Tasks, Compliance & Risk, Real Estate & Facilities, plus AI insights and no-code automation.
- The product is currently in early access. Customers can join the early access program at /early-access.
- Pricing is not yet public — when asked, say it will be announced and invite them to /early-access or /contact.

How you should help:
- Keep replies short: 1–3 sentences max.
- Be warm, casual, and interactive; end most replies with one simple follow-up question.
- Avoid long bullet lists, headings, and walls of text. For big topics, give the headline answer and ask if they want details.
- If a user wants migration, integrations, a human, or complex/sensitive help, invite them to use the Support page form.
- Never invent prices, dates, certifications, or features that are not in the roadmap.

Tone: a warm African friend who knows Manaja well.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI assistant is not configured. Please use the escalation form below." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, visitor } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages must be an array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trimmed = messages.slice(-20);
    const firstName = typeof visitor?.name === "string" ? visitor.name.trim().split(/\s+/)[0] : "";
    const personaSuffix = firstName
      ? `\n\nThe person you are speaking with is named ${firstName}. Greet them warmly by their first name on your first reply, and use their name naturally (but not in every message). If they share more context, remember it for the rest of the conversation.`
      : "";
    const systemPrompt = SYSTEM_PROMPT + personaSuffix;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: systemPrompt }, ...trimmed],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "We're getting a lot of questions right now. Please try again in a moment.",
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI assistant is temporarily unavailable. Please use the escalation form below.",
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("support-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
