# YouTube Data Dashboard — Crixsoft

A multi-user web dashboard where creators upload YouTube export CSVs and explore channel, video, keyword, and comparison analytics. Streamlit isn't supported on Lovable, so we're building the equivalent as a modern React app.

## What the user gets

- **Landing page** — Crixsoft-branded intro, feature highlights, "Sign in / Get started" CTAs.
- **Auth** — Email/password + Google sign-in via Lovable Cloud. `/auth` public page, `/reset-password` page. Everything else lives under an authenticated layout.
- **Dashboard home** — list of the user's saved channels (each = a CSV upload set) + "New upload".
- **CSV upload wizard** — one channel per workspace. Accepts YouTube Studio exports:
  1. Channel overview CSV (subs, views, watch time over time)
  2. Video-level CSV (title, publish date, views, likes, comments, duration, CTR, avg view duration)
  3. Optional traffic-source / keyword CSV
  - Client-side parsing with PapaParse, schema validation with Zod, column auto-mapping with manual override, preview table before save.
- **Channel Overview page** — KPI cards (subs, total views, watch hours, video count), growth line charts (views/subs over time), top-video leaderboard.
- **Video Analytics page** — sortable/filterable table (search, date range, min views), engagement rate = (likes+comments)/views, scatter chart (views vs engagement), per-video detail drawer.
- **Compare Channels page** — pick 2–4 of the user's saved channels, side-by-side KPIs + overlaid line chart.
- **Keyword / Search Insights page** — from the traffic-source CSV: top search terms, impressions, CTR, bar chart + table. Graceful empty state if not uploaded.
- **Settings** — rename channel, delete channel (cascades data), sign out.

## Design direction

Data-dense but calm: dark sidebar + light content, YouTube-adjacent red accent (not a clone), Inter/Geist typography, generous KPI cards, Recharts for all charts. Crixsoft wordmark in header.

## Technical details

**Stack:** TanStack Start (existing), Lovable Cloud (Supabase), Recharts, PapaParse, Zod, TanStack Query.

**Data model (all RLS-protected, `user_id = auth.uid()`):**
- `profiles` (id, display_name, avatar_url)
- `channels` (id, user_id, name, handle, created_at)
- `channel_metrics` (channel_id, date, subscribers, views, watch_time_minutes) — from overview CSV
- `videos` (id, channel_id, external_id, title, published_at, duration_seconds, views, likes, comments, ctr, avg_view_duration)
- `keyword_metrics` (channel_id, term, impressions, clicks, ctr) — optional

Every table: `GRANT SELECT/INSERT/UPDATE/DELETE … TO authenticated` + `GRANT ALL … TO service_role`, RLS enabled, policies scoped to `auth.uid()` via `channels.user_id`. Profile auto-created via `on_auth_user_created` trigger.

**Routes:**
```
/                              public landing
/auth                          sign-in/sign-up
/reset-password                public
/_authenticated/dashboard      channel list
/_authenticated/upload         CSV wizard
/_authenticated/c/$channelId/overview
/_authenticated/c/$channelId/videos
/_authenticated/c/$channelId/keywords
/_authenticated/compare
/_authenticated/settings
```

**Server functions** (`src/lib/*.functions.ts`, `requireSupabaseAuth`): `createChannel`, `ingestChannelMetrics`, `ingestVideos`, `ingestKeywords`, `listChannels`, `getChannelOverview`, `listVideos`, `getKeywordStats`, `deleteChannel`. Loaders live under `_authenticated/` only.

**Google OAuth** wired via `lovable.auth.signInWithOAuth('google')`; `configure_social_auth` for google enabled at build time.

## Out of scope (say so up front)

- Live YouTube API pull (you chose CSV upload). Easy to add later behind the same tables.
- Comment sentiment / AI summaries.
- Team/shared workspaces.

## Build order

1. Enable Lovable Cloud + Google auth, create schema migration, create `profiles` trigger.
2. Auth pages + `_authenticated` layout + root `onAuthStateChange`.
3. Landing page + dashboard shell (sidebar, header, Crixsoft branding).
4. CSV upload wizard + ingest server fns.
5. Channel Overview + Videos pages with charts.
6. Compare + Keywords pages.
7. Settings, polish, empty states, error boundaries.

Ready to build when you approve.
