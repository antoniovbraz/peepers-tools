-- Update deprecated image generation model name
-- gemini-2.0-flash-preview-image-generation → gemini-2.5-flash-image

-- 1. Insert the new model (if not exists)
INSERT INTO public.ai_models (id, provider_id, display_name, capabilities, recommended_for, cost_per_1k_input, cost_per_1k_output, cost_per_image, max_context_tokens)
VALUES
  ('gemini-2.5-flash-image', 'google', 'Gemini 2.5 Flash Image', ARRAY['text','image_gen','vision'], ARRAY['image'], 0.00015, 0.0006, 0.039, 1048576)
ON CONFLICT (id) DO NOTHING;

-- 2. Migrate user_ai_config rows referencing the old model (FK on model_id)
UPDATE public.user_ai_config
SET model_id = 'gemini-2.5-flash-image'
WHERE model_id = 'gemini-2.0-flash-preview-image-generation';

-- 3. Remove the deprecated model
DELETE FROM public.ai_models WHERE id = 'gemini-2.0-flash-preview-image-generation';
