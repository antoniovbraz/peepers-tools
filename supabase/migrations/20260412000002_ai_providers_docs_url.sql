-- Add docs_url column to ai_providers so the Settings UI can show
-- direct links to each provider's API key management page.

ALTER TABLE public.ai_providers
  ADD COLUMN IF NOT EXISTS docs_url TEXT;

UPDATE public.ai_providers SET docs_url = 'https://aistudio.google.com/app/apikey'      WHERE id = 'google';
UPDATE public.ai_providers SET docs_url = 'https://platform.openai.com/api-keys'        WHERE id = 'openai';
UPDATE public.ai_providers SET docs_url = 'https://console.anthropic.com/settings/keys' WHERE id = 'anthropic';
UPDATE public.ai_providers SET docs_url = 'https://replicate.com/account/api-tokens'    WHERE id = 'replicate';
