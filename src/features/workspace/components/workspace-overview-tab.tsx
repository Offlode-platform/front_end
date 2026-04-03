"use client";

import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api/dashboard-api";
import type { ListedClient } from "@/types/clients";
import type { ClientDashboardDetailsResponse } from "@/types/dashboard";

type Props = {
  client: ListedClient;
};

export function WorkspaceOverviewTab({ client }: Props) {
  const [data, setData] = useState<ClientDashboardDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    dashboardApi.clientDetails(client.id).then(
      (result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      },
      () => {
        if (!cancelled) {
          setError("Unable to load client overview.");
          setLoading(false);
        }
      },
    );

    return () => {
      cancelled = true;
      setLoading(true);
      setError(null);
      setData(null);
    };
  }, [client.id]);

  if (loading) {
    return (
      <div className="ws-panel active" style={{ padding: "var(--sp-24)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-12)" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 72, background: "var(--clr-surface-subtle)", borderRadius: "var(--r-lg)", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ws-panel active" style={{ padding: "var(--sp-32)", textAlign: "center" }}>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>{error}</div>
      </div>
    );
  }

  const hasData = data && (
    data.missing_documents.total > 0 ||
    data.chase_history.length > 0 ||
    data.recent_uploads.length > 0 ||
    data.pending_reconciliation > 0
  );

  const supplierCount = data?.missing_documents
    ? Object.keys(data.missing_documents.grouped_by_supplier).length
    : 0;
  const totalChases = data?.chase_history?.length ?? 0;
  const deliveredCount = data?.chase_history?.filter((c) => c.delivered).length ?? 0;

  return (
    <div className="ws-panel active">
      <div style={{ padding: "var(--sp-20)", display: "flex", flexDirection: "column", gap: "var(--sp-20)" }}>
        {/* Always show: Status summary cards */}
        <div>
          <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--fw-semibold)", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--clr-muted)", marginBottom: "var(--sp-10)" }}>
            Overview
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "var(--sp-10)" }}>
            <StatCard value={data?.missing_documents?.total ?? 0} label="Missing docs" color={data?.missing_documents?.total ? "var(--warning)" : "var(--success)"} />
            <StatCard value={supplierCount} label="Suppliers" />
            <StatCard value={totalChases} label="Chases sent" />
            <StatCard value={data?.pending_reconciliation ?? 0} label="Pending recon" />
          </div>
        </div>

        {/* Always show: Client info card */}
        <div style={{
          background: "var(--clr-surface-card)",
          borderRadius: "var(--r-lg)",
          padding: "var(--sp-16)",
          border: "1px solid var(--clr-divider)",
        }}>
          <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--fw-semibold)", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--clr-muted)", marginBottom: "var(--sp-12)" }}>
            Chase Configuration
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--sp-12)" }}>
            <InfoItem label="Status" value={data?.chase_enabled ? "Enabled" : "Disabled"} valueColor={data?.chase_enabled ? "var(--success)" : "var(--clr-muted)"} />
            <InfoItem label="Frequency" value={`Every ${data?.chase_frequency_days ?? client.chase_frequency_days} days`} />
            <InfoItem label="Delivered" value={totalChases > 0 ? `${deliveredCount}/${totalChases}` : "None yet"} />
          </div>
        </div>

        {/* If there's no activity data, show a friendly empty state */}
        {!hasData && (
          <div style={{
            background: "var(--clr-surface-card)",
            borderRadius: "var(--r-lg)",
            padding: "var(--sp-32) var(--sp-24)",
            textAlign: "center",
            border: "1px solid var(--clr-divider)",
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--clr-surface-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto var(--sp-12)",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--clr-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div style={{ fontSize: "var(--text-md)", fontWeight: "var(--fw-medium)", color: "var(--clr-primary)", marginBottom: "var(--sp-4)" }}>
              No activity yet
            </div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)", lineHeight: "var(--lh-body)", maxWidth: 320, margin: "0 auto" }}>
              This client has no missing documents, chases, or uploads. Activity will appear here once document chasing begins.
            </div>
          </div>
        )}

        {/* Recent uploads — only if data exists */}
        {data && data.recent_uploads.length > 0 && (
          <div>
            <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--fw-semibold)", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--clr-muted)", marginBottom: "var(--sp-10)" }}>
              Recent Uploads
              <span style={{ marginLeft: "var(--sp-6)", fontSize: "var(--text-micro)", color: "var(--clr-faint)" }}>{data.recent_uploads.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
              {data.recent_uploads.map((upload, i) => (
                <div
                  key={`${upload.filename}-${i}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "var(--sp-10) var(--sp-12)",
                    background: "var(--clr-surface-card)",
                    borderRadius: "var(--r-md)",
                    border: "1px solid var(--clr-divider)",
                    fontSize: "var(--text-sm)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "var(--clr-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: "var(--fw-medium)" }}>
                      {upload.filename}
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginTop: 2 }}>
                      {new Date(upload.uploaded_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <StatusBadge status={upload.status === "completed" ? "success" : upload.status === "failed" ? "danger" : "warning"} label={upload.status === "completed" ? "Processed" : upload.status === "failed" ? "Failed" : "Pending"} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent chases — only if data exists */}
        {data && data.chase_history.length > 0 && (
          <div>
            <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--fw-semibold)", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--clr-muted)", marginBottom: "var(--sp-10)" }}>
              Recent Chases
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
              {data.chase_history.map((chase, i) => (
                <div
                  key={`chase-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--sp-10)",
                    padding: "var(--sp-10) var(--sp-12)",
                    background: "var(--clr-surface-card)",
                    borderRadius: "var(--r-md)",
                    border: "1px solid var(--clr-divider)",
                    fontSize: "var(--text-sm)",
                  }}
                >
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: chase.delivered ? "var(--success)" : "var(--danger)",
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ textTransform: "capitalize", fontWeight: "var(--fw-medium)", color: "var(--clr-primary)" }}>{chase.type}</span>
                    <span style={{ color: "var(--clr-muted)" }}> — {chase.delivered ? "Delivered" : chase.status}</span>
                  </div>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--clr-faint)", flexShrink: 0 }}>
                    {chase.sent_at ? new Date(chase.sent_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing by supplier — only if data exists */}
        {data && data.missing_documents.total > 0 && (
          <div>
            <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--fw-semibold)", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--clr-muted)", marginBottom: "var(--sp-10)" }}>
              Missing by Supplier
              <span style={{ marginLeft: "var(--sp-6)", fontSize: "var(--text-micro)", color: "var(--clr-faint)" }}>{supplierCount}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
              {Object.entries(data.missing_documents.grouped_by_supplier).map(
                ([supplier, txns]) => (
                  <div
                    key={supplier}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "var(--sp-10) var(--sp-12)",
                      background: "var(--clr-surface-card)",
                      borderRadius: "var(--r-md)",
                      border: "1px solid var(--clr-divider)",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    <span style={{ color: "var(--clr-primary)", fontWeight: "var(--fw-medium)" }}>{supplier}</span>
                    <span style={{ color: "var(--clr-muted)", fontSize: "var(--text-xs)" }}>{txns.length} item{txns.length !== 1 ? "s" : ""}</span>
                  </div>
                ),
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <div style={{
      padding: "var(--sp-14) var(--sp-16)",
      background: "var(--clr-surface-card)",
      borderRadius: "var(--r-lg)",
      border: "1px solid var(--clr-divider)",
    }}>
      <div style={{
        fontSize: "var(--text-xl)",
        fontFamily: "var(--font-display)",
        fontWeight: "var(--fw-bold)",
        color: color ?? "var(--clr-primary)",
        lineHeight: "var(--lh-tight)",
      }}>
        {value}
      </div>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginTop: "var(--sp-4)" }}>
        {label}
      </div>
    </div>
  );
}

function InfoItem({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--fw-medium)", color: valueColor ?? "var(--clr-primary)" }}>{value}</div>
    </div>
  );
}

function StatusBadge({ status, label }: { status: "success" | "warning" | "danger"; label: string }) {
  const colors = {
    success: { bg: "rgba(34,160,107,0.08)", color: "var(--success)" },
    warning: { bg: "rgba(224,148,34,0.08)", color: "var(--warning)" },
    danger: { bg: "rgba(239,68,68,0.08)", color: "var(--danger)" },
  };
  const c = colors[status];
  return (
    <span style={{
      fontSize: "var(--text-micro)",
      fontWeight: "var(--fw-medium)",
      color: c.color,
      background: c.bg,
      padding: "var(--sp-2) var(--sp-8)",
      borderRadius: "var(--r-full)",
      flexShrink: 0,
    }}>
      {label}
    </span>
  );
}
