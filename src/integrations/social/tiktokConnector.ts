import { requireSupabase } from "../../lib/supabaseClient";
import type { ImportMode, SocialAccount } from "../../types";
import type { SocialConnector } from "./types";

export const tiktokConnector: SocialConnector = {
  platform: "TikTok",
  async connect(workspaceId: string, input?: { importMode?: ImportMode }) {
    const { data, error } = await requireSupabase().functions.invoke<{ authorizeUrl: string }>("start-tiktok-oauth", {
      body: { workspaceId, importMode: input?.importMode ?? "from_today" },
    });
    if (error) throw error;
    if (!data?.authorizeUrl) throw new Error("TikTok authorization URL was not returned.");
    window.location.assign(data.authorizeUrl);
    return new Promise<SocialAccount>(() => undefined);
  },
  async disconnect(workspaceId, accountId) {
    const { error } = await requireSupabase().from("social_accounts").update({ connection_status: "disconnected" }).eq("workspace_id", workspaceId).eq("id", accountId);
    if (error) throw error;
  },
  async syncAccount(account) {
    await this.syncPosts(account);
  },
  async syncPosts(account) {
    const { error } = await requireSupabase().functions.invoke("sync-social-account", {
      body: { workspaceId: account.workspaceId, accountId: account.id },
    });
    if (error) throw error;
  },
  async syncAnalytics(account) {
    await this.syncPosts(account);
  },
};
