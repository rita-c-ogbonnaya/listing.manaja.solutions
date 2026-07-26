CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.roadmap_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  source text DEFAULT 'website',
  status text NOT NULL DEFAULT 'received',
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.roadmap_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can subscribe to roadmap" ON public.roadmap_subscribers;
CREATE POLICY "Anyone can subscribe to roadmap"
ON public.roadmap_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  company text,
  subject text NOT NULL,
  message text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'received',
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit support request" ON public.support_requests;
CREATE POLICY "Anyone can submit support request"
ON public.support_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE INDEX IF NOT EXISTS support_requests_created_at_idx ON public.support_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS roadmap_subscribers_created_at_idx ON public.roadmap_subscribers (created_at DESC);

CREATE TABLE IF NOT EXISTS public.vacancies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  department text NOT NULL DEFAULT 'General',
  location text NOT NULL DEFAULT 'Remote',
  employment_type text NOT NULL DEFAULT 'Full-time',
  description text NOT NULL,
  published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vacancies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read published vacancies" ON public.vacancies;
CREATE POLICY "Public can read published vacancies" ON public.vacancies FOR SELECT USING (published = true);
DROP TRIGGER IF EXISTS trg_vacancies_updated ON public.vacancies;
CREATE TRIGGER trg_vacancies_updated BEFORE UPDATE ON public.vacancies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  cover_image_url text,
  body_html text NOT NULL DEFAULT '',
  author text,
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read published blog posts" ON public.blog_posts;
CREATE POLICY "Public can read published blog posts" ON public.blog_posts FOR SELECT USING (published = true);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts (published_at DESC);
DROP TRIGGER IF EXISTS trg_blog_posts_updated ON public.blog_posts;
CREATE TRIGGER trg_blog_posts_updated BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  bio text NOT NULL,
  initials text NOT NULL,
  image_url text,
  display_mode text NOT NULL DEFAULT 'initials',
  sort_order int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read published team members" ON public.team_members;
CREATE POLICY "Public can read published team members" ON public.team_members FOR SELECT USING (published = true);
DROP TRIGGER IF EXISTS trg_team_members_updated ON public.team_members;
CREATE TRIGGER trg_team_members_updated BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.modules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  icon_name text NOT NULL DEFAULT 'Layers',
  description text NOT NULL DEFAULT '',
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  color text NOT NULL DEFAULT 'from-blue-500 to-blue-600',
  light_bg text NOT NULL DEFAULT 'bg-blue-50 dark:bg-blue-950/20',
  image_url text,
  status text NOT NULL DEFAULT 'coming_soon',
  status_label text,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read published modules" ON public.modules;
CREATE POLICY "Public can read published modules" ON public.modules FOR SELECT USING (published = true);
DROP TRIGGER IF EXISTS trg_modules_updated ON public.modules;
CREATE TRIGGER trg_modules_updated BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.milestones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  milestone_key text NOT NULL UNIQUE,
  quarter text NOT NULL DEFAULT '',
  year text NOT NULL DEFAULT '',
  title text NOT NULL,
  tagline text NOT NULL DEFAULT '',
  story text NOT NULL DEFAULT '',
  outcome text NOT NULL DEFAULT '',
  icon_name text NOT NULL DEFAULT 'Sparkles',
  status text NOT NULL DEFAULT 'planned',
  progress integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read published milestones" ON public.milestones;
CREATE POLICY "Public can read published milestones" ON public.milestones FOR SELECT USING (published = true);
DROP TRIGGER IF EXISTS trg_milestones_updated ON public.milestones;
CREATE TRIGGER trg_milestones_updated BEFORE UPDATE ON public.milestones FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.milestone_features (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  milestone_id uuid NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  icon_name text NOT NULL DEFAULT 'CheckCircle2',
  label text NOT NULL,
  detail text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.milestone_features ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read milestone features" ON public.milestone_features;
CREATE POLICY "Public can read milestone features" ON public.milestone_features FOR SELECT USING (true);
DROP TRIGGER IF EXISTS trg_milestone_features_updated ON public.milestone_features;
CREATE TRIGGER trg_milestone_features_updated BEFORE UPDATE ON public.milestone_features FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS idx_milestone_features_milestone_id ON public.milestone_features(milestone_id);

CREATE TABLE IF NOT EXISTS public.roadmap_overrides (
  milestone_id text PRIMARY KEY,
  status text,
  progress int,
  title text,
  tagline text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.roadmap_overrides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read roadmap overrides" ON public.roadmap_overrides;
CREATE POLICY "Public can read roadmap overrides" ON public.roadmap_overrides FOR SELECT USING (true);
DROP TRIGGER IF EXISTS trg_roadmap_overrides_updated ON public.roadmap_overrides;
CREATE TRIGGER trg_roadmap_overrides_updated BEFORE UPDATE ON public.roadmap_overrides FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.admin_settings (
  id integer PRIMARY KEY DEFAULT 1,
  password_hash text,
  recovery_email text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (id = 1)
);
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.admin_settings(id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.admin_password_resets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_password_resets ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_admin_password_resets_expires ON public.admin_password_resets(expires_at);

CREATE TABLE IF NOT EXISTS public.support_tickets (
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
  assignee text,
  first_response_at timestamptz,
  sla_due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets (status);
DROP TRIGGER IF EXISTS trg_support_tickets_updated ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.ticket_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  direction text NOT NULL DEFAULT 'outbound',
  author text,
  body text NOT NULL,
  is_internal boolean NOT NULL DEFAULT false,
  email_message_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket ON public.ticket_replies (ticket_id, created_at);

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
CREATE TRIGGER trg_support_tickets_sla BEFORE INSERT OR UPDATE OF priority ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.set_ticket_sla();

CREATE TABLE IF NOT EXISTS public.ticket_drafts (
  ticket_id uuid PRIMARY KEY REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  updated_by text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ticket_drafts ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_ticket_drafts_updated_at ON public.ticket_drafts;
CREATE TRIGGER trg_ticket_drafts_updated_at BEFORE UPDATE ON public.ticket_drafts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

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
ALTER TABLE public.ticket_send_attempts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_send_attempts_ticket ON public.ticket_send_attempts(ticket_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.chat_conversations (
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
CREATE INDEX IF NOT EXISTS idx_chat_conv_session ON public.chat_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_conv_last ON public.chat_conversations(last_message_at DESC);
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can create a chat conversation" ON public.chat_conversations;
CREATE POLICY "Anyone can create a chat conversation" ON public.chat_conversations FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update their chat conversation" ON public.chat_conversations;
CREATE POLICY "Anyone can update their chat conversation" ON public.chat_conversations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_msg_conv ON public.chat_messages(conversation_id, created_at);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can append chat messages" ON public.chat_messages;
CREATE POLICY "Anyone can append chat messages" ON public.chat_messages FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.module_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_slug text NOT NULL,
  module_title text NOT NULL,
  email text NOT NULL,
  name text,
  company text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mod_wait_mod ON public.module_waitlist(module_slug, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mod_wait_unique ON public.module_waitlist(module_slug, lower(email));
ALTER TABLE public.module_waitlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can join a module waitlist" ON public.module_waitlist;
CREATE POLICY "Anyone can join a module waitlist" ON public.module_waitlist FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.site_settings (
  id integer PRIMARY KEY DEFAULT 1,
  popup_enabled boolean NOT NULL DEFAULT true,
  popup_image_url text,
  popup_title text NOT NULL DEFAULT 'Enterprise Security Guaranteed',
  popup_body text NOT NULL DEFAULT 'Manaja SaaS is proudly certified by the NDPC — giving your business trusted, secure, and compliant data protection.',
  popup_cta_label text NOT NULL DEFAULT '',
  popup_cta_url text NOT NULL DEFAULT '',
  popup_version integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (id = 1)
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
CREATE POLICY "Public can read site settings" ON public.site_settings FOR SELECT USING (true);
INSERT INTO public.site_settings (id, popup_enabled, popup_title, popup_body, popup_cta_label, popup_cta_url)
VALUES (1, true, 'Enterprise Security Guaranteed', 'Manaja SaaS is proudly certified by the Nigeria Data Protection Commission (NDPC), with encryption, protected access, and compliance-first data handling.', '', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES
  ('resumes', 'resumes', false),
  ('email-assets', 'email-assets', true),
  ('blog-images', 'blog-images', true),
  ('module-images', 'module-images', true),
  ('team-images', 'team-images', true),
  ('popup-images', 'popup-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can upload resumes" ON storage.objects;
CREATE POLICY "Anyone can upload resumes" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'resumes');
DROP POLICY IF EXISTS "Service role can read resumes" ON storage.objects;
CREATE POLICY "Service role can read resumes" ON storage.objects FOR SELECT USING (bucket_id = 'resumes');
DROP POLICY IF EXISTS "Public read access for email assets" ON storage.objects;
CREATE POLICY "Public read access for email assets" ON storage.objects FOR SELECT USING (bucket_id = 'email-assets');
DROP POLICY IF EXISTS "Blog images are publicly readable" ON storage.objects;
CREATE POLICY "Blog images are publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'blog-images');
DROP POLICY IF EXISTS "Public can read module images" ON storage.objects;
CREATE POLICY "Public can read module images" ON storage.objects FOR SELECT USING (bucket_id = 'module-images');
DROP POLICY IF EXISTS "Public can read team images" ON storage.objects;
CREATE POLICY "Public can read team images" ON storage.objects FOR SELECT USING (bucket_id = 'team-images');
DROP POLICY IF EXISTS "Public can read popup images" ON storage.objects;
CREATE POLICY "Public can read popup images" ON storage.objects FOR SELECT USING (bucket_id = 'popup-images');