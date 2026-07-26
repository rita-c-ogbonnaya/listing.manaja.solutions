# Manaja Support Platform — Integration Guide

Audience: the frontend engineer porting the support system (live AI agent + ticketed support) from the marketing site (`manaja.solutions`) onto the Manaja webapp (`app.manaja.solutions`) so it can power per-module support.

There are **three** moving pieces:

1. **Database** (Supabase / Lovable Cloud) — tables, RLS, storage buckets.
2. **Edge functions** (Deno) — `support-chat`, `send-support-request`, `admin-support`, `admin-list-submissions`.
3. **Frontend** — the React widgets (`SupportChat`, `SupportForm`) and the Admin panel (`SupportPanel`).

Everything below already exists in the marketing-site repo (`manaja-website`). Copy it over and wire it up.

---

## 1. Database schema (copy these tables)

All tables live in the `public` schema. Run them as one migration on the webapp's Supabase project.

| Table | Purpose |
|---|---|
| `chat_conversations` | One row per visitor chat session with Ọ̀rẹ́ (the AI). |
| `chat_messages` | Every message (user + assistant) inside a conversation. |
| `support_tickets` | Human support tickets (contact form, escalations, sales, careers, etc.). |
| `ticket_replies` | Email replies + internal notes against a ticket. |
| `ticket_drafts` | Auto-saved unsent reply draft per ticket (one row per ticket). |
| `ticket_send_attempts` | Audit log of every outbound email send (success/failure). |
| `support_requests` | Lightweight legacy log of inbound contact form submissions. |
| `admin_settings` | Holds the admin dashboard password hash (sha256). |
| `admin_password_resets` | One-time reset tokens for the admin password. |

### Key columns

```sql
-- chat_conversations
id uuid pk, session_id text not null, visitor_name text, visitor_email text,
escalated boolean default false, message_count int default 0,
last_message_at timestamptz default now(), created_at timestamptz default now()

-- chat_messages
id uuid pk, conversation_id uuid not null, role text not null, -- 'user' | 'assistant'
content text not null, created_at timestamptz default now()

-- support_tickets
id uuid pk, type text default 'contact', name, email, company, phone, subject, message,
status text default 'new', priority text default 'normal', source text,
assignee text, internal_notes text, meta jsonb default '{}',
first_response_at timestamptz, sla_due_at timestamptz,
created_at, updated_at

-- ticket_replies
id uuid pk, ticket_id uuid not null, direction text default 'outbound', -- 'inbound' | 'outbound'
author text, body text not null, is_internal boolean default false,
email_message_id text, created_at timestamptz default now()
```

### RLS policies (CRITICAL)

The website is unauthenticated, so we use **insert-only** RLS for visitor tables. Admin reads/updates go through edge functions running with the **service role key**, which bypasses RLS.

```sql
-- chat_conversations
alter table chat_conversations enable row level security;
create policy "anyone can create chat conversations" on chat_conversations
  for insert to anon, authenticated with check (true);
create policy "anyone can update own chat conversations" on chat_conversations
  for update to anon, authenticated using (true) with check (true);
-- NO SELECT policy (admin reads via edge function)

-- chat_messages
alter table chat_messages enable row level security;
create policy "anyone can insert chat messages" on chat_messages
  for insert to anon, authenticated with check (true);

-- support_tickets / ticket_replies / ticket_drafts / ticket_send_attempts
alter table support_tickets enable row level security;
-- NO public policies — all access goes through admin-support edge fn
```

> **Important quirk we hit and you must avoid**: the chat client cannot do
> `.insert().select().single()` on `chat_conversations` because there's no SELECT policy
> and we don't want one (would expose visitor PII). Instead, **generate the conversation
> UUID on the client** with `crypto.randomUUID()` and pass it into `.insert({ id, ... })`.
> See `src/components/SupportChat.tsx` → `ensureConversation()`.

### Required SQL helper functions / triggers

```sql
-- updated_at trigger helper
create or replace function set_updated_at() returns trigger language plpgsql
security definer set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- SLA timer (auto-fills sla_due_at on insert/priority change)
create or replace function set_ticket_sla() returns trigger language plpgsql
security definer set search_path = public as $$
begin
  if (TG_OP = 'INSERT') or (NEW.priority is distinct from OLD.priority) then
    NEW.sla_due_at := coalesce(NEW.created_at, now()) + case NEW.priority
      when 'urgent' then interval '4 hours'
      when 'high'   then interval '8 hours'
      when 'low'    then interval '72 hours'
      else               interval '24 hours'
    end;
  end if;
  return NEW;
end; $$;

-- attach
create trigger trg_support_tickets_updated_at before update on support_tickets
  for each row execute function set_updated_at();
create trigger trg_support_tickets_sla before insert or update on support_tickets
  for each row execute function set_ticket_sla();
```

### Storage buckets

- `email-assets` (public) — holds the Manaja logo used in transactional email HTML.

---

## 2. Secrets

Set these on the webapp's Supabase project (Cloud → Secrets):

| Secret | Purpose |
|---|---|
| `LOVABLE_API_KEY` | Auth for Lovable AI Gateway (Ọ̀rẹ́ chat + admin AI features). Already set when you enable Lovable Cloud. |
| `RESEND_API_KEY` | Connector key for outbound transactional email (ticket replies, contact confirmations). |
| `ADMIN_DASHBOARD_PASSWORD` | Initial password for the admin panel. Hashed and stored in `admin_settings.password_hash` once an admin sets/changes it from the UI. |

> Service role key, project URL, and JWKS are provided automatically by Lovable Cloud — don't touch them.

---

## 3. Edge functions

Copy these four directories verbatim from the marketing repo:

```
supabase/functions/support-chat/         # Ọ̀rẹ́ AI chat (SSE stream from Lovable AI gateway)
supabase/functions/send-support-request/ # Inserts a ticket + emails the user a confirmation
supabase/functions/admin-support/        # Password-protected CRUD for the admin support panel
supabase/functions/admin-list-submissions/ # Read-only feed for the admin dashboard (chats + tickets)
```

In `supabase/config.toml` make sure each one has `verify_jwt = false` (they're called by anonymous visitors with the publishable key).

### `support-chat` — what it does

- Reads `{ messages: [...], visitor: { name, email } }` from the request body.
- Calls `https://ai.gateway.lovable.dev/v1/chat/completions` with `Authorization: Bearer ${LOVABLE_API_KEY}`, model `google/gemini-2.5-flash`, `stream: true`.
- Returns the upstream SSE stream directly to the browser (`Content-Type: text/event-stream`).
- Returns clean JSON error messages on 402 (out of credits) and 429 (rate limited) so the UI can show a friendly fallback.

If the visitor has a stored name, the function appends one extra line to the system prompt instructing the AI to greet them by first name. This is how "Hello, *Adaeze*" works for returning users.

### `admin-support`

The single endpoint for the support inbox. Every request is `{ password, action, ...payload }`. Actions:

- `list` — all tickets (newest first, limit 500).
- `thread` `{ ticket_id }` — ticket + replies.
- `update` `{ id, status?, priority?, internal_notes?, subject?, assignee? }`.
- `bulk_update` `{ ids[], status?, priority?, assignee? }`.
- `add_internal_note` `{ ticket_id, body }`.
- `get_draft` / `save_draft` / `clear_draft` `{ ticket_id, body? }`.
- `send_attempts` `{ ticket_id }` — email send audit log.
- `reply` `{ ticket_id, body, author? }` — sends the email via Resend, records the reply + send attempt, advances status `new → in_progress`, stamps `first_response_at`, clears the draft.
- `delete` `{ id }` / `bulk_delete` `{ ids[] }`.

Passwords are checked with `sha256` + constant-time compare against `admin_settings.password_hash` (DB row wins; falls back to `sha256(ADMIN_DASHBOARD_PASSWORD)`).

---

## 4. Frontend (React + Vite + shadcn/ui)

Copy these files from the marketing repo:

```
src/components/SupportChat.tsx          # The Ọ̀rẹ́ widget (intro form, streaming chat, escalate)
src/components/SupportForm.tsx          # Human ticket form
src/components/admin/SupportPanel.tsx   # Full admin inbox (filters, bulk, replies, SLA timers)
src/pages/Support.tsx                   # Public /support page that hosts the two widgets
src/pages/AdminSubmissions.tsx          # Admin shell with tabs (Support, Chats, Roadmap, etc.)
```

### Dependencies

```bash
bun add framer-motion react-markdown remark-gfm lucide-react
```

(shadcn primitives `button`, `input`, `label`, `badge`, `checkbox`, `textarea`, `dialog`, `toast` are already required.)

### Supabase client

Use the standard auto-generated `src/integrations/supabase/client.ts`. The widgets only need the publishable key + URL.

### Mounting

Public page — anywhere in your router:

```tsx
import { SupportChat } from "@/components/SupportChat";
import { SupportForm } from "@/components/SupportForm";

<SupportChat onEscalate={(transcript) => setEscalationContext(transcript)} />
<SupportForm prefill={escalationContext} />
```

Admin shell at `/admin` (protected by the password gate at the top of `AdminSubmissions.tsx`).

### Per-module support (the new use case on the webapp)

When you call `send-support-request` from inside a module page, pass module context in the `meta` field so the admin can see where the ticket came from:

```ts
await supabase.functions.invoke("send-support-request", {
  body: {
    name: user.full_name,
    email: user.email,
    subject: `[${moduleName}] ${subject}`,
    message,
    type: "module-support",            // shows up as a filterable type in the admin
    source: "webapp",
    meta: {
      module_slug: "crm",
      module_version: "2026.5",
      tenant_id: tenant.id,
      user_id: user.id,
      url: window.location.href,
    },
  },
});
```

The admin will see `module-support` as a type chip and the `meta` JSON is shown in the ticket detail panel for context.

Similarly, when mounting `SupportChat` inside a module, pass module info into the visitor object so Ọ̀rẹ́ can answer in-context. Easiest path: prepend a system-style message in the conversation, OR add `module` to the `streamSupportChat` payload and read it in the edge function the same way we read `visitor`.

### Returning-user greeting

The widget reads `manaja:chat:visitor` from `localStorage`. On the webapp you already have the authenticated user, so on mount you can seed it:

```ts
useEffect(() => {
  if (user) {
    localStorage.setItem("manaja:chat:visitor", JSON.stringify({
      name: user.full_name, email: user.email,
    }));
  }
}, [user]);
```

The chat will then open with **"Báwo ni, Adaeze 👋 Welcome back…"** and the AI will keep using their first name throughout the conversation.

---

## 5. Smoke test checklist

After deployment:

- [ ] Open the support page anonymously → enter a name → send "hi" → response streams in.
- [ ] Refresh → the widget opens directly into chat and greets the visitor by name.
- [ ] In Supabase Studio, confirm a new row in `chat_conversations` and ≥2 rows in `chat_messages`.
- [ ] Submit the human form → confirm row in `support_tickets` + confirmation email arrives.
- [ ] Log into `/admin` → **Chats** tab lists the conversation → click to view full transcript.
- [ ] **Support** tab → click ticket → send reply → recipient receives email; row appears in `ticket_replies`; status flips to `in_progress`; SLA timer renders.

---

## 6. Known gotchas (we have hit each of these)

1. **Empty admin Chats tab** → 99% of the time means `crypto.randomUUID()` isn't being used to generate `chat_conversations.id`. The browser can't read the row back, so the conversation creation silently fails. Fix: client-side UUID, never `.select()` after insert.
2. **"Ọ̀rẹ́ is taking a moment — please try again"** → 402 (out of AI credits) or 429 (rate limit) from the Lovable AI gateway. Check the `support-chat` function logs.
3. **Reply email never arrives** → Resend connector key missing, OR sender domain not verified. The admin will see a `failed` row in `ticket_send_attempts` with the exact provider error.
4. **`verify_jwt` errors** → make sure all four edge functions are listed as `verify_jwt = false` in `supabase/config.toml`. They're called by anonymous visitors.
5. **Don't add a SELECT policy to `chat_conversations`/`chat_messages`** to "fix" visibility. That leaks every visitor's PII. Admin reads always go through the service-role-key edge function.

---

Questions? Ping the marketing-site team; everything here is mirrored 1:1 in that repo and is the source of truth.
