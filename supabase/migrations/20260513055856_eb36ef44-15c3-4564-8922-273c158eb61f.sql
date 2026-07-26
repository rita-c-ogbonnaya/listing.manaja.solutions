UPDATE public.site_settings SET popup_image_url = 'https://szktsksyfniksaoncghr.supabase.co/storage/v1/object/public/popup-images/popup-default.webp', popup_version = popup_version + 1 WHERE id = 1;

DROP POLICY IF EXISTS "anyone can create chat conversations" ON public.chat_conversations;
CREATE POLICY "anyone can create chat conversations" ON public.chat_conversations FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anyone can update own chat conversations" ON public.chat_conversations;
CREATE POLICY "anyone can update own chat conversations" ON public.chat_conversations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anyone can insert chat messages" ON public.chat_messages;
CREATE POLICY "anyone can insert chat messages" ON public.chat_messages FOR INSERT TO anon, authenticated WITH CHECK (true);