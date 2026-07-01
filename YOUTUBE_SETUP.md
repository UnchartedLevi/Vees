# YouTube Connection Setup

Vees now includes a real YouTube OAuth foundation, mirroring the TikTok integration: the
browser starts OAuth with Google, a Supabase Edge Function exchanges the code server-side,
tokens are encrypted with a dedicated Edge Function secret, and both channel-level analytics
and Shorts tracking sync into the `posts` and `analytics_snapshots` tables.

Channel-level retention analytics (via the YouTube Analytics API) are gated to paid plans —
see **Plan gating** below. Basic video/Shorts stats (views, likes, comments) are available on
every plan.

## 1. Google Cloud Console

Your OAuth Client ID (already created, reused from the Google sign-in setup):

```text
743421672311-igco1fkje3ce60bsbo3s1apkuo8a12b1.apps.googleusercontent.com
```

Steps to finish in the [Google Cloud Console](https://console.cloud.google.com/):

1. Open **APIs & Services > Library** and enable:
   - **YouTube Data API v3** (channel info, videos, playlists)
   - **YouTube Analytics API** (retention, watch time — used for paid-plan channel analytics)
2. Open **APIs & Services > Credentials**, open the existing OAuth client (the one whose ID
   is above), and add this **Authorized redirect URI**:

```text
https://aerhxticuhmjisjnnqmk.supabase.co/functions/v1/social-oauth-callback
```

   This is the same shared callback function TikTok uses — the callback tells providers apart
   by the `state` value it issued.

3. On the **OAuth consent screen**, under **Data access**, make sure these scopes are listed:
   - `https://www.googleapis.com/auth/youtube.readonly`
   - `https://www.googleapis.com/auth/yt-analytics.readonly`

   If the app is in **Testing** mode, add your Google account (and any beta testers) under
   **Test users**, or submit for verification before going to production — Google will review
   the `yt-analytics.readonly` scope similarly to how TikTok reviews sensitive scopes.

4. Copy the **Client secret** for the same OAuth client. Keep it out of the frontend and out
   of chat — it only goes into Supabase secrets (next section).

## 2. Supabase Database

Apply the migration once (after `schema.sql`, and after `tiktok-schema.sql` if you already
applied that one):

```text
supabase/youtube-schema.sql
```

This adds:
- `workspaces.plan_tier` (`free` / `pro` / `agency`, default `free`) — drives feature gating
- `social_accounts.provider_meta` (jsonb) — stores the channel's uploads playlist id
- `posts.is_short`, `posts.duration_seconds`, `posts.retention_rate`
- `analytics_snapshots.average_view_percentage`

## 3. Supabase Edge Function Secrets

```bash
supabase secrets set YOUTUBE_CLIENT_ID=743421672311-igco1fkje3ce60bsbo3s1apkuo8a12b1.apps.googleusercontent.com
supabase secrets set YOUTUBE_CLIENT_SECRET=your_google_client_secret
supabase secrets set YOUTUBE_TOKEN_ENCRYPTION_KEY=a_32_character_or_longer_random_secret
supabase secrets set APP_BASE_URL=http://localhost:5173
supabase secrets set YOUTUBE_REDIRECT_URI=https://aerhxticuhmjisjnnqmk.supabase.co/functions/v1/social-oauth-callback
```

`YOUTUBE_TOKEN_ENCRYPTION_KEY` should be a different random value than
`TIKTOK_TOKEN_ENCRYPTION_KEY` — each provider's tokens are encrypted with their own key.

## 4. Deploy Functions

```bash
supabase functions deploy start-youtube-oauth
supabase functions deploy social-oauth-callback --no-verify-jwt
supabase functions deploy sync-social-account
supabase functions deploy refresh-social-token
```

`social-oauth-callback` now handles both TikTok and YouTube redirects — it looks up the
`oauth_states` row by `state` to know which provider's token exchange to run. Redeploy it any
time you add a new provider.

## Plan gating

`src/utils/planLimits.ts` defines which plans get which features:

```ts
youtubeChannelAnalytics: ["pro", "agency"]
```

- **Free plan**: `sync-social-account` still imports every video/Short with views, likes,
  comments, and flags Shorts via `is_short` (duration ≤ 60s) — useful and presentable on its
  own.
- **Pro / Agency plan**: the sync function additionally calls the YouTube Analytics API for
  `averageViewPercentage` per video (stored in `posts.retention_rate`) — the deeper retention
  insight.

To change a workspace's plan during testing:

```sql
update public.workspaces set plan_tier = 'pro' where id = 'YOUR_WORKSPACE_ID';
```

There's no billing integration wired up yet — `plan_tier` is a plain column you (or a future
Stripe webhook) can update directly.

## How Sync Works

After connecting YouTube, click **Sync YouTube Shorts** in Vees. The sync function:

1. Refreshes the access token if it's expired.
2. Reads the channel's uploads playlist (cached in `social_accounts.provider_meta`).
3. Pulls the latest 20 videos with `snippet,statistics,contentDetails`.
4. Flags anything ≤ 60 seconds as a Short.
5. On paid plans, fetches per-video retention from the YouTube Analytics API.
6. Upserts everything into `posts` and writes an `analytics_snapshots` row.

Official docs:

- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- [YouTube Analytics API](https://developers.google.com/youtube/analytics)
