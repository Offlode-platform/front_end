"use client";

import { useMemo, useState } from "react";
import { buildUnifiedTimelineEvents, type TimelineAgent } from "../workspace-unified-timeline";
import type { WorkspaceDemoClient } from "../types";

type FilterKey = "all" | TimelineAgent;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "documents", label: "Documents" },
  { key: "calls", label: "Calls" },
  { key: "payments", label: "Payments" },
];

const AGENT_LABEL: Record<TimelineAgent, string> = {
  documents: "Documents",
  calls: "Calls",
  payments: "Payments",
};

const AGENT_COLOR: Record<TimelineAgent, string> = {
  documents: "var(--collect)",
  calls: "var(--respond)",
  payments: "var(--settle)",
};

type WorkspaceUnifiedTimelineProps = {
  client: WorkspaceDemoClient;
  firstName: string;
};

export function WorkspaceUnifiedTimeline({ client, firstName }: WorkspaceUnifiedTimelineProps) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const events = useMemo(() => buildUnifiedTimelineEvents(client, firstName), [client, firstName]);

  const visible = useMemo(() => {
    if (filter === "all") return events;
    return events.filter((e) => e.agent === filter);
  }, [events, filter]);

  return (
    <>
      <div style={{ marginBottom: "var(--sp-24)" }}>
        <span style={{ fontSize: "var(--text-lg)", fontWeight: "var(--fw-semibold)", color: "var(--clr-primary)" }}>
          Activity
        </span>
      </div>

      <div className="ws-card" style={{ padding: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--sp-4)",
            padding: "var(--sp-12) var(--sp-16)",
            borderBottom: "1px solid var(--clr-divider)",
            flexWrap: "wrap",
          }}
        >
          {FILTERS.map(({ key, label }) => {
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                className={`ws-timeline-filter${active ? " active" : ""}`}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            );
          })}
        </div>

        {visible.length === 0 ? (
          <div style={{ textAlign: "center", padding: "var(--sp-32) var(--sp-16)", color: "var(--clr-muted)" }}>
            <div style={{ fontSize: "var(--text-base)", fontWeight: "var(--fw-medium)", marginBottom: "var(--sp-4)" }}>
              No activity recorded
            </div>
            <div style={{ fontSize: "var(--text-sm)" }}>
              When calls, document requests, uploads, or payment actions occur, they will appear here.
            </div>
          </div>
        ) : (
          <div style={{ padding: "var(--sp-8) var(--sp-16) var(--sp-16)" }}>
            {visible.map((evt, idx) => (
              <div
                key={`${evt.time}-${evt.text}-${idx}`}
                className="ws-timeline-item"
                data-agent={evt.agent}
                style={{
                  display: "flex",
                  gap: "var(--sp-12)",
                  padding: "var(--sp-12) 0",
                  borderBottom: idx < visible.length - 1 ? "1px solid var(--clr-divider)" : undefined,
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 72,
                    fontSize: "var(--text-xs)",
                    color: "var(--clr-muted)",
                    paddingTop: "var(--sp-2)",
                  }}
                >
                  {evt.time}
                </div>
                <div
                  style={{
                    width: 3,
                    flexShrink: 0,
                    borderRadius: 2,
                    background: AGENT_COLOR[evt.agent],
                    opacity: 0.4,
                    margin: "var(--sp-4) 0",
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-secondary)", lineHeight: "var(--lh-normal)" }}>
                    {evt.text}
                  </div>
                  {evt.detail ? (
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginTop: "var(--sp-2)" }}>{evt.detail}</div>
                  ) : null}
                </div>
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: "var(--text-micro)",
                    fontWeight: "var(--fw-normal)",
                    textTransform: "uppercase",
                    letterSpacing: "var(--ls-label)",
                    color: AGENT_COLOR[evt.agent],
                    opacity: 0.7,
                    paddingTop: "var(--sp-2)",
                  }}
                >
                  {AGENT_LABEL[evt.agent]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
