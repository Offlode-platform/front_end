"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { auditLogsApi } from "@/lib/api/audit-logs-api";
import type { AuditLogResponse, AuditLogFilter } from "@/types/audit-logs";

// ---------------------------------------------------------------------------
// Types + visual maps
// ---------------------------------------------------------------------------

type SeverityFilter = "all" | "info" | "warning" | "critical";

type SeverityVisual = { bg: string; color: string; dot: string; label: string };

const SEVERITY_STYLES: Record<string, SeverityVisual> = {
  info: {
    bg: "rgba(96,165,250,0.12)",
    color: "#60A5FA",
    dot: "#60A5FA",
    label: "Info",
  },
  warning: {
    bg: "rgba(224,148,34,0.12)",
    color: "var(--warning)",
    dot: "var(--warning)",
    label: "Warning",
  },
  critical: {
    bg: "rgba(239,68,68,0.14)",
    color: "var(--danger)",
    dot: "var(--danger)",
    label: "Critical",
  },
};

// 6 columns — Timestamp / Severity / Action / Details / User / Module
const GRID_COLS = "160px 110px 180px minmax(0, 1fr) 180px 140px";

const LIMIT = 50;

const MONO_FONT =
  'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace';

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): { short: string; full: string } {
  const d = new Date(iso);
  const short = d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const full = d.toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return { short, full };
}

function extractDetails(log: AuditLogResponse): string {
  if (log.resource_type && log.client_name) {
    return `${log.resource_type} — ${log.client_name}`;
  }
  if (log.resource_type) return log.resource_type;
  if (log.client_name) return log.client_name;
  try {
    const keys = Object.keys(log.details || {});
    if (keys.length > 0) {
      const first = keys[0];
      const value = (log.details as Record<string, unknown>)[first];
      return `${first}: ${typeof value === "string" ? value : JSON.stringify(value)}`;
    }
  } catch {
    /* ignore */
  }
  return "—";
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function AuditLogPageView() {
  const [logs, setLogs] = useState<AuditLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [searchAction, setSearchAction] = useState("");
  const [searchModule, setSearchModule] = useState("");
  const [hasMore, setHasMore] = useState(true);

  const fetchLogs = useCallback(
    async (offset: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const filter: AuditLogFilter = { skip: offset, limit: LIMIT };
        if (severity !== "all") filter.severity = severity;
        if (searchAction.trim()) filter.action = searchAction.trim();
        if (searchModule.trim()) filter.module = searchModule.trim();

        const result = await auditLogsApi.list(filter);
        setLogs((prev) => (append ? [...prev, ...result] : result));
        setHasMore(result.length >= LIMIT);
      } catch {
        setError("Unable to load audit logs.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [severity, searchAction, searchModule],
  );

  // Refetch from scratch whenever the filters change.
  useEffect(() => {
    fetchLogs(0, false);
  }, [fetchLogs]);

  // Summary stats come from the loaded set. They show what's visible, not the
  // global corpus — keeping this honest avoids a second API call.
  const stats = useMemo(() => {
    const info = logs.filter((l) => l.severity === "info").length;
    const warning = logs.filter((l) => l.severity === "warning").length;
    const critical = logs.filter((l) => l.severity === "critical").length;
    return { total: logs.length, info, warning, critical };
  }, [logs]);

  return (
    <div
      className="page active"
      id="page-audit-log"
      style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
    >
      {/* Page bar — matches Dashboard / Clients / Imports */}
      <div className="page-bar" style={{ flexShrink: 0 }}>
        <div className="page-bar-left">
          <div>
            <div className="pg-title">Audit Log</div>
            <div className="pg-subtitle">
              Immutable trail of every action performed across your organization.
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="dash-content">
        {/* Error banner (only shown on error) */}
        {error && (
          <div
            style={{
              marginBottom: "var(--sp-16)",
              padding: "var(--sp-12) var(--sp-16)",
              background: "rgba(239,68,68,0.06)",
              color: "var(--danger)",
              fontSize: "var(--text-sm)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "var(--r-md)",
            }}
          >
            {error}
          </div>
        )}

        {/*
          Everything lives inside a single card with internal sections
          separated by dividers — matches the Import History panel pattern
          exactly. Section order: stats → search → table header → rows → footer.
        */}
        <div style={cardShell}>
          {/* Stats section — compact clickable filter cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "var(--sp-12)",
              padding: "var(--sp-20) var(--sp-24)",
              borderBottom: "1px solid var(--clr-divider)",
            }}
          >
            <FilterStat
              label="All events"
              value={stats.total}
              active={severity === "all"}
              onClick={() => setSeverity("all")}
            />
            <FilterStat
              label="Info"
              value={stats.info}
              color="#60A5FA"
              active={severity === "info"}
              onClick={() => setSeverity("info")}
            />
            <FilterStat
              label="Warning"
              value={stats.warning}
              color="var(--warning)"
              active={severity === "warning"}
              onClick={() => setSeverity("warning")}
            />
            <FilterStat
              label="Critical"
              value={stats.critical}
              color="var(--danger)"
              active={severity === "critical"}
              onClick={() => setSeverity("critical")}
            />
          </div>

          {/* Search section — inline toolbar inside the same card */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
              gap: "var(--sp-12)",
              padding: "var(--sp-16) var(--sp-24)",
              borderBottom: "1px solid var(--clr-divider)",
            }}
          >
            <SearchInput
              placeholder="Filter by action (e.g. client_created)"
              value={searchAction}
              onChange={setSearchAction}
            />
            <SearchInput
              placeholder="Filter by module"
              value={searchModule}
              onChange={setSearchModule}
            />
          </div>

          <TableHeader />

          {loading ? (
            <>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} style={rowBase}>
                  <SkeletonLine width="80%" height={12} />
                  <SkeletonLine width="60%" height={18} />
                  <SkeletonLine width="70%" height={14} />
                  <SkeletonLine width="90%" height={14} />
                  <SkeletonLine width="70%" height={14} />
                  <SkeletonLine width="50%" height={14} />
                </div>
              ))}
            </>
          ) : logs.length === 0 ? (
            <EmptyState filtered={severity !== "all" || !!searchAction || !!searchModule} />
          ) : (
            logs.map((log) => <LogRow key={log.id} log={log} />)
          )}

          {/* Load more footer */}
          {!loading && hasMore && logs.length > 0 && (
            <div
              style={{
                padding: "var(--sp-16)",
                textAlign: "center",
                borderTop: "1px solid var(--clr-divider)",
                background: "var(--clr-surface-subtle)",
              }}
            >
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => fetchLogs(logs.length, true)}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

const cardShell: CSSProperties = {
  background: "var(--clr-surface-card)",
  borderRadius: "var(--r-lg)",
  border: "1px solid var(--clr-divider)",
  overflow: "hidden",
};

const rowBase: CSSProperties = {
  display: "grid",
  gridTemplateColumns: GRID_COLS,
  gap: "var(--sp-12)",
  padding: "var(--sp-14) var(--sp-20)",
  borderBottom: "1px solid var(--clr-divider)",
  fontSize: "var(--text-sm)",
  alignItems: "center",
};

function TableHeader() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: GRID_COLS,
        gap: "var(--sp-12)",
        padding: "var(--sp-12) var(--sp-20)",
        background: "var(--clr-surface-subtle)",
        borderBottom: "1px solid var(--clr-divider)",
        fontSize: "var(--text-xs)",
        fontWeight: "var(--fw-semibold)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "var(--clr-muted)",
      }}
    >
      <span>Timestamp</span>
      <span>Severity</span>
      <span>Action</span>
      <span>Details</span>
      <span>User</span>
      <span>Module</span>
    </div>
  );
}

function FilterStat({
  label,
  value,
  color,
  active,
  onClick,
}: {
  label: string;
  value: number;
  color?: string;
  active: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: "var(--sp-4)",
        padding: "var(--sp-12) var(--sp-16)",
        background: active
          ? "var(--clr-surface-subtle)"
          : hover
          ? "var(--clr-surface-subtle)"
          : "transparent",
        border: `1px solid ${active ? "var(--brand)" : "var(--clr-divider)"}`,
        borderRadius: "var(--r-md)",
        cursor: "pointer",
        textAlign: "left",
        transition: "border-color 0.15s, background-color 0.15s",
        fontFamily: "inherit",
      }}
    >
      <span
        style={{
          fontSize: "var(--text-xs)",
          fontWeight: "var(--fw-medium)",
          color: "var(--clr-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "var(--text-stat)",
          fontWeight: "var(--fw-semibold)",
          color: color ?? "var(--clr-primary)",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </button>
  );
}

function SearchInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--clr-muted)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          position: "absolute",
          left: "var(--sp-12)",
          pointerEvents: "none",
        }}
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1,
          width: "100%",
          padding: "var(--sp-8) var(--sp-12) var(--sp-8) var(--sp-32)",
          border: `1px solid ${focused ? "var(--brand)" : "var(--clr-divider)"}`,
          borderRadius: "var(--r-md)",
          fontSize: "var(--text-sm)",
          background: "var(--clr-surface-subtle)",
          color: "var(--clr-primary)",
          fontFamily: "inherit",
          outline: "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
          boxShadow: focused ? "0 0 0 3px rgba(53,126,146,0.1)" : "none",
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear"
          style={{
            position: "absolute",
            right: "var(--sp-8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 20,
            height: 20,
            padding: 0,
            background: "transparent",
            border: "none",
            color: "var(--clr-muted)",
            cursor: "pointer",
            borderRadius: "var(--r-sm)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}

function LogRow({ log }: { log: AuditLogResponse }) {
  const [hover, setHover] = useState(false);
  const sev = SEVERITY_STYLES[log.severity] ?? SEVERITY_STYLES.info;
  const { short, full } = formatDate(log.timestamp);
  const userName = log.user_name || log.user_email || "System";
  const isSystem = !log.user_name && !log.user_email;
  const details = extractDetails(log);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...rowBase,
        background: hover ? "var(--clr-surface-subtle)" : "transparent",
        transition: "background-color 0.12s",
      }}
    >
      {/* Timestamp */}
      <span
        title={full}
        style={{
          color: "var(--clr-muted)",
          fontSize: "var(--text-xs)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {short}
      </span>

      {/* Severity badge with dot */}
      <div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--sp-6)",
            fontSize: "var(--text-micro)",
            fontWeight: "var(--fw-semibold)",
            color: sev.color,
            background: sev.bg,
            padding: "var(--sp-4) var(--sp-12)",
            borderRadius: "var(--r-full)",
            textTransform: "capitalize",
            lineHeight: 1.4,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: sev.dot,
              flexShrink: 0,
            }}
          />
          {sev.label}
        </span>
      </div>

      {/* Action (monospace for that "code/event name" feel) */}
      <span
        title={log.action}
        style={{
          fontFamily: MONO_FONT,
          fontSize: "var(--text-xs)",
          color: "var(--clr-primary)",
          fontWeight: "var(--fw-medium)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {log.action}
      </span>

      {/* Details */}
      <span
        title={details}
        style={{
          color: "var(--clr-secondary)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: 0,
        }}
      >
        {details}
      </span>

      {/* User with avatar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--sp-8)",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        <UserAvatar name={userName} system={isSystem} />
        <span
          style={{
            color: isSystem ? "var(--clr-muted)" : "var(--clr-primary)",
            fontSize: "var(--text-sm)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontStyle: isSystem ? "italic" : "normal",
          }}
        >
          {userName}
        </span>
      </div>

      {/* Module */}
      <span
        style={{
          color: "var(--clr-faint)",
          fontSize: "var(--text-xs)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {log.module || "—"}
      </span>
    </div>
  );
}

function UserAvatar({ name, system }: { name: string; system: boolean }) {
  if (system) {
    return (
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "var(--clr-surface-subtle)",
          border: "1px solid var(--clr-divider)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--clr-muted)",
          flexShrink: 0,
        }}
        aria-label="System"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </div>
    );
  }
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: "linear-gradient(135deg, rgba(53,126,146,0.25), rgba(139,92,246,0.25))",
        border: "1px solid var(--clr-divider)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--clr-primary)",
        fontSize: "var(--text-xs)",
        fontWeight: "var(--fw-semibold)",
        flexShrink: 0,
        letterSpacing: 0,
      }}
      aria-label={name}
    >
      {initialsOf(name) || "?"}
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div style={{ padding: "var(--sp-48) var(--sp-24)", textAlign: "center" }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "var(--clr-surface-subtle)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "var(--sp-16)",
        }}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--clr-muted)"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      </div>
      <div
        style={{
          fontSize: "var(--text-md)",
          fontWeight: "var(--fw-semibold)",
          color: "var(--clr-primary)",
          marginBottom: "var(--sp-4)",
        }}
      >
        {filtered ? "No events match your filters" : "No audit events yet"}
      </div>
      <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>
        {filtered
          ? "Try clearing a filter or choosing a different severity."
          : "Actions performed across your workspace will appear here as they happen."}
      </div>
    </div>
  );
}

function SkeletonLine({ width, height }: { width: string | number; height: number }) {
  return (
    <div
      style={{
        width,
        height,
        background: "var(--clr-surface-subtle)",
        borderRadius: "var(--r-sm)",
      }}
    />
  );
}

