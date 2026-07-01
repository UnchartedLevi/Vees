import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import DotGrid from "../components/DotGrid";

const GoogleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

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

  const titles: Record<typeof mode, string> = {
    login: "Sign in to Vees",
    signup: "Create your account",
    forgot: "Reset your password",
  };

  const subtitles: Record<typeof mode, string> = {
    login: "Welcome back. Enter your details to continue.",
    signup: "Start managing your social presence with clarity.",
    forgot: "We'll send a reset link to your inbox.",
  };

  const ctaLabel: Record<typeof mode, string> = {
    login: "Sign in",
    signup: "Create account",
    forgot: "Send reset link",
  };

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center p-5 overflow-hidden"
      style={{ backgroundColor: "#F5F5F7" }}
    >
      {/* ReactBits DotGrid background */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <DotGrid
          className="opacity-80"
          dotSize={4}
          gap={28}
          baseColor="#CBD5E1"
          activeColor="#0071E3"
          proximity={135}
          speedTrigger={90}
          shockRadius={210}
          shockStrength={3.5}
          resistance={700}
          returnDuration={1.25}
        />
      </div>
      {/* Soft wash and vignette so the card reads cleanly over the interactive grid */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(circle at 50% 42%, rgba(255,255,255,0.34) 0%, rgba(245,245,247,0.78) 44%, rgba(245,245,247,0.94) 100%), linear-gradient(135deg, rgba(0,113,227,0.08), rgba(52,199,89,0.06) 48%, rgba(175,82,222,0.08))",
        }}
        aria-hidden="true"
      />
      {/* Content above the interactive background */}
      <div className="relative z-[2] flex w-full flex-col items-center">

      {/* Wordmark */}
      <div className="mb-8 flex items-center gap-2">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-[11px] text-white"
          style={{ background: "linear-gradient(145deg, #1D1D1F 0%, #3A3A3C 100%)" }}
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" fill="white" fillOpacity="0.9"/>
            <path d="M8 5L11 6.75V10.25L8 12L5 10.25V6.75L8 5Z" fill="white" fillOpacity="0.4"/>
          </svg>
        </div>
        <span
          className="text-[19px] font-semibold"
          style={{ color: "#1D1D1F", letterSpacing: "-0.04em" }}
        >
          Vees
        </span>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-[400px] rounded-[24px] bg-white p-8"
        style={{
          border: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.06)",
        }}
      >
        <h1
          className="text-[28px] font-semibold"
          style={{ color: "#1D1D1F", letterSpacing: "-0.04em", lineHeight: 1.1 }}
        >
          {titles[mode]}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "#6E6E73" }}>
          {subtitles[mode]}
        </p>

        <div className="mt-7 space-y-4">
          <label>
            <span className="label">Email address</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void submit()}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          {mode !== "forgot" && (
            <label>
              <span className="label">Password</span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void submit()}
                placeholder="At least 6 characters"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </label>
          )}

          {error && (
            <div
              className="rounded-[12px] p-3.5 text-[13px] leading-relaxed"
              style={{ background: "rgba(255,59,48,0.06)", color: "#C00" }}
            >
              {error}
            </div>
          )}

          {notice && (
            <div
              className="rounded-[12px] p-3.5 text-[13px] leading-relaxed"
              style={{ background: "rgba(52,199,89,0.08)", color: "#1A7A40" }}
            >
              {notice}
            </div>
          )}

          <button
            className="button-primary w-full"
            disabled={busy}
            onClick={() => void submit()}
          >
            {busy ? "Please wait..." : ctaLabel[mode]}
            {!busy && <ArrowRight size={15} />}
          </button>

          {mode !== "forgot" && (
            <>
              <div className="flex items-center gap-3">
                <div className="h-px flex-1" style={{ background: "rgba(0,0,0,0.08)" }} />
                <span className="text-[12px]" style={{ color: "#86868B" }}>or</span>
                <div className="h-px flex-1" style={{ background: "rgba(0,0,0,0.08)" }} />
              </div>

              <button
                className="button-secondary w-full"
                onClick={() => void google()}
                style={{ borderRadius: "12px" }}
              >
                <GoogleIcon />
                Continue with Google
              </button>
            </>
          )}
        </div>

        {/* Footer links */}
        <div className="mt-6 flex justify-between text-[13px]" style={{ color: "#6E6E73" }}>
          {mode === "login" ? (
            <>
              <Link to="/signup" className="transition hover:text-[#0071E3]">
                Create an account
              </Link>
              <Link to="/forgot-password" className="transition hover:text-[#0071E3]">
                Forgot password?
              </Link>
            </>
          ) : (
            <Link to="/login" className="transition hover:text-[#0071E3]">
              Back to sign in
            </Link>
          )}
        </div>
      </div>

      {/* Legal */}
      <p className="mt-6 max-w-[380px] text-center text-[12px] leading-relaxed" style={{ color: "#86868B" }}>
        By using Vees, you agree to the{" "}
        <Link
          className="font-medium transition hover:text-[#1D1D1F]"
          style={{ color: "#6E6E73" }}
          to="/terms"
        >
          Terms
        </Link>{" "}
        and{" "}
        <Link
          className="font-medium transition hover:text-[#1D1D1F]"
          style={{ color: "#6E6E73" }}
          to="/privacy"
        >
          Privacy Policy
        </Link>
        .
      </p>

      </div>{/* end z-[2] wrapper */}
    </main>
  );
}
