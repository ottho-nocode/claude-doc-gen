# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (localhost:3000)
npm run build     # Production build
npm run lint      # ESLint
```

No test framework is configured.

## Architecture

Next.js 14 App Router SaaS that transforms meeting transcriptions into technical documentation (user stories, user flows, specs, screen prompts) via Claude AI, with wireframe generation.

### Supabase Client Pattern (critical)

Two Supabase clients exist and must not be confused:
- **Browser** (`src/lib/supabase/client.ts`): `createBrowserClient()` — used in `'use client'` components
- **Server** (`src/lib/supabase/server.ts`): `createServerClient()` with cookies — used in API routes and Server Components. Returns a Promise, must be `await`ed.

Import paths differ:
```typescript
// Client component
import { createClient } from '@/lib/supabase/client'
// API route / Server Component
import { createClient } from '@/lib/supabase/server'
```

### Auth Flow

Middleware (`src/middleware.ts` → `src/lib/supabase/middleware.ts`) runs on every request:
- Refreshes Supabase auth token via cookies
- Redirects unauthenticated users to `/login` for protected routes (`/projects`, `/project/*`, `/settings`)
- Redirects authenticated users away from `/login` and `/register` to `/projects`

### Route Groups

- `(auth)/` — Login, Register (public, redirect if authenticated)
- `(dashboard)/` — Projects, Project detail, Settings (protected, shared Navbar layout)

### API Routes

All API routes use the server Supabase client and verify auth via `supabase.auth.getUser()`.

| Route | Method | Purpose |
|---|---|---|
| `/api/upload` | POST | Upload transcription (MD/TXT/DOCX via FormData) |
| `/api/generate` | POST | Generate document via Claude (`{project_id, document_type}`) |
| `/api/export` | GET | Export document (`?id=&format=md\|docx`) |
| `/api/wireframe` | GET/POST | JSON wireframe generation/retrieval |
| `/api/wireframe-html` | GET/POST | HTML+Tailwind wireframe per screen |
| `/api/wireframe-v0` | GET/POST | v0.dev wireframe generation |

### Credit System

Users have `credits_remaining` on their profile. Value of `-1` means unlimited (Enterprise). Credits are decremented on document generation and wireframe generation. Always check `!== -1` before comparing.

### i18n

Context-based system in `src/lib/i18n/` with 3 locales (fr, en, es). Use `useI18n()` hook → `t('key')` with optional parameter interpolation `t('key', { param: value })`. Locale stored in localStorage, defaults to French, auto-detects browser language.

### Wireframe System

Three rendering approaches in `src/components/wireframe/`:
- **WireframeRenderer** — Renders structured JSON wireframes (25+ element types)
- **HtmlWireframeRenderer** — Renders raw HTML+Tailwind in iframe with device preview
- **V0WireframeRenderer** — Embeds v0.dev generated UIs

Wireframes require `screens_prompts` document to be generated first. The HTML route parses screen sections from the document using `## Ecran:` heading markers.

### Database Tables (Supabase)

`profiles`, `projects`, `transcriptions`, `documents`, `wireframes`, `wireframes_html`, `wireframes_v0`. All have RLS enabled — users only see their own data. Profile is auto-created on signup via a database trigger.

### Claude AI Integration

- `src/lib/claude/client.ts`: `getAnthropicClient()` and `generateWithClaude(prompt)` (model: `claude-sonnet-4-20250514`, 8192 max tokens)
- `src/lib/claude/prompts.ts`: `PROMPTS` object per DocumentType + `buildPrompt()` combining type instructions, project name, and transcription contents

## Key Conventions

- Path alias: `@/*` maps to `./src/*`
- All dashboard pages are `'use client'` components using the browser Supabase client
- UI components: `src/components/ui/` — Button (variants: primary/outline/ghost, sizes: sm/md/lg, `isLoading` prop), Input (with `label`/`error`), Card (compound: CardHeader/CardTitle/CardContent/CardFooter)
- Utility: `cn()` from `src/lib/utils.ts` for merging Tailwind classes (clsx + tailwind-merge)
- Toasts: `react-hot-toast` — `toast.success()` / `toast.error()`
- Icons: `lucide-react`
- Custom primary color palette defined in `tailwind.config.ts` (blue shades 50-900)
- `next.config.js`: `serverActions.bodySizeLimit` set to `10mb` for file uploads

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
V0_API_KEY
NEXT_PUBLIC_APP_URL
```

## Deployment

Deployed on Vercel. Supabase project ID: `ihxiakrmclnbfrmrjnvg` (eu-west-1). The Supabase free tier pauses after inactivity — if the app shows blank pages, the project likely needs to be restored.
