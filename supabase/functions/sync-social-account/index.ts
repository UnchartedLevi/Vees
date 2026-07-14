import { corsHeaders, decryptToken, encryptToken, json, requireEnv, serviceClient, userClient } from "../_shared/tiktok.ts";
import { decryptToken as decryptInstagramToken } from "../_shared/instagram.ts";
import {
  decryptToken as decryptYouTubeToken,
  encryptToken as encryptYouTubeToken,
  planTier,
  requireEnv as requireYouTubeEnv,
} from "../_shared/youtube.ts";
import { clientAuthHeader as xClientAuthHeader, decryptToken as decryptXToken, encryptToken as encryptXToken, requireEnv as requireXEnv } from "../_shared/x.ts";

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
      external_url: video.share_url ?? null,
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
  let thumbnailUrl = account.provider_meta?.thumbnailUrl as string | undefined;
  if (!uploadsPlaylistId || !thumbnailUrl) {
    const channelResponse = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&mine=true", {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    const channelPayload = await channelResponse.json();
    if (!channelResponse.ok) throw new Error(channelPayload.error?.message ?? "Could not read the YouTube channel.");
    const channel = channelPayload?.items?.[0];
    uploadsPlaylistId = uploadsPlaylistId ?? channel?.contentDetails?.relatedPlaylists?.uploads;
    const thumbnails = channel?.snippet?.thumbnails ?? {};
    thumbnailUrl = thumbnailUrl ?? thumbnails.high?.url ?? thumbnails.medium?.url ?? thumbnails.default?.url;
    if (uploadsPlaylistId || thumbnailUrl) {
      await db.from("social_accounts").update({
        provider_meta: { ...(account.provider_meta ?? {}), uploadsPlaylistId, thumbnailUrl },
      }).eq("id", accountId);
    }
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
  // and are only fetched for workspaces on a paid plan - see src/utils/planLimits.ts.
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
      external_url: video.id ? `https://www.youtube.com/watch?v=${video.id}` : null,
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

async function refreshXAccessToken(db: Db, account: any) {
  const refreshToken = await decryptXToken(account.refresh_token_encrypted);
  if (!refreshToken) throw new Error("X account is missing a refresh token.");
  const response = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      authorization: xClientAuthHeader(),
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: requireXEnv("X_CLIENT_ID"),
    }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error_description ?? payload.error ?? "X token refresh failed.");
  await db.from("social_accounts").update({
    access_token_encrypted: await encryptXToken(payload.access_token),
    refresh_token_encrypted: await encryptXToken(payload.refresh_token ?? refreshToken),
    token_expires_at: new Date(Date.now() + Number(payload.expires_in ?? 0) * 1000).toISOString(),
  }).eq("id", account.id);
  return payload.access_token as string;
}

async function syncX(db: Db, workspaceId: string, accountId: string, account: any) {
  let accessToken = await decryptXToken(account.access_token_encrypted);
  if (!accessToken || (account.token_expires_at && new Date(account.token_expires_at).getTime() < Date.now() + 60_000)) {
    accessToken = await refreshXAccessToken(db, account);
  }

  const userResponse = await fetch("https://api.x.com/2/users/me?user.fields=profile_image_url,username,name", {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  const userPayload = await userResponse.json();
  if (!userResponse.ok) throw new Error(userPayload.detail ?? userPayload.title ?? "Could not read the X profile.");
  const user = userPayload?.data ?? {};
  const providerAccountId = String(user.id ?? account.provider_account_id ?? "");
  const username = String(user.username ?? account.provider_meta?.username ?? "");
  const profileImageUrl = user.profile_image_url ?? account.provider_meta?.profilePictureUrl ?? null;

  await db.from("social_accounts").update({
    account_name: user.name ?? account.account_name,
    account_handle: username ? `@${username}` : account.account_handle,
    provider_account_id: providerAccountId || account.provider_account_id,
    provider_meta: { ...(account.provider_meta ?? {}), username, thumbnailUrl: profileImageUrl, profilePictureUrl: profileImageUrl },
  }).eq("id", accountId);

  if (!providerAccountId) throw new Error("X account id is unavailable. Reconnect X and try again.");

  const tweetParams = new URLSearchParams({
    max_results: "100",
    "tweet.fields": "created_at,public_metrics,entities",
    exclude: "retweets,replies",
  });
  const tweetResponse = await fetch(`https://api.x.com/2/users/${providerAccountId}/tweets?${tweetParams.toString()}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  const tweetPayload = await tweetResponse.json();
  if (!tweetResponse.ok) throw new Error(tweetPayload.detail ?? tweetPayload.title ?? "X post sync failed.");

  const tweets: any[] = tweetPayload?.data ?? [];
  return tweets.map((tweet) => {
    const metrics = tweet.public_metrics ?? {};
    const impressions = Number(metrics.impression_count ?? 0);
    const likes = Number(metrics.like_count ?? 0);
    const comments = Number(metrics.reply_count ?? 0);
    const shares = Number(metrics.retweet_count ?? 0) + Number(metrics.quote_count ?? 0);
    const saves = Number(metrics.bookmark_count ?? 0);
    const totalEngagement = likes + comments + shares + saves;
    return {
      workspace_id: workspaceId,
      social_account_id: accountId,
      platform: "X",
      title: tweet.text ? String(tweet.text).slice(0, 120) : "X post",
      caption: tweet.text ? String(tweet.text).slice(0, 500) : null,
      content_type: "Text",
      status: "published",
      media_url: null,
      external_url: username ? `https://x.com/${username}/status/${tweet.id}` : null,
      posted_at: tweet.created_at ?? null,
      likes,
      comments,
      shares,
      saves,
      reach: impressions,
      impressions,
      engagement_rate: impressions ? (totalEngagement / impressions) * 100 : 0,
      source: "x",
      external_post_id: tweet.id,
    };
  });
}
async function readInstagramProfile(accessToken: string) {
  const load = async (fields: string) => {
    const response = await fetch(`https://graph.instagram.com/me?fields=${encodeURIComponent(fields)}&access_token=${accessToken}`);
    const payload = await response.json();
    return { ok: response.ok, payload };
  };

  const withPicture = await load("id,username,account_type,media_count,profile_picture_url");
  if (withPicture.ok) return withPicture.payload;

  const fallback = await load("id,username,account_type,media_count");
  if (!fallback.ok) throw new Error(fallback.payload.error?.message ?? "Could not read the Instagram profile before sync.");
  return fallback.payload;
}

async function syncInstagram(db: Db, workspaceId: string, accountId: string, account: any) {
  const accessToken = await decryptInstagramToken(account.access_token_encrypted);
  if (!accessToken) throw new Error("Instagram account is missing an access token.");

  // Long-lived Instagram tokens last 60 days; refresh once inside the last 5 days of validity.
  if (account.token_expires_at && new Date(account.token_expires_at).getTime() < Date.now() + 5 * 24 * 60 * 60 * 1000) {
    const refreshResponse = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`);
    const refreshPayload = await refreshResponse.json();
    if (refreshResponse.ok && refreshPayload.access_token) {
      await db.from("social_accounts").update({
        access_token_encrypted: await encryptInstagramToken(refreshPayload.access_token),
        token_expires_at: new Date(Date.now() + Number(refreshPayload.expires_in ?? 60 * 24 * 60 * 60) * 1000).toISOString(),
      }).eq("id", accountId);
    }
  }

  const currentToken = (await decryptInstagramToken((await db.from("social_accounts").select("access_token_encrypted").eq("id", accountId).single()).data?.access_token_encrypted)) ?? accessToken;

  const profilePayload = await readInstagramProfile(currentToken);
  if (profilePayload.profile_picture_url) {
    await db.from("social_accounts").update({
      account_name: profilePayload.username ?? account.account_name,
      account_handle: profilePayload.username ? `@${profilePayload.username}` : account.account_handle,
      provider_meta: {
        ...(account.provider_meta ?? {}),
        accountType: profilePayload.account_type ?? account.provider_meta?.accountType ?? null,
        profilePictureUrl: profilePayload.profile_picture_url,
        thumbnailUrl: profilePayload.profile_picture_url,
      },
    }).eq("id", accountId);
  }

  const mediaFields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count";
  const media: any[] = [];
  let mediaUrl: string | undefined = `https://graph.instagram.com/me/media?fields=${encodeURIComponent(mediaFields)}&limit=100&access_token=${currentToken}`;

  for (let page = 0; mediaUrl && page < 10; page += 1) {
    const mediaResponse = await fetch(mediaUrl);
    const mediaPayload = await mediaResponse.json();
    if (!mediaResponse.ok) throw new Error(mediaPayload.error?.message ?? "Instagram media sync failed.");
    media.push(...(mediaPayload?.data ?? []));
    mediaUrl = mediaPayload?.paging?.next;
  }

  if (!media.length && Number(profilePayload.media_count ?? 0) > 0) {
    throw new Error(`Instagram returned 0 media for @${profilePayload.username ?? account.account_handle}, but the profile reports ${profilePayload.media_count} posts. Reconnect Instagram and approve media access again.`);
  }

  // Reach, saved, and shares come from a separate Insights call per media item and are only
  // fetched on paid plans - see src/utils/planLimits.ts. Free plans get like/comment counts,
  // which are already included on the media object above at no extra API cost.
  const tier = await planTier(db, workspaceId);
  const includeInsights = tier !== "free";
  const insightsByMedia = new Map<string, { reach: number; saved: number; shares: number; views: number; totalInteractions: number }>();
  const insightDiagnostics: Array<{ mediaId: string; metric: string; status: number; error?: string; value?: number }> = [];

  if (includeInsights) {
    await Promise.all(media.map(async (item) => {
      const values: Record<string, number> = {};
      const metrics = ["reach", "views", "saved", "saves", "shares", "total_interactions"];

      for (const metric of metrics) {
        try {
          const insightsResponse = await fetch(`https://graph.instagram.com/${item.id}/insights?metric=${metric}&access_token=${currentToken}`);
          const insightsPayload = await insightsResponse.json();
          if (!insightsResponse.ok) {
            if (insightDiagnostics.length < 30) {
              insightDiagnostics.push({
                mediaId: item.id,
                metric,
                status: insightsResponse.status,
                error: insightsPayload.error?.message ?? "Metric unavailable",
              });
            }
            continue;
          }
          for (const entry of insightsPayload?.data ?? []) {
            const value = Number(entry.values?.[0]?.value ?? 0);
            values[entry.name] = value;
            if (insightDiagnostics.length < 30) {
              insightDiagnostics.push({ mediaId: item.id, metric: entry.name, status: insightsResponse.status, value });
            }
          }
        } catch {
          // Individual metrics vary by media type and API version. Keep the sync resilient.
          if (insightDiagnostics.length < 30) {
            insightDiagnostics.push({ mediaId: item.id, metric, status: 0, error: "Metric request failed" });
          }
        }
      }

      insightsByMedia.set(item.id, {
        reach: values.reach ?? values.views ?? 0,
        saved: values.saved ?? values.saves ?? 0,
        shares: values.shares ?? 0,
        views: values.views ?? 0,
        totalInteractions: values.total_interactions ?? 0,
      });
    }));

    await db.from("social_accounts").update({
      provider_meta: {
        ...(account.provider_meta ?? {}),
        lastInsightSync: {
          checkedAt: new Date().toISOString(),
          mediaCount: media.length,
          diagnostics: insightDiagnostics,
        },
      },
    }).eq("id", accountId);
  }

  const captionTypeMap: Record<string, string> = { IMAGE: "Image", VIDEO: "Video", CAROUSEL_ALBUM: "Carousel", REELS: "Reel" };
  return media.map((item) => {
    const likes = Number(item.like_count ?? 0);
    const comments = Number(item.comments_count ?? 0);
    const insight = insightsByMedia.get(item.id);
    const reach = insight?.reach ?? 0;
    const shares = insight?.shares ?? 0;
    const saves = insight?.saved ?? 0;
    const totalInteractions = insight?.totalInteractions ?? likes + comments + shares + saves;
    return {
      workspace_id: workspaceId,
      social_account_id: accountId,
      platform: "Instagram",
      title: item.caption ? String(item.caption).slice(0, 120) : "Instagram post",
      caption: item.caption ? String(item.caption).slice(0, 500) : null,
      content_type: captionTypeMap[item.media_type] ?? "Image",
      status: "published",
      media_url: item.thumbnail_url ?? item.media_url ?? null,
      external_url: item.permalink ?? null,
      posted_at: item.timestamp ?? null,
      likes,
      comments,
      shares,
      saves,
      reach,
      impressions: insight?.views ?? reach,
      engagement_rate: reach ? (totalInteractions / reach) * 100 : 0,
      source: "instagram",
      external_post_id: item.id,
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
    else if (account.platform === "Instagram") posts = await syncInstagram(db, workspaceId, accountId, account);
    else if (account.platform === "X") posts = await syncX(db, workspaceId, accountId, account);
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

