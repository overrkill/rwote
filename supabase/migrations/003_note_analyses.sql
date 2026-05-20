-- Create note_analyses table for persisting AI-generated note analysis
CREATE TABLE public.note_analyses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id     UUID NOT NULL REFERENCES notes_v2(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis    JSONB NOT NULL,
  content_hash TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_note_analysis UNIQUE (note_id)
);

-- Enable RLS
ALTER TABLE public.note_analyses ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own note analyses"
  ON public.note_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own note analyses"
  ON public.note_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own note analyses"
  ON public.note_analyses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own note analyses"
  ON public.note_analyses FOR DELETE
  USING (auth.uid() = user_id);
