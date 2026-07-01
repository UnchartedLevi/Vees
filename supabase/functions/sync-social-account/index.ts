import { corsHeaders, decryptToken, encryptToken, json, requireEnv, serviceClient, userClient } from "../_shared/tiktok.ts";
import {
  decryptToken as decryptYouTubeToken,
  encryptToken as encryptYouTubeToken,
  planTier,
  requireEnv as requireYouTubeEnv,
} from "../_shared/youtube.ts";

type Db = ReturnType<typeof serviceClient>;

type TikTokVideo = {
  id: string;
  title?: string;
  create_time?: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  view_count?: number;
  cover_image_url?: string;
  share_url?: string;
};

function parseIsoDuration(iso?: string) {
  if (!iso) return 0;
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!match) return 0;
  const [, h, m, s] = match;
  return Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0);
}

async function refreshYouTubeAccessToken(db: Db, account: any) {
  const refreshToken = await decryptYouTubeToken(account.refresh_token_encrypted);
  if (!refreshToken) throw new Error("YouTube account is missing a refresh token.");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireYouTubeEnv("YOUTUBE_CLIENT_ID"),
      client_secret: requireYouTubeEnv("YOUTUBE_CLIENT_SECRET"),
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error_description ?? payload.error ?? "YouTube token refresh failed.");
  await db.from("social_accounts").update({
    access_token_encrypted: await encryptYouTubeToken(payload.access_token),
    token_expires_at: new Date(Date.now() + Number(payload.expires_in ?? 0) * 1000).toISOString(),
  }).eq("id", account.id);
  return payload.access_token as string;
}

async function syncTikTok(db: Db, workspaceId: string, accountId: string, account: any) {
  let accessToken = await decryptToken(account.access_token_encrypted);
  const refreshToken = await decryptToken(account.refresh_token_encrypted);
  if (!accessToken) throw new Error("TikTok account is missing an access token.");

  if (account.token_expires_at && new Date(account.token_expires_at).getTime() < Date.now() + 60_000 && refreshToken) {
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
    accessToken = refreshPayload.access_token;
    await db.from("social_accounts").update({
      access_token_encrypted: await encryptToken(refreshPayload.access_token),
      refresh_token_encrypted: await encryptToken(refreshPayload.refresh_token ?? refreshToken),
      token_expires_at: new Date(Date.now() + Number(refreshPayload.expires_in ?? 0) * 1000).toISOString(),
    }).eq("id", accountId);
  }

  const fields = "id,title,cover_image_url,share_url,create_time,like_count,comment_count,share_count,view_count";
  const videoResponse = await fetch(`https://open.tiktokapis.com/v2/video/list/?fields=${encodeURIComponent(fields)}`, {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({ max_count: 20 }),
  });
  const videoPayload = await videoResponse.json();
  if (!videoResponse.ok) throw new Error(videoPayload.error?.message ?? videoPayload.message ?? "TikTok video sync failed.");

  const videos: TikTokVideo[] = videoPayload?.data?.videos ?? [];
  return videos.map((video) => {
    const reach = Number(video.view_count ?? 0);
    const likes = Number(video.like_count ?? 0);
    const comments = Number(video.comment_count ?? 0);
    const shares = Number(video.share_count ?? 0);
    return {
      workspace_id: workspaceId,
      social_account_id: accountId,
      platform: "TikTok",
      title: video.title || "TikTok video",
      caption: video.share_url ?? null,
      content_type: "Video",
      status: "published",
      media_url: video.cover_image_url ?? null,
      posted_at: video.create_time ? new Date(video.create_time * 1000).toISOString() : null,
      likes,
      comments,
      shares,
      saves: 0,
      reach,
      impressions: reach,
      engagement_rate: reach ? ((likes + comments + shares) / reach) * 100 : 0,
      source: "tiktok",
      external_post_id: video.id,
    };
  });
}

async function syncYouTube(db: Db, workspaceId: string, accountId: string, account: any) {
  let accessToken = await decryptYouTubeToken(account.access_token_encrypted);
  if (!accessToken || (account.token_expires_at && new Date(account.token_expires_at).getTime() < Date.now() + 60_000)) {
    accessToken = await refreshYouTubeAccessToken(db, account);
  }

  let uploadsPlaylistId = account.provider_meta?.uploadsPlaylistId as string | undefined;
  if (!uploadsPlaylistId) {
    const channelResponse = await fetch("https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true", {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    const channelPayload = await channelResponse.json();
    if (!channelResponse.ok) throw new Error(channelPayload.error?.message ?? "Could not read the YouTube channel.");
    uploadsPlaylistId = channelPayload?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (uploadsPlaylistId) await db.from("social_accounts").update({ provider_meta: { uploadsPlaylistId } }).eq("id", accountId);
  }
  if (!uploadsPlaylistId) throw new Error("Could not find the channel's uploads playlist.");

  const playlistResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=20&playlistId=${uploadsPlaylistId}`,
    { headers: { authorization: `Bearer ${accessToken}` } },
  );
  const playlistPayload = await playlistResponse.json();
  if (!playlistResponse.ok) throw new Error(playlistPayload.error?.message ?? "YouTube video list failed.");
  const videoIds: string[] = (playlistPayload?.items ?? []).map((item: any) => item.contentDetails?.videoId).filter(Boolean);
  if (!videoIds.length) return [];

  const videosResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(",")}`,
    { headers: { authorization: `Bearer ${accessToken}` } },
  );
  const videosPayload = await videosResponse.json();
  if (!videosResponse.ok) throw new Error(videosPayload.error?.message ?? "YouTube video details failed.");
  const videos: any[] = videosPayload?.items ?? [];

  // Channel analytics (retention, watch time) require the yt-analytics.readonly scope
  // and are only fetched for workspaces on a paid plan — see src/utils/planLimits.ts.
  const tier = await planTier(db, workspaceId);
  const includeChannelAnalytics = tier !== "free";
  const retentionByVideo = new Map<string, number>();

  if (includeChannelAnalytics && videoIds.length) {
    try {
      const endDate = new Date().toISOString().slice(0, 10);
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const analyticsParams = new URLSearchParams({
        ids: "channel==MINE",
        startDate,
        endDate,
        metrics: "averageViewPercentage",
        dimensions: "video",
        filters: `video==${videoIds.join(",")}`,
      });
      const analyticsResponse = await fetch(`https://youtubeanalytics.googleapis.com/v2/reports?${analyticsParams.toString()}`, {
        headers: { authorization: `Bearer ${accessToken}` },
      });
      const analyticsPayload = await analyticsResponse.json();
      if (analyticsResponse.ok) {
        for (const row of analyticsPayload?.rows ?? []) retentionByVideo.set(row[0], Number(row[1] ?? 0));
      }
    } catch {
      // Retention is a bonus metric; a failed analytics call should not fail the whole sync.
    }
  }

  return videos.map((video) => {
    const durationSeconds = parseIsoDuration(video.contentDetails?.duration);
    const isShort = durationSeconds > 0 && durationSeconds <= 60;
    const views = Number(video.statistics?.viewCount ?? 0);
    const likes = Number(video.statistics?.likeCount ?? 0);
    const comments = Number(video.statistics?.commentCount ?? 0);
    return {
      workspace_id: workspaceId,
      social_account_id: accountId,
      platform: "YouTube Shorts",
      title: video.snippet?.title || (isShort ? "YouTube Short" : "YouTube video"),
      caption: video.snippet?.description ? String(video.snippet.description).slice(0, 500) : null,
      content_type: "Video",
      status: "published",
      media_url: video.snippet?.thumbnails?.high?.url ?? video.snippet?.thumbnails?.default?.url ?? null,
      posted_at: video.snippet?.publishedAt ?? null,
      likes,
      comments,
      shares: 0,
      saves: 0,
      reach: views,
      impressions: views,
      engagement_rate: views ? ((likes + comments) / views) * 100 : 0,
      source: "youtube",
      external_post_id: video.id,
      is_short: isShort,
      duration_seconds: durationSeconds,
      retention_rate: includeChannelAnalytics ? (retentionByVideo.get(video.id) ?? null) : null,
    };
  });
}

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

    let posts: any[];
    if (account.platform === "TikTok") posts = await syncTikTok(db, workspaceId, accountId, account);
    else if (account.platform === "YouTube Shorts") posts = await syncYouTube(db, workspaceId, accountId, account);
    else return json({ error: `Sync is not supported for ${account.platform} yet` }, 400);

    if (posts.length) {
      const { error: upsertError } = await db.from("posts").upsert(posts, { onConflict: "workspace_id,platform,external_post_id" });
      if (upsertError) throw upsertError;
    }

    const totalReach = posts.reduce((sum, post) => sum + post.reach, 0);
    const totalEngagement = posts.reduce((sum, post) => sum + post.likes + post.comments + post.shares + post.saves, 0);
    await db.from("analytics_snapshots").insert({
      workspace_id: workspaceId,
      social_account_id: accountId,
      platform: account.platform,
      snapshot_date: new Date().toISOString().slice(0, 10),
      total_posts: posts.length,
      total_reach: totalReach,
      total_impressions: totalReach,
      total_engagement: totalEngagement,
      average_engagement_rate: totalReach ? (totalEngagement / totalReach) * 100 : 0,
    });

    await db.from("social_accounts").update({ last_synced_at: new Date().toISOString() }).eq("id", accountId);
    return json({ syncedPosts: posts.length });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Could not sync social account" }, 500);
  }
});
