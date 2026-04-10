"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { importsApi } from "@/lib/api/imports-api";
import type { ImportSessionResponse } from "@/types/imports";

// ---------------------------------------------------------------------------
// Status + platform visual maps
// ---------------------------------------------------------------------------

type StatusVisual = { bg: string; color: string; dot: string };

const STATUS_STYLES: Record<string, StatusVisual> = {
  completed: { bg: "rgba(34,160,107,0.1)",  color: "var(--success)", dot: "var(--success)" },
  processing:{ bg: "rgba(96,165,250,0.1)",  color: "#60A5FA",        dot: "#60A5FA" },
  validated: { bg: "rgba(224,148,34,0.1)",  color: "var(--warning)", dot: "var(--warning)" },
  detected:  { bg: "rgba(139,92,246,0.12)", color: "var(--purple)",  dot: "var(--purple)" },
  pending:   { bg: "rgba(224,148,34,0.1)",  color: "var(--warning)", dot: "var(--warning)" },
  mapped:    { bg: "rgba(224,148,34,0.1)",  color: "var(--warning)", dot: "var(--warning)" },
  uploaded:  { bg: "rgba(224,148,34,0.1)",  color: "var(--warning)", dot: "var(--warning)" },
  failed:    { bg: "rgba(239,68,68,0.1)",   color: "var(--danger)",  dot: "var(--danger)" },
  cancelled: { bg: "rgba(107,114,128,0.1)", color: "var(--clr-muted)", dot: "var(--clr-muted)" },
};

const PLATFORM_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  csv:        { bg: "rgba(107,114,128,0.12)", color: "var(--clr-secondary)", label: "CSV" },
  xero:       { bg: "rgba(19,181,234,0.12)",  color: "#13B5EA",              label: "Xero" },
  quickbooks: { bg: "rgba(16,132,82,0.12)",   color: "#108452",              label: "QuickBooks" },
  sage:       { bg: "rgba(0,220,160,0.12)",   color: "#00DCA0",              label: "Sage" },
};

// Seven columns — File / Platform / Type / Total / Created / Errors / Status
const GRID_COLS = "minmax(0, 1fr) 120px 120px 90px 90px 90px 140px";

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n === 0) return "—";
  return n.toLocaleString("en-GB");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

type FilterKey = "all" | "completed" | "in_progress" | "failed";

export function ImportHistoryPanel() {
  const [sessions, setSessions] = useState<ImportSessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");

  useEffect(() => {
    let cancelled = false;
    importsApi.list({ limit: 50 }).then(
      (result) => {
        if (!cancelled) {
          setSessions(result.items);
          setLoading(false);
        }
      },
      () => {
        if (!cancelled) {
          setError("Unable to load import history.");
          setLoading(false);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const total = sessions.length;
    const completed = sessions.filter((s) => s.status === "completed").length;
    const failed = sessions.filter((s) => s.status === "failed" || s.status === "cancelled").length;
    const inProgress = total - completed - failed;
    return { total, completed, inProgress, failed };
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    switch (filter) {
      case "completed":
        return sessions.filter((s) => s.status === "completed");
      case "failed":
        return sessions.filter((s) => s.status === "failed" || s.status === "cancelled");
      case "in_progress":
        return sessions.filter(
          (s) => s.status !== "completed" && s.status !== "failed" && s.status !== "cancelled",
        );
      default:
        return sessions;
    }
  }, [sessions, filter]);

  // -------- Loading --------
  if (loading) {
    return (
      <div style={cardShell}>
        <SummarySkeleton />
        <TableHeader />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={rowBase}>
            <SkeletonLine width="55%" height={14} />
            <SkeletonLine width="70%" height={20} />
            <SkeletonLine width="50%" height={14} />
            <SkeletonLine width="60%" height={14} />
            <SkeletonLine width="50%" height={14} />
            <SkeletonLine width="40%" height={14} />
            <SkeletonLine width="80%" height={20} />
          </div>
        ))}
      </div>
    );
  }

  // -------- Error --------
  if (error) {
    return (
      <div style={cardShell}>
        <div
          style={{
            padding: "var(--sp-24)",
            background: "rgba(239,68,68,0.06)",
            color: "var(--danger)",
            fontSize: "var(--text-sm)",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  // -------- Empty --------
  if (sessions.length === 0) {
    return (
      <div style={{ ...cardShell, padding: "var(--sp-48) var(--sp-24)" }}>
        <div style={{ textAlign: "center" }}>
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
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
            No imports yet
          </div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>
            Your import history will appear here after your first upload.
          </div>
        </div>
      </div>
    );
  }

  // -------- Main --------
  return (
    <div style={cardShell}>
      {/* Summary stats / filter chips */}
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
          label="Total"
          value={stats.total}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        <FilterStat
          label="Completed"
          value={stats.completed}
          color="var(--success)"
          active={filter === "completed"}
          onClick={() => setFilter("completed")}
        />
        <FilterStat
          label="In progress"
          value={stats.inProgress}
          color="var(--warning)"
          active={filter === "in_progress"}
          onClick={() => setFilter("in_progress")}
        />
        <FilterStat
          label="Failed"
          value={stats.failed}
          color="var(--danger)"
          active={filter === "failed"}
          onClick={() => setFilter("failed")}
        />
      </div>

      <TableHeader />

      {/* Rows */}
      {filteredSessions.length === 0 ? (
        <div
          style={{
            padding: "var(--sp-32) var(--sp-24)",
            textAlign: "center",
            color: "var(--clr-muted)",
            fontSize: "var(--text-sm)",
          }}
        >
          No imports match this filter.
        </div>
      ) : (
        filteredSessions.map((s) => <ImportRow key={s.id} session={s} />)
      )}
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
  gap: "var(--sp-8)",
  padding: "var(--sp-16) var(--sp-24)",
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
        gap: "var(--sp-8)",
        padding: "var(--sp-12) var(--sp-24)",
        background: "var(--clr-surface-subtle)",
        borderBottom: "1px solid var(--clr-divider)",
        fontSize: "var(--text-xs)",
        fontWeight: "var(--fw-semibold)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "var(--clr-muted)",
      }}
    >
      <span>File</span>
      <span>Platform</span>
      <span>Type</span>
      <span style={{ textAlign: "right" }}>Total</span>
      <span style={{ textAlign: "right" }}>Created</span>
      <span style={{ textAlign: "right" }}>Errors</span>
      <span style={{ textAlign: "right" }}>Status</span>
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
        gap: "var(--sp-6)",
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

function ImportRow({ session }: { session: ImportSessionResponse }) {
  const [hover, setHover] = useState(false);
  const statusStyle = STATUS_STYLES[session.status] ?? STATUS_STYLES.pending;
  const platformKey = (session.platform ?? "").toLowerCase();
  const platformStyle =
    PLATFORM_STYLES[platformKey] ?? {
      bg: "rgba(107,114,128,0.12)",
      color: "var(--clr-secondary)",
      label: session.platform || "—",
    };

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
      {/* File */}
      <div style={{ overflow: "hidden", minWidth: 0 }}>
        <div
          style={{
            color: "var(--clr-primary)",
            fontWeight: "var(--fw-medium)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={session.filename ?? "Untitled"}
        >
          {session.filename || "Untitled"}
        </div>
        <div
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--clr-faint)",
            marginTop: 2,
          }}
        >
          {formatDate(session.created_at)}
        </div>
      </div>

      {/* Platform */}
      <Pill bg={platformStyle.bg} color={platformStyle.color}>
        {platformStyle.label}
      </Pill>

      {/* Type */}
      <span
        style={{
          color: "var(--clr-secondary)",
          textTransform: "capitalize",
          fontSize: "var(--text-sm)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {session.data_type}
      </span>

      {/* Total */}
      <span
        style={{
          color: session.total_rows ? "var(--clr-primary)" : "var(--clr-muted)",
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
          fontWeight: session.total_rows ? "var(--fw-medium)" : "var(--fw-normal)",
        }}
      >
        {formatNumber(session.total_rows)}
      </span>

      {/* Created */}
      <span
        style={{
          color: session.records_created ? "var(--success)" : "var(--clr-muted)",
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
          fontWeight: session.records_created ? "var(--fw-medium)" : "var(--fw-normal)",
        }}
      >
        {formatNumber(session.records_created)}
      </span>

      {/* Errors */}
      <span
        style={{
          color: session.error_rows ? "var(--danger)" : "var(--clr-muted)",
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
          fontWeight: session.error_rows ? "var(--fw-medium)" : "var(--fw-normal)",
        }}
      >
        {formatNumber(session.error_rows)}
      </span>

      {/* Status badge */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--sp-6)",
            fontSize: "var(--text-micro)",
            fontWeight: "var(--fw-semibold)",
            color: statusStyle.color,
            background: statusStyle.bg,
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
              background: statusStyle.dot,
              flexShrink: 0,
            }}
          />
          {session.status}
        </span>
      </div>
    </div>
  );
}

function Pill({ bg, color, children }: { bg: string; color: string; children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "var(--sp-4) var(--sp-8)",
        background: bg,
        color,
        borderRadius: "var(--r-sm)",
        fontSize: "var(--text-xs)",
        fontWeight: "var(--fw-medium)",
        width: "fit-content",
        letterSpacing: 0,
      }}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Skeletons
// ---------------------------------------------------------------------------

function SummarySkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: "var(--sp-12)",
        padding: "var(--sp-20) var(--sp-24)",
        borderBottom: "1px solid var(--clr-divider)",
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            padding: "var(--sp-12) var(--sp-16)",
            border: "1px solid var(--clr-divider)",
            borderRadius: "var(--r-md)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--sp-8)",
          }}
        >
          <SkeletonLine width="55%" height={10} />
          <SkeletonLine width="45%" height={22} />
        </div>
      ))}
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
