"use client";

import { useEffect, useState } from "react";
import { importsApi } from "@/lib/api/imports-api";
import type { ImportSessionResponse } from "@/types/imports";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  completed: { bg: "rgba(34,160,107,0.08)", color: "var(--success)" },
  processing: { bg: "rgba(96,165,250,0.08)", color: "#60A5FA" },
  pending: { bg: "rgba(224,148,34,0.08)", color: "var(--warning)" },
  validated: { bg: "rgba(224,148,34,0.08)", color: "var(--warning)" },
  mapped: { bg: "rgba(224,148,34,0.08)", color: "var(--warning)" },
  uploaded: { bg: "rgba(224,148,34,0.08)", color: "var(--warning)" },
  failed: { bg: "rgba(239,68,68,0.08)", color: "var(--danger)" },
  cancelled: { bg: "rgba(107,114,128,0.08)", color: "var(--clr-muted)" },
};

export function ImportHistoryPanel() {
  const [sessions, setSessions] = useState<ImportSessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    importsApi.list({ limit: 50 }).then(
      (result) => {
        if (!cancelled) { setSessions(result.items); setLoading(false); }
      },
      () => {
        if (!cancelled) { setError("Unable to load import history."); setLoading(false); }
      },
    );
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "var(--sp-24)", textAlign: "center", color: "var(--clr-muted)", fontSize: "var(--text-sm)" }}>
        Loading history...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "var(--sp-12) var(--sp-16)", background: "rgba(239,68,68,0.08)", borderRadius: "var(--r-md)", color: "var(--danger)", fontSize: "var(--text-sm)" }}>
        {error}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div style={{
        background: "var(--clr-surface-card)",
        borderRadius: "var(--r-lg)",
        border: "1px solid var(--clr-divider)",
        padding: "var(--sp-40)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "var(--text-md)", fontWeight: "var(--fw-medium)", color: "var(--clr-primary)", marginBottom: "var(--sp-4)" }}>
          No imports yet
        </div>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>
          Your import history will appear here after your first import.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "var(--clr-surface-card)",
      borderRadius: "var(--r-lg)",
      border: "1px solid var(--clr-divider)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 100px 100px 80px 80px 80px 100px",
        gap: "var(--sp-8)",
        padding: "var(--sp-10) var(--sp-16)",
        borderBottom: "1px solid var(--clr-divider)",
        fontSize: "var(--text-xs)",
        fontWeight: "var(--fw-semibold)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: "var(--clr-muted)",
      }}>
        <span>File</span>
        <span>Platform</span>
        <span>Type</span>
        <span>Total</span>
        <span>Created</span>
        <span>Errors</span>
        <span>Status</span>
      </div>

      {/* Rows */}
      {sessions.map((s) => {
        const statusStyle = STATUS_COLORS[s.status] ?? STATUS_COLORS.pending;
        return (
          <div
            key={s.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 100px 100px 80px 80px 80px 100px",
              gap: "var(--sp-8)",
              padding: "var(--sp-10) var(--sp-16)",
              borderBottom: "1px solid var(--clr-divider)",
              fontSize: "var(--text-sm)",
              alignItems: "center",
            }}
          >
            <div style={{ overflow: "hidden" }}>
              <div style={{ color: "var(--clr-primary)", fontWeight: "var(--fw-medium)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.filename || "Untitled"}
              </div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-faint)", marginTop: 1 }}>
                {new Date(s.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            <span style={{ color: "var(--clr-muted)", textTransform: "capitalize" }}>{s.platform}</span>
            <span style={{ color: "var(--clr-muted)", textTransform: "capitalize" }}>{s.data_type}</span>
            <span style={{ color: "var(--clr-primary)" }}>{s.total_rows ?? "—"}</span>
            <span style={{ color: "var(--success)" }}>{s.records_created || "—"}</span>
            <span style={{ color: s.error_rows ? "var(--danger)" : "var(--clr-muted)" }}>{s.error_rows ?? "—"}</span>
            <span style={{
              fontSize: "var(--text-micro)",
              fontWeight: "var(--fw-medium)",
              color: statusStyle.color,
              background: statusStyle.bg,
              padding: "var(--sp-2) var(--sp-8)",
              borderRadius: "var(--r-full)",
              textTransform: "capitalize",
              textAlign: "center",
            }}>
              {s.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}
