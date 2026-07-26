const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend'
const LOGO_URL = 'https://szktsksyfniksaoncghr.supabase.co/storage/v1/object/public/email-assets/manajalogo.png'

const bodySchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(50).optional(),
  position: z.string().min(1).max(200),
  coverLetter: z.string().max(5000).optional(),
  resumePath: z.string().min(1).max(500),
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

    const { firstName, lastName, email, phone, position, coverLetter, resumePath } = parsed.data

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const { data: signedUrl } = await supabase.storage
      .from('resumes')
      .createSignedUrl(resumePath, 60 * 60 * 24 * 30)

    // Send notification to recruitment team
    const notifyRes = await fetch(`${GATEWAY_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: 'Manaja Careers <noreply@manaja.solutions>',
        to: ['recruitment@manaja.solutions'],
        subject: `[New Application] ${position} - ${firstName} ${lastName}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <img src="${LOGO_URL}" alt="Manaja" style="height:60px;margin-bottom:20px;" />
            <h2>New Job Application Received</h2>
            <p><strong>Position:</strong> ${position}</p>
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            ${coverLetter ? `<hr /><p><strong>Cover Letter:</strong></p><p>${coverLetter.replace(/\n/g, '<br />')}</p>` : ''}
            <hr />
            <p><strong>Resume/CV:</strong> <a href="${signedUrl?.signedUrl || '#'}">Download Resume</a></p>
            <p style="color:#888;font-size:12px;">This link expires in 30 days.</p>
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
        from: 'Manaja Careers <noreply@manaja.solutions>',
        to: [email],
        subject: `Application Received - ${position} at Manaja Solutions`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <img src="${LOGO_URL}" alt="Manaja" style="height:60px;margin-bottom:20px;" />
            <h2 style="color:#1a1a2e;">Thank You for Your Application, ${firstName}!</h2>
            <p>We have successfully received your application for the <strong>${position}</strong> position at Manaja Solutions.</p>
            <p>Our recruitment team will carefully review your application and we will respond as soon as possible.</p>
            <p>In the meantime, feel free to learn more about us at <a href="https://manaja.solutions" style="color:#4f46e5;">manaja.solutions</a>.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
            <p style="color:#666;font-size:14px;">Best regards,<br /><strong>The Manaja Recruitment Team</strong></p>
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
