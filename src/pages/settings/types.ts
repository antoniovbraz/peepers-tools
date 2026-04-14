import { Zap, Scale, Crown, Sliders } from "lucide-react";

/* ── Types ── */

export interface Provider {
  id: string;
  name: string;
  base_url: string;
  docs_url: string | null;
}

export interface UserKey {
  id: string;
  provider_id: string;
  key_hint: string;
  is_valid: boolean;
  last_validated_at: string | null;
}

export interface AIModel {
  id: string;
  provider_id: string;
  display_name: string;
  capabilities: string[];
  recommended_for: string[];
  cost_per_1k_input: number | null;
  cost_per_1k_output: number | null;
  cost_per_image: number | null;
}

export interface FunctionConfig {
  provider_id: string;
  model_id: string;
  temperature: number;
}

export type ProfileId = "economico" | "equilibrado" | "premium" | "personalizado";

export const AI_FUNCTIONS = ["identify", "ads", "prompts", "image", "overlay_copy"] as const;
export type AIFunction = typeof AI_FUNCTIONS[number];

export const FUNCTION_LABELS: Record<AIFunction, string> = {
  identify: "Identificar Produto",
  ads: "Gerar Anúncios",
  prompts: "Gerar Prompts",
  image: "Gerar Imagem",
  overlay_copy: "Gerar Copy Overlay",
};

export const FUNCTION_REQUIREMENTS: Record<AIFunction, string[]> = {
  identify: ["vision", "function_calling"],
  ads: ["text", "function_calling"],
  prompts: ["text", "function_calling"],
  image: ["image_gen"],
  overlay_copy: ["text", "function_calling"],
};

export const PROFILE_CONFIGS: Record<Exclude<ProfileId, "personalizado">, Record<AIFunction, FunctionConfig>> = {
  economico: {
    identify:     { provider_id: "google",    model_id: "gemini-2.5-flash", temperature: 0.3 },
    ads:          { provider_id: "google",    model_id: "gemini-2.5-flash", temperature: 0.7 },
    prompts:      { provider_id: "google",    model_id: "gemini-2.5-flash", temperature: 0.7 },
    image:        { provider_id: "replicate", model_id: "flux-schnell", temperature: 0.9 },
    overlay_copy: { provider_id: "google",    model_id: "gemini-2.5-flash", temperature: 0.7 },
  },
  equilibrado: {
    identify:     { provider_id: "google",    model_id: "gemini-2.5-flash", temperature: 0.3 },
    ads:          { provider_id: "anthropic", model_id: "claude-haiku-3.5", temperature: 0.7 },
    prompts:      { provider_id: "google",    model_id: "gemini-2.5-flash", temperature: 0.7 },
    image:        { provider_id: "google",    model_id: "gemini-2.5-flash-image", temperature: 0.9 },
    overlay_copy: { provider_id: "anthropic", model_id: "claude-haiku-3.5", temperature: 0.7 },
  },
  premium: {
    identify:     { provider_id: "openai",    model_id: "gpt-4o", temperature: 0.3 },
    ads:          { provider_id: "anthropic", model_id: "claude-sonnet-4-20250514", temperature: 0.7 },
    prompts:      { provider_id: "anthropic", model_id: "claude-sonnet-4-20250514", temperature: 0.7 },
    image:        { provider_id: "openai",    model_id: "dall-e-3", temperature: 0.9 },
    overlay_copy: { provider_id: "anthropic", model_id: "claude-sonnet-4-20250514", temperature: 0.7 },
  },
};

export const PROFILE_META: Record<ProfileId, { name: string; description: string; icon: React.ElementType }> = {
  economico:     { name: "Econômico",     description: "Menor custo por produto",   icon: Zap },
  equilibrado:   { name: "Equilibrado",   description: "Melhor custo-benefício",    icon: Scale },
  premium:       { name: "Premium",       description: "Máxima qualidade",          icon: Crown },
  personalizado: { name: "Personalizado", description: "Escolha manual por função", icon: Sliders },
};
