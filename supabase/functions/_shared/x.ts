import { appBaseUrl, assertWorkspaceMember, authenticatedUser, corsHeaders, decryptTokenWithKey, encryptTokenWithKey, json, planTier, redirect, requireEnv, serviceClient, sha256, userClient } from "./core.ts";

export { appBaseUrl, assertWorkspaceMember, authenticatedUser, corsHeaders, json, planTier, redirect, requireEnv, serviceClient, sha256, userClient };

export const xScopes = [
  "tweet.read",
  "users.read",
  "offline.access",
];

export const redirectUri = (request: Request) => Deno.env.get("X_REDIRECT_URI")
  ?? `${new URL(request.url).origin}/functions/v1/social-oauth-callback`;

export const encryptToken = (value?: string | null) => encryptTokenWithKey(value, "X_TOKEN_ENCRYPTION_KEY");
export const decryptToken = (value?: string | null) => decryptTokenWithKey(value, "X_TOKEN_ENCRYPTION_KEY");

export const clientAuthHeader = () => `Basic ${btoa(`${requireEnv("X_CLIENT_ID")}:${requireEnv("X_CLIENT_SECRET")}`)}`;
