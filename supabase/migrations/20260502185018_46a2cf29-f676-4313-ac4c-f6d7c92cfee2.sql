-- Modules CMS
CREATE TABLE public.modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'Layers',
  description TEXT NOT NULL DEFAULT '',
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  color TEXT NOT NULL DEFAULT 'from-blue-500 to-blue-600',
  light_bg TEXT NOT NULL DEFAULT 'bg-blue-50 dark:bg-blue-950/20',
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published modules" ON public.modules FOR SELECT USING (published = true);
CREATE TRIGGER trg_modules_updated BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Milestones CMS
CREATE TABLE public.milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  milestone_key TEXT NOT NULL UNIQUE,
  quarter TEXT NOT NULL DEFAULT '',
  year TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  story TEXT NOT NULL DEFAULT '',
  outcome TEXT NOT NULL DEFAULT '',
  icon_name TEXT NOT NULL DEFAULT 'Sparkles',
  status TEXT NOT NULL DEFAULT 'planned',
  progress INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published milestones" ON public.milestones FOR SELECT USING (published = true);
CREATE TRIGGER trg_milestones_updated BEFORE UPDATE ON public.milestones FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.milestone_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  icon_name TEXT NOT NULL DEFAULT 'CheckCircle2',
  label TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.milestone_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read milestone features" ON public.milestone_features FOR SELECT USING (true);
CREATE TRIGGER trg_milestone_features_updated BEFORE UPDATE ON public.milestone_features FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_milestone_features_milestone_id ON public.milestone_features(milestone_id);

-- Team image support
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS display_mode TEXT NOT NULL DEFAULT 'initials';

-- Admin settings (password override + recovery email)
CREATE TABLE public.admin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  password_hash TEXT,
  recovery_email TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (id = 1)
);
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.admin_settings(id) VALUES (1) ON CONFLICT DO NOTHING;

-- Admin password reset tokens
CREATE TABLE public.admin_password_resets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_password_resets ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_admin_password_resets_expires ON public.admin_password_resets(expires_at);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('module-images', 'module-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('team-images', 'team-images', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read module images" ON storage.objects FOR SELECT USING (bucket_id = 'module-images');
CREATE POLICY "Public can read team images" ON storage.objects FOR SELECT USING (bucket_id = 'team-images');