import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend'
const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions'
const LOGO_URL = 'https://szktsksyfniksaoncghr.supabase.co/storage/v1/object/public/email-assets/manajalogo.png'

const SYSTEM_PROMPT = `You are Manaja Support, the friendly and knowledgeable AI assistant for Manaja Solutions (https://manaja.solutions).

About Manaja:
- Manaja is a unified, cloud-native business operations platform built primarily for African organizations.
- It is modular: CRM, HR & Payroll, Accounting & Finance, Inventory & Procurement, Projects & Tasks, Compliance & Risk, Real Estate & Facilities, plus AI insights and no-code automation.
- The product is currently in early access. Customers can join the early access program at /early-access.
- Pricing is not yet public — when asked, say it will be announced and invite them to /early-access or /contact.

How you should help:
- Answer questions about modules, features, roadmap, security, integrations, migration, and getting started.
- Be concise, warm, and clear. Use short paragraphs and bullet points when helpful.
- If a user wants to migrate from another platform or request a new integration, point them to the relevant form on the Support page (/support).
- If a user explicitly asks for a human, says you cannot help, or has a complex/sensitive issue (legal, billing, account-specific data, partnership, security incident), tell them you are escalating and ask them to fill in the short escalation form below the chat.
- Never invent prices, dates, certifications, or features that are not in the roadmap. When unsure, say so and offer escalation.

Tone: professional, helpful, modern. You represent the Manaja brand.`

const emailSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(50).optional(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
})

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().min(1).max(8000),
      })
    )
    .min(1)
    .max(20),
})

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const chatParsed = chatSchema.safeParse(body)

    if (chatParsed.success) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
      if (!LOVABLE_API_KEY) {
        return new Response(JSON.stringify({ error: 'AI assistant is not configured.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const response = await fetch(AI_GATEWAY_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...chatParsed.data.messages.slice(-20)],
          stream: true,
        }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'We are getting a lot of questions right now. Please try again in a moment.' }),
            {
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: 'AI assistant is temporarily unavailable. Please use the escalation form below.' }),
            {
              status: 402,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        const text = await response.text()
        console.error('AI gateway error:', response.status, text)
        return new Response(JSON.stringify({ error: 'AI gateway error' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(response.body, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      })
    }

    const emailParsed = emailSchema.safeParse(body)
    if (!emailParsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured')
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured')

    const { firstName, lastName, email, phone, subject, message } = emailParsed.data

    // Persist as a support ticket (best-effort)
    try {
      const supa = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )
      const { data: ticket } = await supa
        .from('support_tickets')
        .insert({
          type: 'contact',
          name: `${firstName} ${lastName}`.trim(),
          email,
          phone: phone || null,
          subject,
          message,
          source: 'contact_form',
        })
        .select('id')
        .single()
      if (ticket?.id) {
        await supa.from('ticket_replies').insert({
          ticket_id: ticket.id,
          direction: 'inbound',
          author: `${firstName} ${lastName}`.trim(),
          body: message,
        })
      }
    } catch (e) {
      console.error('persist contact ticket failed', e)
    }

    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: 'Manaja Website <noreply@manaja.solutions>',
        to: ['contactfromwebsite@manaja.solutions'],
        subject: `[Website Contact] ${subject} - ${firstName} ${lastName}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <img src="${LOGO_URL}" alt="Manaja" style="height:60px;margin-bottom:20px;" />
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${escapeHtml(firstName)} ${escapeHtml(lastName)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Phone:</strong> ${phone ? escapeHtml(phone) : 'Not provided'}</p>
            <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
            <hr />
            <p><strong>Message:</strong></p>
            <p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Resend API failed [${res.status}]: ${err}`)
    }

    const autoRes = await fetch(`${GATEWAY_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: 'Manaja <noreply@manaja.solutions>',
        to: [email],
        subject: `We Received Your Message, ${firstName}!`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <img src="${LOGO_URL}" alt="Manaja" style="height:60px;margin-bottom:20px;" />
            <h2 style="color:#1a1a2e;">Thank You for Reaching Out, ${escapeHtml(firstName)}!</h2>
            <p>We have received your message regarding <strong>"${escapeHtml(subject)}"</strong> and our team is reviewing it.</p>
            <p>We will get back to you within <strong>24-48 hours</strong>.</p>
            <p>In the meantime, feel free to learn more about us at <a href="https://manaja.solutions" style="color:#4f46e5;">manaja.solutions</a>.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
            <p style="color:#666;font-size:14px;">Best regards,<br /><strong>The Manaja Team</strong></p>
            <p style="color:#999;font-size:12px;">This is an automated response. Please do not reply to this email.</p>
          </div>
        `,
      }),
    })

    if (!autoRes.ok) {
      console.error('Auto-response failed:', await autoRes.text())
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('send-contact-email error:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
