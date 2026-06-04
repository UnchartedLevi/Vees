import { encryptToken, redirect, redirectUri, requireEnv, serviceClient, sha256 } from "../_shared/tiktok.ts";

Deno.serve(async (request) => {
  const url = new URL(request.url);
  const error = url.searchParams.get("error") ?? url.searchParams.get("error_description");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (error) return redirect(`/app/connect?tiktok=error&message=${encodeURIComponent(error)}`);
  if (!code || !state) return redirect("/app/connect?tiktok=error&message=Missing%20TikTok%20code%20or%20state");

  const db = serviceClient();
  try {
    const stateHash = await sha256(state);
    const { data: stateRow, error: stateError } = await db.from("oauth_states").select("*").eq("provider", "tiktok").eq("state_hash", stateHash).single();
    if (stateError || !stateRow) throw new Error("TikTok OAuth state was not found.");
    if (new Date(stateRow.expires_at).getTime() < Date.now()) throw new Error("TikTok OAuth state expired. Start the connection again.");

    const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: requireEnv("TIKTOK_CLIENT_KEY"),
        client_secret: requireEnv("TIKTOK_CLIENT_SECRET"),
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri(request),
      }),
    });
    const tokenPayload = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error(tokenPayload.error_description ?? tokenPayload.message ?? "TikTok token exchange failed.");

    const accessToken = tokenPayload.access_token as string;
    const refreshToken = tokenPayload.refresh_token as string | undefined;
    const openId = tokenPayload.open_id as string;
    const scopes = String(tokenPayload.scope ?? "").split(",").map((scope) => scope.trim()).filter(Boolean);

    const userInfoResponse = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username", {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    const userInfoPayload = await userInfoResponse.json();
    const user = userInfoPayload?.data?.user ?? {};
    const accountName = user.display_name ?? user.username ?? "TikTok account";
    const accountHandle = user.username ? `@${user.username}` : openId;

    const expiresAt = new Date(Date.now() + Number(tokenPayload.expires_in ?? 0) * 1000).toISOString();
    const values = {
      workspace_id: stateRow.workspace_id,
      platform: "TikTok",
      account_name: accountName,
      account_handle: accountHandle,
      provider_account_id: openId,
      connection_status: "connected",
      import_mode: stateRow.import_mode,
      access_token_encrypted: await encryptToken(accessToken),
      refresh_token_encrypted: await encryptToken(refreshToken),
      token_expires_at: expiresAt,
      scopes,
      last_synced_at: new Date().toISOString(),
    };

    const { data: existing } = await db.from("social_accounts").select("id").eq("workspace_id", stateRow.workspace_id).eq("platform", "TikTok").eq("provider_account_id", openId).maybeSingle();
    if (existing) {
      const { error: updateError } = await db.from("social_accounts").update(values).eq("id", existing.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await db.from("social_accounts").insert(values);
      if (insertError) throw insertError;
    }

    await db.from("oauth_states").delete().eq("id", stateRow.id);
    return redirect("/app/connect?tiktok=connected");
  } catch (caught) {
    return redirect(`/app/connect?tiktok=error&message=${encodeURIComponent(caught instanceof Error ? caught.message : "TikTok connection failed")}`);
  }
});
