const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend'
const LOGO_URL = 'https://szktsksyfniksaoncghr.supabase.co/storage/v1/object/public/email-assets/manajalogo.png'

const bodySchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(50).optional(),
  company: z.string().min(1).max(200),
  industry: z.string().max(200).optional(),
  companySize: z.string().max(100).optional(),
  role: z.string().max(100).optional(),
  modules: z.array(z.string()).optional(),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured')
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured')

    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { firstName, lastName, email, phone, company, industry, companySize, role, modules } = parsed.data

    // Send notification to team
    const notifyRes = await fetch(`${GATEWAY_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: 'Manaja Early Access <noreply@manaja.solutions>',
        to: ['contactfromwebsite@manaja.solutions'],
        subject: `[Early Access] ${firstName} ${lastName} - ${company}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <img src="${LOGO_URL}" alt="Manaja" style="height:60px;margin-bottom:20px;" />
            <h2>New Early Access Sign-Up</h2>
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Company:</strong> ${company}</p>
            <p><strong>Industry:</strong> ${industry || 'Not provided'}</p>
            <p><strong>Company Size:</strong> ${companySize || 'Not provided'}</p>
            <p><strong>Role:</strong> ${role || 'Not provided'}</p>
            ${modules && modules.length > 0 ? `<p><strong>Modules of Interest:</strong> ${modules.join(', ')}</p>` : ''}
          </div>
        `,
      }),
    })

    if (!notifyRes.ok) {
      const err = await notifyRes.text()
      throw new Error(`Failed to send notification [${notifyRes.status}]: ${err}`)
    }

    // Send auto-response to applicant
    const autoRes = await fetch(`${GATEWAY_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: 'Manaja <noreply@manaja.solutions>',
        to: [email],
        subject: `Welcome to Manaja Early Access, ${firstName}!`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <img src="${LOGO_URL}" alt="Manaja" style="height:60px;margin-bottom:20px;" />
            <h2 style="color:#1a1a2e;">You're on the List, ${firstName}! 🎉</h2>
            <p>Thank you for joining the Manaja Early Access program. We're thrilled to have you on board!</p>
            <p>As an early adopter, you'll enjoy:</p>
            <ul>
              <li><strong>Priority Access</strong> — Be among the first to use Manaja</li>
              <li><strong>Founding Member Pricing</strong> — Exclusive rates locked in forever</li>
              <li><strong>Direct Feedback Line</strong> — Help shape the product roadmap</li>
              <li><strong>Dedicated Onboarding</strong> — Personalized setup from our team</li>
            </ul>
            <p>We'll reach out soon with your exclusive invitation and next steps.</p>
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
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
