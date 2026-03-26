"use client";

import { useEffect, useMemo } from "react";
import { DashboardHeader } from "./components/dashboard-header";
import { DashboardKpis } from "./components/dashboard-kpis";
import { DashboardNeedsAttention } from "./components/dashboard-needs-attention";
import { DashboardOnTrack } from "./components/dashboard-on-track";
import { DashboardRecentChases } from "./components/dashboard-recent-chases";
import { useDashboardStore } from "@/stores/dashboard-store";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardPageView() {
  const {
    isLoading,
    initialized,
    sectionErrors,
    summary,
    missingByClient,
    needsAttentionV2,
    recentChases,
    needsAttention,
    onTrack,
    loadDashboard,
  } = useDashboardStore();

  useEffect(() => {
    if (!initialized) {
      void loadDashboard();
    }
  }, [initialized, loadDashboard]);

  const totalClients = missingByClient?.total_clients ?? 0;
  const needsAttentionCount = needsAttentionV2?.clients?.length ?? 0;
  const onTrackCount = Math.max(totalClients - needsAttentionCount, 0);
  const recentChasesCount = recentChases?.events?.length ?? 0;

  const summaryLine = useMemo(() => {
    return `${totalClients} clients · ${needsAttentionCount} need attention · ${onTrackCount} handled`;
  }, [needsAttentionCount, onTrackCount, totalClients]);

  return (
    <div className="offlode-dashboard">
      <DashboardHeader
        greeting={getGreeting()}
        summaryLine={summaryLine}
        summaryApiText={summary}
      />

      <DashboardKpis
        totalClients={totalClients}
        needsAttentionCount={needsAttentionCount}
        onTrackCount={onTrackCount}
        recentChasesCount={recentChasesCount}
      />

      {isLoading && !initialized ? (
        <p className="offlode-shell__subtitle">Loading dashboard data...</p>
      ) : null}

      <section className="offlode-shell__grid offlode-dashboard__grid">
        <DashboardNeedsAttention
          data={needsAttentionV2}
          fallbackText={needsAttention}
          error={sectionErrors.needsAttentionV2 ?? sectionErrors.needsAttention}
        />
        <DashboardOnTrack
          data={missingByClient}
          onTrackText={onTrack}
          error={sectionErrors.missingByClient ?? sectionErrors.onTrack}
        />
        <DashboardRecentChases
          data={recentChases}
          error={sectionErrors.recentChases}
        />
      </section>
    </div>
  );
}
