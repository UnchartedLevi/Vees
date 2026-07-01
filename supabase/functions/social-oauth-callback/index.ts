import { redirect, requireEnv, serviceClient, sha256 } from "../_shared/core.ts";
import { encryptToken as encryptTikTokToken, redirectUri as tiktokRedirectUri } from "../_shared/tiktok.ts";
import { encryptToken as encryptYouTubeToken, redirectUri as youtubeRedirectUri } from "../_shared/youtube.ts";

type Db = ReturnType<typeof serviceClient>;
type StateRow = { id: string; workspace_id: string; import_mode: string };

async function completeTikTok(request: Request, code: string, stateRow: StateRow, db: Db) {
  const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: requireEnv("TIKTOK_CLIENT_KEY"),
      client_secret: requireEnv("TIKTOK_CLIENT_SECRET"),
      code,
      grant_type: "authorization_code",
      redirect_uri: tiktokRedirectUri(request),
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
    access_token_encrypted: await encryptTikTokToken(accessToken),
    refresh_token_encrypted: await encryptTikTokToken(refreshToken),
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
}

async function completeYouTube(request: Request, code: string, stateRow: StateRow, db: Db) {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireEnv("YOUTUBE_CLIENT_ID"),
      client_secret: requireEnv("YOUTUBE_CLIENT_SECRET"),
      code,
      grant_type: "authorization_code",
      redirect_uri: youtubeRedirectUri(request),
    }),
  });
  const tokenPayload = await tokenResponse.json();
  if (!tokenResponse.ok) throw new Error(tokenPayload.error_description ?? tokenPayload.error ?? "YouTube token exchange failed.");

  const accessToken = tokenPayload.access_token as string;
  const refreshToken = tokenPayload.refresh_token as string | undefined;
  const scopes = String(tokenPayload.scope ?? "").split(" ").map((scope) => scope.trim()).filter(Boolean);

  const channelResponse = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&mine=true",
    { headers: { authorization: `Bearer ${accessToken}` } },
  );
  const channelPayload = await channelResponse.json();
  if (!channelResponse.ok) throw new Error(channelPayload.error?.message ?? "Could not read the YouTube channel.");
  const channel = channelPayload?.items?.[0];
  if (!channel) throw new Error("No YouTube channel was found for this Google account.");

  const channelId = channel.id as string;
  const accountName = channel.snippet?.title ?? "YouTube channel";
  const accountHandle = channel.snippet?.customUrl ? `@${String(channel.snippet.customUrl).replace(/^@/, "")}` : channelId;
  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads as string | undefined;

  const expiresAt = new Date(Date.now() + Number(tokenPayload.expires_in ?? 0) * 1000).toISOString();
  const values = {
    workspace_id: stateRow.workspace_id,
    platform: "YouTube Shorts",
    account_name: accountName,
    account_handle: accountHandle,
    provider_account_id: channelId,
    connection_status: "connected",
    import_mode: stateRow.import_mode,
    access_token_encrypted: await encryptYouTubeToken(accessToken),
    refresh_token_encrypted: await encryptYouTubeToken(refreshToken),
    token_expires_at: expiresAt,
    scopes,
    last_synced_at: new Date().toISOString(),
    provider_meta: { uploadsPlaylistId },
  };

  const { data: existing } = await db.from("social_accounts").select("id").eq("workspace_id", stateRow.workspace_id).eq("platform", "YouTube Shorts").eq("provider_account_id", channelId).maybeSingle();
  if (existing) {
    const { error: updateError } = await db.from("social_accounts").update(values).eq("id", existing.id);
    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await db.from("social_accounts").insert(values);
    if (insertError) throw insertError;
  }
}

Deno.serve(async (request) => {
  const url = new URL(request.url);
  const error = url.searchParams.get("error") ?? url.searchParams.get("error_description");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (error) return redirect(`/app/connect?social=error&message=${encodeURIComponent(error)}`);
  if (!code || !state) return redirect("/app/connect?social=error&message=Missing%20authorization%20code%20or%20state");

  const db = serviceClient();
  let provider = "social";
  try {
    const stateHash = await sha256(state);
    const { data: stateRow, error: stateError } = await db.from("oauth_states").select("*").eq("state_hash", stateHash).single();
    if (stateError || !stateRow) throw new Error("OAuth state was not found.");
    if (new Date(stateRow.expires_at).getTime() < Date.now()) throw new Error("OAuth state expired. Start the connection again.");
    provider = stateRow.provider;

    if (provider === "tiktok") await completeTikTok(request, code, stateRow, db);
    else if (provider === "youtube") await completeYouTube(request, code, stateRow, db);
    else throw new Error(`Unsupported provider: ${provider}`);

    await db.from("oauth_states").delete().eq("id", stateRow.id);
    return redirect(`/app/connect?${provider}=connected`);
  } catch (caught) {
    return redirect(`/app/connect?${provider}=error&message=${encodeURIComponent(caught instanceof Error ? caught.message : "Connection failed")}`);
  }
});
