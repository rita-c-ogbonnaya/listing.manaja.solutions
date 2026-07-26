-- Site-wide settings (single row)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  popup_enabled BOOLEAN NOT NULL DEFAULT true,
  popup_image_url TEXT,
  popup_title TEXT NOT NULL DEFAULT 'Enterprise Security Guaranteed',
  popup_body TEXT NOT NULL DEFAULT 'Manaja SaaS is proudly certified by the NDPC — giving your business trusted, secure, and compliant data protection.',
  popup_cta_label TEXT NOT NULL DEFAULT 'Join early access',
  popup_cta_url TEXT NOT NULL DEFAULT '/early-access',
  popup_version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (id = 1)
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read site settings" ON public.site_settings FOR SELECT USING (true);
INSERT INTO public.site_settings (id, popup_image_url)
  VALUES (1, '/popup-default.png')
  ON CONFLICT (id) DO NOTHING;

-- Popup images bucket (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('popup-images', 'popup-images', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public can read popup images" ON storage.objects FOR SELECT USING (bucket_id = 'popup-images');
