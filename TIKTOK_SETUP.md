# TikTok Connection Setup

Vees now includes a real TikTok OAuth foundation. The browser starts OAuth, Supabase Edge Functions exchange the code server-side, tokens are encrypted with an Edge Function secret, and video metrics can sync into the `posts` table.

## What You Need From TikTok

Create an app at [TikTok for Developers](https://developers.tiktok.com/), then configure Login Kit for Web.

Requested scopes:

```text
user.info.basic
video.list
```

Set the TikTok redirect URI to your deployed Supabase Edge Function callback:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/social-oauth-callback
```

For the current project, the Supabase project ref appears to be:

```text
aerhxticuhmjisjnnqmk
```

So the local project callback should be:

```text
https://aerhxticuhmjisjnnqmk.supabase.co/functions/v1/social-oauth-callback
```

## Supabase Database

If you have not applied the full schema yet, run:

```text
supabase/schema.sql
```

If the base schema already exists, run the TikTok add-on:

```text
supabase/tiktok-schema.sql
```

## Supabase Edge Function Secrets

Set these secrets in Supabase:

```bash
supabase secrets set TIKTOK_CLIENT_KEY=your_tiktok_client_key
supabase secrets set TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
supabase secrets set TIKTOK_TOKEN_ENCRYPTION_KEY=a_32_character_or_longer_random_secret
supabase secrets set APP_BASE_URL=http://localhost:5173
supabase secrets set TIKTOK_REDIRECT_URI=https://aerhxticuhmjisjnnqmk.supabase.co/functions/v1/social-oauth-callback
```

Do not put TikTok client secrets in `.env.local` or frontend code.

## Deploy Functions

Deploy these Supabase Edge Functions:

```bash
supabase functions deploy start-tiktok-oauth
supabase functions deploy social-oauth-callback --no-verify-jwt
supabase functions deploy sync-social-account
supabase functions deploy refresh-social-token
```

`social-oauth-callback` must allow unauthenticated requests because TikTok redirects the user's browser there after OAuth.

## How Sync Works

After connecting TikTok, click **Sync TikTok** in Vees. The sync function imports available videos into `posts` with:

- title
- posted date
- likes
- comments
- shares
- views as reach/impressions
- engagement rate

TikTok does not expose all analytics to every app by default. Some fields and scopes may require TikTok approval.

Official docs:

- [TikTok Login Kit for Web](https://developers.tiktok.com/doc/login-kit-web/)
- [TikTok Display API](https://developers.tiktok.com/doc/display-api-overview/)
