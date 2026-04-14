/**
 * Shared prompt rules for image generation.
 * Single source of truth — FIDELITY and REALISM rules live ONLY here.
 * Referenced in generate-image; NEVER injected into generate-prompts (they apply at generation time).
 *
 * Version: v1
 */

export const PROMPT_RULES_VERSION = "v1";

// ─────────────────────────────────────────────────────────────────
// FIDELITY & REALISM — injected as prefix when ref photos are present
// ─────────────────────────────────────────────────────────────────

export const FIDELITY_RULES = `FIDELITY RULES (MANDATORY — NEVER VIOLATE):
- Use the EXACT product from these reference photos
- Do not change: shape, proportions, dimensions, materials, colors, textures, button placement, ports, layout, logos, branding, text, labels
- Preserve ALL physical characteristics exactly as shown
- Do not add, remove, or modify any product feature
- Match the exact surface finish (matte, glossy, brushed, etc.)`;

export const REALISM_RULES = `REALISM RULES (MANDATORY):
- This must look like a REAL photograph, NOT a 3D render or CGI
- Realistic reflections based on actual material (metal, plastic, glass, fabric, leather)
- Accurate shadows with natural light falloff
- Subtle micro imperfections for photorealism (minor surface variations, realistic edge quality)
- AVOID: plastic/CGI look, over-smoothing, fake edges, unrealistic specular highlights, artificial sheen`;

// ─────────────────────────────────────────────────────────────────
// PROVIDER CAPABILITIES
// Used by callAI() to cap image refs and adapt prompt compilation.
// ─────────────────────────────────────────────────────────────────

export interface ProviderCapabilities {
  /** Provider supports receiving reference images in the request */
  supportsRefs: boolean;
  /** Maximum number of reference images the provider will actually use */
  maxRefs: number;
  /** Provider supports explicit fidelity level control (e.g. input_fidelity: "high") */
  supportsFidelityLevel: boolean;
  /** Provider can output images with transparent background (alpha channel) */
  supportsTransparency: boolean;
}

export const PROVIDER_CAPABILITIES: Record<string, ProviderCapabilities> = {
  // Google Gemini — multimodal inline; many refs OK; no fidelity param; no alpha output
  google:    { supportsRefs: true,  maxRefs: 10, supportsFidelityLevel: false, supportsTransparency: false },
  // OpenAI GPT Image — /v1/images/edits with FormData; up to 5 refs; input_fidelity param; alpha output
  openai:    { supportsRefs: true,  maxRefs: 5,  supportsFidelityLevel: true,  supportsTransparency: true  },
  // Replicate Flux 1.1 Pro — single image ref via `image` param; no explicit fidelity control
  replicate: { supportsRefs: true,  maxRefs: 1,  supportsFidelityLevel: false, supportsTransparency: false },
  // Anthropic Claude — vision model only; no image generation
  anthropic: { supportsRefs: false, maxRefs: 0,  supportsFidelityLevel: false, supportsTransparency: false },
};

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

/** Build the reference-photo prefix text for content parts. */
export function buildRefPrefix(): string {
  return `${FIDELITY_RULES}\n\n${REALISM_RULES}\n\nGenerate the image following the style direction in the prompt below.\nEnsure the product looks IDENTICAL to the reference and NOT reinterpreted.`;
}
