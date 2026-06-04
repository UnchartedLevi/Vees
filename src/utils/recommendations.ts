import type { ContentIdea, ContentType, Post, Recommendation, ScheduledPost, SocialPlatform } from "../types";
import { engagementRate, engagementTotal } from "./analytics";
import { addDays, toDateKey } from "./dates";

export const getAverageEngagementRate = (posts: Post[]) => posts.length ? posts.reduce((sum, post) => sum + engagementRate(post), 0) / posts.length : 0;
export const getTotalEngagement = (posts: Post[]) => posts.reduce((sum, post) => sum + engagementTotal(post), 0);
export const getTopPosts = (posts: Post[], limit = 3) => [...posts].sort((a, b) => engagementTotal(b) - engagementTotal(a)).slice(0, limit);
const pendingStatuses = new Set(["Approved", "Scheduled"]);
export const getScheduledPostsThisWeek = (posts: ScheduledPost[], today = new Date()) => {
  const start = toDateKey(today); const end = toDateKey(addDays(today, 6));
  return posts.filter((post) => pendingStatuses.has(post.status) && post.scheduledDate >= start && post.scheduledDate <= end);
};

const bestGroup = <T extends string>(posts: Post[], select: (post: Post) => T) => {
  const groups = posts.reduce<Record<string, Post[]>>((acc, post) => ({ ...acc, [select(post)]: [...(acc[select(post)] ?? []), post] }), {});
  return Object.entries(groups).sort(([, a], [, b]) => getAverageEngagementRate(b) - getAverageEngagementRate(a))[0]?.[0] as T | undefined;
};

export const getBestPlatform = (posts: Post[]) => bestGroup<SocialPlatform>(posts, (post) => post.platform) ?? "No data yet";
export const getBestContentType = (posts: Post[]) => bestGroup<ContentType>(posts, (post) => post.contentType) ?? "No data yet";
export const getBestPostingDay = (posts: Post[]) => {
  const day = bestGroup(posts, (post) => new Date(`${post.datePosted}T12:00:00`).toLocaleDateString("en-US", { weekday: "long" }));
  return day ?? "No data yet";
};
export const getBestPostingPeriod = (posts: Post[]) => {
  const periods = posts.map((post) => Number(post.postingTime?.slice(0, 2))).filter((hour) => Number.isFinite(hour)).map((hour) => hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening");
  const counts = periods.reduce<Record<string, number>>((acc, period) => ({ ...acc, [period]: (acc[period] ?? 0) + 1 }), {});
  return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "not established yet";
};

export const generateRecommendations = (posts: Post[], scheduled: ScheduledPost[], ideas: ContentIdea[], today = new Date()): Recommendation[] => {
  const bestPlatform = getBestPlatform(posts);
  const bestType = getBestContentType(posts);
  const nextWeekStart = toDateKey(addDays(today, 7)); const nextWeekEnd = toDateKey(addDays(today, 13));
  const nextWeek = scheduled.filter((post) => pendingStatuses.has(post.status) && post.scheduledDate >= nextWeekStart && post.scheduledDate <= nextWeekEnd);
  const bestPeriod = getBestPostingPeriod(posts);
  if (!posts.length) return [
    { id: "rec-track", title: "Track your first published post.", detail: "Add performance manually or import demo history to unlock analytics recommendations.", type: "planning" },
    { id: "rec-plan", title: nextWeek.length ? `${nextWeek.length} ${nextWeek.length === 1 ? "post is" : "posts are"} planned for next week.` : "You have no posts scheduled for next week.", detail: ideas.length ? "Convert a ready content idea into your calendar." : "Add a few ideas to build your pipeline.", type: "planning" },
  ];
  return [
    { id: "rec-platform", title: `Your best performing platform is ${bestPlatform}.`, detail: "Prioritize proven formats there while testing one new angle.", type: "performance" },
    { id: "rec-format", title: `${bestType}s are leading your content mix.`, detail: "Repurpose your strongest topic into this format next.", type: "growth" },
    { id: "rec-time", title: `Your publishing rhythm is strongest in the ${bestPeriod}.`, detail: "Use this as a starting point and keep testing your audience response.", type: "performance" },
    { id: "rec-plan", title: nextWeek.length ? `${nextWeek.length} ${nextWeek.length === 1 ? "post is" : "posts are"} planned for next week.` : "You have no posts scheduled for next week.", detail: ideas.length ? "Convert a ready content idea into your calendar." : "Add a few ideas to build your pipeline.", type: "planning" },
  ];
};
