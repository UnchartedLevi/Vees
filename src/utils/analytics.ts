import type { Post } from "../types";

export const engagementTotal = (post: Post) => post.likes + post.comments + post.shares + post.saves;
export const engagementRate = (post: Post) => post.reach ? (engagementTotal(post) / post.reach) * 100 : 0;
export const formatNumber = (value: number) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
export const insightForPost = (post: Post) => {
  if (post.saves > 250) return "Good save rate";
  if (engagementRate(post) >= 9) return "Strong engagement";
  if (post.reach > 20000 && engagementRate(post) < 8) return "High reach, low interaction";
  return "Needs better hook";
};
