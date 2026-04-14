# Copilot Instructions — Peepers Tools

AI-powered product listing generator for Brazilian marketplaces (Mercado Livre, Shopee, Amazon BR, and Magalu). All user-facing text is in **Brazilian Portuguese**.

## Commands

```bash
npm run dev          # start Vite dev server
npm run build        # production build
npm run lint         # ESLint
npm run test         # run unit tests once (Vitest)
npm run test:watch   # run unit tests in watch mode
```

Run a single test file:
```bash
npx vitest run src/context/CreateListingContext.test.tsx
```

## Architecture

### 5-Step Wizard Flow
`/create` is the main route, rendered by `src/pages/CreateListing.tsx`. It wraps `CreateListingProvider` and renders one step at a time (animated with Framer Motion):

| Step | Index | Component |
|------|-------|-----------|
| Upload photos | 0 | `StepUpload` |
| Identify product | 1 | `StepIdentify` |
| Generate ads | 2 | `StepAds` |
| Generate image prompts | 3 | `StepPrompts` |
| Export | 4 | `StepExport` |

Steps 3–4 (image-heavy) are wrapped in individual `ErrorBoundary` instances to prevent canvas crashes from losing wizard state.

### State Management
All wizard state lives in `CreateListingContext` (`src/context/CreateListingContext.tsx`). There is no Redux or Zustand. The context auto-saves to `localStorage` (key: `draft_product_v2`) with a 2-second debounce. On mount it offers to restore a draft via a toast. `File` objects are excluded from the draft (not serializable).

Key `ListingData` fields:
- `marketplace: Marketplace` — active marketplace (`"mercadoLivre"` | `"shopee"` | `"amazon"` | `"magalu"`)
- `includeBrand: boolean` — whether to include brand name in generated titles
- `identification.suggested_category?: string` — normalised category key returned by `identify-product`
- `ads.amazon?: AdData & { bullets?: string[]; backend_search_terms?: string }` — Amazon-specific ad data
- `ads.magalu?: AdData` — Magalu ad data

Context handlers: `updateMarketplace(marketplace)`, `updateIncludeBrand(includeBrand)` in addition to the existing `updateIdentification()`, `updateAds()`, etc.

### AI Edge Functions (Deno / Supabase)
All AI calls go through Supabase Edge Functions in `supabase/functions/`. Each function:
1. Calls `authenticate(req, cors)` to verify the Supabase JWT
2. Calls `checkRateLimit(userId, functionName, cors)` using the `rate_limits` table
3. Calls `callGoogleAI()` which hits the Google Generative Language API directly (`https://generativelanguage.googleapis.com/v1beta`)
4. Uses `tool_choice` / function-calling to get structured JSON back
5. Returns the parsed result via `parseToolCallResult()`

Models: `gemini-2.5-flash` (text/vision/function-calling), `gemini-2.5-flash-image` (image generation).

Shared utilities live in `supabase/functions/_shared/helpers.ts`:
- `callGoogleAI()` — adapter that converts OpenAI-style params to Gemini format and back; supports function calling, image generation, and vision
- `sanitizeForLLM()` / `sanitizeArrayForLLM()` — wrap user input in `<user_input>` XML tags to prevent prompt injection
- `fetchWithRetry()` — exponential backoff, 30 s timeout, up to 3 retries
- `createRequestLogger()` — structured JSON logging with request ID and elapsed time

### Auth
`AuthContext` (`src/context/AuthContext.tsx`) wraps the app and exposes `{ session, user, loading, signOut }`. OAuth (Google) uses native Supabase Auth (`supabase.auth.signInWithOAuth`). All routes except `/auth` are protected by `ProtectedRoute` in `App.tsx`.

### Database
Supabase Postgres with RLS on all tables. All policies enforce `auth.uid() = user_id`.

- `products` — core product info + `visual_dna` JSONB
- `ads` — one row per marketplace (`mercadoLivre` | `shopee` | `amazon` | `magalu`) per product
- `creatives` — AI-generated images, overlay URLs, and `overlay_elements` JSONB
- `rate_limits` — per-user per-function hourly quota tracking

Storage buckets: `product-photos` (public) and `generated-images` (public).

### Overlay System
`OverlayElement` is the canonical type, defined in `src/components/create/overlay-editor/types.ts` — all position/size values are **percentages (0–100)** relative to the image. `src/lib/overlayTemplates.ts` imports it and defines `IMAGE_ROLES` (seven image slots) plus default templates per slot. Templates are indexed 1–7; index 1 (cover) has no overlay. Use `OverlayElement` directly; `OverlayElementData` is a deprecated alias.

### Knowledge Base
`supabase/functions/_shared/knowledge/` contains 7 modules assembled by `buildKnowledge(options)` before each AI call (token budget ~6 000):
- `marketplace-rules.ts` — title format, tone, char limits per marketplace (ML 60, Shopee 120, Amazon BR 200, Magalu 150)
- `copywriting.ts` — AIDA framework, PT-BR power words, anti-patterns
- `category-guides.ts` — 10 normalised categories with required fields and sales angles; exports `normalizeCategory()` and `CATEGORIES`
- `seo-strategy.ts` — keyword strategy and backend search terms per marketplace
- `image-rules.ts` — resolution/format rules + AI prompt guidelines per category
- `overlay-copy.ts` — char limits per element (headline 30, subheadline 50, bullet 40, badge 15, CTA 20)
- `index.ts` — `buildKnowledge({ functionName, marketplace, category, includeBrand })` assembler

Frontend mirror: `src/lib/knowledgeCategories.ts` exports the same `CATEGORIES` array and `KnowledgeCategory` type for use in UI components.

## Key Conventions

- **Path alias**: `@/` maps to `src/`. Always use this for imports within `src/`.
- **Auto-generated files** — do not edit:
  - `src/integrations/supabase/client.ts`
- **LLM prompt injection safety**: all user-provided strings embedded in prompts must go through `sanitizeForLLM()` from `_shared/helpers.ts`.
- **UI components**: Radix UI primitives wrapped as shadcn/ui-style components in `src/components/ui/`. Use these instead of raw HTML or third-party component libraries.
- **Toasts**: use `toast()` from `@/hooks/use-toast`, not `alert()` or custom modals.
- **Tests**: Vitest + jsdom + `@testing-library/react`. Test files live at `src/**/*.{test,spec}.{ts,tsx}`. Playwright is configured for e2e but no e2e tests exist yet.
- **Rate limits** (per hour, enforced in edge functions): identify-product: 20, generate-ads: 30, generate-prompts: 20, generate-image: 50, generate-overlay-copy: 50.
- **Environment variables** (frontend, prefixed `VITE_`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. Edge functions use `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGIN`. Users provide their own AI API keys via the Settings page (BYOK model). See `.env.example`.
