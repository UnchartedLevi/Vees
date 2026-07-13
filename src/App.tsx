import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Database, ExternalLink, Loader2, Menu, RefreshCw, Search } from "lucide-react";
import type { Campaign, ContentIdea, Post, Report, ScheduledPost, SocialAccount, Workspace } from "./types";
import { isSupabaseConfigured } from "./lib/supabaseClient";
import { useAuth } from "./context/AuthContext";
import { useWorkspace } from "./context/WorkspaceContext";
import { DataProvider, useData } from "./context/DataContext";
import Sidebar, { type Page } from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Calendar from "./components/Calendar";
import Analytics from "./components/Analytics";
import Ideas from "./components/Ideas";
import Campaigns from "./components/Campaigns";
import Reports from "./components/Reports";
import Chatbot from "./components/Chatbot";
import Settings from "./components/Settings";
import SetupRequired from "./pages/SetupRequired";
import AuthPage from "./pages/AuthPage";
import Onboarding from "./pages/Onboarding";
import ConnectSocial from "./pages/ConnectSocial";
import UpdatePassword from "./pages/UpdatePassword";
import { PrivacyPage, TermsPage } from "./pages/LegalPages";

export interface AppDataProps {
  workspace: Workspace;
  setWorkspace: Dispatch<SetStateAction<Workspace>>;
  posts: Post[];
  setPosts: Dispatch<SetStateAction<Post[]>>;
  scheduledPosts: ScheduledPost[];
  setScheduledPosts: Dispatch<SetStateAction<ScheduledPost[]>>;
  ideas: ContentIdea[];
  setIdeas: Dispatch<SetStateAction<ContentIdea[]>>;
  campaigns: Campaign[];
  setCampaigns: Dispatch<SetStateAction<Campaign[]>>;
  reports: Report[];
  setReports: Dispatch<SetStateAction<Report[]>>;
  socialAccounts: SocialAccount[];
  onNavigate?: (page: Page) => void;
  onConnect?: () => void;
  onCreatePost?: (platform?: string) => void;
}

const paths: Record<Page, string> = {
  Dashboard: "/app/dashboard",
  Connect: "/app/connect",
  Calendar: "/app/calendar",
  Analytics: "/app/analytics",
  "Content Ideas": "/app/ideas",
  Campaigns: "/app/campaigns",
  Reports: "/app/reports",
  Assistant: "/app/assistant",
  Settings: "/app/settings",
};
const pathEntries = Object.entries(paths) as [Page, string][];
const pageFromPath = (path: string) => {
  const normalized = path.replace(/\/+$/, "") || "/";
  return pathEntries.find(([, value]) => normalized === value || normalized.startsWith(`${value}/`))?.[0];
};
const Spinner = () => (
  <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--vees-mist)" }}>
    <Loader2 className="animate-spin" style={{ color: "var(--vees-violet-2)" }} size={22} />
  </div>
);

function GuestOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <Navigate to="/app/dashboard" replace /> : children;
}

function SignedInOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? children : <Navigate to="/login" replace />;
}

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { activeWorkspace, loading: workspaceLoading, error } = useWorkspace();
  if (loading || workspaceLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (error) return <WorkspaceLoadError message={error} />;
  if (!activeWorkspace) return <Navigate to="/onboarding" replace />;
  return children;
}

function WorkspaceLoadError({ message }: { message: string }) {
  const { refreshWorkspace } = useWorkspace();
  const schemaMissing = message.includes("PGRST205") || message.includes("Could not find the table") || message.includes("schema cache");
  if (schemaMissing) return (
    <main className="flex min-h-screen items-center justify-center p-5" style={{ background: "var(--vees-mist)" }}>
      <section className="card max-w-xl p-8">
        <span className="inline-flex rounded-[14px] p-3 text-white" style={{ background: "var(--vees-ink)" }}>
          <Database size={20} />
        </span>
        <h1 className="mt-6 text-[22px] font-semibold tracking-tight" style={{ color: "var(--vees-text)", letterSpacing: 0 }}>
          Finish the Supabase database setup
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--vees-muted)" }}>
          Your Google sign-in worked, but the Vees database tables do not exist yet. Open the Supabase SQL Editor, paste the full contents of <code className="font-mono text-sm" style={{ color: "var(--vees-text)" }}>supabase/schema.sql</code>, and run the script once.
        </p>
        <div className="mt-5 rounded-[14px] p-4 text-[13px] leading-6" style={{ background: "var(--vees-mist)", color: "var(--vees-muted)" }}>
          <p>Required first table: <code className="font-mono" style={{ color: "var(--vees-text)" }}>public.workspaces</code></p>
          <p>Local schema file: <code className="font-mono" style={{ color: "var(--vees-text)" }}>supabase/schema.sql</code></p>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <a className="button-primary" href="https://supabase.com/dashboard/project/_/sql/new" target="_blank" rel="noreferrer">
            Open SQL Editor <ExternalLink size={14} />
          </a>
          <button className="button-secondary" onClick={() => void refreshWorkspace()}>Check again</button>
        </div>
      </section>
    </main>
  );
  return (
    <main className="flex min-h-screen items-center justify-center p-5" style={{ background: "var(--vees-mist)" }}>
      <section className="card max-w-lg p-8">
        <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: "var(--vees-text)", letterSpacing: 0 }}>
          Could not load your workspace
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--vees-muted)" }}>{message}</p>
        <button className="button-primary mt-6" onClick={() => void refreshWorkspace()}>Try again</button>
      </section>
    </main>
  );
}

function OnboardingRoute() {
  const { activeWorkspace, loading, error } = useWorkspace();
  if (loading) return <Spinner />;
  if (error) return <WorkspaceLoadError message={error} />;
  return activeWorkspace ? <Navigate to="/app/dashboard" replace /> : <Onboarding />;
}

function Callback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, user, error } = useAuth();
  const providerError = new URLSearchParams(location.search || location.hash.slice(1)).get("error_description");
  useEffect(() => {
    if (!loading && !providerError && !error) navigate(user ? "/app/dashboard" : "/login", { replace: true });
  }, [error, loading, navigate, providerError, user]);
  if (providerError || error) return (
    <main className="flex min-h-screen items-center justify-center p-5" style={{ background: "var(--vees-mist)" }}>
      <section className="card max-w-lg p-8">
        <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: "var(--vees-text)", letterSpacing: 0 }}>
          Authentication could not be completed
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--vees-muted)" }}>{providerError || error}</p>
        <button className="button-primary mt-6" onClick={() => navigate("/login", { replace: true })}>Back to sign in</button>
      </section>
    </main>
  );
  return <Spinner />;
}

function DataLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-rose-50 text-rose-600">
          <AlertCircle size={18} />
        </span>
        <div>
          <h2 className="text-[17px] font-semibold tracking-tight text-slate-950">Could not load workspace data</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{message}</p>
        </div>
      </div>
      <button className="button-primary shrink-0" onClick={onRetry}>
        <RefreshCw size={15} />
        Try again
      </button>
    </div>
  );
}

function Shell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const data = useData();
  const { signOut } = useAuth();
  const page = pageFromPath(location.pathname);
  const props = {
    ...data,
    onNavigate: (next: Page) => navigate(paths[next]),
    onConnect: () => navigate("/app/connect"),
    onCreatePost: (platform?: string) => navigate(`/app/calendar?new=1${platform ? `&platform=${encodeURIComponent(platform)}` : ""}`),
  };

  const content = () => {
    if (data.loading) return (
      <div className="card flex items-center gap-3 p-6" style={{ color: "var(--vees-muted)", fontSize: "0.9375rem" }}>
        <Loader2 size={16} className="animate-spin" />
        Loading workspace data…
      </div>
    );
    if (data.error) return (
      <DataLoadError message={data.error} onRetry={() => void data.refresh()} />
    );
    if (location.pathname === "/app/connect") return <ConnectSocial />;
    if (!page) return <Navigate to="/app/dashboard" replace />;
    return {
      Dashboard: <Dashboard {...props} />,
      Connect: <ConnectSocial />,
      Calendar: <Calendar {...props} />,
      Analytics: <Analytics {...props} />,
      "Content Ideas": <Ideas {...props} />,
      Campaigns: <Campaigns {...props} />,
      Reports: <Reports {...props} />,
      Assistant: <Chatbot {...props} />,
      Settings: <Settings {...props} />,
    }[page];
  };

  const pageTitle = location.pathname === "/app/connect" ? "Connect accounts" : page ?? "Dashboard";

  return (
    <div className="min-h-screen">
      <Sidebar
        page={page ?? "Dashboard"}
        brandName={data.workspace.brandName}
        scheduledCount={data.scheduledPosts.length}
        onNavigate={(next) => navigate(paths[next])}
        onConnect={() => navigate("/app/connect")}
        onLogout={() => void signOut()}
        open={open}
        onClose={() => setOpen(false)}
      />

      <main className="lg:ml-[260px]">
        {/* Header */}
        <header
          className="sticky top-0 z-20 flex h-[64px] items-center justify-between px-5 sm:px-8"
          style={{
            background: "rgba(247,244,255,0.78)",
            backdropFilter: "saturate(180%) blur(20px)",
            WebkitBackdropFilter: "saturate(180%) blur(20px)",
            borderBottom: "1px solid var(--vees-line)",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-black/10 bg-white/80 transition lg:hidden"
              style={{ color: "var(--vees-muted)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(48,47,87,0.06)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.8)"; }}
              onClick={() => setOpen(true)}
            >
              <Menu size={18} />
            </button>
            <h1
              className="text-[16px] font-semibold"
              style={{ color: "var(--vees-text)", letterSpacing: 0 }}
            >
              {pageTitle}
            </h1>
          </div>

          {/* Search */}
          <label
            className="hidden cursor-text items-center gap-2 rounded-[10px] px-3 py-2 md:flex"
            style={{
              background: "rgba(255,255,255,0.82)",
              border: "1px solid var(--vees-line)",
              color: "var(--vees-muted)",
            }}
          >
            <Search size={14} />
            <input
              className="w-36 bg-transparent text-[14px] outline-none"
              placeholder="Search"
              style={{ color: "var(--vees-text)" }}
            />
          </label>
        </header>

        {/* Content */}
        <div className="p-5 sm:p-7 lg:p-8 xl:p-10">
          <div className="mx-auto max-w-[1440px]">
            {content()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return <Routes>
    <Route path="/terms" element={<TermsPage />} />
    <Route path="/privacy" element={<PrivacyPage />} />
    {!isSupabaseConfigured ? <Route path="*" element={<SetupRequired />} /> : <>
    <Route path="/login" element={<GuestOnly><AuthPage mode="login" /></GuestOnly>} />
    <Route path="/signup" element={<GuestOnly><AuthPage mode="signup" /></GuestOnly>} />
    <Route path="/forgot-password" element={<GuestOnly><AuthPage mode="forgot" /></GuestOnly>} />
    <Route path="/update-password" element={<SignedInOnly><UpdatePassword /></SignedInOnly>} />
    <Route path="/auth/callback" element={<Callback />} />
    <Route path="/onboarding" element={<SignedInOnly><OnboardingRoute /></SignedInOnly>} />
    <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
    <Route path="/app/:section" element={<Protected><DataProvider><Shell /></DataProvider></Protected>} />
    <Route path="/app/:section/*" element={<Protected><DataProvider><Shell /></DataProvider></Protected>} />
    <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
    <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
    </>}
  </Routes>;
}
