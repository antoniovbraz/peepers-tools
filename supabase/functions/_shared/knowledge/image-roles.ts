/**
 * 7 image roles for e-commerce product listings.
 * Injected into generate-prompts via buildKnowledge() so that roles can be
 * evolved independently of the system prompt boilerplate.
 *
 * Version: v1
 */

export const IMAGE_ROLES_VERSION = "v1";

export const IMAGE_ROLES_KNOWLEDGE = `
═══════════════════════════════════════
IMAGE ROLES — 7 REQUIRED IMAGES
═══════════════════════════════════════

Generate EXACTLY 7 image prompts, one per role below.
Each prompt must be pure SCENE DIRECTION (80-150 words):
  ▸ Camera: angle, lens equivalent, perspective, distance
  ▸ Lighting: CONSISTENT with campaign visualDNA
  ▸ Background: CONSISTENT with campaign visualDNA
  ▸ Composition: product position, negative space, framing

CRITICAL — Do NOT include in prompts:
  ✗ Fidelity / realism rules (injected at generation time)
  ✗ Text overlays or typography (added programmatically)
  ✗ Vague or generic instructions ("nice photo", "high quality")

──────────────────────────────────────
#1 — COVER (Hero / Marketplace main image)
──────────────────────────────────────
Clean white background (or campaign background for Shopee).
Product centered, 3/4 angle, slightly elevated view, 85mm lens compression.
Soft studio key light upper-left, subtle rim light for product separation.
Product fills 75-85% of frame. No text, no effects, no props.

──────────────────────────────────────
#2 — BENEFITS (text overlay applied later)
──────────────────────────────────────
Product prominently displayed but positioned RIGHT of center.
Generous negative space on the LEFT (~40% of frame) for headline + bullet text overlay.
Same lighting and background as campaign visualDNA.
Slight 3/4 angle to add dimensionality while keeping text area clean.

──────────────────────────────────────
#3 — FEATURES (icon callouts applied later)
──────────────────────────────────────
Product at slight angle clearly showing key feature areas (ports, buttons, textures, materials).
Even, flat studio lighting revealing all surface details.
Generous margins all around product (~25% padding each side) for icon/callout placement.

──────────────────────────────────────
#4 — CLOSE-UP DETAIL
──────────────────────────────────────
Macro shot of the most visually compelling product detail.
100mm macro lens equivalent, shallow depth of field (f/2.8).
Directional cross-lighting (45° side) to reveal texture, material grain, and surface quality.
Tight crop — detail fills 70-80% of frame.

──────────────────────────────────────
#5 — LIFESTYLE / USAGE CONTEXT
──────────────────────────────────────
Product in a realistic, aspirational usage environment.
Natural or ambient light consistent with the setting; contextual props relevant to target user.
Rule of thirds — product as clear focal point. Shallow-to-medium depth of field.
Environment suggests who the buyer is and how they live.

──────────────────────────────────────
#6 — PORTABILITY / SCALE
──────────────────────────────────────
Product placed next to a universally recognized reference object (human hand, standard smartphone,
or coin) to communicate physical size without text.
Clean background (consistent with campaign visualDNA), even studio lighting.
Both objects sharp, clearly visible, no overlap obscuring scale comparison.

──────────────────────────────────────
#7 — IN-BOX / WHAT'S INCLUDED
──────────────────────────────────────
Flat lay or 45° overhead angle showing every item included in the box:
product + all cables, adapters, manuals, and accessories.
Clean neutral surface (white, marble, or light grey), soft diffused overhead lighting.
Organized, symmetrical layout with main product centered or at top.
`;
