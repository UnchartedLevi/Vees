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
const Spinner = () => <div className="flex min-h-screen items-center justify-center bg-[#f7f8fa] text-slate-400"><Loader2 className="animate-spin" /></div>;

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
  if (schemaMissing) return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] p-5"><section className="card max-w-xl p-7 sm:p-9"><span className="inline-flex rounded-2xl bg-slate-900 p-3 text-white"><Database size={20} /></span><h1 className="mt-6 text-xl font-semibold">Finish the Supabase database setup</h1><p className="mt-3 text-sm leading-6 text-slate-500">Your Google sign-in worked, but the Vees database tables do not exist yet. Open the Supabase SQL Editor, paste the full contents of <code>supabase/schema.sql</code>, and run the script once.</p><div className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs leading-6 text-slate-600"><p>Required first table: <code>public.workspaces</code></p><p>Local schema file: <code>supabase/schema.sql</code></p></div><div className="mt-6 flex flex-wrap gap-2"><a className="button-primary" href="https://supabase.com/dashboard/project/_/sql/new" target="_blank" rel="noreferrer">Open SQL Editor <ExternalLink size={15} /></a><button className="button-secondary" onClick={() => void refreshWorkspace()}>Check again</button></div></section></main>;
  return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] p-5"><section className="card max-w-lg p-7"><h1 className="text-xl font-semibold">Could not load your workspace</h1><p className="mt-3 text-sm leading-6 text-slate-500">{message}</p><button className="button-primary mt-5" onClick={() => void refreshWorkspace()}>Try again</button></section></main>;
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
  if (providerError || error) return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] p-5"><section className="card max-w-lg p-7"><h1 className="text-xl font-semibold">Authentication could not be completed</h1><p className="mt-3 text-sm leading-6 text-slate-500">{providerError || error}</p><button className="button-primary mt-5" onClick={() => navigate("/login", { replace: true })}>Back to sign in</button></section></main>;
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
    if (data.loading) return <div className="card flex items-center gap-3 p-6 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" />Loading workspace data...</div>;
    if (data.error) return <div className="card p-6 text-sm text-rose-700">Could not load workspace data: {data.error}</div>;
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

  return <div className="min-h-screen"><Sidebar page={page ?? "Dashboard"} brandName={data.workspace.brandName} scheduledCount={data.scheduledPosts.length} onNavigate={(next) => navigate(paths[next])} onConnect={() => navigate("/app/connect")} onLogout={() => void signOut()} open={open} onClose={() => setOpen(false)} /><main className="lg:ml-64"><header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200/60 bg-[#f7f8fa]/90 px-5 backdrop-blur-xl sm:px-8"><div className="flex items-center gap-3"><button aria-label="Open menu" className="rounded-lg p-2 text-slate-500 hover:bg-white lg:hidden" onClick={() => setOpen(true)}><Menu size={20} /></button><div><h1 className="text-lg font-semibold tracking-tight">{location.pathname === "/app/connect" ? "Connect accounts" : page ?? "Dashboard"}</h1><p className="hidden text-xs text-slate-400 sm:block">{data.workspace.brandName} workspace</p></div></div><label className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-400 md:flex"><Search size={16} /><input className="w-36 bg-transparent text-sm" placeholder="Search content" /></label></header><div className="p-4 sm:p-6 lg:p-8 xl:p-10">{content()}</div></main></div>;
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
