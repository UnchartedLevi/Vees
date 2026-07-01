import type { PlanTier } from "../types";

const FEATURES = {
  youtubeChannelAnalytics: ["pro", "agency"],
} as const;

export function hasFeature(planTier: PlanTier | string | undefined, feature: keyof typeof FEATURES) {
  return (FEATURES[feature] as readonly string[]).includes(planTier ?? "free");
}
