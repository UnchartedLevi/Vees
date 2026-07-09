import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

interface AuthValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);
const googleSetupError = (message: string) => message.includes("Unsupported provider") || message.includes("provider is not enabled")
  ? new Error("Google sign-in is not enabled yet. Add your Google OAuth Client ID and Client Secret under Supabase Authentication > Providers > Google, then enable the provider.")
  : new Error(message);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const db = supabase;
    let active = true;
    void db.auth.getSession().then(async ({ data, error: sessionError }) => {
      if (!active) return;
      if (!data.session || sessionError) {
        setSession(null);
        setError(sessionError?.message ?? "");
        setLoading(false);
        return;
      }

      const { error: userError } = await db.auth.getUser(data.session.access_token);
      if (!active) return;
      if (userError) {
        await db.auth.signOut();
        setSession(null);
        setError("Your session expired. Sign in again to continue.");
        setLoading(false);
        return;
      }

      setSession(data.session);
      setError("");
      setLoading(false);
    });
    const { data } = db.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setError("");
      setLoading(false);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const need = () => {
    if (!supabase) throw new Error("Supabase is not configured.");
    return supabase;
  };

  return <AuthContext.Provider value={{
    user: session?.user ?? null,
    session,
    loading,
    error,
    async signInWithEmail(email, password) {
      const { error: signInError } = await need().auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
    },
    async signUpWithEmail(email, password) {
      const { data, error: signUpError } = await need().auth.signUp({ email, password });
      if (signUpError) throw signUpError;
      return Boolean(data.session);
    },
    async sendPasswordReset(email) {
      const { error: resetError } = await need().auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/update-password` });
      if (resetError) throw resetError;
    },
    async updatePassword(password) {
      const { error: updateError } = await need().auth.updateUser({ password });
      if (updateError) throw updateError;
    },
    async signInWithGoogle() {
      const { error: oauthError } = await need().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback` } });
      if (oauthError) throw googleSetupError(oauthError.message);
    },
    async signOut() {
      const { error: signOutError } = await need().auth.signOut();
      if (signOutError) throw signOutError;
    },
  }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth requires AuthProvider");
  return value;
};
