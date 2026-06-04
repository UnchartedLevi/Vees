import type { Campaign, ContentIdea, Post, Report, ScheduledPost, Workspace } from "../types";

export const platforms = ["Instagram", "TikTok", "LinkedIn", "X", "Facebook"] as const;
export const contentTypes = ["Reel", "Carousel", "Image", "Text", "Story", "Video"] as const;

export const initialWorkspace: Workspace = {
  id: "workspace-valerie",
  brandName: "Valerie",
  industry: "Personal brand and lifestyle",
  targetAudience: "Ambitious professionals and creators who want practical, calm growth strategies.",
  mainPlatforms: ["Instagram", "LinkedIn", "TikTok"],
  contentGoals: ["Grow engaged audience", "Build trust", "Increase reach"],
  toneOfVoice: "Warm, clear, practical, optimistic",
};

export const initialPosts: Post[] = [
  ["p1", "Behind the scenes: campaign day", "Instagram", "Reel", "2026-05-28", 1240, 86, 151, 298, 18400, 25600, "c1", "Build trust", "18:30"],
  ["p2", "5 lessons from this month's launch", "LinkedIn", "Carousel", "2026-05-26", 684, 72, 105, 188, 9800, 13300, "c1", "Drive saves", "09:00"],
  ["p3", "Quick desk reset before filming", "TikTok", "Reel", "2026-05-23", 2130, 94, 220, 116, 36700, 44200, "c2", "Increase reach", "19:15"],
  ["p4", "Monday mindset note", "X", "Text", "2026-05-19", 174, 38, 49, 11, 7600, 9100, undefined, "Start conversations", "08:30"],
  ["p5", "How I plan a content week", "Instagram", "Carousel", "2026-05-16", 908, 54, 96, 332, 14200, 20100, "c2", "Drive saves", "18:00"],
  ["p6", "A small win worth celebrating", "LinkedIn", "Text", "2026-05-12", 438, 67, 31, 42, 5900, 7100, undefined, "Build trust", "10:00"],
  ["p7", "Three things I stopped overthinking", "Instagram", "Image", "2026-05-09", 510, 46, 24, 76, 11300, 16000, undefined, "Build trust", "17:45"],
  ["p8", "The two-minute content planning trick", "TikTok", "Video", "2026-05-06", 1760, 81, 147, 89, 28900, 35100, "c2", "Increase reach", "20:00"],
  ["p9", "What clients actually ask before buying", "LinkedIn", "Carousel", "2026-05-02", 732, 93, 78, 155, 8400, 11900, "c3", "Generate leads", "09:15"],
  ["p10", "Friday check-in: what are you building?", "X", "Text", "2026-04-30", 198, 56, 37, 9, 6900, 8800, undefined, "Start conversations", "16:30"],
  ["p11", "A calmer morning workflow", "Facebook", "Image", "2026-04-27", 355, 41, 67, 29, 7200, 10500, undefined, "Build trust", "07:45"],
  ["p12", "One lesson from a failed draft", "Instagram", "Reel", "2026-04-24", 1010, 74, 121, 204, 15800, 21900, "c1", "Build trust", "19:00"],
  ["p13", "Your content does not need to be perfect", "Facebook", "Text", "2026-04-21", 288, 63, 45, 18, 6400, 9200, undefined, "Start conversations", "18:15"],
  ["p14", "A simple brand voice checklist", "LinkedIn", "Carousel", "2026-04-18", 603, 48, 64, 147, 7900, 10100, "c3", "Drive saves", "08:45"],
  ["p15", "Three hooks to try this week", "Instagram", "Carousel", "2026-04-14", 840, 59, 101, 251, 12900, 17600, "c3", "Drive saves", "18:45"],
].map(([id, title, platform, contentType, datePosted, likes, comments, shares, saves, reach, impressions, campaignId, contentGoal, postingTime]) => ({ id, title, platform, contentType, datePosted, likes, comments, shares, saves, reach, impressions, campaignId, contentGoal, postingTime } as Post));

export const initialScheduledPosts: ScheduledPost[] = [
  ["s1", "Three creator habits to keep", "Instagram", "Carousel", "2026-06-03", "Scheduled", "c2", "Drive saves"],
  ["s2", "Workspace tour: tiny upgrades", "TikTok", "Reel", "2026-06-05", "Approved", "c2", "Increase reach"],
  ["s3", "Ask me anything: content edition", "Instagram", "Story", "2026-06-06", "Scheduled", undefined, "Start conversations"],
  ["s4", "A note on sustainable growth", "LinkedIn", "Text", "2026-06-07", "Draft", "c3", "Build trust"],
  ["s5", "How to find a useful content angle", "LinkedIn", "Carousel", "2026-06-10", "In Review", "c3", "Drive saves"],
  ["s6", "One-minute filming setup", "TikTok", "Video", "2026-06-12", "Idea", "c2", "Increase reach"],
  ["s7", "What I learned this month", "Facebook", "Text", "2026-06-14", "Approved", undefined, "Build trust"],
  ["s8", "The best advice I ignored", "Instagram", "Reel", "2026-06-16", "Draft", "c1", "Build trust"],
].map(([id, title, platform, contentType, scheduledDate, status, campaignId, contentGoal]) => ({ id, title, platform, contentType, scheduledDate, status, campaignId, contentGoal } as ScheduledPost));

export const initialIdeas: ContentIdea[] = [
  ["i1", "A week in the life of a content planner", "Instagram", "Reel", "Build trust", "High", "Ready", "Keep it candid and practical."],
  ["i2", "What I would do differently starting over", "LinkedIn", "Carousel", "Drive saves", "High", "Backlog", "Use five clear lessons."],
  ["i3", "Three tools making my workflow calmer", "TikTok", "Video", "Increase reach", "Medium", "Ready", "Fast cuts, simple captions."],
  ["i4", "Friday audience question box", "Instagram", "Story", "Start conversations", "Low", "Backlog", "Ask about planning blockers."],
  ["i5", "The myth of posting every day", "LinkedIn", "Text", "Build trust", "Medium", "Backlog", "Share a measured point of view."],
  ["i6", "Before and after: my weekly plan", "Instagram", "Carousel", "Drive saves", "High", "Ready", "Use a checklist on the final slide."],
  ["i7", "A lesson from an awkward first draft", "TikTok", "Reel", "Build trust", "Medium", "Backlog", "Tell a compact story."],
  ["i8", "Three questions to ask before posting", "Facebook", "Text", "Start conversations", "Low", "Backlog", "Invite audience answers."],
  ["i9", "What a calm content system looks like", "Instagram", "Image", "Build trust", "Medium", "Ready", "Use a desk photo with a useful caption."],
  ["i10", "Small brand, strong voice", "X", "Text", "Build trust", "Low", "Backlog", "Turn into a short thread."],
].map(([id, title, platform, format, goal, priority, status, notes]) => ({ id, title, platform, format, goal, priority, status, notes } as ContentIdea));

export const initialCampaigns: Campaign[] = [
  { id: "c1", name: "Build in Public", goal: "Build audience trust through honest process content.", startDate: "2026-04-20", endDate: "2026-06-20", platforms: ["Instagram", "LinkedIn"], attachedPostIds: ["p1", "p2", "p12"], status: "Active" },
  { id: "c2", name: "Calm Creator Systems", goal: "Grow reach with practical workflow content.", startDate: "2026-05-01", endDate: "2026-06-30", platforms: ["Instagram", "TikTok"], attachedPostIds: ["p3", "p5", "p8"], status: "Active" },
  { id: "c3", name: "Personal Brand Essentials", goal: "Create saveable brand education posts.", startDate: "2026-04-01", endDate: "2026-05-31", platforms: ["LinkedIn", "Instagram"], attachedPostIds: ["p9", "p14", "p15"], status: "Completed" },
];

export const initialReports: Report[] = [
  { id: "r1", type: "Weekly", title: "Weekly content pulse", dateRange: "May 22 - May 28, 2026", totalPosts: 3, totalReach: 64900, totalEngagement: 4924, averageEngagementRate: 8.1, topPost: "Quick desk reset before filming", recommendations: ["Turn the campaign-day Reel into a carousel.", "Keep publishing practical evening Reels."] },
  { id: "r2", type: "Monthly", title: "May performance review", dateRange: "May 1 - May 31, 2026", totalPosts: 9, totalReach: 138800, totalEngagement: 10090, averageEngagementRate: 8.2, topPost: "Quick desk reset before filming", recommendations: ["Instagram is the most reliable channel.", "Use more saveable carousel formats."] },
  { id: "r3", type: "Campaign", title: "Calm Creator Systems review", dateRange: "May 1 - Jun 30, 2026", totalPosts: 3, totalReach: 79800, totalEngagement: 6820, averageEngagementRate: 8.4, topPost: "Quick desk reset before filming", recommendations: ["Continue the practical Reel series.", "Turn the workflow topic into a LinkedIn carousel."] },
];

export const engagementTrend = [42, 58, 47, 70, 62, 86, 78].map((value, index) => ({ label: `Week ${index + 1}`, value }));
