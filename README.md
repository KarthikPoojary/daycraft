# Daycraft

AI-powered travel activity suggester. Enter your destination, hotel, and dates — Claude searches the web and returns personalized activity, restaurant, and local tip recommendations.

## Stack

| Layer | Package | Version |
|---|---|---|
| Framework | Next.js | 16 |
| UI | React | 19 |
| Styling | Tailwind CSS | 4 |
| Auth & DB | Supabase | 2 |
| AI | Anthropic SDK (`claude-sonnet-4-6` + web search) | latest |
| Language | TypeScript | 6 |
| Linter | ESLint | 10 (flat config) |

## Features

- Email/password auth via Supabase
- Trip form: destination, hotel, check-in/out, preferences
- Claude calls `web_search` to find current, relevant suggestions
- Results split into Activities, Restaurants, and Local Tips cards
- Past trips saved and reloadable from the dashboard
- Mobile-first layout

## Setup

1. Clone and install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.local` and fill in real values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ANTHROPIC_API_KEY=...
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

## Project structure

```
app/
  api/suggestions/   POST handler — saves trip, calls Claude
  dashboard/         Main page, TripForm, SuggestionCards
  login/             Email/password sign-in
  signup/            Account creation
lib/
  supabase/          Browser + server Supabase clients
  types.ts           Shared TypeScript types
proxy.ts             Auth guard (Next.js 16 proxy, replaces middleware)
```

## Database

The `trips` table is created in Supabase with row-level security:

```sql
create table trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  destination text not null,
  hotel_name text,
  check_in date not null,
  check_out date not null,
  preferences text,
  created_at timestamptz default now()
);
```

## Upgrade notes (2026-04-30)

- **Next.js 14 → 16**: `middleware.ts` renamed to `proxy.ts`; exported function renamed from `middleware` to `proxy`. Turbopack is now the default bundler for production builds.
- **React 18 → 19**: No code changes needed; no deprecated APIs (`forwardRef`, `defaultProps`) were in use.
- **Tailwind CSS 3 → 4**: Removed `tailwind.config.ts`; replaced `@tailwind` directives in `globals.css` with `@import "tailwindcss"`; updated `postcss.config.mjs` to use `@tailwindcss/postcss`.
- **ESLint 8 → 10**: Replaced `.eslintrc.json` (legacy config) with `eslint.config.mjs` (flat config) using `FlatCompat` from `@eslint/eslintrc`.
- **TypeScript 5 → 6**: No code changes needed; `tsconfig.json` updated automatically by Next.js build (`jsx`, `target`, `include`).
