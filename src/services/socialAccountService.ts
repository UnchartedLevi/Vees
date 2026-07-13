import type { ImportMode, SocialAccount, SocialPlatform } from "../types";
import { requireSupabase } from "../lib/supabaseClient";
import { mapAccount, mapSnapshot } from "./mappers";

// Keep the browser query compatible with databases created before the TikTok
// connector migration added social_accounts.scopes. Edge functions can still
// write scopes after supabase/tiktok-schema.sql is applied.
const accountColumns = "id,workspace_id,platform,account_name,account_handle,connection_status,import_mode,last_synced_at,provider_meta";

export async function getSocialAccounts(workspaceId: string) {
  const { data, error } = await requireSupabase().from("social_accounts").select(accountColumns).eq("workspace_id", workspaceId);
  if (error) throw error;
  return (data ?? []).map(mapAccount);
}

export async function createSocialAccount(workspaceId: string, input: { platform: SocialPlatform; accountName: string; accountHandle: string; importMode: ImportMode }) {
  const db = requireSupabase();
  const match = () => db.from("social_accounts").select(accountColumns).eq("workspace_id", workspaceId).eq("platform", input.platform).eq("account_handle", input.accountHandle).maybeSingle();
  const { data: existing, error: findError } = await match();
  if (findError) throw findError;
  const values = { account_name: input.accountName, import_mode: input.importMode, connection_status: "connected", last_synced_at: new Date().toISOString() };
  if (existing) {
    const { data, error } = await db.from("social_accounts").update(values).eq("workspace_id", workspaceId).eq("id", existing.id).select(accountColumns).single();
    if (error) throw error;
    return mapAccount(data);
  }
  const { data, error } = await db.from("social_accounts").insert({ workspace_id: workspaceId, platform: input.platform, account_handle: input.accountHandle, ...values }).select(accountColumns).single();
  if (!error) return mapAccount(data);
  if (error.code !== "23505") throw error;
  const { data: concurrent, error: concurrentError } = await match();
  if (concurrentError) throw concurrentError;
  if (!concurrent) throw error;
  return mapAccount(concurrent);
}

export async function disconnectSocialAccount(workspaceId: string, accountId: string) {
  const { error } = await requireSupabase()
    .from("social_accounts")
    .update({ connection_status: "disconnected" })
    .eq("workspace_id", workspaceId)
    .eq("id", accountId);
  if (error) throw error;
}

export async function getSnapshots(workspaceId: string) {
  const { data, error } = await requireSupabase().from("analytics_snapshots").select("*").eq("workspace_id", workspaceId);
  if (error) throw error;
  return (data ?? []).map(mapSnapshot);
}
