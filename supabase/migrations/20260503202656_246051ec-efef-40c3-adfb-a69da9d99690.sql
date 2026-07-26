
-- Support tickets
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'contact',
  name text NOT NULL,
  email text NOT NULL,
  company text,
  phone text,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  priority text NOT NULL DEFAULT 'normal',
  source text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
-- No public policies; only service role (edge functions) can read/write

CREATE INDEX idx_support_tickets_created_at ON public.support_tickets (created_at DESC);
CREATE INDEX idx_support_tickets_status ON public.support_tickets (status);

CREATE TRIGGER trg_support_tickets_updated
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Ticket replies / thread
CREATE TABLE public.ticket_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  direction text NOT NULL DEFAULT 'outbound', -- 'inbound' (from client) | 'outbound' (from admin)
  author text,
  body text NOT NULL,
  is_internal boolean NOT NULL DEFAULT false,
  email_message_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_ticket_replies_ticket ON public.ticket_replies (ticket_id, created_at);

-- Modules: status field for homepage hover badge
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'coming_soon',
  ADD COLUMN IF NOT EXISTS status_label text;
