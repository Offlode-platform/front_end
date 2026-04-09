"use client";

import { useCallback, useEffect, useState } from "react";
import { auditLogsApi } from "@/lib/api/audit-logs-api";
import type { AuditLogResponse, AuditLogFilter } from "@/types/audit-logs";

type SeverityFilter = "all" | "info" | "warning" | "critical";

const SEVERITY_COLORS: Record<string, { bg: string; color: string }> = {
  info: { bg: "rgba(96,165,250,0.1)", color: "#60A5FA" },
  warning: { bg: "rgba(224,148,34,0.1)", color: "var(--warning)" },
  critical: { bg: "rgba(239,68,68,0.1)", color: "var(--danger)" },
};

export function AuditLogPageView() {
  const [logs, setLogs] = useState<AuditLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [searchAction, setSearchAction] = useState("");
  const [searchModule, setSearchModule] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 50;

  const fetchLogs = useCallback(async (reset = false) => {
    const offset = reset ? 0 : page * limit;
    setLoading(true);
    setError(null);
    try {
      const filter: AuditLogFilter = {
        skip: offset,
        limit,
      };
      if (severity !== "all") filter.severity = severity;
      if (searchAction.trim()) filter.action = searchAction.trim();
      if (searchModule.trim()) filter.module = searchModule.trim();

      const result = await auditLogsApi.list(filter);
      if (reset) {
        setLogs(result);
        setPage(0);
      } else {
        setLogs((prev) => (offset === 0 ? result : [...prev, ...result]));
      }
      setHasMore(result.length >= limit);
    } catch {
      setError("Unable to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, [severity, searchAction, searchModule, page]);

  useEffect(() => {
    fetchLogs(true);
  }, [severity, searchAction, searchModule]);

  function loadMore() {
    setPage((p) => p + 1);
    fetchLogs(false);
  }

  return (
    <div style={{ padding: "var(--sp-24)", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-20)" }}>
        <div>
          <h1 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--fw-bold)", color: "var(--clr-primary)", margin: 0, fontFamily: "var(--font-display)" }}>
            Audit Log
          </h1>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)", marginTop: "var(--sp-4)" }}>
            Immutable trail of all platform actions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: "flex",
        gap: "var(--sp-12)",
        marginBottom: "var(--sp-16)",
        flexWrap: "wrap",
        alignItems: "center",
      }}>
        {/* Severity filter */}
        <div className="ws-issue-filters">
          {(["all", "info", "warning", "critical"] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`ws-issue-filter${severity === s ? " active" : ""}`}
              onClick={() => setSeverity(s)}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Action search */}
        <input
          type="text"
          placeholder="Filter by action..."
          value={searchAction}
          onChange={(e) => setSearchAction(e.target.value)}
          style={{
            padding: "var(--sp-6) var(--sp-12)",
            border: "1px solid var(--clr-divider-strong)",
            borderRadius: "var(--r-md)",
            fontSize: "var(--text-sm)",
            background: "var(--canvas-bg)",
            color: "var(--clr-primary)",
            width: 200,
          }}
        />

        {/* Module search */}
        <input
          type="text"
          placeholder="Filter by module..."
          value={searchModule}
          onChange={(e) => setSearchModule(e.target.value)}
          style={{
            padding: "var(--sp-6) var(--sp-12)",
            border: "1px solid var(--clr-divider-strong)",
            borderRadius: "var(--r-md)",
            fontSize: "var(--text-sm)",
            background: "var(--canvas-bg)",
            color: "var(--clr-primary)",
            width: 200,
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: "var(--sp-12) var(--sp-16)", background: "rgba(239,68,68,0.08)", borderRadius: "var(--r-md)", color: "var(--danger)", fontSize: "var(--text-sm)", marginBottom: "var(--sp-16)" }}>
          {error}
        </div>
      )}

      {/* Logs table */}
      <div style={{ background: "var(--clr-surface-card)", borderRadius: "var(--r-lg)", border: "1px solid var(--clr-divider)", overflow: "hidden" }}>
        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "140px 80px 120px 1fr 160px 120px",
          gap: "var(--sp-8)",
          padding: "var(--sp-10) var(--sp-16)",
          borderBottom: "1px solid var(--clr-divider)",
          fontSize: "var(--text-xs)",
          fontWeight: "var(--fw-semibold)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--clr-muted)",
        }}>
          <span>Timestamp</span>
          <span>Severity</span>
          <span>Action</span>
          <span>Details</span>
          <span>User</span>
          <span>Module</span>
        </div>

        {/* Rows */}
        {logs.length === 0 && !loading && (
          <div style={{ padding: "var(--sp-32)", textAlign: "center", fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>
            No audit logs found.
          </div>
        )}
        {logs.map((log) => {
          const sev = SEVERITY_COLORS[log.severity] ?? SEVERITY_COLORS.info;
          return (
            <div
              key={log.id}
              style={{
                display: "grid",
                gridTemplateColumns: "140px 80px 120px 1fr 160px 120px",
                gap: "var(--sp-8)",
                padding: "var(--sp-10) var(--sp-16)",
                borderBottom: "1px solid var(--clr-divider)",
                fontSize: "var(--text-sm)",
                alignItems: "center",
              }}
            >
              <span style={{ color: "var(--clr-muted)", fontSize: "var(--text-xs)" }}>
                {new Date(log.timestamp).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span>
                <span style={{
                  fontSize: "var(--text-micro)",
                  fontWeight: "var(--fw-medium)",
                  color: sev.color,
                  background: sev.bg,
                  padding: "var(--sp-2) var(--sp-8)",
                  borderRadius: "var(--r-full)",
                }}>
                  {log.severity}
                </span>
              </span>
              <span style={{ color: "var(--clr-primary)", fontWeight: "var(--fw-medium)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {log.action}
              </span>
              <span style={{ color: "var(--clr-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {log.resource_type && `${log.resource_type}`}
                {log.client_name && ` - ${log.client_name}`}
                {!log.resource_type && !log.client_name && JSON.stringify(log.details).slice(0, 80)}
              </span>
              <span style={{ color: "var(--clr-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {log.user_name || log.user_email || "System"}
              </span>
              <span style={{ color: "var(--clr-faint)", fontSize: "var(--text-xs)" }}>
                {log.module || "—"}
              </span>
            </div>
          );
        })}

        {/* Loading */}
        {loading && (
          <div style={{ padding: "var(--sp-16)", textAlign: "center", color: "var(--clr-muted)", fontSize: "var(--text-sm)" }}>
            Loading...
          </div>
        )}

        {/* Load more */}
        {!loading && hasMore && logs.length > 0 && (
          <div style={{ padding: "var(--sp-12)", textAlign: "center" }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={loadMore}
              style={{ fontSize: "var(--text-xs)" }}
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
