import { appBaseUrl, corsHeaders, decryptTokenWithKey, encryptTokenWithKey, json, planTier, redirect, requireEnv, serviceClient, sha256, userClient } from "./core.ts";

export { appBaseUrl, corsHeaders, json, planTier, redirect, requireEnv, serviceClient, sha256, userClient };

export const tiktokScopes = ["user.info.basic", "video.list"];

export const redirectUri = (request: Request) => Deno.env.get("TIKTOK_REDIRECT_URI")
  ?? `${new URL(request.url).origin}/functions/v1/social-oauth-callback`;

export const encryptToken = (value?: string | null) => encryptTokenWithKey(value, "TIKTOK_TOKEN_ENCRYPTION_KEY");
export const decryptToken = (value?: string | null) => decryptTokenWithKey(value, "TIKTOK_TOKEN_ENCRYPTION_KEY");
