import { createContext, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { AnalyticsSnapshot, Campaign, ContentIdea, Post, Report, ScheduledPost, SocialAccount, Workspace } from "../types";
import { addManualPost, addScheduledPost, deletePost, getPosts, getScheduledPosts, updatePostStatus } from "../services/postService";
import { addCampaign, getCampaigns } from "../services/campaignService";
import { addIdea, getIdeas, updateIdea } from "../services/ideaService";
import { addReport, getReports } from "../services/reportService";
import { getSnapshots, getSocialAccounts } from "../services/socialAccountService";
import { useWorkspace } from "./WorkspaceContext";

export interface DataValue {
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
  snapshots: AnalyticsSnapshot[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataValue | null>(null);

const getErrorMessage = (reason: unknown, fallback: string) => {
  if (reason instanceof Error) return reason.message;
  if (reason && typeof reason === "object") {
    const details = reason as { code?: string; message?: string };
    if (details.message) return [details.code, details.message].filter(Boolean).join(": ");
  }
  return fallback;
};

export function DataProvider({ children }: { children: ReactNode }) {
  const { activeWorkspace, saveWorkspace } = useWorkspace();
  const [posts, setPostsState] = useState<Post[]>([]);
  const [scheduled, setScheduledState] = useState<ScheduledPost[]>([]);
  const [ideas, setIdeasState] = useState<ContentIdea[]>([]);
  const [campaigns, setCampaignsState] = useState<Campaign[]>([]);
  const [reports, setReportsState] = useState<Report[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [snapshots, setSnapshots] = useState<AnalyticsSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const track = (operation: Promise<unknown>, reload = false) => {
    void operation.then(() => {
      if (reload) void refresh();
    }).catch((reason) => setError(getErrorMessage(reason, "Could not save workspace data")));
  };

  const refresh = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const [nextPosts, nextScheduled, nextIdeas, nextCampaigns, nextReports, nextAccounts, nextSnapshots] = await Promise.all([
        getPosts(activeWorkspace.id),
        getScheduledPosts(activeWorkspace.id),
        getIdeas(activeWorkspace.id),
        getCampaigns(activeWorkspace.id),
        getReports(activeWorkspace.id),
        getSocialAccounts(activeWorkspace.id),
        getSnapshots(activeWorkspace.id),
      ]);
      setPostsState(nextPosts);
      setScheduledState(nextScheduled);
      setIdeasState(nextIdeas);
      setCampaignsState(nextCampaigns);
      setReportsState(nextReports);
      setAccounts(nextAccounts);
      setSnapshots(nextSnapshots);
      setError("");
    } catch (reason) {
      setError(getErrorMessage(reason, "Failed to load workspace data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [activeWorkspace?.id]);

  if (!activeWorkspace) return null;

  const wrap = <T,>(setState: Dispatch<SetStateAction<T[]>>, persist: (previous: T[], next: T[]) => void): Dispatch<SetStateAction<T[]>> => (action) => setState((previous) => {
    const next = typeof action === "function" ? (action as (value: T[]) => T[])(previous) : action;
    persist(previous, next);
    return next;
  });

  return <DataContext.Provider value={{
    workspace: activeWorkspace,
    setWorkspace: (action) => {
      const next = typeof action === "function" ? action(activeWorkspace) : action;
      track(saveWorkspace(next));
    },
    posts,
    setPosts: wrap(setPostsState, (previous, next) => {
      next.filter((item) => !previous.some(({ id }) => id === item.id)).forEach((item) => track(addManualPost(activeWorkspace.id, item), true));
      previous.filter((item) => !next.some(({ id }) => id === item.id)).forEach((item) => track(deletePost(activeWorkspace.id, item.id), true));
    }),
    scheduledPosts: scheduled,
    setScheduledPosts: wrap(setScheduledState, (previous, next) => {
      next.filter((item) => !previous.some(({ id }) => id === item.id)).forEach((item) => track(addScheduledPost(activeWorkspace.id, item), true));
      next.filter((item) => previous.some(({ id, status }) => id === item.id && status !== item.status)).forEach((item) => track(updatePostStatus(activeWorkspace.id, item.id, item.status), true));
    }),
    ideas,
    setIdeas: wrap(setIdeasState, (previous, next) => {
      next.filter((item) => !previous.some(({ id }) => id === item.id)).forEach((item) => track(addIdea(activeWorkspace.id, item), true));
      next.filter((item) => previous.some((existing) => existing.id === item.id && JSON.stringify(existing) !== JSON.stringify(item))).forEach((item) => track(updateIdea(activeWorkspace.id, item), true));
    }),
    campaigns,
    setCampaigns: wrap(setCampaignsState, (previous, next) => {
      next.filter((item) => !previous.some(({ id }) => id === item.id)).forEach((item) => track(addCampaign(activeWorkspace.id, item), true));
    }),
    reports,
    setReports: wrap(setReportsState, (previous, next) => {
      next.filter((item) => !previous.some(({ id }) => id === item.id)).forEach((item) => track(addReport(activeWorkspace.id, item), true));
    }),
    socialAccounts: accounts,
    snapshots,
    loading,
    error,
    refresh,
  }}>{children}</DataContext.Provider>;
}

export const useData = () => {
  const value = useContext(DataContext);
  if (!value) throw new Error("useData requires DataProvider");
  return value;
};
