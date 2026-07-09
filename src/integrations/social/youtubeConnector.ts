import { requireSupabase } from "../../lib/supabaseClient";
import type { ImportMode, SocialAccount } from "../../types";
import { authHeaders } from "./authHeaders";
import { readableFunctionError } from "./functionErrors";
import type { SocialConnector } from "./types";

export const youtubeConnector: SocialConnector = {
  platform: "YouTube Shorts",
  async connect(workspaceId: string, input?: { importMode?: ImportMode }) {
    const db = requireSupabase();
    const { data, error } = await db.functions.invoke<{ authorizeUrl: string }>("start-youtube-oauth", {
      body: { workspaceId, importMode: input?.importMode ?? "from_today" },
      headers: await authHeaders(db),
    });
    if (error) throw new Error(await readableFunctionError(error, "YouTube connection could not start."));
    if (!data?.authorizeUrl) throw new Error("YouTube authorization URL was not returned.");
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
    const db = requireSupabase();
    const { error } = await db.functions.invoke("sync-social-account", {
      body: { workspaceId: account.workspaceId, accountId: account.id },
      headers: await authHeaders(db),
    });
    if (error) throw new Error(await readableFunctionError(error, "YouTube sync failed."));
  },
  async syncAnalytics(account) {
    await this.syncPosts(account);
  },
};
