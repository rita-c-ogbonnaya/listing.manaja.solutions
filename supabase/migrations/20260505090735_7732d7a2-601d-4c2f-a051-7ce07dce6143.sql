
-- Chat conversations & messages
CREATE TABLE public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  visitor_name text,
  visitor_email text,
  escalated boolean NOT NULL DEFAULT false,
  message_count integer NOT NULL DEFAULT 0,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_conv_session ON public.chat_conversations(session_id);
CREATE INDEX idx_chat_conv_last ON public.chat_conversations(last_message_at DESC);
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
-- No public policies; service role only

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_msg_conv ON public.chat_messages(conversation_id, created_at);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Anonymous insert allowed so the public chat widget can persist its conversation
CREATE POLICY "Anyone can create a chat conversation"
ON public.chat_conversations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update their chat conversation"
ON public.chat_conversations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can append chat messages"
ON public.chat_messages FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Module waitlist (per-module early access signups)
CREATE TABLE public.module_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_slug text NOT NULL,
  module_title text NOT NULL,
  email text NOT NULL,
  name text,
  company text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mod_wait_mod ON public.module_waitlist(module_slug, created_at DESC);
CREATE UNIQUE INDEX idx_mod_wait_unique ON public.module_waitlist(module_slug, lower(email));
ALTER TABLE public.module_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can join a module waitlist"
ON public.module_waitlist FOR INSERT TO anon, authenticated WITH CHECK (true);
