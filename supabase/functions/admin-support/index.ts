import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_GATEWAY = 'https://connector-gateway.lovable.dev/resend'
const LOGO_URL = 'https://szktsksyfniksaoncghr.supabase.co/storage/v1/object/public/email-assets/manajalogo.png'

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}
async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}
async function checkPassword(supabase: any, plain: string) {
  if (!plain) return false
  const { data } = await supabase.from('admin_settings').select('password_hash').eq('id', 1).maybeSingle()
  let stored = data?.password_hash
  if (!stored) {
    const env = Deno.env.get('ADMIN_DASHBOARD_PASSWORD')
    if (!env) return false
    stored = await sha256Hex(env)
  }
  const provided = await sha256Hex(plain)
  return timingSafeEqual(provided, stored)
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

async function sendReplyEmail(toEmail: string, toName: string, subject: string, body: string) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) throw new Error('Email not configured')
  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">
    <img src="${LOGO_URL}" alt="Manaja" style="height:48px;margin-bottom:20px"/>
    <p>Hi ${escapeHtml(toName || 'there')},</p>
    <div style="font-size:15px;line-height:1.6;color:#374151;white-space:pre-wrap">${escapeHtml(body).replace(/\n/g, '<br/>')}</div>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
    <p style="color:#666;font-size:14px">Best regards,<br/><strong>The Manaja Support Team</strong></p>
    <p style="color:#9ca3af;font-size:12px">Reply to this email to continue the conversation.</p>
  </div>`
  const r = await fetch(`${RESEND_GATEWAY}/emails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: 'Manaja Support <noreply@manaja.solutions>',
      to: [toEmail],
      reply_to: 'contactfromwebsite@manaja.solutions',
      subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
      html,
    }),
  })
  if (!r.ok) throw new Error(`Email send failed (${r.status}): ${await r.text()}`)
  const j = await r.json().catch(() => ({}))
  return j?.id as string | undefined
}

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  try {
    const body = await req.json().catch(() => ({})) as any
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const ok = await checkPassword(supabase, body.password ?? '')
    if (!ok) return json({ error: 'Unauthorized' }, 401)

    const action = body.action as string

    if (action === 'list') {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)
      if (error) return json({ error: error.message }, 500)
      return json({ data })
    }

    if (action === 'thread') {
      if (!body.ticket_id) return json({ error: 'Missing ticket_id' }, 400)
      const [{ data: ticket }, { data: replies }] = await Promise.all([
        supabase.from('support_tickets').select('*').eq('id', body.ticket_id).maybeSingle(),
        supabase.from('ticket_replies').select('*').eq('ticket_id', body.ticket_id).order('created_at', { ascending: true }),
      ])
      if (!ticket) return json({ error: 'Ticket not found' }, 404)
      return json({ ticket, replies: replies ?? [] })
    }

    if (action === 'update') {
      if (!body.id) return json({ error: 'Missing id' }, 400)
      const allowed: any = {}
      for (const k of ['status', 'priority', 'internal_notes', 'subject', 'assignee']) {
        if (k in body) allowed[k] = body[k]
      }
      const { data, error } = await supabase.from('support_tickets').update(allowed).eq('id', body.id).select().single()
      if (error) return json({ error: error.message }, 500)
      return json({ data })
    }

    if (action === 'bulk_update') {
      const ids: string[] = Array.isArray(body.ids) ? body.ids : []
      if (ids.length === 0) return json({ error: 'No ids provided' }, 400)
      const allowed: any = {}
      for (const k of ['status', 'priority', 'assignee']) {
        if (k in body) allowed[k] = body[k]
      }
      if (Object.keys(allowed).length === 0) return json({ error: 'No fields to update' }, 400)
      const { error } = await supabase.from('support_tickets').update(allowed).in('id', ids)
      if (error) return json({ error: error.message }, 500)
      return json({ ok: true, updated: ids.length })
    }

    if (action === 'add_internal_note') {
      if (!body.ticket_id || !body.body) return json({ error: 'Missing fields' }, 400)
      await supabase.from('ticket_replies').insert({
        ticket_id: body.ticket_id,
        direction: 'outbound',
        author: 'Admin',
        body: body.body,
        is_internal: true,
      })
      return json({ ok: true })
    }

    if (action === 'get_draft') {
      if (!body.ticket_id) return json({ error: 'Missing ticket_id' }, 400)
      const { data } = await supabase.from('ticket_drafts').select('*').eq('ticket_id', body.ticket_id).maybeSingle()
      return json({ draft: data || null })
    }

    if (action === 'save_draft') {
      if (!body.ticket_id) return json({ error: 'Missing ticket_id' }, 400)
      const payload = {
        ticket_id: body.ticket_id,
        body: typeof body.body === 'string' ? body.body : '',
        updated_by: body.author || 'Admin',
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase.from('ticket_drafts').upsert(payload, { onConflict: 'ticket_id' })
      if (error) return json({ error: error.message }, 500)
      return json({ ok: true })
    }

    if (action === 'clear_draft') {
      if (!body.ticket_id) return json({ error: 'Missing ticket_id' }, 400)
      await supabase.from('ticket_drafts').delete().eq('ticket_id', body.ticket_id)
      return json({ ok: true })
    }

    if (action === 'send_attempts') {
      if (!body.ticket_id) return json({ error: 'Missing ticket_id' }, 400)
      const { data, error } = await supabase
        .from('ticket_send_attempts')
        .select('*')
        .eq('ticket_id', body.ticket_id)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) return json({ error: error.message }, 500)
      return json({ data: data || [] })
    }

    if (action === 'reply') {
      if (!body.ticket_id || !body.body) return json({ error: 'Missing fields' }, 400)
      const { data: ticket } = await supabase.from('support_tickets').select('*').eq('id', body.ticket_id).maybeSingle()
      if (!ticket) return json({ error: 'Ticket not found' }, 404)
      const author = body.author || 'Manaja Support'
      const preview = String(body.body).slice(0, 280)
      let messageId: string | undefined
      try {
        messageId = await sendReplyEmail(ticket.email, ticket.name, ticket.subject, body.body)
      } catch (e: any) {
        const errMsg = e?.message || 'Failed to send email'
        await supabase.from('ticket_send_attempts').insert({
          ticket_id: body.ticket_id,
          status: 'failed',
          error: errMsg,
          body_preview: preview,
          attempted_by: author,
        })
        return json({ error: errMsg }, 500)
      }
      const { data: replyRow } = await supabase.from('ticket_replies').insert({
        ticket_id: body.ticket_id,
        direction: 'outbound',
        author,
        body: body.body,
        is_internal: false,
        email_message_id: messageId,
      }).select().single()
      await supabase.from('ticket_send_attempts').insert({
        ticket_id: body.ticket_id,
        reply_id: replyRow?.id ?? null,
        status: 'sent',
        provider_message_id: messageId,
        body_preview: preview,
        attempted_by: author,
      })
      // Auto-advance status if currently 'new', record first response
      const updates: any = {}
      if (ticket.status === 'new') updates.status = 'in_progress'
      if (!ticket.first_response_at) updates.first_response_at = new Date().toISOString()
      if (Object.keys(updates).length) {
        await supabase.from('support_tickets').update(updates).eq('id', body.ticket_id)
      }
      // Clear draft on successful send
      await supabase.from('ticket_drafts').delete().eq('ticket_id', body.ticket_id)
      return json({ ok: true, message_id: messageId })
    }

    if (action === 'delete') {
      if (!body.id) return json({ error: 'Missing id' }, 400)
      const { error } = await supabase.from('support_tickets').delete().eq('id', body.id)
      if (error) return json({ error: error.message }, 500)
      return json({ ok: true })
    }

    if (action === 'bulk_delete') {
      const ids: string[] = Array.isArray(body.ids) ? body.ids : []
      if (ids.length === 0) return json({ error: 'No ids provided' }, 400)
      const { error } = await supabase.from('support_tickets').delete().in('id', ids)
      if (error) return json({ error: error.message }, 500)
      return json({ ok: true, deleted: ids.length })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (err) {
    console.error('admin-support error', err)
    return json({ error: err instanceof Error ? err.message : 'Unknown' }, 500)
  }
})
