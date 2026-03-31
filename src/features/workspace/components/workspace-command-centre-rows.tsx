"use client";

import type { WorkspaceZone } from "../types";
import type { WorkspaceTask } from "../workspace-task-stream";

type WorkspaceCommandCentreRowsProps = {
  tasks: WorkspaceTask[];
  onEnterZone: (zone: WorkspaceZone) => void;
};

const ZONES: {
  key: WorkspaceZone;
  label: string;
  color: string;
  agent: "collect" | "respond" | "settle";
  icon: React.ReactNode;
}[] = [
  {
    key: "documents",
    label: "Documents",
    color: "var(--brand)",
    agent: "collect",
    icon: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </>
    ),
  },
  {
    key: "calls",
    label: "Calls",
    color: "var(--purple)",
    agent: "respond",
    icon: (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12 12 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12 12 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    ),
  },
  {
    key: "payments",
    label: "Payments",
    color: "#E09422",
    agent: "settle",
    icon: (
      <>
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </>
    ),
  },
];

function priorityUrgency(t: WorkspaceTask): number {
  if (t.severity === "escalation_risk") return 0;
  if (t.severity === "due_today") return 1;
  if (t.severity === "needs_decision") return 2;
  return 3;
}

export function WorkspaceCommandCentreRows({ tasks, onEnterZone }: WorkspaceCommandCentreRowsProps) {
  const catData = ZONES.map((cat) => {
    const catTasks = tasks.filter((t) => t.category === cat.key);
    let maxUrg = 99;
    catTasks.forEach((t) => {
      const u = priorityUrgency(t);
      if (u < maxUrg) maxUrg = u;
    });
    const top = catTasks[0];
    const hasEsc = catTasks.some((t) => t.severity === "escalation_risk");
    const hasDue = catTasks.some((t) => t.severity === "due_today");
    return {
      ...cat,
      tasks: catTasks,
      count: catTasks.length,
      maxUrgency: catTasks.length ? maxUrg : 99,
      top,
      hasEsc,
      hasDue,
    };
  });

  catData.sort((a, b) => a.maxUrgency - b.maxUrgency);

  return (
    <div className="ws-cmd-zones">
      {catData.map((cd) => {
        const urgHtml = cd.hasEsc ? (
          <span className="ws-cmd-urg ws-cmd-urg-esc">Escalation</span>
        ) : cd.hasDue ? (
          <span className="ws-cmd-urg ws-cmd-urg-due">Due today</span>
        ) : null;
        const rowCls = `ws-cmd-row${cd.count === 0 ? " ws-cmd-clear" : ""}`;

        return (
          <button
            key={cd.key}
            type="button"
            className={rowCls}
            onClick={() => onEnterZone(cd.key)}
            style={{ borderLeftColor: cd.color }}
          >
            <div className="ws-cmd-id" style={{ color: cd.color }}>
              <svg viewBox="0 0 24 24" className="ws-cmd-icon" aria-hidden="true">
                {cd.icon}
              </svg>
              <span className="ws-cmd-label">{cd.label}</span>
              {cd.count > 0 ? (
                <span className="ws-cmd-count" style={{ background: cd.color }}>
                  {cd.count}
                </span>
              ) : null}
            </div>
            <div className="ws-cmd-headline">
              {cd.top ? (
                <>
                  <span
                    className="ws-cmd-pill"
                    style={{
                      borderColor: cd.color,
                      color: cd.color,
                      textTransform: "capitalize",
                      fontSize: "var(--text-2xs)",
                    }}
                  >
                    {cd.top.pill.toLowerCase()}
                  </span>{" "}
                  {cd.top.headline}
                </>
              ) : (
                <span className="ws-cmd-allclear">All clear</span>
              )}
            </div>
            <div className="ws-cmd-right">
              {urgHtml}
              <svg viewBox="0 0 24 24" className="ws-cmd-arrow" aria-hidden="true">
                <polyline points="9 6 15 12 9 18" />
              </svg>
            </div>
          </button>
        );
      })}
    </div>
  );
}
