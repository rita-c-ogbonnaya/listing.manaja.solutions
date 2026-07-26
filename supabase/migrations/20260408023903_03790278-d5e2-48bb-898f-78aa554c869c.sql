
-- Create storage bucket for resume/CV uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);

-- Allow anyone to upload resumes (no auth required for job applicants)
CREATE POLICY "Anyone can upload resumes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes');

-- Allow service role to read resumes (for edge functions to generate signed URLs)
CREATE POLICY "Service role can read resumes" ON storage.objects FOR SELECT USING (bucket_id = 'resumes');
