import { useEffect, useState } from "react";
import { CheckCircle2, Link2, Plug, RefreshCw, Zap } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { demoConnector } from "../integrations/social/demoConnector";
import { tiktokConnector } from "../integrations/social/tiktokConnector";
import type { ImportMode, SocialPlatform } from "../types";
import PageHeader from "../components/PageHeader";

const providers: SocialPlatform[] = ["Instagram", "Facebook", "TikTok", "LinkedIn", "X", "YouTube Shorts"];
const importModes: [ImportMode, string, string][] = [
  ["existing_posts", "Import existing posts", "Import available historical posts from the provider."],
  ["from_today", "Start tracking from today", "Connect with minimal history."],
  ["future_only", "Only track future platform posts", "Keep analytics empty until content is added."],
];

export default function ConnectSocial() {
  const { workspace, socialAccounts, refresh } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<SocialPlatform>("Instagram");
  const [name, setName] = useState("Demo account");
  const [handle, setHandle] = useState("@demo");
  const [mode, setMode] = useState<ImportMode>("existing_posts");
  const [busy, setBusy] = useState(false);
  const [syncingId, setSyncingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get("tiktok");
    if (!status) return;
    if (status === "connected") {
      setMessage("TikTok connected. Run sync to import available videos and metrics.");
      void refresh();
    }
    if (status === "error") setError(params.get("message") ?? "TikTok connection failed.");
    navigate("/app/connect", { replace: true });
  }, [location.search, navigate, refresh]);

  const connectDemo = async () => {
    if (!name.trim() || !handle.trim()) {
      setError("Add an account name and handle before connecting.");
      return;
    }
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await demoConnector.connect(workspace.id, { platform, accountName: name.trim(), accountHandle: handle.trim(), importMode: mode });
      await refresh();
      setMessage("Demo account connected. Your workspace data is ready.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Connection failed");
    } finally {
      setBusy(false);
    }
  };

  const connectTikTok = async () => {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await tiktokConnector.connect(workspace.id, { importMode: mode });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "TikTok connection failed");
      setBusy(false);
    }
  };

  const syncTikTok = async (accountId: string) => {
    const account = socialAccounts.find((item) => item.id === accountId);
    if (!account) return;
    setSyncingId(accountId);
    setMessage("");
    setError("");
    try {
      await tiktokConnector.syncPosts(account);
      await refresh();
      setMessage("TikTok sync completed. Analytics and posts have been refreshed.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "TikTok sync failed");
    } finally {
      setSyncingId("");
    }
  };

  return <div className="space-y-7"><PageHeader eyebrow="Channel connections" title="Connect social accounts" description="Connect TikTok through OAuth, or use the demo connector while waiting for provider approvals." />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{providers.map((provider) => {
      const isTikTok = provider === "TikTok";
      return <article key={provider} className={`card p-5 ${isTikTok ? "border-slate-900/10" : ""}`}><span className="inline-flex rounded-xl bg-slate-50 p-2.5 text-slate-500"><Link2 size={17} /></span><h3 className="mt-4 font-semibold">{provider}</h3><p className="mt-2 text-xs leading-5 text-slate-400">{isTikTok ? "OAuth foundation is ready. Requires a TikTok developer app, approved scopes, and deployed Supabase functions." : "OAuth setup required. Provider-specific permissions and review may apply."}</p>{isTikTok ? <button className="button-primary mt-4 w-full" disabled={busy} onClick={() => void connectTikTok()}><Plug size={15} />{busy ? "Opening TikTok..." : "Connect TikTok"}</button> : <button disabled className="button-secondary mt-4 opacity-50">Coming soon</button>}</article>;
    })}</section>
    <section className="card grid gap-4 p-5 sm:p-6 lg:grid-cols-2"><div><div className="flex items-center gap-2"><Zap size={17} /><h3 className="font-semibold">Demo / manual connector</h3></div><p className="mt-2 text-sm leading-6 text-slate-400">Simulate a channel connection and optionally seed realistic workspace analytics.</p><div className="mt-5 space-y-4"><label><span className="label">Platform to simulate</span><select className="input" value={platform} onChange={(event) => setPlatform(event.target.value as SocialPlatform)}>{providers.map((provider) => <option key={provider}>{provider}</option>)}</select></label><label><span className="label">Account name</span><input className="input" value={name} onChange={(event) => setName(event.target.value)} /></label><label><span className="label">Handle</span><input className="input" value={handle} onChange={(event) => setHandle(event.target.value)} /></label></div></div>
      <div className="rounded-2xl bg-slate-50 p-4"><p className="label">Import mode</p>{importModes.map(([value, title, copy]) => <label key={value} className="mb-2 flex cursor-pointer gap-3 rounded-xl bg-white p-3"><input type="radio" checked={mode === value} onChange={() => setMode(value)} /><span><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs leading-5 text-slate-400">{copy}</span></span></label>)}<button className="button-secondary mt-3 w-full" disabled={busy} onClick={() => void connectDemo()}><Plug size={15} />{busy ? "Connecting..." : "Connect demo account"}</button></div>
      {message && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 lg:col-span-2">{message}</p>}{error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 lg:col-span-2">{error}</p>}
    </section>
    {socialAccounts.length > 0 && <section className="card p-5"><h3 className="font-semibold">Connected accounts</h3><div className="mt-4 space-y-3">{socialAccounts.map((account) => <div key={account.id} className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><CheckCircle2 size={16} className="text-emerald-600" /><div className="min-w-0"><p className="truncate text-sm font-semibold">{account.platform} / {account.accountName}</p><p className="truncate text-xs text-slate-400">{account.accountHandle} / {account.importMode}</p></div></div>{account.platform === "TikTok" && <button className="button-secondary w-full sm:w-auto" disabled={syncingId === account.id} onClick={() => void syncTikTok(account.id)}><RefreshCw size={15} className={syncingId === account.id ? "animate-spin" : ""} />{syncingId === account.id ? "Syncing..." : "Sync TikTok"}</button>}</div>)}</div></section>}
  </div>;
}
