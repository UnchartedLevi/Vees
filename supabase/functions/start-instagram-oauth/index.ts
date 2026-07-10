import { assertWorkspaceMember, authenticatedUser, corsHeaders, instagramScopes, json, redirectUri, requireEnv, serviceClient, sha256 } from "../_shared/instagram.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authorization = request.headers.get("authorization");
    if (!authorization) return json({ error: "Missing authorization header" }, 401);

    const { workspaceId, importMode = "from_today" } = await request.json();
    if (!workspaceId) return json({ error: "workspaceId is required" }, 400);

    const db = serviceClient();
    const { user } = await authenticatedUser(authorization);
    if (!(await assertWorkspaceMember(db, workspaceId, user.id))) return json({ error: "Workspace not found" }, 404);

    const state = crypto.randomUUID();
    const stateHash = await sha256(state);
    await db.from("oauth_states").delete().eq("provider", "instagram").eq("workspace_id", workspaceId).eq("user_id", user.id);
    const { error: stateError } = await db.from("oauth_states").insert({
      workspace_id: workspaceId,
      user_id: user.id,
      provider: "instagram",
      state_hash: stateHash,
      import_mode: importMode,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    if (stateError) throw stateError;

    const params = new URLSearchParams({
      client_id: requireEnv("INSTAGRAM_CLIENT_ID"),
      response_type: "code",
      scope: instagramScopes.join(","),
      redirect_uri: redirectUri(request),
      state,
    });

    return json({ authorizeUrl: `https://www.instagram.com/oauth/authorize?${params.toString()}` });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Could not start Instagram OAuth" }, 500);
  }
});
