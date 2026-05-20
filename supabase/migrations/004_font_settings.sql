-- Add font customization columns to user_settings
ALTER TABLE public.user_settings
  ADD COLUMN editor_font TEXT NOT NULL DEFAULT 'jetbrains-mono',
  ADD COLUMN interface_font TEXT NOT NULL DEFAULT 'system';

-- Change font_size from TEXT to INTEGER, drop old check
ALTER TABLE public.user_settings
  ALTER COLUMN font_size TYPE INTEGER USING font_size::INTEGER,
  ALTER COLUMN font_size SET DEFAULT 14,
  DROP CONSTRAINT IF EXISTS font_size_check;

ALTER TABLE public.user_settings
  ADD CONSTRAINT font_size_check CHECK (font_size >= 8 AND font_size <= 24);

-- Update get_user_settings function
CREATE OR REPLACE FUNCTION public.get_user_settings()
RETURNS TABLE(
  theme TEXT,
  ai_provider TEXT,
  ai_ollama_url TEXT,
  ai_ollama_model TEXT,
  font_size TEXT,
  editor_font TEXT,
  interface_font TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT us.theme, us.ai_provider, us.ai_ollama_url, us.ai_ollama_model, us.font_size, us.editor_font, us.interface_font
  FROM public.user_settings us
  WHERE us.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update update_user_settings function
CREATE OR REPLACE FUNCTION public.update_user_settings(
  p_theme TEXT DEFAULT NULL,
  p_ai_provider TEXT DEFAULT NULL,
  p_ai_ollama_url TEXT DEFAULT NULL,
  p_ai_ollama_model TEXT DEFAULT NULL,
  p_font_size TEXT DEFAULT NULL,
  p_editor_font TEXT DEFAULT NULL,
  p_interface_font TEXT DEFAULT NULL
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
    editor_font = COALESCE(p_editor_font, editor_font),
    interface_font = COALESCE(p_interface_font, interface_font),
    updated_at = now()
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
