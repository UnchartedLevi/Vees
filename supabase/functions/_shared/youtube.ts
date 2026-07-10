import { appBaseUrl, assertWorkspaceMember, authenticatedUser, corsHeaders, decryptTokenWithKey, encryptTokenWithKey, json, planTier, redirect, requireEnv, serviceClient, sha256, userClient } from "./core.ts";

export { appBaseUrl, assertWorkspaceMember, authenticatedUser, corsHeaders, json, planTier, redirect, requireEnv, serviceClient, sha256, userClient };

// youtube.readonly covers channel details + video/playlist listing (Shorts included).
// yt-analytics.readonly unlocks retention, watch time, and traffic-source data via the
// YouTube Analytics API. Both are requested at connect time so a later plan upgrade does
// not require the user to reauthorize; the sync function decides what to fetch/store based
// on the workspace plan_tier (see supabase/youtube-schema.sql and src/utils/planLimits.ts).
export const youtubeScopes = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
];

export const redirectUri = (request: Request) => Deno.env.get("YOUTUBE_REDIRECT_URI")
  ?? `${new URL(request.url).origin}/functions/v1/social-oauth-callback`;

export const encryptToken = (value?: string | null) => encryptTokenWithKey(value, "YOUTUBE_TOKEN_ENCRYPTION_KEY");
export const decryptToken = (value?: string | null) => decryptTokenWithKey(value, "YOUTUBE_TOKEN_ENCRYPTION_KEY");
