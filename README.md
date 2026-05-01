# ✈ Daycraft

**AI-powered day-trip planner.** Tell Daycraft where you're going and it builds a personalised guide — curated activities, restaurants, local tips, and a visual itinerary timeline — in seconds.

🌐 **Live app:** [daycraft-five.vercel.app](https://daycraft-five.vercel.app)

---

## What it does

You fill in:
- Destination
- Hotel / area you're staying in
- Check-in and check-out dates
- Any preferences (budget, interests, dietary needs, travel style…)

Daycraft uses **Groq + Llama 3.3 70B** to generate:
- 3–4 curated **activities** with timing, location, and duration
- 2–3 **restaurant** picks matched to your taste
- 2–3 **local insider tips**
- A **day timeline** you build yourself by checking off the stops you want

---

## Use cases

| Who | How they use it |
|-----|----------------|
| Weekend traveller | Quick guide for an unfamiliar city — no hours of research |
| Couple on a city break | Pick a hotel, get a ready-made day plan with restaurants |
| Solo road tripper | Enter each overnight stop, save an itinerary per day |
| Budget traveller | Set a daily budget in preferences, get free/cheap options |
| Foodie | Filter by "restaurants and food markets only" |
| Family trip planner | Preferences like "family-friendly, no late nights" shape the output |

---

## Features

- **Smart suggestions** — Groq (Llama 3.3 70B) generates fresh, context-aware recommendations tailored to your preferences
- **Cached trips** — suggestions are saved to your account; clicking a past trip loads instantly, no regeneration needed
- **Itinerary builder** — tick any activity or restaurant to add it to a live **timeline** showing travel times and durations between stops
- **Recent trips** — quickly switch between saved trips; delete ones you no longer need (with confirmation)
- **Secure auth** — email/password sign-in via Supabase; all data is user-scoped with row-level security
- **Mobile-first** — works great on phone as well as desktop

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19 + Tailwind CSS 4 |
| Auth & Database | Supabase (Postgres + Auth) |
| AI | Groq API — `llama-3.3-70b-versatile` |
| Deployment | Vercel |
| Language | TypeScript 6 |

---

## Running locally

1. **Clone and install**
   ```bash
   git clone https://github.com/KarthikPoojary/daycraft.git
   cd daycraft
   npm install
   ```

2. **Set up environment variables** — create `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GROQ_API_KEY=your_groq_api_key
   ```
   - Supabase: [supabase.com](https://supabase.com) → new project → Settings → API
   - Groq: [console.groq.com/keys](https://console.groq.com/keys) — free tier, no card needed

3. **Create the database table** in Supabase SQL editor:
   ```sql
   create table trips (
     id uuid primary key default gen_random_uuid(),
     user_id uuid references auth.users not null,
     destination text not null,
     hotel_name text,
     check_in date not null,
     check_out date not null,
     preferences text,
     suggestions jsonb,
     created_at timestamptz default now()
   );

   alter table trips enable row level security;

   create policy "Users manage own trips"
     on trips for all
     using (auth.uid() = user_id);
   ```

4. **Start the dev server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

---

## Project structure

```
app/
  api/
    suggestions/        POST — generates AI suggestions, saves to DB
    trips/[id]/         DELETE — removes a trip
  dashboard/
    page.tsx            Main dashboard (server component)
    TripForm.tsx        Form + recent trips + delete confirmation
    SuggestionCards.tsx Cards with checkboxes + live itinerary timeline
    SignOutButton.tsx
  login/                Email/password sign-in
  signup/               Account creation
lib/
  supabase/
    client.ts           Browser Supabase client
    server.ts           Server Supabase client (SSR cookies)
  types.ts              Shared TypeScript interfaces
middleware.ts           Auth guard — redirects unauthenticated page visits to /login
```

---

## Changelog

### v1.0.0 — 2026-05-01
- **Itinerary builder** — checkbox on each suggestion adds it to a live timeline with travel times and durations
- **Suggestion caching** — AI results saved to DB; past trips load instantly without regenerating
- **Delete trips** — × button on recent trip chips with confirmation popup
- **Groq / Llama 3.3 70B** — switched AI provider from Google Gemini to Groq for reliability and free-tier access
- **Auth middleware fix** — sessions correctly refreshed for API routes; no more spurious 401s on Vercel
- Version badge `v1.0.0` in dashboard header

### v0.1.0 — 2026-04-30
- Initial build — trip form, Supabase auth, AI suggestions (Activities / Restaurants / Tips), recent trips list
- Next.js 16, React 19, Tailwind 4, ESLint 10 flat config
