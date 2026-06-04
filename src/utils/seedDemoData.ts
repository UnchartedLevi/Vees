import { initialCampaigns, initialIdeas, initialPosts, initialReports } from "../data/mockData";
import { requireSupabase } from "../lib/supabaseClient";
import type { SocialAccount } from "../types";

export async function seedDemoData(workspaceId: string, account: SocialAccount) {
  const db = requireSupabase();
  const { error: claimError } = await db.from("demo_seed_runs").insert({ workspace_id: workspaceId });
  if (claimError?.code === "23505") return;
  if (claimError) throw claimError;

  try {
    const { data: campaigns, error: campaignError } = await db.from("campaigns").insert(initialCampaigns.map((campaign) => ({
      workspace_id: workspaceId,
      name: campaign.name,
      goal: campaign.goal,
      status: campaign.status.toLowerCase(),
      start_date: campaign.startDate,
      end_date: campaign.endDate,
      platforms: campaign.platforms,
    }))).select();
    if (campaignError) throw campaignError;

    const campaignMap = new Map(initialCampaigns.map((campaign, index) => [campaign.id, campaigns?.[index]?.id]));
    const { data: posts, error: postError } = await db.from("posts").insert(initialPosts.map((post) => ({
      workspace_id: workspaceId,
      social_account_id: account.id,
      platform: post.platform,
      title: post.title,
      content_type: post.contentType,
      status: "published",
      content_goal: post.contentGoal,
      posted_at: `${post.datePosted}T${post.postingTime ?? "12:00"}:00Z`,
      likes: post.likes,
      comments: post.comments,
      shares: post.shares,
      saves: post.saves,
      reach: post.reach,
      impressions: post.impressions,
      campaign_id: post.campaignId ? campaignMap.get(post.campaignId) : null,
      engagement_rate: post.reach ? ((post.likes + post.comments + post.shares + post.saves) / post.reach) * 100 : 0,
      source: "demo",
      external_post_id: `demo-${post.id}`,
    }))).select("id,title");
    if (postError) throw postError;

    const { error: ideaError } = await db.from("content_ideas").insert(initialIdeas.map((idea) => ({
      workspace_id: workspaceId,
      title: idea.title,
      platform: idea.platform,
      format: idea.format,
      goal: idea.goal,
      priority: idea.priority,
      status: idea.status,
      notes: idea.notes,
    })));
    if (ideaError) throw ideaError;

    const topPostByTitle = new Map((posts ?? []).map((post) => [post.title, post.id]));
    const { error: reportError } = await db.from("reports").insert(initialReports.map((report) => ({
      workspace_id: workspaceId,
      report_type: report.type.toLowerCase(),
      title: report.title,
      total_posts: report.totalPosts,
      total_reach: report.totalReach,
      total_engagement: report.totalEngagement,
      average_engagement_rate: report.averageEngagementRate,
      top_post_id: topPostByTitle.get(report.topPost),
      recommendations: report.recommendations,
    })));
    if (reportError) throw reportError;

    const { error: snapshotError } = await db.from("analytics_snapshots").insert({
      workspace_id: workspaceId,
      social_account_id: account.id,
      platform: account.platform,
      snapshot_date: new Date().toISOString().slice(0, 10),
      followers: 4280,
      total_posts: initialPosts.length,
      total_reach: 198300,
      total_impressions: 266900,
      total_engagement: 16100,
      average_engagement_rate: 8.2,
    });
    if (snapshotError) throw snapshotError;
  } catch (error) {
    await Promise.all([
      db.from("analytics_snapshots").delete().eq("workspace_id", workspaceId).eq("social_account_id", account.id),
      db.from("reports").delete().eq("workspace_id", workspaceId).in("title", initialReports.map(({ title }) => title)),
      db.from("content_ideas").delete().eq("workspace_id", workspaceId).in("title", initialIdeas.map(({ title }) => title)),
      db.from("posts").delete().eq("workspace_id", workspaceId).eq("source", "demo"),
      db.from("campaigns").delete().eq("workspace_id", workspaceId).in("name", initialCampaigns.map(({ name }) => name)),
    ]);
    await db.from("demo_seed_runs").delete().eq("workspace_id", workspaceId);
    throw error;
  }
}
