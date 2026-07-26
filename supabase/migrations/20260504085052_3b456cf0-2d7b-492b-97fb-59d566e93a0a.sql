-- 1. Extend support_tickets
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS assignee text,
  ADD COLUMN IF NOT EXISTS first_response_at timestamptz,
  ADD COLUMN IF NOT EXISTS sla_due_at timestamptz;

-- Backfill SLA based on priority for existing rows (4h urgent, 8h high, 24h normal, 72h low)
UPDATE public.support_tickets
SET sla_due_at = created_at + CASE priority
  WHEN 'urgent' THEN interval '4 hours'
  WHEN 'high' THEN interval '8 hours'
  WHEN 'low' THEN interval '72 hours'
  ELSE interval '24 hours'
END
WHERE sla_due_at IS NULL;

-- Auto-set sla_due_at on insert / when priority changes
CREATE OR REPLACE FUNCTION public.set_ticket_sla()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (NEW.priority IS DISTINCT FROM OLD.priority) THEN
    NEW.sla_due_at := COALESCE(NEW.created_at, now()) + CASE NEW.priority
      WHEN 'urgent' THEN interval '4 hours'
      WHEN 'high' THEN interval '8 hours'
      WHEN 'low' THEN interval '72 hours'
      ELSE interval '24 hours'
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_support_tickets_sla ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_sla
BEFORE INSERT OR UPDATE OF priority ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.set_ticket_sla();

-- 2. ticket_drafts (server-side persisted drafts)
CREATE TABLE IF NOT EXISTS public.ticket_drafts (
  ticket_id uuid PRIMARY KEY REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  updated_by text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ticket_drafts ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_ticket_drafts_updated_at ON public.ticket_drafts;
CREATE TRIGGER trg_ticket_drafts_updated_at
BEFORE UPDATE ON public.ticket_drafts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. ticket_send_attempts (delivery history)
CREATE TABLE IF NOT EXISTS public.ticket_send_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  reply_id uuid REFERENCES public.ticket_replies(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('sent','failed')),
  provider_message_id text,
  error text,
  body_preview text,
  attempted_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_send_attempts_ticket ON public.ticket_send_attempts(ticket_id, created_at DESC);
ALTER TABLE public.ticket_send_attempts ENABLE ROW LEVEL SECURITY;