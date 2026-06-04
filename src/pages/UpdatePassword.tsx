import { useState } from "react";
import { ArrowRight, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function UpdatePassword() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (password.length < 6) {
      setError("Use at least 6 characters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await updatePassword(password);
      navigate("/app/dashboard", { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  };

  return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] p-5"><section className="card w-full max-w-md p-7 sm:p-9"><span className="inline-flex rounded-2xl bg-slate-900 p-3 text-white"><KeyRound size={20} /></span><h1 className="mt-6 text-2xl font-semibold tracking-tight">Choose a new password</h1><p className="mt-3 text-sm leading-6 text-slate-500">Set a new password for your Vees account.</p><label className="mt-6 block"><span className="label">New password</span><input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" /></label>{error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-xs leading-5 text-rose-700">{error}</p>}<button className="button-primary mt-5 w-full" disabled={busy} onClick={() => void save()}>{busy ? "Updating..." : "Update password"}<ArrowRight size={15} /></button></section></main>;
}
