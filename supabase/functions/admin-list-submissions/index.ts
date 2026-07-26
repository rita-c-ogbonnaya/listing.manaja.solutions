import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
}

const requestSchema = z.object({
  password: z.string().min(1).max(200),
  type: z.enum(['roadmap', 'support', 'all', 'chats', 'waitlist', 'chat_messages']).default('all'),
  conversation_id: z.string().uuid().optional(),
  limit: z.number().int().positive().max(500).optional(),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

    // Resolve stored hash: DB override wins, fallback to env secret hash
    const stored = await resolveAdminHash(supabase)
    if (!stored) {
      return new Response(
        JSON.stringify({ error: 'Admin dashboard is not configured.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const providedHash = await sha256Hex(parsed.data.password)
    if (!timingSafeEqual(providedHash, stored)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const limit = parsed.data.limit ?? 200

    if (parsed.data.type === 'chat_messages') {
      if (!parsed.data.conversation_id) {
        return new Response(JSON.stringify({ error: 'Missing conversation_id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id,role,content,created_at')
        .eq('conversation_id', parsed.data.conversation_id)
        .order('created_at', { ascending: true })
      return new Response(JSON.stringify({ messages: data ?? [], error: error?.message ?? null }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const wantRoadmap = parsed.data.type === 'all' || parsed.data.type === 'roadmap'
    const wantSupport = parsed.data.type === 'all' || parsed.data.type === 'support'
    const wantChats = parsed.data.type === 'all' || parsed.data.type === 'chats'
    const wantWait = parsed.data.type === 'all' || parsed.data.type === 'waitlist'

    const [roadmapRes, supportRes, chatsRes, waitRes] = await Promise.all([
      wantRoadmap
        ? supabase
            .from('roadmap_subscribers')
            .select('id,email,name,status,source,created_at')
            .order('created_at', { ascending: false })
            .limit(limit)
            .then((r: any) => r, () => ({ data: [], error: null }))
        : Promise.resolve({ data: [], error: null }),
      wantSupport
        ? supabase
            .from('support_tickets')
            .select('id,type,name,email,company,subject,status,created_at')
            .order('created_at', { ascending: false })
            .limit(limit)
        : Promise.resolve({ data: [], error: null }),
      wantChats
        ? supabase
            .from('chat_conversations')
            .select('id,session_id,visitor_name,visitor_email,escalated,message_count,last_message_at,created_at')
            .order('last_message_at', { ascending: false })
            .limit(limit)
        : Promise.resolve({ data: [], error: null }),
      wantWait
        ? supabase
            .from('module_waitlist')
            .select('id,module_slug,module_title,email,name,company,source,created_at')
            .order('created_at', { ascending: false })
            .limit(limit)
        : Promise.resolve({ data: [], error: null }),
    ])

    return new Response(
      JSON.stringify({
        roadmap: roadmapRes.data ?? [],
        support: supportRes.data ?? [],
        chats: chatsRes.data ?? [],
        waitlist: waitRes.data ?? [],
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('admin-list-submissions error', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function resolveAdminHash(supabase: any): Promise<string | null> {
  const { data } = await supabase.from('admin_settings').select('password_hash').eq('id', 1).maybeSingle()
  if (data?.password_hash) return data.password_hash
  const env = Deno.env.get('ADMIN_DASHBOARD_PASSWORD')
  if (!env) return null
  return await sha256Hex(env)
}

