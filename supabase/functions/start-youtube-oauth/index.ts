import { corsHeaders, json, redirectUri, requireEnv, serviceClient, sha256, userClient, youtubeScopes } from "../_shared/youtube.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authorization = request.headers.get("authorization");
    if (!authorization) return json({ error: "Missing authorization header" }, 401);

    const { workspaceId, importMode = "from_today" } = await request.json();
    if (!workspaceId) return json({ error: "workspaceId is required" }, 400);

    const userDb = userClient(authorization);
    const { data: { user }, error: userError } = await userDb.auth.getUser();
    if (userError || !user) return json({ error: "Invalid user session" }, 401);

    const { data: workspace, error: workspaceError } = await userDb.from("workspaces").select("id").eq("id", workspaceId).single();
    if (workspaceError || !workspace) return json({ error: "Workspace not found" }, 404);

    const state = crypto.randomUUID();
    const stateHash = await sha256(state);
    const db = serviceClient();
    await db.from("oauth_states").delete().eq("provider", "youtube").eq("workspace_id", workspaceId).eq("user_id", user.id);
    const { error: stateError } = await db.from("oauth_states").insert({
      workspace_id: workspaceId,
      user_id: user.id,
      provider: "youtube",
      state_hash: stateHash,
      import_mode: importMode,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    if (stateError) throw stateError;

    const params = new URLSearchParams({
      client_id: requireEnv("YOUTUBE_CLIENT_ID"),
      response_type: "code",
      scope: youtubeScopes.join(" "),
      redirect_uri: redirectUri(request),
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      state,
    });

    return json({ authorizeUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Could not start YouTube OAuth" }, 500);
  }
});
