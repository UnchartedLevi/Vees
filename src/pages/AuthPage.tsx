import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Chrome, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AuthPage({ mode }: { mode: "login" | "signup" | "forgot" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();

  const submit = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "forgot") {
        await auth.sendPasswordReset(email);
        setNotice("Check your inbox for the password reset link.");
        return;
      }
      if (mode === "login") await auth.signInWithEmail(email, password);
      else {
        const signedIn = await auth.signUpWithEmail(email, password);
        if (!signedIn) {
          setNotice("Account created. Check your inbox to confirm your email, then sign in.");
          return;
        }
      }
      navigate("/app/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError("");
    try {
      await auth.signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed");
    }
  };

  return (
    <main className="grid min-h-screen bg-[#f7f8fa] lg:grid-cols-[1fr_1.05fr]">
      <section className="hidden bg-slate-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3"><Sparkles size={18} /><span className="font-semibold">Vees</span></div>
        <div>
          <p className="text-4xl font-semibold leading-tight tracking-tight">A calm content system for teams that need clarity.</p>
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">Plan campaigns, connect channels, track performance, and turn analytics into practical next steps.</p>
        </div>
        <p className="text-xs text-slate-400">Supabase-powered workspace foundation.</p>
      </section>
      <section className="flex items-center justify-center p-5">
        <div className="w-full max-w-md">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Welcome</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Sign in to your workspace"}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Use your email or continue with Google through Supabase Auth.</p>
          <div className="mt-7 space-y-4">
            <label><span className="label">Email address</span><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
            {mode !== "forgot" && <label><span className="label">Password</span><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" /></label>}
            {error && <p className="rounded-xl bg-rose-50 p-3 text-xs leading-5 text-rose-700">{error}</p>}
            {notice && <p className="rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-700">{notice}</p>}
            <button className="button-primary w-full" disabled={busy} onClick={submit}>{busy ? "Please wait..." : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}<ArrowRight size={15} /></button>
            {mode !== "forgot" && <button className="button-secondary w-full" onClick={() => void google()}><Chrome size={15} /> Continue with Google</button>}
          </div>
          <div className="mt-6 flex justify-between text-xs text-slate-500">{mode === "login" ? <><Link to="/signup">Create an account</Link><Link to="/forgot-password">Forgot password?</Link></> : <Link to="/login">Back to sign in</Link>}</div>
          <p className="mt-6 text-[11px] leading-5 text-slate-400">Google OAuth must be enabled and configured in the Supabase dashboard.</p>
          <p className="mt-3 text-[11px] leading-5 text-slate-400">
            By using Vees, you agree to the <Link className="font-semibold text-slate-600 hover:text-slate-900" to="/terms">Terms</Link> and acknowledge the <Link className="font-semibold text-slate-600 hover:text-slate-900" to="/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
