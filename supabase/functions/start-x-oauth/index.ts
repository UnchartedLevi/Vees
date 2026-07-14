import { assertWorkspaceMember, authenticatedUser, corsHeaders, json, redirectUri, requireEnv, serviceClient, sha256, xScopes } from "../_shared/x.ts";

const base64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const randomVerifier = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return base64Url(bytes);
};

async function codeChallenge(verifier: string) {
  const bytes = new TextEncoder().encode(verifier);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return base64Url(hash);
}

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
    const verifier = randomVerifier();
    await db.from("oauth_states").delete().eq("provider", "x").eq("workspace_id", workspaceId).eq("user_id", user.id);
    const { error: stateError } = await db.from("oauth_states").insert({
      workspace_id: workspaceId,
      user_id: user.id,
      provider: "x",
      state_hash: stateHash,
      code_verifier: verifier,
      import_mode: importMode,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    if (stateError) throw stateError;

    const params = new URLSearchParams({
      response_type: "code",
      client_id: requireEnv("X_CLIENT_ID"),
      redirect_uri: redirectUri(request),
      scope: xScopes.join(" "),
      state,
      code_challenge: await codeChallenge(verifier),
      code_challenge_method: "S256",
    });

    return json({ authorizeUrl: `https://x.com/i/oauth2/authorize?${params.toString()}` });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Could not start X OAuth" }, 500);
  }
});
