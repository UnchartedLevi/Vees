import { corsHeaders, decryptToken, encryptToken, json, requireEnv, serviceClient, userClient } from "../_shared/tiktok.ts";

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
    const posts = videos.map((video) => {
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

    if (posts.length) {
      const { error: upsertError } = await db.from("posts").upsert(posts, { onConflict: "workspace_id,platform,external_post_id" });
      if (upsertError) throw upsertError;
    }

    const totalReach = posts.reduce((sum, post) => sum + post.reach, 0);
    const totalEngagement = posts.reduce((sum, post) => sum + post.likes + post.comments + post.shares + post.saves, 0);
    await db.from("analytics_snapshots").insert({
      workspace_id: workspaceId,
      social_account_id: accountId,
      platform: "TikTok",
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
    return json({ error: error instanceof Error ? error.message : "Could not sync TikTok account" }, 500);
  }
});
