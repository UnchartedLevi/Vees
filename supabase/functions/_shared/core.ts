import { createClient } from "https://esm.sh/@supabase/supabase-js@2.106.2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "content-type": "application/json" },
});

export const requireEnv = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};

export const serviceClient = () => createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

export const userClient = (authorization: string) => createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_ANON_KEY"), {
  global: { headers: { authorization } },
  auth: { persistSession: false },
});

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export async function sha256(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function normalizeKey(raw: string) {
  if (raw.length >= 32) return raw.slice(0, 32);
  return raw.padEnd(32, "0");
}

async function cryptoKey(keyEnvName: string) {
  return crypto.subtle.importKey("raw", encoder.encode(normalizeKey(requireEnv(keyEnvName))), "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptTokenWithKey(value: string | null | undefined, keyEnvName: string) {
  if (!value) return null;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await cryptoKey(keyEnvName);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(value)));
  const combined = new Uint8Array(iv.length + encrypted.length);
  combined.set(iv);
  combined.set(encrypted, iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptTokenWithKey(value: string | null | undefined, keyEnvName: string) {
  if (!value) return null;
  const combined = Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  const key = await cryptoKey(keyEnvName);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted);
  return decoder.decode(decrypted);
}

export const appBaseUrl = () => (Deno.env.get("APP_BASE_URL") ?? "http://localhost:5173").replace(/\/$/, "");

export const redirect = (path: string, status = 302) => Response.redirect(`${appBaseUrl()}${path}`, status);

export const planTier = async (db: ReturnType<typeof serviceClient>, workspaceId: string) => {
  const { data } = await db.from("workspaces").select("plan_tier").eq("id", workspaceId).single();
  return (data?.plan_tier as string | undefined) ?? "free";
};
