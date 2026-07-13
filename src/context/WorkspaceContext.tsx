import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Workspace } from "../types";
import { createWorkspace as create, getWorkspaces, updateWorkspace } from "../services/workspaceService";
import { useAuth } from "./AuthContext";
import { isTransientFetchError, withRetry } from "../utils/async";

interface WorkspaceValue {
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  loading: boolean;
  error: string;
  createWorkspace: (workspace: Omit<Workspace, "id">) => Promise<Workspace>;
  saveWorkspace: (workspace: Workspace) => Promise<void>;
  refreshWorkspace: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceValue | null>(null);
const getErrorMessage = (reason: unknown) => {
  if (isTransientFetchError(reason)) return "Vees could not reach Supabase. Check your connection, then try again.";
  if (reason instanceof Error) return reason.message;
  if (reason && typeof reason === "object") {
    const value = reason as { code?: string; message?: string };
    if (value.message) return [value.code, value.message].filter(Boolean).join(": ");
  }
  return "Failed to load workspace";
};

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshWorkspace = async () => {
    if (!user) {
      setWorkspaces([]);
      setError("");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setWorkspaces(await withRetry(getWorkspaces));
      setError("");
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!user) {
      setWorkspaces([]);
      setError("");
      setLoading(false);
      return;
    }
    setLoading(true);
    void withRetry(getWorkspaces).then((next) => {
      if (!active) return;
      setWorkspaces(next);
      setError("");
    }).catch((reason) => {
      if (active) setError(getErrorMessage(reason));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user?.id]);

  return <WorkspaceContext.Provider value={{
    activeWorkspace: workspaces[0] ?? null,
    workspaces,
    loading,
    error,
    async createWorkspace(workspace) {
      if (!user) throw new Error("Sign in first.");
      const next = await create(user.id, workspace);
      setWorkspaces((current) => [next, ...current.filter(({ id }) => id !== next.id)]);
      return next;
    },
    async saveWorkspace(workspace) {
      const next = await updateWorkspace(workspace);
      setWorkspaces((current) => current.map((item) => item.id === next.id ? next : item));
    },
    refreshWorkspace,
  }}>{children}</WorkspaceContext.Provider>;
}

export const useWorkspace = () => {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace requires provider");
  return value;
};
