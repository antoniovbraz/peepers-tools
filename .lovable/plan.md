

## Plan: Fix Persistent Build/Publish Error + Full Codebase Audit

### Root Cause of Build Failure

The error `Cannot find package 'rollup' imported from /opt/template-node-modules/vite/dist/node/cli.js` reveals the real problem: **the deploy system uses its own Vite installation from `/opt/template-node-modules/`**, not the project's. That system-level Vite expects `rollup` to be available alongside it in the same template directory. Adding `rollup` or `vite` to the project's `dependencies` does not fix this because Node's module resolution from `/opt/template-node-modules/vite/` does not look in the project's `node_modules`.

Previous attempts to fix this (moving build tools to `dependencies`, adding `rollup` explicitly) were incorrect and actually made the `package.json` messier.

**The fix**: Revert build tools (`vite`, `rollup`, `@vitejs/plugin-react`, `postcss`, `tailwindcss`, `autoprefixer`, `lovable-tagger`, `tailwindcss-animate`, `@types/file-saver`) back to `devDependencies` where they belong. The deploy system provides its own build toolchain. The real rollup issue is an infrastructure problem that may need a fresh lockfile regeneration.

We will also remove the explicit `rollup` dependency entirely (it was never meant to be a direct dependency — Vite bundles it internally).

### Combined Changes (Build Fix + Audit Phases 1-3)

#### 1. Fix `package.json` (Build fix + Audit 3.3/3.4)
- Move build tools back to `devDependencies`: `vite`, `@vitejs/plugin-react`, `postcss`, `tailwindcss`, `tailwindcss-animate`, `autoprefixer`, `lovable-tagger`, `@types/file-saver`
- **Remove** `rollup` entirely (internal Vite dependency, should never be direct)
- **Remove** unused packages: `recharts`, `react-resizable-panels`, `embla-carousel-react`, `input-otp`, `date-fns`, `react-day-picker`, `cmdk`, `vaul`
- Regenerate lockfile

#### 2. History.tsx — Add user_id filter (Audit 1.1)
- Add `.eq("user_id", user.id)` to the query on line 53

#### 3. Edge Functions — Input validation + safe JSON parse (Audit 1.3/1.4)
- `identify-product`: Validate `photoUrls` are strings starting with `data:image/`, limit array size
- `generate-image`: Validate `prompt` length, validate `referencePhotos` format
- `generate-ads`: Validate required fields, add string length limits
- `generate-prompts`: Same validation pattern
- All 4: Wrap `JSON.parse(toolCall.function.arguments)` in try-catch

#### 4. Memory leak fixes (Audit 2.1/2.2)
- `StepUpload.tsx`: Revoke old blob URLs before creating new ones in `addFiles` and `removePhoto`
- `PromptCardItem.tsx`: Revoke previous blob URL in `handleImageUpload`

#### 5. StepExport.tsx — Safe base64 decode (Audit 2.3)
- Wrap `atob()` call in try-catch

#### 6. Clean up dead code (Audit 3.1/3.2)
- Delete `src/App.css` (unused Vite template leftover)
- Delete `src/pages/Index.tsx` (placeholder, never rendered — route redirects to `/create`)

#### 7. Minor fixes (Audit 6.1/6.2/6.3)
- `NotFound.tsx`: Remove `console.error` for 404
- `Auth.tsx`: Map Supabase error messages to user-friendly Portuguese strings
- `App.tsx`: Remove `<Sonner />` import and component (app uses Radix toast exclusively)

#### 8. StepPrompts.tsx — Fix potential infinite loop (Audit 4.2)
- Remove `useEffect(() => updatePrompts(prompts), [prompts])` and call `updatePrompts` directly in handlers

#### 9. StepIdentify.tsx — Disable Re-analisar while loading (Audit 4.3)
- Add `disabled={loading}` to the Re-analisar button

#### 10. StepUpload.tsx — File validation (Audit 5.1)
- Max 10MB per file, max 8 files. Show toast on rejection.

### Not included in this pass
- CORS origin restriction (Audit 1.2): Requires env variable setup and testing; will do as follow-up
- TypeScript strict mode (Audit 3.5): Incremental change, separate pass
- ESLint config (Audit 3.6): Separate pass
- Edge function DRY refactor (Audit 4.1): Cosmetic, lower priority
- Test coverage: Separate initiative

