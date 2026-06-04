import { corsHeaders, decryptToken, encryptToken, json, requireEnv, serviceClient, userClient } from "../_shared/tiktok.ts";

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
    const { data: account, error: accountError } = await db.from("social_accounts").select("*").eq("workspace_id", workspaceId).eq("id", accountId).eq("platform", "TikTok").single();
    if (accountError || !account) return json({ error: "TikTok account not found" }, 404);

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
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Could not refresh TikTok token" }, 500);
  }
});
