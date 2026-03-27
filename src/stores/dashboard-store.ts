"use client";

import { create } from "zustand";
import { dashboardApi } from "@/lib/api/dashboard-api";
import type {
  DashboardSummaryResponse,
  MissingByClientResponse,
  NeedsAttentionResponse,
  NeedsAttentionV2Response,
  OnTrackResponse,
  RecentChasesResponse,
} from "@/types/dashboard";

type DashboardSection =
  | "summary"
  | "missingByClient"
  | "needsAttentionV2"
  | "recentChases"
  | "needsAttention"
  | "onTrack";

type DashboardState = {
  isLoading: boolean;
  initialized: boolean;
  sectionErrors: Partial<Record<DashboardSection, string>>;
  summary: DashboardSummaryResponse | null;
  missingByClient: MissingByClientResponse | null;
  needsAttentionV2: NeedsAttentionV2Response | null;
  recentChases: RecentChasesResponse | null;
  needsAttention: NeedsAttentionResponse | null;
  onTrack: OnTrackResponse | null;
  loadDashboard: (params?: { recentChasesLimit?: number }) => Promise<void>;
};

function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return "Unable to load data.";
}

export const useDashboardStore = create<DashboardState>((set) => ({
  isLoading: false,
  initialized: false,
  sectionErrors: {},
  summary: null,
  missingByClient: null,
  needsAttentionV2: null,
  recentChases: null,
  needsAttention: null,
  onTrack: null,

  loadDashboard: async (params) => {
    set({ isLoading: true, sectionErrors: {} });

    const results = await Promise.allSettled([
      dashboardApi.summary(),
      dashboardApi.missingByClient(),
      dashboardApi.needsAttentionV2(),
      dashboardApi.recentChases({ limit: params?.recentChasesLimit ?? 20 }),
      dashboardApi.needsAttention(),
      dashboardApi.onTrack({ skip: 0, limit: 20 }),
    ]);

    const nextState: Partial<DashboardState> = {
      isLoading: false,
      initialized: true,
      sectionErrors: {},
    };

    if (results[0].status === "fulfilled") {
      nextState.summary = results[0].value;
    } else {
      nextState.sectionErrors = {
        ...nextState.sectionErrors,
        summary: getErrorMessage(results[0].reason),
      };
    }

    if (results[1].status === "fulfilled") {
      nextState.missingByClient = results[1].value;
    } else {
      nextState.sectionErrors = {
        ...nextState.sectionErrors,
        missingByClient: getErrorMessage(results[1].reason),
      };
    }

    if (results[2].status === "fulfilled") {
      nextState.needsAttentionV2 = results[2].value;
    } else {
      nextState.sectionErrors = {
        ...nextState.sectionErrors,
        needsAttentionV2: getErrorMessage(results[2].reason),
      };
    }

    if (results[3].status === "fulfilled") {
      nextState.recentChases = results[3].value;
    } else {
      nextState.sectionErrors = {
        ...nextState.sectionErrors,
        recentChases: getErrorMessage(results[3].reason),
      };
    }

    if (results[4].status === "fulfilled") {
      nextState.needsAttention = results[4].value;
    } else {
      nextState.sectionErrors = {
        ...nextState.sectionErrors,
        needsAttention: getErrorMessage(results[4].reason),
      };
    }

    if (results[5].status === "fulfilled") {
      nextState.onTrack = results[5].value;
    } else {
      nextState.sectionErrors = {
        ...nextState.sectionErrors,
        onTrack: getErrorMessage(results[5].reason),
      };
    }

    set(nextState as DashboardState);
  },
}));
