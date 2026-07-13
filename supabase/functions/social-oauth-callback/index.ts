import { redirect, requireEnv, serviceClient, sha256 } from "../_shared/core.ts";
import { encryptToken as encryptInstagramToken, redirectUri as instagramRedirectUri } from "../_shared/instagram.ts";
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
  const thumbnails = channel.snippet?.thumbnails ?? {};
  const thumbnailUrl = thumbnails.high?.url ?? thumbnails.medium?.url ?? thumbnails.default?.url ?? null;

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
    provider_meta: { uploadsPlaylistId, thumbnailUrl },
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

async function readInstagramProfile(accessToken: string) {
  const load = async (fields: string) => {
    const response = await fetch(`https://graph.instagram.com/me?fields=${encodeURIComponent(fields)}&access_token=${accessToken}`);
    const payload = await response.json();
    return { ok: response.ok, payload };
  };

  const withPicture = await load("id,username,account_type,profile_picture_url");
  if (withPicture.ok) return withPicture.payload;

  const fallback = await load("id,username,account_type");
  if (!fallback.ok) throw new Error(fallback.payload.error?.message ?? "Could not read the Instagram profile.");
  return fallback.payload;
}

async function completeInstagram(request: Request, rawCode: string, stateRow: StateRow, db: Db) {
  // Instagram sometimes appends a "#_" suffix to the returned code — strip it before exchange.
  const code = rawCode.replace(/#_$/, "");

  const shortLivedResponse = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireEnv("INSTAGRAM_CLIENT_ID"),
      client_secret: requireEnv("INSTAGRAM_CLIENT_SECRET"),
      grant_type: "authorization_code",
      redirect_uri: instagramRedirectUri(request),
      code,
    }),
  });
  const shortLivedPayload = await shortLivedResponse.json();
  if (!shortLivedResponse.ok) throw new Error(shortLivedPayload.error_message ?? shortLivedPayload.error_description ?? "Instagram token exchange failed.");
  const shortLivedToken = shortLivedPayload.access_token as string;
  const igUserId = String(shortLivedPayload.user_id ?? "");

  const longLivedParams = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: requireEnv("INSTAGRAM_CLIENT_SECRET"),
    access_token: shortLivedToken,
  });
  const longLivedResponse = await fetch(`https://graph.instagram.com/access_token?${longLivedParams.toString()}`);
  const longLivedPayload = await longLivedResponse.json();
  if (!longLivedResponse.ok) throw new Error(longLivedPayload.error?.message ?? "Could not obtain a long-lived Instagram token.");
  const accessToken = longLivedPayload.access_token as string;
  const expiresAt = new Date(Date.now() + Number(longLivedPayload.expires_in ?? 60 * 24 * 60 * 60) * 1000).toISOString();

  const profilePayload = await readInstagramProfile(accessToken);

  const accountId = String(profilePayload.id ?? igUserId);
  const values = {
    workspace_id: stateRow.workspace_id,
    platform: "Instagram",
    account_name: profilePayload.username ?? "Instagram account",
    account_handle: profilePayload.username ? `@${profilePayload.username}` : accountId,
    provider_account_id: accountId,
    connection_status: "connected",
    import_mode: stateRow.import_mode,
    access_token_encrypted: await encryptInstagramToken(accessToken),
    refresh_token_encrypted: null,
    token_expires_at: expiresAt,
    scopes: ["instagram_business_basic", "instagram_business_manage_insights"],
    last_synced_at: new Date().toISOString(),
    provider_meta: {
      accountType: profilePayload.account_type ?? null,
      profilePictureUrl: profilePayload.profile_picture_url ?? null,
      thumbnailUrl: profilePayload.profile_picture_url ?? null,
    },
  };

  const { data: existing } = await db.from("social_accounts").select("id").eq("workspace_id", stateRow.workspace_id).eq("platform", "Instagram").eq("provider_account_id", accountId).maybeSingle();
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
    else if (provider === "instagram") await completeInstagram(request, code, stateRow, db);
    else throw new Error(`Unsupported provider: ${provider}`);

    await db.from("oauth_states").delete().eq("id", stateRow.id);
    return redirect(`/app/connect?${provider}=connected`);
  } catch (caught) {
    return redirect(`/app/connect?${provider}=error&message=${encodeURIComponent(caught instanceof Error ? caught.message : "Connection failed")}`);
  }
});
