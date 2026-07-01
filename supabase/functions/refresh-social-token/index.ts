import { corsHeaders, decryptToken, encryptToken, json, requireEnv, serviceClient, userClient } from "../_shared/tiktok.ts";
import {
  decryptToken as decryptYouTubeToken,
  encryptToken as encryptYouTubeToken,
  requireEnv as requireYouTubeEnv,
} from "../_shared/youtube.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authorization = request.headers.get("authorization");
    if (!authorization) return json({ error: "Missing authorization header" }, 401);
    const { workspaceId, accountId } = await request.json();
    if (!workspaceId || !accountId) return json({ error: "workspaceId and accountId are required" }, 400);

    const userDb = userClient(authorization);
    const { data: workspace, error: workspaceError } = await userDb.from("workspaces").select("id").eq("id", workspaceId).single();
    if (workspaceError || !workspace) return json({ error: "Workspace not found" }, 404);

    const db = serviceClient();
    const { data: account, error: accountError } = await db.from("social_accounts").select("*").eq("workspace_id", workspaceId).eq("id", accountId).single();
    if (accountError || !account) return json({ error: "Social account not found" }, 404);

    if (account.platform === "TikTok") {
      const refreshToken = await decryptToken(account.refresh_token_encrypted);
      if (!refreshToken) return json({ error: "TikTok account is missing a refresh token" }, 400);

      const refreshResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_key: requireEnv("TIKTOK_CLIENT_KEY"),
          client_secret: requireEnv("TIKTOK_CLIENT_SECRET"),
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      });
      const refreshPayload = await refreshResponse.json();
      if (!refreshResponse.ok) throw new Error(refreshPayload.error_description ?? "TikTok token refresh failed.");

      const { error: updateError } = await db.from("social_accounts").update({
        access_token_encrypted: await encryptToken(refreshPayload.access_token),
        refresh_token_encrypted: await encryptToken(refreshPayload.refresh_token ?? refreshToken),
        token_expires_at: new Date(Date.now() + Number(refreshPayload.expires_in ?? 0) * 1000).toISOString(),
        connection_status: "connected",
        last_synced_at: new Date().toISOString(),
      }).eq("id", accountId);
      if (updateError) throw updateError;
      return json({ refreshed: true });
    }

    if (account.platform === "YouTube Shorts") {
      const refreshToken = await decryptYouTubeToken(account.refresh_token_encrypted);
      if (!refreshToken) return json({ error: "YouTube account is missing a refresh token" }, 400);

      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: requireYouTubeEnv("YOUTUBE_CLIENT_ID"),
          client_secret: requireYouTubeEnv("YOUTUBE_CLIENT_SECRET"),
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      });
      const refreshPayload = await refreshResponse.json();
      if (!refreshResponse.ok) throw new Error(refreshPayload.error_description ?? refreshPayload.error ?? "YouTube token refresh failed.");

      const { error: updateError } = await db.from("social_accounts").update({
        access_token_encrypted: await encryptYouTubeToken(refreshPayload.access_token),
        token_expires_at: new Date(Date.now() + Number(refreshPayload.expires_in ?? 0) * 1000).toISOString(),
        connection_status: "connected",
        last_synced_at: new Date().toISOString(),
      }).eq("id", accountId);
      if (updateError) throw updateError;
      return json({ refreshed: true });
    }

    return json({ error: `Refresh is not supported for ${account.platform} yet` }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Could not refresh social token" }, 500);
  }
});
