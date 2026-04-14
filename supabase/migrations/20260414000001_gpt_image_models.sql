-- Add OpenAI GPT Image models and deactivate deprecated image models
-- (DALL-E 3 and Flux Schnell do not support reference images)

BEGIN;

-- ============================================================
-- 1. Insert new GPT Image models
-- ============================================================
INSERT INTO public.ai_models (id, provider_id, display_name, capabilities, recommended_for, cost_per_1k_input, cost_per_1k_output, cost_per_image, max_context_tokens)
VALUES
  ('gpt-image-1.5',    'openai', 'GPT Image 1.5',      ARRAY['image_gen','image_edit'], ARRAY['image'], NULL, NULL, 0.034, NULL),
  ('gpt-image-1',      'openai', 'GPT Image 1',         ARRAY['image_gen','image_edit'], ARRAY['image'], NULL, NULL, 0.042, NULL),
  ('gpt-image-1-mini', 'openai', 'GPT Image 1 Mini',    ARRAY['image_gen','image_edit'], ARRAY['image'], NULL, NULL, 0.011, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Deactivate DALL-E 3 (no reference image support)
-- ============================================================
UPDATE public.ai_models SET status = 'inactive' WHERE id = 'dall-e-3';

-- ============================================================
-- 3. Deactivate Flux Schnell (no reference image support)
-- ============================================================
UPDATE public.ai_models SET status = 'inactive' WHERE id = 'flux-schnell';

-- ============================================================
-- 4. Migrate user configs referencing deprecated models
-- ============================================================
-- DALL-E 3 → GPT Image 1 (balanced quality/cost default)
UPDATE public.user_ai_config
SET model_id    = 'gpt-image-1',
    provider_id = 'openai'
WHERE model_id = 'dall-e-3';

-- Flux Schnell → GPT Image 1 Mini (budget replacement)
UPDATE public.user_ai_config
SET model_id    = 'gpt-image-1-mini',
    provider_id = 'openai'
WHERE model_id = 'flux-schnell';

COMMIT;
