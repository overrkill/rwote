-- Create user_settings table for storing per-user settings
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'paper_dark',
  ai_provider TEXT NOT NULL DEFAULT 'disabled',
  ai_ollama_url TEXT DEFAULT 'http://localhost:11434',
  ai_ollama_model TEXT DEFAULT 'llama3.2',
  font_size TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT ai_provider_check CHECK (ai_provider IN ('disabled', 'ollama', 'groq')),
  CONSTRAINT theme_check CHECK (theme IN ('paper_dark', 'tokyonight', 'tokyonight_light', 'catppuccin', 'catppuccin_light', 'nord', 'nord_light', 'ayu', 'ayu_light', 'monokai', 'monokai_light')),
  CONSTRAINT font_size_check CHECK (font_size IN ('small', 'medium', 'large'))
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON public.user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Modify existing trigger to also create user_settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user settings
CREATE OR REPLACE FUNCTION public.get_user_settings()
RETURNS TABLE(
  theme TEXT,
  ai_provider TEXT,
  ai_ollama_url TEXT,
  ai_ollama_model TEXT,
  font_size TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT us.theme, us.ai_provider, us.ai_ollama_url, us.ai_ollama_model, us.font_size
  FROM public.user_settings us
  WHERE us.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user settings
CREATE OR REPLACE FUNCTION public.update_user_settings(
  p_theme TEXT DEFAULT NULL,
  p_ai_provider TEXT DEFAULT NULL,
  p_ai_ollama_url TEXT DEFAULT NULL,
  p_ai_ollama_model TEXT DEFAULT NULL,
  p_font_size TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE public.user_settings
  SET
    theme = COALESCE(p_theme, theme),
    ai_provider = COALESCE(p_ai_provider, ai_provider),
    ai_ollama_url = COALESCE(p_ai_ollama_url, ai_ollama_url),
    ai_ollama_model = COALESCE(p_ai_ollama_model, ai_ollama_model),
    font_size = COALESCE(p_font_size, font_size),
    updated_at = now()
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;