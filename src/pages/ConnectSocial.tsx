import { useEffect, useState } from "react";
import { CheckCircle2, Link2, Plug, RefreshCw, Zap } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { demoConnector } from "../integrations/social/demoConnector";
import { tiktokConnector } from "../integrations/social/tiktokConnector";
import { youtubeConnector } from "../integrations/social/youtubeConnector";
import type { ImportMode, SocialPlatform } from "../types";
import PageHeader from "../components/PageHeader";

const providers: { name: SocialPlatform; ready: boolean; note: string }[] = [
  { name: "Instagram",      ready: false, note: "OAuth setup required. Meta app review and approved scopes needed before going live." },
  { name: "TikTok",         ready: true,  note: "OAuth foundation is ready. Requires a TikTok developer app, approved scopes, and deployed Supabase functions." },
  { name: "LinkedIn",       ready: false, note: "OAuth setup required. LinkedIn app review and approved API access needed." },
  { name: "X",              ready: false, note: "OAuth 2.0 setup required. X developer portal approval and elevated access may apply." },
  { name: "Facebook",       ready: false, note: "OAuth setup required. Meta app review and Page permissions needed." },
  { name: "YouTube Shorts", ready: true,  note: "Channel analytics and Shorts tracking. Deeper retention metrics unlock on paid plans." },
];

const importModes: [ImportMode, string, string][] = [
  ["existing_posts", "Import existing posts",           "Pull available historical posts from the provider."],
  ["from_today",     "Start tracking from today",       "Connect with minimal history."],
  ["future_only",    "Only track future platform posts", "Keep analytics empty until content is added."],
];

const PlatformIcon = ({ name }: { name: SocialPlatform }) => {
  const icons: Record<SocialPlatform, string> = {
    Instagram:        "I",
    TikTok:           "T",
    LinkedIn:         "in",
    X:                "X",
    Facebook:         "f",
    "YouTube Shorts": "▶",
  };
  return (
    <span
      className="flex h-9 w-9 items-center justify-center rounded-[10px] text-[13px] font-bold"
      style={{ background: "#F5F5F7", color: "#1D1D1F" }}
    >
      {icons[name]}
    </span>
  );
};

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
    const providerLabels: Record<string, string> = { tiktok: "TikTok", youtube: "YouTube", social: "Provider" };
    const providerKey = ["tiktok", "youtube", "social"].find((key) => params.has(key));
    if (!providerKey) return;
    const status = params.get(providerKey);
    const label = providerLabels[providerKey];
    if (status === "connected") {
      setMessage(`${label} connected. Run sync to import available posts and metrics.`);
      void refresh();
    }
    if (status === "error") setError(params.get("message") ?? `${label} connection failed.`);
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
      await demoConnector.connect(workspace.id, {
        platform,
        accountName: name.trim(),
        accountHandle: handle.trim(),
        importMode: mode,
      });
      await refresh();
      setMessage("Demo account connected. Your workspace data is ready.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Connection failed");
    } finally {
      setBusy(false);
    }
  };

  const connectorFor = (providerName: SocialPlatform) => (providerName === "TikTok" ? tiktokConnector : providerName === "YouTube Shorts" ? youtubeConnector : null);

  const connectProvider = async (providerName: SocialPlatform) => {
    const connector = connectorFor(providerName);
    if (!connector) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await connector.connect(workspace.id, { importMode: mode });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : `${providerName} connection failed`);
      setBusy(false);
    }
  };

  const syncProvider = async (accountId: string) => {
    const account = socialAccounts.find((a) => a.id === accountId);
    if (!account) return;
    const connector = connectorFor(account.platform);
    if (!connector) return;
    setSyncingId(accountId);
    setMessage("");
    setError("");
    try {
      await connector.syncPosts(account);
      await refresh();
      setMessage(`${account.platform} sync completed. Analytics and posts have been refreshed.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : `${account.platform} sync failed`);
    } finally {
      setSyncingId("");
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Channel connections"
        title="Connect social accounts"
        description="Connect TikTok through OAuth, or use the demo connector while waiting for provider approvals."
      />

      {/* Provider grid */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {providers.map(({ name: providerName, ready, note }) => (
          <article
            key={providerName}
            className="card p-5 flex flex-col gap-4"
            style={{ borderRadius: "18px" }}
          >
            <div className="flex items-start justify-between">
              <PlatformIcon name={providerName} />
              <span
                className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                style={
                  ready
                    ? { background: "rgba(52,199,89,0.1)", color: "#1A7A40" }
                    : { background: "rgba(0,0,0,0.05)", color: "#86868B" }
                }
              >
                {ready ? "Ready" : "Coming soon"}
              </span>
            </div>

            <div className="flex-1">
              <h3
                className="text-[15px] font-semibold"
                style={{ color: "#1D1D1F", letterSpacing: "-0.02em" }}
              >
                {providerName}
              </h3>
              <p
                className="mt-1 text-[12px] leading-relaxed"
                style={{ color: "#86868B" }}
              >
                {note}
              </p>
            </div>

            {ready ? (
              <button
                className="button-primary w-full"
                disabled={busy}
                onClick={() => void connectProvider(providerName)}
                style={{ borderRadius: "12px" }}
              >
                <Plug size={14} />
                {busy ? "Opening…" : `Connect ${providerName}`}
              </button>
            ) : (
              <button
                disabled
                className="button-secondary w-full opacity-40 cursor-not-allowed"
                style={{ borderRadius: "12px" }}
              >
                <Link2 size={14} />
                Not available yet
              </button>
            )}
          </article>
        ))}
      </section>

      {/* Demo connector */}
      <section className="card p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-[10px]"
            style={{ background: "#F5F5F7", color: "#1D1D1F" }}
          >
            <Zap size={15} />
          </span>
          <div>
            <h3
              className="text-[15px] font-semibold"
              style={{ color: "#1D1D1F", letterSpacing: "-0.02em" }}
            >
              Demo / manual connector
            </h3>
            <p className="text-[12px]" style={{ color: "#86868B" }}>
              Simulate a channel connection and seed realistic analytics instantly.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left — fields */}
          <div className="space-y-4">
            <label>
              <span className="label">Platform to simulate</span>
              <select
                className="input"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
              >
                {providers.map(({ name: n }) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">Account name</span>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vees Marketing"
              />
            </label>
            <label>
              <span className="label">Handle</span>
              <input
                className="input"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@handle"
              />
            </label>
          </div>

          {/* Right — import mode */}
          <div>
            <p className="label mb-3">Import mode</p>
            <div className="space-y-2">
              {importModes.map(([value, title, copy]) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-start gap-3 rounded-[14px] p-3.5 transition-colors duration-150"
                  style={{
                    background: mode === value ? "rgba(0,113,227,0.06)" : "#F5F5F7",
                    border: `1px solid ${mode === value ? "rgba(0,113,227,0.2)" : "rgba(0,0,0,0.05)"}`,
                  }}
                >
                  <input
                    type="radio"
                    className="mt-0.5 accent-[#0071E3]"
                    checked={mode === value}
                    onChange={() => setMode(value)}
                  />
                  <span>
                    <span
                      className="block text-[13px] font-semibold"
                      style={{ color: "#1D1D1F" }}
                    >
                      {title}
                    </span>
                    <span
                      className="mt-0.5 block text-[12px] leading-relaxed"
                      style={{ color: "#86868B" }}
                    >
                      {copy}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            <button
              className="button-primary mt-4 w-full"
              disabled={busy}
              onClick={() => void connectDemo()}
              style={{ borderRadius: "12px" }}
            >
              <Plug size={14} />
              {busy ? "Connecting…" : "Connect demo account"}
            </button>
          </div>
        </div>

        {/* Feedback */}
        {message && (
          <p
            className="mt-5 rounded-[12px] p-3.5 text-[13px] leading-relaxed"
            style={{ background: "rgba(52,199,89,0.08)", color: "#1A7A40" }}
          >
            {message}
          </p>
        )}
        {error && (
          <p
            className="mt-5 rounded-[12px] p-3.5 text-[13px] leading-relaxed"
            style={{ background: "rgba(255,59,48,0.06)", color: "#C00" }}
          >
            {error}
          </p>
        )}
      </section>

      {/* Connected accounts */}
      {socialAccounts.length > 0 && (
        <section className="card p-6">
          <h3
            className="text-[15px] font-semibold mb-4"
            style={{ color: "#1D1D1F", letterSpacing: "-0.02em" }}
          >
            Connected accounts
          </h3>
          <div className="space-y-2">
            {socialAccounts.map((account) => (
              <div
                key={account.id}
                className="flex flex-col gap-3 rounded-[14px] p-4 sm:flex-row sm:items-center sm:justify-between"
                style={{ background: "#F5F5F7", border: "1px solid rgba(0,0,0,0.05)" }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <CheckCircle2 size={16} style={{ color: "#1A7A40", flexShrink: 0 }} />
                  <div className="min-w-0">
                    <p
                      className="truncate text-[14px] font-medium"
                      style={{ color: "#1D1D1F" }}
                    >
                      {account.platform} · {account.accountName}
                    </p>
                    <p className="truncate text-[12px]" style={{ color: "#86868B" }}>
                      {account.accountHandle} · {account.importMode}
                    </p>
                  </div>
                </div>
                {(account.platform === "TikTok" || account.platform === "YouTube Shorts") && (
                  <button
                    className="button-secondary w-full sm:w-auto"
                    disabled={syncingId === account.id}
                    onClick={() => void syncProvider(account.id)}
                    style={{ borderRadius: "10px", fontSize: "0.875rem" }}
                  >
                    <RefreshCw
                      size={13}
                      className={syncingId === account.id ? "animate-spin" : ""}
                    />
                    {syncingId === account.id ? "Syncing…" : `Sync ${account.platform}`}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
