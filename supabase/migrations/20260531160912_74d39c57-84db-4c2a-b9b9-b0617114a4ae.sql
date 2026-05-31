
-- Briefings
CREATE TABLE public.briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  project_type TEXT NOT NULL,
  title TEXT NOT NULL,
  intro TEXT,
  public_token TEXT NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  status TEXT NOT NULL DEFAULT 'sent', -- draft, sent, in_progress, completed, archived
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_id UUID NOT NULL REFERENCES public.briefings(id) ON DELETE CASCADE,
  order_index INT NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT,
  kind TEXT NOT NULL DEFAULT 'single', -- single, multi, text
  allow_comment BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE public.question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  order_index INT NOT NULL DEFAULT 0,
  image_url TEXT,
  label TEXT NOT NULL,
  tag TEXT,
  interpretation TEXT
);

CREATE TABLE public.responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_id UUID NOT NULL REFERENCES public.briefings(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  text_answer TEXT,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (briefing_id, question_id)
);

CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_id UUID NOT NULL UNIQUE REFERENCES public.briefings(id) ON DELETE CASCADE,
  ai_text TEXT,
  edited_text TEXT,
  style_profile JSONB,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GRANTS (public-facing platform, no auth - admin acts via anon role)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.briefings TO anon, authenticated;
GRANT ALL ON public.briefings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO anon, authenticated;
GRANT ALL ON public.questions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_options TO anon, authenticated;
GRANT ALL ON public.question_options TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.responses TO anon, authenticated;
GRANT ALL ON public.responses TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO anon, authenticated;
GRANT ALL ON public.reports TO service_role;

-- RLS: open for MVP (no auth in this scope). Admin and client share same anon access.
ALTER TABLE public.briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open_all" ON public.briefings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_all" ON public.questions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_all" ON public.question_options FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_all" ON public.responses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_all" ON public.reports FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_questions_briefing ON public.questions(briefing_id, order_index);
CREATE INDEX idx_options_question ON public.question_options(question_id, order_index);
CREATE INDEX idx_responses_briefing ON public.responses(briefing_id);
CREATE INDEX idx_briefings_token ON public.briefings(public_token);
