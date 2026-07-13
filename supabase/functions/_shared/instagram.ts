import { appBaseUrl, assertWorkspaceMember, authenticatedUser, corsHeaders, decryptTokenWithKey, encryptTokenWithKey, json, planTier, redirect, requireEnv, serviceClient, sha256, userClient } from "./core.ts";

export { appBaseUrl, assertWorkspaceMember, authenticatedUser, corsHeaders, json, planTier, redirect, requireEnv, serviceClient, sha256, userClient };

// instagram_business_basic covers profile read, media list, and both account- and media-level
// insights (reach, impressions, engagement). We deliberately do not request
// instagram_business_content_publish / manage_messages / manage_comments — Vees only reads
// analytics, and requesting unused scopes slows down Meta's app review.
export const instagramScopes = ["instagram_business_basic", "instagram_business_manage_insights"];

export const redirectUri = (request: Request) => Deno.env.get("INSTAGRAM_REDIRECT_URI")
  ?? `${new URL(request.url).origin}/functions/v1/social-oauth-callback`;

export const encryptToken = (value?: string | null) => encryptTokenWithKey(value, "INSTAGRAM_TOKEN_ENCRYPTION_KEY");
export const decryptToken = (value?: string | null) => decryptTokenWithKey(value, "INSTAGRAM_TOKEN_ENCRYPTION_KEY");
