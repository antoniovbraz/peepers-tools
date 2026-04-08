# Copilot Instructions — Peepers Tools

AI-powered product listing generator for Brazilian marketplaces (Mercado Livre and Shopee). All user-facing text is in **Brazilian Portuguese**.

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

### AI Edge Functions (Deno / Supabase)
All AI calls go through Supabase Edge Functions in `supabase/functions/`. Each function:
1. Calls `authenticate(req, cors)` to verify the Supabase JWT
2. Calls `checkRateLimit(userId, functionName, cors)` using the `rate_limits` table
3. Calls the Lovable AI gateway at `https://ai.gateway.lovable.dev/v1/chat/completions` with model `google/gemini-2.5-flash`
4. Uses `tool_choice` / function-calling to get structured JSON back
5. Returns the parsed result via `parseToolCallResult()`

Shared utilities live in `supabase/functions/_shared/helpers.ts`:
- `sanitizeForLLM()` / `sanitizeArrayForLLM()` — wrap user input in `<user_input>` XML tags to prevent prompt injection
- `fetchWithRetry()` — exponential backoff, 30 s timeout, up to 3 retries
- `createRequestLogger()` — structured JSON logging with request ID and elapsed time

### Auth
`AuthContext` (`src/context/AuthContext.tsx`) wraps the app and exposes `{ session, user, loading, signOut }`. OAuth (Google/Apple) goes through the Lovable auth integration (`src/integrations/lovable/index.ts`). All routes except `/auth` are protected by `ProtectedRoute` in `App.tsx`.

### Database
Supabase Postgres with RLS on all tables. All policies enforce `auth.uid() = user_id`.

- `products` — core product info + `visual_dna` JSONB
- `ads` — one row per marketplace (`mercadoLivre` | `shopee`) per product
- `creatives` — AI-generated images, overlay URLs, and `overlay_elements` JSONB
- `rate_limits` — per-user per-function hourly quota tracking

Storage buckets: `product-photos` (public) and `generated-images` (public).

### Overlay System
`src/lib/overlayTemplates.ts` defines `OverlayElement` — all position/size values are **percentages (0–100)** relative to the image. Templates are indexed 1–7 matching `IMAGE_ROLES`. Use `OverlayElement` directly; `OverlayElementData` is a deprecated alias.

## Key Conventions

- **Path alias**: `@/` maps to `src/`. Always use this for imports within `src/`.
- **Auto-generated files** — do not edit:
  - `src/integrations/supabase/client.ts`
  - `src/integrations/lovable/index.ts`
- **LLM prompt injection safety**: all user-provided strings embedded in prompts must go through `sanitizeForLLM()` from `_shared/helpers.ts`.
- **UI components**: Radix UI primitives wrapped as shadcn/ui-style components in `src/components/ui/`. Use these instead of raw HTML or third-party component libraries.
- **Toasts**: use `toast()` from `@/hooks/use-toast`, not `alert()` or custom modals.
- **Tests**: Vitest + jsdom + `@testing-library/react`. Test files live at `src/**/*.{test,spec}.{ts,tsx}`. Playwright is configured for e2e but no e2e tests exist yet.
- **Rate limits** (per hour, enforced in edge functions): identify-product: 20, generate-ads: 30, generate-prompts: 20, generate-image: 50, generate-overlay-copy: 50.
- **Environment variables** (frontend, prefixed `VITE_`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. Edge functions use `LOVABLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGIN`.
