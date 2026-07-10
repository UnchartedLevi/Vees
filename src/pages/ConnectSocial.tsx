import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, CircleDashed, Clock3, Link2, Plug, RefreshCw, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { demoConnector } from "../integrations/social/demoConnector";
import { metaConnector } from "../integrations/social/metaConnector";
import { youtubeConnector } from "../integrations/social/youtubeConnector";
import type { ImportMode, SocialPlatform } from "../types";
import PageHeader from "../components/PageHeader";
import SocialPlatformIcon from "../components/SocialPlatformIcon";

type ProviderStatus = "live" | "blocked" | "planned";

type Provider = {
  name: SocialPlatform;
  displayName: string;
  status: ProviderStatus;
  note: string;
  features: string[];
};

const providers: Provider[] = [
  {
    name: "Instagram",
    displayName: "Instagram",
    status: "live",
    note: "Connect a professional Instagram account through Meta Business Login.",
    features: ["Business or creator accounts", "Media sync", "Paid-plan insights"],
  },
  {
    name: "YouTube Shorts",
    displayName: "YouTube",
    status: "live",
    note: "Connect the full channel. Vees imports regular uploads and flags Shorts automatically.",
    features: ["Channel videos", "Shorts detection", "Retention on paid plans"],
  },
  {
    name: "TikTok",
    displayName: "TikTok",
    status: "blocked",
    note: "Paused until TikTok approves the developer app and releases the Client Key.",
    features: ["OAuth code ready", "Awaiting app approval", "No live connect button"],
  },
  {
    name: "LinkedIn",
    displayName: "LinkedIn",
    status: "planned",
    note: "Requires LinkedIn app review and approved API access before OAuth can go live.",
    features: ["App review needed", "Read access pending", "Manual demo available"],
  },
  {
    name: "X",
    displayName: "X",
    status: "planned",
    note: "Requires X developer access and OAuth setup before Vees can connect accounts.",
    features: ["Developer access needed", "OAuth pending", "Manual demo available"],
  },
  {
    name: "Facebook",
    displayName: "Facebook",
    status: "planned",
    note: "Requires Page permissions and Meta app review before account sync is available.",
    features: ["Page permissions needed", "Review pending", "Manual demo available"],
  },
];

const importModes: [ImportMode, string, string][] = [
  ["existing_posts", "Import existing posts", "Pull available historical posts from the provider."],
  ["from_today", "Start tracking from today", "Connect with minimal history."],
  ["future_only", "Only track future platform posts", "Keep analytics empty until content is added."],
];

const labelFor = (name: SocialPlatform) => providers.find((provider) => provider.name === name)?.displayName ?? name;

const statusConfig: Record<ProviderStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  live: {
    label: "Live",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  },
  blocked: {
    label: "Not ready",
    className: "border-amber-200 bg-amber-50 text-amber-800",
    icon: Clock3,
  },
  planned: {
    label: "Coming later",
    className: "border-slate-200 bg-slate-50 text-slate-500",
    icon: CircleDashed,
  },
};

const StatusBadge = ({ status }: { status: ProviderStatus }) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold ${config.className}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
};

const PlatformIcon = ({ name }: { name: SocialPlatform }) => {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm">
      <SocialPlatformIcon platform={name} size="lg" />
    </span>
  );
};

const accountAvatar = (account: { accountName: string; accountHandle: string; providerMeta?: { thumbnailUrl?: string | null } }) =>
  account.providerMeta?.thumbnailUrl || "";

const ConnectedAvatar = ({ account }: { account: { accountName: string; accountHandle: string; providerMeta?: { thumbnailUrl?: string | null } } }) => {
  const src = accountAvatar(account);
  const fallback = (account.accountName || account.accountHandle || "A").trim().slice(0, 1).toUpperCase();
  return src ? (
    <img
      src={src}
      alt=""
      className="h-11 w-11 shrink-0 rounded-full border border-slate-200 bg-slate-100 object-cover shadow-sm"
      referrerPolicy="no-referrer"
    />
  ) : (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-sm font-bold text-emerald-700 shadow-sm">
      {fallback}
    </span>
  );
};

const formatLastSynced = (value?: string) => {
  if (!value) return "Not synced yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sync date unavailable";
  return `Synced ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
};

export default function ConnectSocial() {
  const { workspace, socialAccounts, refresh } = useData();
  const location = useLocation();
  const navigate = useNavigate();

  const [platform, setPlatform] = useState<SocialPlatform>("Instagram");
  const [name, setName] = useState("Demo account");
  const [handle, setHandle] = useState("@demo");
  const [mode, setMode] = useState<ImportMode>("existing_posts");
  const [demoBusy, setDemoBusy] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<SocialPlatform | "">("");
  const [syncingId, setSyncingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const providerLabels: Record<string, string> = { tiktok: "TikTok", youtube: "YouTube", instagram: "Instagram", social: "Provider" };
    const providerKey = ["tiktok", "youtube", "instagram", "social"].find((key) => params.has(key));
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
    setDemoBusy(true);
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
      setDemoBusy(false);
    }
  };

  const connectorFor = (providerName: SocialPlatform) =>
    providerName === "YouTube Shorts" ? youtubeConnector
    : providerName === "Instagram" ? metaConnector
    : null;

  const connectProvider = async (providerName: SocialPlatform) => {
    const connector = connectorFor(providerName);
    if (!connector) return;
    setConnectingProvider(providerName);
    setMessage("");
    setError("");
    try {
      await connector.connect(workspace.id, { importMode: mode });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : `${labelFor(providerName)} connection failed`);
      setConnectingProvider("");
    }
  };

  const syncProvider = async (accountId: string) => {
    const account = socialAccounts.find((entry) => entry.id === accountId);
    if (!account) return;
    const connector = connectorFor(account.platform);
    if (!connector) return;
    setSyncingId(accountId);
    setMessage("");
    setError("");
    try {
      await connector.syncPosts(account);
      await refresh();
      setMessage(`${labelFor(account.platform)} sync completed. Analytics and posts have been refreshed.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : `${labelFor(account.platform)} sync failed`);
    } finally {
      setSyncingId("");
    }
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Channel connections"
        title="Connect social accounts"
        description="Instagram and YouTube are ready for live OAuth. TikTok is paused until the developer app approval releases the Client Key."
      />

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <ShieldCheck size={16} />
            Live connectors
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-950">2</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Instagram and YouTube can connect now.</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <Clock3 size={16} />
            Blocked
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-950">TikTok</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Waiting on app approval and Client Key.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Sparkles size={16} />
            Import mode
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{importModes.find(([value]) => value === mode)?.[1]}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Used for the next live or demo connection.</p>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Live OAuth channels</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Connectors with verified backend functions show active buttons. Paused providers stay visible without a risky connect action.</p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {providers.map((provider) => {
            const isLive = provider.status === "live";
            const connectedAccount = socialAccounts.find((account) => account.platform === provider.name && account.connectionStatus === "connected");
            return (
              <article
                key={provider.name}
                className={`flex min-h-[260px] flex-col rounded-lg border bg-white p-4 shadow-sm transition hover:shadow-md ${
                  connectedAccount ? "border-emerald-200 ring-1 ring-emerald-100" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {connectedAccount ? <ConnectedAvatar account={connectedAccount} /> : <PlatformIcon name={provider.name} />}
                  {connectedAccount ? (
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                      <CheckCircle2 size={12} />
                      Connected
                    </span>
                  ) : (
                    <StatusBadge status={provider.status} />
                  )}
                </div>

                <div className="mt-4 flex-1">
                  <h3 className="flex items-center gap-2 text-[15px] font-semibold text-slate-950">
                    <SocialPlatformIcon platform={provider.name} size="sm" />
                    {provider.displayName}
                  </h3>
                  {connectedAccount ? (
                    <div className="mt-2 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
                      <p className="truncate text-sm font-semibold text-slate-950">{connectedAccount.accountName}</p>
                      <p className="mt-0.5 truncate text-xs text-emerald-800">{connectedAccount.accountHandle}</p>
                      <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.12em] text-emerald-700">
                        {formatLastSynced(connectedAccount.lastSyncedAt)}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-slate-500">{provider.note}</p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {provider.features.map((feature) => (
                      <span key={feature} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {connectedAccount ? (
                  <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <button
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-emerald-400"
                      disabled={syncingId === connectedAccount.id}
                      onClick={() => void syncProvider(connectedAccount.id)}
                    >
                      <RefreshCw size={15} className={syncingId === connectedAccount.id ? "animate-spin" : ""} />
                      {syncingId === connectedAccount.id ? "Syncing..." : "Sync"}
                    </button>
                    <button
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                      disabled={Boolean(connectingProvider)}
                      onClick={() => void connectProvider(provider.name)}
                    >
                      <Plug size={15} />
                      Reconnect
                    </button>
                  </div>
                ) : isLive ? (
                  <button
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    disabled={Boolean(connectingProvider)}
                    onClick={() => void connectProvider(provider.name)}
                  >
                    <Plug size={15} />
                    {connectingProvider === provider.name ? "Opening..." : `Connect ${provider.displayName}`}
                  </button>
                ) : (
                  <div className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-400">
                    <Link2 size={15} />
                    {provider.status === "blocked" ? "Not ready yet" : "Planned"}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
            <Zap size={17} />
          </span>
          <div>
            <h3 className="text-[15px] font-semibold text-slate-950">Demo / manual connector</h3>
            <p className="text-sm leading-6 text-slate-500">Simulate any channel while provider reviews are still in progress.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <label>
              <span className="label">Platform to simulate</span>
              <select className="input" value={platform} onChange={(event) => setPlatform(event.target.value as SocialPlatform)}>
                {providers.map((provider) => (
                  <option key={provider.name} value={provider.name}>{provider.displayName}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">Account name</span>
              <input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Vees Marketing" />
            </label>
            <label>
              <span className="label">Handle</span>
              <input className="input" value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="@handle" />
            </label>
          </div>

          <div>
            <p className="label mb-3">Import mode</p>
            <div className="space-y-2">
              {importModes.map(([value, title, copy]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition ${
                    mode === value ? "border-slate-950 bg-slate-50" : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <input type="radio" className="mt-1 accent-slate-950" checked={mode === value} onChange={() => setMode(value)} />
                  <span>
                    <span className="block text-sm font-semibold text-slate-950">{title}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{copy}</span>
                  </span>
                </label>
              ))}
            </div>

            <button
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              disabled={demoBusy}
              onClick={() => void connectDemo()}
            >
              <Plug size={15} />
              {demoBusy ? "Connecting..." : "Connect demo account"}
            </button>
          </div>
        </div>

        {message && (
          <p className="mt-5 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-sm leading-6 text-emerald-800">
            <CheckCircle2 className="mt-0.5 shrink-0" size={16} />
            {message}
          </p>
        )}
        {error && (
          <p className="mt-5 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-sm leading-6 text-rose-700">
            <AlertCircle className="mt-0.5 shrink-0" size={16} />
            {error}
          </p>
        )}
      </section>

      {socialAccounts.length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-[15px] font-semibold text-slate-950">Connected accounts</h3>
          <div className="space-y-2">
            {socialAccounts.map((account) => {
              const canSync = Boolean(connectorFor(account.platform));
              return (
                <div key={account.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <ConnectedAvatar account={account} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        <span className="inline-flex items-center gap-2">
                          <SocialPlatformIcon platform={account.platform} size="sm" />
                          {labelFor(account.platform)} - {account.accountName}
                        </span>
                      </p>
                      <p className="truncate text-xs leading-5 text-slate-500">
                        {account.accountHandle} - {account.importMode}
                      </p>
                      {account.connectionStatus === "connected" && (
                        <p className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 size={12} />
                          Connected
                        </p>
                      )}
                    </div>
                  </div>
                  {canSync ? (
                    <button
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400 sm:w-auto"
                      disabled={syncingId === account.id}
                      onClick={() => void syncProvider(account.id)}
                    >
                      <RefreshCw size={14} className={syncingId === account.id ? "animate-spin" : ""} />
                      {syncingId === account.id ? "Syncing..." : `Sync ${labelFor(account.platform)}`}
                    </button>
                  ) : (
                    <span className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-400 sm:w-auto">
                      Sync paused
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
