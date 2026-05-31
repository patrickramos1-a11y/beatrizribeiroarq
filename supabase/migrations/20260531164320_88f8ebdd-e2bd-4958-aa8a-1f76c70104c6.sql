
INSERT INTO storage.buckets (id, name, public) VALUES ('briefing-images', 'briefing-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read briefing-images" ON storage.objects FOR SELECT USING (bucket_id = 'briefing-images');
CREATE POLICY "Anyone can upload briefing-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'briefing-images');
CREATE POLICY "Anyone can update briefing-images" ON storage.objects FOR UPDATE USING (bucket_id = 'briefing-images');
CREATE POLICY "Anyone can delete briefing-images" ON storage.objects FOR DELETE USING (bucket_id = 'briefing-images');
