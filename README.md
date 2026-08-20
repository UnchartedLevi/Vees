# Vees

Vees is a Supabase-powered social media management SaaS foundation. It helps creators, schools, small businesses, agencies, and NGOs organize content, track performance, connect channels, manage campaigns, generate reports, and get rule-based recommendations.

## Implemented

- Supabase Auth with email/password, Google OAuth, password reset, session persistence, and logout
- Protected routes and first-time workspace onboarding
- Multi-brand-ready workspace schema with Row Level Security
- Dashboard, calendar, analytics, ideas, campaigns, reports, assistant, settings, and connection pages
- Manual post tracking and scheduled posts stored in Supabase
- Demo social connector with configurable import modes and idempotent demo seeding
- Typed social connector interface with placeholders for Meta, TikTok, LinkedIn, X, and YouTube
- X provider setup guide for server-side Xquik sync without browser-exposed API keys
- TikTok OAuth foundation with Supabase Edge Functions and server-side token handling
- Supabase Edge Function placeholders for OAuth callbacks, sync jobs, and token refresh
- Clean missing-environment setup screen instead of a runtime crash

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase Auth and Postgres
- Lucide React icons

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Create a Supabase project at [supabase.com](https://supabase.com).

3. Open the Supabase SQL Editor and run:

```text
supabase/schema.sql
```

Run the full schema script before testing sign-in. A `PGRST205` response for `public.workspaces` means the schema has not been applied yet.
Run it in the same Supabase project referenced by `.env.local`. The script ends by requesting a PostgREST schema-cache refresh.

4. Copy `.env.example` to `.env.local`, then add your project values:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

5. Start Vite:

```bash
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Google OAuth

Enable Google under Supabase Authentication providers. Add your Google OAuth client credentials in the Supabase dashboard and configure the allowed redirect URLs, including:

```text
http://localhost:5173/auth/callback
```

The browser receives only the Supabase session. Provider secrets must not be stored in frontend code.

Follow the complete local setup checklist in `GOOGLE_OAUTH_SETUP.md`. Keep the Google Client Secret only in the Supabase dashboard.

## Demo Connector

The Connect Accounts page includes a working demo/manual connector. It stores the selected account in `social_accounts` and supports:

- Import existing posts: seeds sample posts, campaigns, ideas, reports, and analytics
- Start tracking from today: connects with minimal history
- Only track future platform posts: stays empty until content is created

Demo seeding is idempotent for each workspace.

## Social Integrations

Real provider integrations are intentionally placeholders. Each platform requires its own developer app, OAuth permissions, redirect configuration, token refresh strategy, and possibly platform review. Meta integrations may also require professional Instagram accounts and production app review.

Do not put real social access tokens in localStorage or frontend JavaScript. Production token exchange, encryption, refresh, and scheduled sync should run server-side through Supabase Edge Functions or another backend API. Placeholder functions live in `supabase/functions`.

## Architecture Notes

- Database schema and policies: `supabase/schema.sql`
- Environment-safe client: `src/lib/supabaseClient.ts`
- Auth and workspace state: `src/context`
- Workspace-scoped queries: `src/services`
- Social provider modules: `src/integrations/social`
- Demo seed helper: `src/utils/seedDemoData.ts`
- TikTok setup: `TIKTOK_SETUP.md`
- X provider setup: `X_PROVIDER_SETUP.md`

## Production Build

```bash
npm run build
```

## Roadmap

- Deploy and schedule Edge Functions for social sync
- Complete approved OAuth integrations per provider
- Add server-side encrypted token storage
- Support team invitations and workspace switching
- Add publish scheduling workers
- Replace the rule-based assistant with a secure backend AI integration
- Add real PDF report export
