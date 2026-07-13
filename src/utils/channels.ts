import type { SocialAccount, SocialPlatform } from "../types";
import { platforms } from "../data/options";

export const platformLabel = (platform: SocialPlatform) => platform === "YouTube Shorts" ? "YouTube" : platform;

export function connectedPlatforms(accounts: SocialAccount[]) {
  return [...new Set(accounts.filter((account) => account.connectionStatus === "connected").map((account) => account.platform))];
}

export function orderedPlatforms(accounts: SocialAccount[]) {
  const connected = connectedPlatforms(accounts);
  return [...connected, ...platforms.filter((platform) => !connected.includes(platform))];
}

export function accountForPlatform(accounts: SocialAccount[], platform: SocialPlatform) {
  return accounts.find((account) => account.platform === platform && account.connectionStatus === "connected");
}
