-- Updated-at helper (idempotent)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Vacancies
CREATE TABLE public.vacancies (
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
CREATE POLICY "Public can read published vacancies"
  ON public.vacancies FOR SELECT USING (published = true);
CREATE TRIGGER trg_vacancies_updated BEFORE UPDATE ON public.vacancies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Blog posts
CREATE TABLE public.blog_posts (
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
CREATE POLICY "Public can read published blog posts"
  ON public.blog_posts FOR SELECT USING (published = true);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts (published_at DESC);
CREATE TRIGGER trg_blog_posts_updated BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Team members
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  bio text NOT NULL,
  initials text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published team members"
  ON public.team_members FOR SELECT USING (published = true);
CREATE TRIGGER trg_team_members_updated BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Roadmap overrides (keyed by code-side milestone id)
CREATE TABLE public.roadmap_overrides (
  milestone_id text PRIMARY KEY,
  status text,
  progress int,
  title text,
  tagline text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.roadmap_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read roadmap overrides"
  ON public.roadmap_overrides FOR SELECT USING (true);
CREATE TRIGGER trg_roadmap_overrides_updated BEFORE UPDATE ON public.roadmap_overrides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Public bucket for blog cover images
INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Blog images are publicly readable"
  ON storage.objects FOR SELECT USING (bucket_id = 'blog-images');