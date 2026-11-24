# Marketing Dashboard

## What we're building

A marketing dashboard for **one marketer working on one brand**.

### Target user

A solo marketer: a founder, brand manager, or freelancer working on a **single brand**. They:

- do the work themselves, so they have no team and no handoffs
- don't have much time, so the dashboard should save it, not add setup work
- want results they can use right away, like a campaign they can send, an image they can post, or a number they can act on

Design for one person and one brand. Don't add multi-tenant features, team roles, permissions, or agency-style client switching unless we decide to later.

## The four core jobs

The dashboard has four main jobs. Every feature should support at least one of them.

1. **Performance & analytics.** Pull in performance numbers and analyze them, so the marketer can see what's working and decide what to do next.
2. **Email campaigns.** Write email campaigns (subject lines, body copy, calls to action) in the brand's voice.
3. **Campaign imagery.** Generate images for campaigns that match the brand.
4. **Marketing calendar.** Manage the marketing calendar and display it, so the marketer can see what's planned, what's in progress, and what has shipped.

These jobs should connect to each other. For example, a campaign on the calendar can have its email and images attached, and its performance numbers can flow back into analytics.

## Guiding principles

- **Single brand.** Brand details (name, voice, colors, audience) are set once and reused in the writing and image tools.
- **Fast to a useful result.** Get the user to something usable in as few steps as possible.
- **Clear over clever.** The user isn't a data analyst, so show plain numbers and explain what they mean.

## Tech stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend / data:** PostgreSQL hosted on Supabase
- **Analytics source:** Google Analytics 4 Data API via a service account (`src/lib/google-analytics.ts`, using `google-auth-library`).
- **Other third-party APIs** (AI text, image generation): to be added later. The user will say when and which ones. Don't add any before then.

## Auth

- One user. There is **no `users` table**.
- There is a login screen for that one user. How it works hasn't been decided yet, so don't implement it until asked.

## Data model (planned)

Build these tables **one at a time, only when asked**. Don't create migrations, a Supabase client, or types for a table before then.

| Table | Columns |
|---|---|
| `brand_kits` | name, voice, palette (JSON), dos, donts, created_at |
| `campaigns` | name, brief, brand_kit_id → brand_kits, subject (AI-generated), body (AI-generated), status (`draft` / `scheduled` / `sent`), scheduled_at, created_at |
| `assets` | prompt (used to generate the image/asset), image_url, campaign_id → campaigns, created_at |
| `analytics_snapshots` | period, metrics (JSON), pulled_at |
| `insights` | snapshot_id → analytics_snapshots, summary, created_at |
| `calendar_entries` | campaign_id → campaigns, scheduled_date, channel (`email` / `social` / `sms`), status (`scheduled` / `sent` / `cancelled`) |

## Project structure

```
src/app/
  layout.tsx            root layout (html/body only)
  login/                single-user login (placeholder, outside the app shell)
  (dashboard)/          route group: everything behind the sidebar shell
    layout.tsx          sidebar nav + main area
    page.tsx            overview (/)
    analytics/          job 1: performance numbers + insights
    campaigns/          job 2: email campaigns (list, new, [id])
    assets/             job 3: campaign imagery
    calendar/           job 4: marketing calendar
    brand-kit/          brand voice, palette, dos/don'ts
src/components/         shared UI (Nav, PageHeader, Placeholder)
```

## Next.js version notes

@AGENTS.md

- This is **Next.js 16** with `cacheComponents` enabled. Reading runtime data (`params`, `searchParams`, `cookies()`, `headers()`, uncached fetches/DB calls) or client hooks like `usePathname()` must happen inside `<Suspense>`, or be cached with `"use cache"`. Otherwise `next build` fails.
- Use the global `PageProps<"/route">` and `LayoutProps<"/route">` helpers to type `params`, which is a Promise.
- Check `node_modules/next/dist/docs/` before using an API you're unsure of.

## Commands

- `npm run dev`: start the dev server (http://localhost:3000)
- `npm run build`: production build
- `npm run lint`: ESLint

## Conventions

- Keep styling minimal for now: plain Tailwind utilities and no component library. The design pass comes later.
- Build features incrementally, one piece at a time, as the user directs.

## Status

The Next.js app is scaffolded, and each screen has a placeholder page. The database, auth, and APIs aren't implemented yet.
