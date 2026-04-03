"use client";

import { useEffect, useState } from "react";
import { chasesApi } from "@/lib/api/chases-api";
import { dashboardApi } from "@/lib/api/dashboard-api";
import type { ListedClient } from "@/types/clients";
import type { ChaseHistoryResponse } from "@/types/chases";
import type { ClientDashboardChaseEntry } from "@/types/dashboard";

type Props = {
  client: ListedClient;
};

type ChaseFilter = "all" | "email" | "sms";

// Normalized chase item that works with both API sources
type ChaseItem = {
  id: string;
  chase_type: string;
  status: string;
  created_at: string;
  is_successful: boolean;
  is_pending: boolean;
  is_escalation: boolean;
  failure_reason: string | null;
  magic_link_clicked: boolean;
  delivered_at: string | null;
};

function normalizeChaseHistory(data: ChaseHistoryResponse): {
  items: ChaseItem[];
  stats: { total: number; deliveryRate: number; clickRate: number; lastChaseAt: string | null };
} {
  return {
    items: data.chases.map((c) => ({
      id: c.id,
      chase_type: c.chase_type,
      status: c.status,
      created_at: c.created_at,
      is_successful: c.is_successful,
      is_pending: c.is_pending,
      is_escalation: c.is_escalation,
      failure_reason: c.failure_reason,
      magic_link_clicked: c.magic_link_clicked,
      delivered_at: c.delivered_at,
    })),
    stats: {
      total: data.total_chases,
      deliveryRate: data.delivery_rate,
      clickRate: data.click_rate,
      lastChaseAt: data.last_chase_at,
    },
  };
}

function normalizeDashboardChases(
  entries: ClientDashboardChaseEntry[],
): { items: ChaseItem[]; stats: { total: number; deliveryRate: number; clickRate: number; lastChaseAt: string | null } } {
  const delivered = entries.filter((e) => e.delivered).length;
  const items: ChaseItem[] = entries.map((e, i) => ({
    id: `dash-${i}`,
    chase_type: e.type,
    status: e.status,
    created_at: e.sent_at || "",
    is_successful: e.delivered,
    is_pending: e.status === "pending",
    is_escalation: false,
    failure_reason: null,
    magic_link_clicked: false,
    delivered_at: e.sent_at,
  }));
  return {
    items,
    stats: {
      total: entries.length,
      deliveryRate: entries.length > 0 ? delivered / entries.length : 0,
      clickRate: 0,
      lastChaseAt: entries.length > 0 ? (entries[0].sent_at || null) : null,
    },
  };
}

export function WorkspaceActivityTab({ client }: Props) {
  const [items, setItems] = useState<ChaseItem[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    deliveryRate: number;
    clickRate: number;
    lastChaseAt: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ChaseFilter>("all");

  useEffect(() => {
    let cancelled = false;

    // Try chase history API first, fall back to dashboard endpoint
    chasesApi.history(client.id, { limit: 50 }).then(
      (result) => {
        if (!cancelled) {
          const normalized = normalizeChaseHistory(result);
          setItems(normalized.items);
          setStats(normalized.stats);
          setLoading(false);
        }
      },
      () => {
        // Fallback to dashboard client details
        dashboardApi.clientDetails(client.id).then(
          (result) => {
            if (!cancelled) {
              const normalized = normalizeDashboardChases(result.chase_history || []);
              setItems(normalized.items);
              setStats(normalized.stats);
              setLoading(false);
            }
          },
          () => {
            if (!cancelled) {
              setError("Unable to load chase history.");
              setLoading(false);
            }
          },
        );
      },
    );

    return () => {
      cancelled = true;
      setLoading(true);
      setError(null);
      setItems([]);
      setStats(null);
    };
  }, [client.id]);

  if (loading) {
    return (
      <div className="ws-panel active" style={{ padding: "var(--sp-24)", color: "var(--clr-muted)" }}>
        Loading activity...
      </div>
    );
  }

  if (error) {
    return (
      <div className="ws-panel active" style={{ padding: "var(--sp-24)" }}>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>{error}</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="ws-panel active">
        <div style={{ padding: "var(--sp-32)", textAlign: "center" }}>
          <div style={{ fontSize: "var(--text-md)", fontWeight: "var(--fw-medium)", color: "var(--clr-primary)", marginBottom: "var(--sp-4)" }}>
            No chase history
          </div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>
            No chases have been sent to this client yet.
          </div>
        </div>
      </div>
    );
  }

  const filtered = items.filter((c) => {
    if (filter === "all") return true;
    return c.chase_type === filter;
  });

  return (
    <div className="ws-panel active">
      <div style={{ padding: "var(--sp-16)" }}>
        {/* Summary bar */}
        {stats && (
          <div style={{ display: "flex", gap: "var(--sp-16)", marginBottom: "var(--sp-16)", fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>
            <span>Total: <strong style={{ color: "var(--clr-primary)" }}>{stats.total}</strong></span>
            <span>Delivery: <strong style={{ color: "var(--clr-primary)" }}>{(stats.deliveryRate * 100).toFixed(0)}%</strong></span>
            {stats.clickRate > 0 && (
              <span>Clicks: <strong style={{ color: "var(--clr-primary)" }}>{(stats.clickRate * 100).toFixed(0)}%</strong></span>
            )}
            {stats.lastChaseAt && (
              <span>Last: <strong style={{ color: "var(--clr-primary)" }}>
                {new Date(stats.lastChaseAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </strong></span>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="ws-issue-filters" style={{ marginBottom: "var(--sp-12)" }}>
          {(["all", "email", "sms"] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`ws-issue-filter${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : f === "email" ? "Email" : "SMS"}
            </button>
          ))}
        </div>

        {/* Chase list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
          {filtered.map((chase) => (
            <div
              key={chase.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--sp-12)",
                padding: "var(--sp-10) var(--sp-12)",
                background: "var(--canvas-bg)",
                borderRadius: "var(--r-md)",
              }}
            >
              <div style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                marginTop: 5,
                flexShrink: 0,
                background: chase.is_successful
                  ? "var(--success)"
                  : chase.is_pending
                    ? "var(--warning)"
                    : "var(--danger)",
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--fw-medium)", color: "var(--clr-primary)", textTransform: "capitalize" }}>
                    {chase.chase_type} chase
                    {chase.is_escalation && (
                      <span style={{ color: "var(--danger)", fontSize: "var(--text-xs)", marginLeft: 6 }}>
                        Escalation
                      </span>
                    )}
                  </span>
                  {chase.created_at && (
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)" }}>
                      {new Date(chase.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginTop: 2 }}>
                  {chase.is_successful ? "Delivered" : chase.is_pending ? "Pending" : `Failed${chase.failure_reason ? `: ${chase.failure_reason}` : ""}`}
                  {chase.magic_link_clicked && (
                    <span style={{ color: "var(--brand)" }}> · Link clicked</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: "var(--sp-16)", textAlign: "center", fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>
              No {filter} chases found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
