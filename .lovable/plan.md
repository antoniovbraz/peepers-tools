

## Plan: First Prompt Always White Background for Marketplaces

### What changes

**Edge function `supabase/functions/generate-prompts/index.ts`** — Update the system prompt to instruct the AI that:

1. **Prompt #1 must always be a white-background marketplace photo** following this style:
   - Product perfectly upright, three-quarter angle, fully visible, floating slightly above pure white background
   - Composite studio lighting (soft fill + directional highlights), HDR tonal separation, flawless edges
   - Preserve logos/text/brand elements, full depth of field on product, clean premium retouched realism

2. **Prompts #2–7** remain varied styles (lifestyle, flat lay, close-up, in-use, etc.) as they are today.

### Technical detail

Update the system prompt content (lines 29–36) to explicitly define the first prompt template and instruct the remaining 6 to cover different angles/styles. No frontend changes needed — the prompt cards already render in order.

