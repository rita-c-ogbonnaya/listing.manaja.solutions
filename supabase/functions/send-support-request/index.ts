// build: 2026-04-22 force redeploy v2
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const LOGO_URL =
  "https://szktsksyfniksaoncghr.supabase.co/storage/v1/object/public/email-assets/manajalogo.png";

const requestTypeLabel: Record<string, string> = {
  integration: "Integration Request",
  migration: "Migration Request",
  bug: "Bug Report",
  feature: "Feature Request",
  escalation: "Live Agent Escalation",
};

const bodySchema = z.object({
  type: z.enum(["integration", "migration", "bug", "feature", "escalation"]),
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  company: z.string().max(150).optional().or(z.literal("")),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  // Type-specific extras (all optional, validated lightly)
  meta: z
    .object({
      currentTool: z.string().max(150).optional(),
      teamSize: z.string().max(50).optional(),
      timeline: z.string().max(100).optional(),
      priority: z.string().max(50).optional(),
      transcript: z.string().max(8000).optional(),
    })
    .optional(),
});

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { type, name, email, company, subject, message, meta } = parsed.data;
    const label = requestTypeLabel[type];

    // Persist as a support ticket
    try {
      const supa = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data: ticket } = await supa
        .from("support_tickets")
        .insert({
          type,
          name,
          email,
          company: company || null,
          subject,
          message,
          source: "support_form",
          meta: meta || {},
          priority: meta?.priority || "normal",
        })
        .select("id")
        .single();
      if (ticket?.id) {
        await supa.from("ticket_replies").insert({
          ticket_id: ticket.id,
          direction: "inbound",
          author: name,
          body: message,
        });
      }
    } catch (e) {
      console.error("persist support ticket failed", e);
    }

    const metaRows = meta
      ? Object.entries(meta)
          .filter(([, v]) => v && v.trim() !== "")
          .map(
            ([k, v]) =>
              `<p><strong>${escapeHtml(k)}:</strong> ${escapeHtml(String(v))}</p>`
          )
          .join("")
      : "";

    // Notify team
    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "Manaja Support <noreply@manaja.solutions>",
        to: ["contactfromwebsite@manaja.solutions"],
        reply_to: email,
        subject: `[Support – ${label}] ${subject}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1a1a2e;">
            <img src="${LOGO_URL}" alt="Manaja" style="height:60px;margin-bottom:20px;" />
            <h2>New ${escapeHtml(label)}</h2>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            ${company ? `<p><strong>Company:</strong> ${escapeHtml(company)}</p>` : ""}
            <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
            ${metaRows}
            <hr />
            <p><strong>Message:</strong></p>
            <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend API failed [${res.status}]: ${err}`);
    }

    // Auto-acknowledgement
    const autoRes = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "Manaja Support <noreply@manaja.solutions>",
        to: [email],
        subject: `We've received your ${label.toLowerCase()}, ${name}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e;">
            <img src="${LOGO_URL}" alt="Manaja" style="height:60px;margin-bottom:20px;" />
            <h2>Thanks for reaching out, ${escapeHtml(name)}!</h2>
            <p>We've received your <strong>${escapeHtml(label.toLowerCase())}</strong> regarding "<em>${escapeHtml(subject)}</em>".</p>
            <p>A member of the Manaja team will get back to you within <strong>24 business hours</strong>.</p>
            <p>In the meantime, feel free to explore <a href="https://manaja.solutions" style="color:#4f46e5;">manaja.solutions</a>.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
            <p style="color:#666;font-size:14px;">Best regards,<br/><strong>The Manaja Team</strong></p>
            <p style="color:#999;font-size:12px;">This is an automated response — please don't reply.</p>
          </div>
        `,
      }),
    });

    if (!autoRes.ok) {
      console.error("Auto-response failed:", await autoRes.text());
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-support-request error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
