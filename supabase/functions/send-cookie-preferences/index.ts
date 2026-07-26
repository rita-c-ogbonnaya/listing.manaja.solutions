const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend'

const bodySchema = z.object({
  status: z.enum(['accepted', 'declined', 'custom']),
  preferences: z.object({
    necessary: z.boolean(),
    analytics: z.boolean(),
    functionality: z.boolean(),
    targeting: z.boolean(),
  }),
  userAgent: z.string().max(500).optional(),
  timestamp: z.string().max(100),
  url: z.string().max(500).optional(),
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

    const { status, preferences, userAgent, timestamp, url } = parsed.data

    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: 'Manaja Website <noreply@manaja.solutions>',
        to: ['contactfromwebsite@manaja.solutions'],
        subject: `[Cookie Consent] User ${status} cookies - ${timestamp}`,
        html: `
          <h2>Cookie Consent Record</h2>
          <p><strong>Status:</strong> ${status}</p>
          <p><strong>Timestamp:</strong> ${timestamp}</p>
          <p><strong>Page URL:</strong> ${url || 'Unknown'}</p>
          <p><strong>User Agent:</strong> ${userAgent || 'Unknown'}</p>
          <hr />
          <h3>Cookie Preferences</h3>
          <table style="border-collapse:collapse;width:100%;">
            <tr style="background:#f5f5f5;">
              <th style="text-align:left;padding:8px;border:1px solid #ddd;">Cookie Type</th>
              <th style="text-align:left;padding:8px;border:1px solid #ddd;">Status</th>
            </tr>
            <tr><td style="padding:8px;border:1px solid #ddd;">Strictly Necessary</td><td style="padding:8px;border:1px solid #ddd;">✅ Always Active</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;">Analytics</td><td style="padding:8px;border:1px solid #ddd;">${preferences.analytics ? '✅ Accepted' : '❌ Declined'}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;">Functionality</td><td style="padding:8px;border:1px solid #ddd;">${preferences.functionality ? '✅ Accepted' : '❌ Declined'}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;">Targeting</td><td style="padding:8px;border:1px solid #ddd;">${preferences.targeting ? '✅ Accepted' : '❌ Declined'}</td></tr>
          </table>
        `,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Resend API failed [${res.status}]: ${err}`)
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
