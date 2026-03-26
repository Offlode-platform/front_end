"use client";

import { useEffect, useMemo } from "react";
import { DashboardHeader } from "./components/dashboard-header";
import { DashboardKpis } from "./components/dashboard-kpis";
import { DashboardNeedsAttention } from "./components/dashboard-needs-attention";
import { DashboardOnTrack } from "./components/dashboard-on-track";
import { DashboardRecentChases } from "./components/dashboard-recent-chases";
import { useDashboardStore } from "@/stores/dashboard-store";
import type {
  DashboardSummaryResponse,
  NeedsAttentionBucketsResponse,
  NeedsAttentionResponse,
} from "@/types/dashboard";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getNeedsAttentionBuckets(
  payload: NeedsAttentionResponse | null
): NeedsAttentionBucketsResponse | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const candidate = payload as Partial<NeedsAttentionBucketsResponse>;
  if (
    Array.isArray(candidate.non_responsive_clients) &&
    Array.isArray(candidate.vat_deadline_upcoming) &&
    Array.isArray(candidate.delivery_failures) &&
    Array.isArray(candidate.security_issues) &&
    Array.isArray(candidate.flagged_uploads) &&
    Array.isArray(candidate.unassigned_clients)
  ) {
    return candidate as NeedsAttentionBucketsResponse;
  }

  return null;
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

  const totalClients = missingByClient?.total_clients ?? missingByClient?.total ?? 0;
  const needsAttentionCount = needsAttentionV2?.clients?.length ?? 0;
  const onTrackCount = Math.max(totalClients - needsAttentionCount, 0);
  const recentChasesCount = recentChases?.events?.length ?? 0;
  const attentionBuckets = useMemo(
    () => getNeedsAttentionBuckets(needsAttention),
    [needsAttention]
  );
  const bucketNeedsCount = useMemo(() => {
    if (!attentionBuckets) return 0;
    return (
      attentionBuckets.non_responsive_clients.length +
      attentionBuckets.vat_deadline_upcoming.length +
      attentionBuckets.delivery_failures.length +
      attentionBuckets.security_issues.length +
      attentionBuckets.flagged_uploads.length +
      attentionBuckets.unassigned_clients.length
    );
  }, [attentionBuckets]);
  const resolvedNeedsAttentionCount = Math.max(needsAttentionCount, bucketNeedsCount);

  const summaryLine = useMemo(() => {
    return `${totalClients} clients · ${needsAttentionCount} need attention · ${onTrackCount} handled`;
  }, [needsAttentionCount, onTrackCount, totalClients]);

  const summaryApiText = useMemo(() => {
    if (!summary) return summaryLine;
    return `${summary.active_clients} clients · ${summary.total_missing_documents} need attention · ${summary.total_documents_received} handled`;
  }, [summary, summaryLine]);

  return (
    <div className="page active" id="page-dashboard">
      <DashboardHeader
        greeting={getGreeting()}
        summaryLine={summaryApiText}
      />

      <div
        id="dashContent"
        style={{
          flex: 1,
          minWidth: 0,
          overflowY: "auto",
          padding: "var(--sp-24) var(--sp-32) var(--sp-48)",
          background: "var(--canvas-bg)",
        }}
      >
        <DashboardKpis
          totalClients={totalClients}
          needsAttentionCount={resolvedNeedsAttentionCount}
          onTrackCount={onTrackCount}
          recentChasesCount={recentChasesCount}
        />

        {isLoading && !initialized ? (
          <p className="dash-kpi-sub" style={{ marginBottom: "var(--sp-16)" }}>
            Loading dashboard data...
          </p>
        ) : null}

        <section className="dash-grid">
          <DashboardNeedsAttention
            data={needsAttentionV2}
            buckets={attentionBuckets}
            error={sectionErrors.needsAttentionV2 ?? sectionErrors.needsAttention}
          />
          <DashboardOnTrack
            data={missingByClient}
            error={sectionErrors.missingByClient ?? sectionErrors.onTrack}
          />
          <DashboardRecentChases
            data={recentChases}
            error={sectionErrors.recentChases}
          />
        </section>
      </div>
    </div>
  );
}
