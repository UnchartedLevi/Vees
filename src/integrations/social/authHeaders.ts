import type { SupabaseClient } from "@supabase/supabase-js";

export async function authHeaders(db: SupabaseClient) {
  const { data: refreshed, error: refreshError } = await db.auth.refreshSession();
  if (refreshError) {
    const { data } = await db.auth.getSession();
    if (!data.session) throw new Error("Your Vees session expired. Sign out, sign back in, then connect this account again.");
  }

  const { data, error } = await db.auth.getSession();
  if (error) throw error;
  if (!data.session?.access_token) {
    throw new Error("Your Vees session expired. Sign out, sign back in, then connect this account again.");
  }

  const accessToken = refreshed.session?.access_token ?? data.session.access_token;
  return { Authorization: `Bearer ${accessToken}` };
}
