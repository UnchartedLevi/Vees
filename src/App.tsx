import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Database, ExternalLink, Loader2, Menu, Search, Unplug } from "lucide-react";
import type { Campaign, ContentIdea, Post, Report, ScheduledPost, Workspace } from "./types";
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
import EmptyState from "./components/EmptyState";
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
  onNavigate?: (page: Page) => void;
}

const paths: Record<Page, string> = {
  Dashboard: "/app/dashboard",
  Calendar: "/app/calendar",
  Analytics: "/app/analytics",
  "Content Ideas": "/app/ideas",
  Campaigns: "/app/campaigns",
  Reports: "/app/reports",
  Assistant: "/app/assistant",
  Settings: "/app/settings",
};
const pathEntries = Object.entries(paths) as [Page, string][];
const pageFromPath = (path: string) => pathEntries.find(([, value]) => path === value)?.[0];
const Spinner = () => (
  <div className="flex min-h-screen items-center justify-center" style={{ background: "#F5F5F7" }}>
    <Loader2 className="animate-spin" style={{ color: "#86868B" }} size={22} />
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
    <main className="flex min-h-screen items-center justify-center p-5" style={{ background: "#F5F5F7" }}>
      <section className="card max-w-xl p-8">
        <span className="inline-flex rounded-[14px] p-3 text-white" style={{ background: "#1D1D1F" }}>
          <Database size={20} />
        </span>
        <h1 className="mt-6 text-[22px] font-semibold tracking-tight" style={{ color: "#1D1D1F", letterSpacing: "-0.03em" }}>
          Finish the Supabase database setup
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "#6E6E73" }}>
          Your Google sign-in worked, but the Vees database tables do not exist yet. Open the Supabase SQL Editor, paste the full contents of <code className="font-mono text-sm" style={{ color: "#1D1D1F" }}>supabase/schema.sql</code>, and run the script once.
        </p>
        <div className="mt-5 rounded-[14px] p-4 text-[13px] leading-6" style={{ background: "#F5F5F7", color: "#6E6E73" }}>
          <p>Required first table: <code className="font-mono" style={{ color: "#1D1D1F" }}>public.workspaces</code></p>
          <p>Local schema file: <code className="font-mono" style={{ color: "#1D1D1F" }}>supabase/schema.sql</code></p>
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
    <main className="flex min-h-screen items-center justify-center p-5" style={{ background: "#F5F5F7" }}>
      <section className="card max-w-lg p-8">
        <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: "#1D1D1F", letterSpacing: "-0.03em" }}>
          Could not load your workspace
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "#6E6E73" }}>{message}</p>
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
    <main className="flex min-h-screen items-center justify-center p-5" style={{ background: "#F5F5F7" }}>
      <section className="card max-w-lg p-8">
        <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: "#1D1D1F", letterSpacing: "-0.03em" }}>
          Authentication could not be completed
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "#6E6E73" }}>{providerError || error}</p>
        <button className="button-primary mt-6" onClick={() => navigate("/login", { replace: true })}>Back to sign in</button>
      </section>
    </main>
  );
  return <Spinner />;
}

function Shell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const data = useData();
  const { signOut } = useAuth();
  const page = pageFromPath(location.pathname);
  const props = { ...data, onNavigate: (next: Page) => navigate(paths[next]) };

  const content = () => {
    if (data.loading) return (
      <div className="card flex items-center gap-3 p-6" style={{ color: "#86868B", fontSize: "0.9375rem" }}>
        <Loader2 size={16} className="animate-spin" />
        Loading workspace data…
      </div>
    );
    if (data.error) return (
      <div className="card p-6 text-[14px]" style={{ color: "#C00" }}>
        Could not load workspace data: {data.error}
      </div>
    );
    if (location.pathname === "/app/connect") return <ConnectSocial />;
    if (!page) return <Navigate to="/app/dashboard" replace />;
    if (page === "Dashboard" && !data.socialAccounts.length) return <EmptyState icon={Unplug} title="Connect your social accounts to start tracking analytics." description="Connect a demo account to test the workflow, or prepare a real provider connection when your OAuth setup is ready." action={<div className="flex flex-wrap justify-center gap-2"><button className="button-primary" onClick={() => navigate("/app/connect")}>Connect social account</button><button className="button-secondary" onClick={() => navigate("/app/connect")}>Use demo data</button></div>} />;
    if (page === "Dashboard" && !data.posts.length) return <EmptyState icon={Unplug} title="Your account is connected. Analytics will appear as posts arrive." description="Track a post manually, choose the demo import mode, or wait for a future provider sync to populate your dashboard." action={<button className="button-primary" onClick={() => navigate("/app/analytics")}>Track a post manually</button>} />;
    return {
      Dashboard: <Dashboard {...props} />,
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
    <div className="min-h-screen" style={{ background: "#F5F5F7" }}>
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
          className="sticky top-0 z-20 flex h-[60px] items-center justify-between px-5 sm:px-8"
          style={{
            background: "rgba(245,245,247,0.85)",
            backdropFilter: "saturate(180%) blur(20px)",
            WebkitBackdropFilter: "saturate(180%) blur(20px)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              aria-label="Open menu"
              className="flex h-8 w-8 items-center justify-center rounded-[8px] transition lg:hidden"
              style={{ color: "#6E6E73" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.05)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              onClick={() => setOpen(true)}
            >
              <Menu size={18} />
            </button>
            <h1
              className="text-[17px] font-semibold"
              style={{ color: "#1D1D1F", letterSpacing: "-0.025em" }}
            >
              {pageTitle}
            </h1>
          </div>

          {/* Search */}
          <label
            className="hidden cursor-text items-center gap-2 rounded-[10px] px-3 py-1.5 md:flex"
            style={{
              background: "rgba(0,0,0,0.05)",
              border: "1px solid rgba(0,0,0,0.06)",
              color: "#86868B",
            }}
          >
            <Search size={14} />
            <input
              className="w-36 bg-transparent text-[14px] outline-none placeholder:text-[#86868B]"
              placeholder="Search"
              style={{ color: "#1D1D1F" }}
            />
          </label>
        </header>

        {/* Content */}
        <div className="p-5 sm:p-7 lg:p-8 xl:p-10">
          {content()}
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
    <Route path="/app/*" element={<Protected><DataProvider><Shell /></DataProvider></Protected>} />
    <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
    <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
    </>}
  </Routes>;
}
