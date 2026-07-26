import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Entity =
  | 'vacancies'
  | 'blog_posts'
  | 'team_members'
  | 'roadmap_overrides'
  | 'modules'
  | 'milestones'
  | 'milestone_features'

const ALLOWED: Entity[] = [
  'vacancies', 'blog_posts', 'team_members', 'roadmap_overrides',
  'modules', 'milestones', 'milestone_features',
]

const RESEND_GATEWAY = 'https://connector-gateway.lovable.dev/resend'
const LOGO_URL = 'https://szktsksyfniksaoncghr.supabase.co/storage/v1/object/public/email-assets/manajalogo.png'
const DEFAULT_RECOVERY_EMAIL = 'feedback@manaja.solutions'
const APP_BASE_URL = 'https://manaja.solutions'

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

function randomToken(bytes = 32) {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function resolveAdminPassword(supabase: any): Promise<string | null> {
  // Override password (set via reset) takes precedence
  const { data } = await supabase.from('admin_settings').select('password_hash').eq('id', 1).maybeSingle()
  if (data?.password_hash) return data.password_hash // already a hash
  const env = Deno.env.get('ADMIN_DASHBOARD_PASSWORD')
  if (!env) return null
  return await sha256Hex(env)
}

async function checkPassword(supabase: any, plain: string): Promise<boolean> {
  if (!plain) return false
  const stored = await resolveAdminPassword(supabase)
  if (!stored) return false
  const provided = await sha256Hex(plain)
  return timingSafeEqual(provided, stored)
}

async function getRecoveryEmail(supabase: any) {
  const { data } = await supabase.from('admin_settings').select('recovery_email').eq('id', 1).maybeSingle()
  return data?.recovery_email || DEFAULT_RECOVERY_EMAIL
}

async function sendResetEmail(toEmail: string, link: string) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) throw new Error('Email not configured')
  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;padding:32px;border-radius:12px;border:1px solid #eee;">
    <div style="text-align:center;margin-bottom:24px;"><img src="${LOGO_URL}" alt="Manaja" style="height:40px"/></div>
    <h2 style="color:#0a1226;margin:0 0 12px">Admin password reset</h2>
    <p style="color:#374151;line-height:1.6">A password reset was requested for the Manaja admin dashboard. Click the button below to set a new password. This link expires in 30 minutes and can only be used once.</p>
    <div style="text-align:center;margin:28px 0">
      <a href="${link}" style="background:#F5B500;color:#0a1226;text-decoration:none;padding:12px 22px;border-radius:9999px;font-weight:600;display:inline-block">Set a new password</a>
    </div>
    <p style="color:#6b7280;font-size:12px;line-height:1.5">If you didn't request this, you can safely ignore this email — your password won't change.</p>
    <p style="color:#9ca3af;font-size:11px;margin-top:24px">Manaja Solutions Limited</p>
  </div>`
  const r = await fetch(`${RESEND_GATEWAY}/emails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: 'Manaja Admin <noreply@manaja.solutions>',
      to: [toEmail],
      subject: 'Reset your Manaja admin password',
      html,
    }),
  })
  if (!r.ok) throw new Error(`Email send failed (${r.status})`)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  try {
    const body = await req.json().catch(() => ({})) as any
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const action = body.action as string

    // ----- Password reset flow (no auth required) -----
    if (action === 'request_password_reset') {
      const recovery = await getRecoveryEmail(supabase)
      const token = randomToken(32)
      const tokenHash = await sha256Hex(token)
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
      const { error } = await supabase.from('admin_password_resets').insert({ token_hash: tokenHash, expires_at: expiresAt })
      if (error) return json({ error: error.message }, 500)
      const link = `${APP_BASE_URL}/admin/submissions?reset=${token}`
      try {
        await sendResetEmail(recovery, link)
      } catch (e) {
        console.error('reset email failed', e)
        return json({ error: 'Failed to send reset email' }, 500)
      }
      return json({ ok: true, sent_to_masked: recovery.replace(/(.{2}).+(@.+)/, '$1***$2') })
    }

    if (action === 'verify_reset_token') {
      if (!body.token) return json({ error: 'Missing token' }, 400)
      const tokenHash = await sha256Hex(body.token)
      const { data } = await supabase.from('admin_password_resets').select('id, expires_at, used_at').eq('token_hash', tokenHash).maybeSingle()
      if (!data) return json({ valid: false })
      if (data.used_at) return json({ valid: false, reason: 'used' })
      if (new Date(data.expires_at) < new Date()) return json({ valid: false, reason: 'expired' })
      return json({ valid: true })
    }

    if (action === 'consume_reset_token') {
      if (!body.token || !body.new_password) return json({ error: 'Missing fields' }, 400)
      if (String(body.new_password).length < 8) return json({ error: 'Password must be at least 8 characters' }, 400)
      const tokenHash = await sha256Hex(body.token)
      const { data } = await supabase.from('admin_password_resets').select('id, expires_at, used_at').eq('token_hash', tokenHash).maybeSingle()
      if (!data) return json({ error: 'Invalid token' }, 400)
      if (data.used_at) return json({ error: 'Token already used' }, 400)
      if (new Date(data.expires_at) < new Date()) return json({ error: 'Token expired' }, 400)
      const newHash = await sha256Hex(body.new_password)
      await supabase.from('admin_settings').upsert({ id: 1, password_hash: newHash, updated_at: new Date().toISOString() })
      await supabase.from('admin_password_resets').update({ used_at: new Date().toISOString() }).eq('id', data.id)
      return json({ ok: true })
    }

    // ----- Authenticated CMS actions -----
    const ok = await checkPassword(supabase, body.password ?? '')
    if (!ok) return json({ error: 'Unauthorized' }, 401)

    if (action === 'update_recovery_email') {
      if (!body.recovery_email) return json({ error: 'Missing email' }, 400)
      await supabase.from('admin_settings').upsert({ id: 1, recovery_email: body.recovery_email, updated_at: new Date().toISOString() })
      return json({ ok: true })
    }

    if (action === 'get_recovery_email') {
      const email = await getRecoveryEmail(supabase)
      return json({ recovery_email: email })
    }

    if (action === 'change_password') {
      if (!body.new_password || String(body.new_password).length < 8)
        return json({ error: 'Password must be at least 8 characters' }, 400)
      const newHash = await sha256Hex(body.new_password)
      await supabase.from('admin_settings').upsert({ id: 1, password_hash: newHash, updated_at: new Date().toISOString() })
      return json({ ok: true })
    }

    if (action === 'get_site_settings') {
      const { data } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle()
      return json({ data: data || null })
    }

    if (action === 'update_site_settings') {
      const allowed = ['popup_enabled','popup_image_url','popup_title','popup_body','popup_cta_label','popup_cta_url','hero_dashboard_image_url']
      const patch: any = { id: 1, updated_at: new Date().toISOString() }
      for (const k of allowed) if (k in (body.settings || {})) patch[k] = body.settings[k]
      // Bump version when image changes so visitors see it again
      const { data: cur } = await supabase.from('site_settings').select('popup_image_url, popup_version').eq('id', 1).maybeSingle()
      if (cur && patch.popup_image_url && patch.popup_image_url !== cur.popup_image_url) {
        patch.popup_version = (cur.popup_version || 1) + 1
      }
      const { data, error } = await supabase.from('site_settings').upsert(patch).select().single()
      if (error) return json({ error: error.message }, 500)
      return json({ data })
    }

    if (!body.entity || !ALLOWED.includes(body.entity)) {
      return json({ error: 'Invalid entity' }, 400)
    }
    const table = body.entity as Entity

    if (action === 'list') {
      const orderCol =
        table === 'blog_posts' ? 'created_at' :
        table === 'roadmap_overrides' ? 'milestone_id' :
        table === 'milestone_features' ? 'sort_order' :
        'sort_order'
      let query = supabase.from(table).select('*').order(orderCol, { ascending: table !== 'blog_posts' })
      if (table === 'milestone_features' && body.milestone_id) {
        query = supabase.from(table).select('*').eq('milestone_id', body.milestone_id).order('sort_order', { ascending: true })
      }
      const { data, error } = await query
      if (error) return json({ error: error.message }, 500)
      return json({ data })
    }

    if (action === 'upsert') {
      if (!body.record) return json({ error: 'Missing record' }, 400)
      const record = { ...body.record }
      if (table === 'blog_posts') {
        if (record.published === true && !record.published_at) {
          ;(record as any).published_at = new Date().toISOString()
        }
      }
      const onConflict =
        table === 'roadmap_overrides' ? 'milestone_id' :
        table === 'modules' ? 'id' :
        table === 'milestones' ? 'id' :
        'id'
      const { data, error } = await supabase.from(table).upsert(record as any, { onConflict }).select().single()
      if (error) return json({ error: error.message }, 500)
      return json({ data })
    }

    if (action === 'delete') {
      if (!body.id) return json({ error: 'Missing id' }, 400)
      const keyCol = table === 'roadmap_overrides' ? 'milestone_id' : 'id'
      const { error } = await supabase.from(table).delete().eq(keyCol, body.id)
      if (error) return json({ error: error.message }, 500)
      return json({ ok: true })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (err) {
    console.error('admin-cms error', err)
    return json({ error: err instanceof Error ? err.message : 'Unknown' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
