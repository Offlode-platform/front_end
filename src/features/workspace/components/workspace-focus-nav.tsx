"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { WorkspaceZone } from "../types";
import type { WorkspaceTask } from "../workspace-task-stream";

const catLabels: Record<WorkspaceZone, string> = {
  documents: "Documents",
  calls: "Calls",
  payments: "Payments",
};

const catColors: Record<WorkspaceZone, string> = {
  documents: "var(--collect)",
  calls: "var(--respond)",
  payments: "var(--settle)",
};

type WorkspaceFocusNavProps = {
  tasks: WorkspaceTask[];
  mode: "ref" | "zone";
  focusedZone: WorkspaceZone | null;
  onOpenZone: (zone: WorkspaceZone) => void;
};

function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 13, height: 13, opacity: 0.7 }}>
      <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 13, height: 13, opacity: 0.7 }}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12 12 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12 12 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
      />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 13, height: 13, opacity: 0.7 }}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth={2} />
      <line x1="1" y1="10" x2="23" y2="10" fill="none" stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}

const pillIcons: Record<WorkspaceZone, ReactNode> = {
  documents: <DocIcon />,
  calls: <PhoneIcon />,
  payments: <CardIcon />,
};

export function WorkspaceFocusNav({ tasks, mode, focusedZone, onOpenZone }: WorkspaceFocusNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);

  const counts: Record<WorkspaceZone, number> = {
    documents: tasks.filter((t) => t.category === "documents").length,
    calls: tasks.filter((t) => t.category === "calls").length,
    payments: tasks.filter((t) => t.category === "payments").length,
  };

  if (mode === "zone" && focusedZone) {
    return (
      <div className="ws-content-nav" id="wsFocusNav">
        {(["documents", "calls", "payments"] as const).map((key) => {
          const isActive = key === focusedZone;
          const count = counts[key];
          const color = catColors[key];
          const label = catLabels[key];
          if (isActive) {
            return (
              <span
                key={key}
                className="ws-switch-pill ws-switch-active"
                style={{
                  background: color,
                  borderColor: color,
                  color: "#fff",
                  opacity: 1,
                }}
              >
                {pillIcons[key]} {label}
                {count > 0 ? (
                  <span className="ws-switch-count" style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}>
                    {count}
                  </span>
                ) : null}
              </span>
            );
          }
          const emptyStyle = count === 0 ? { opacity: 0.45 } : undefined;
          return (
            <button
              key={key}
              type="button"
              className="ws-switch-pill"
              style={{ borderColor: color, color: color, ...emptyStyle }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenZone(key);
              }}
            >
              {pillIcons[key]} {label}
              {count > 0 ? <span className="ws-switch-count">{count}</span> : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="ws-content-nav" id="wsFocusNav" ref={wrapRef}>
      <button
        type="button"
        className="ws-areas-btn"
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((o) => !o);
        }}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
        Areas
        <svg viewBox="0 0 24 24" style={{ width: 10, height: 10, marginLeft: "var(--sp-2)" }} aria-hidden="true">
          <polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" strokeWidth={2} />
        </svg>
      </button>
      <div className={`ws-areas-menu${menuOpen ? " open" : ""}`} id="wsAreasMenu">
        <button
          type="button"
          className="ws-areas-item"
          onClick={() => {
            setMenuOpen(false);
            onOpenZone("documents");
          }}
        >
          <DocIcon />
          Documents
          {counts.documents > 0 ? <span className="ws-areas-count">{counts.documents}</span> : null}
        </button>
        <button
          type="button"
          className="ws-areas-item"
          onClick={() => {
            setMenuOpen(false);
            onOpenZone("calls");
          }}
        >
          <PhoneIcon />
          Calls
          {counts.calls > 0 ? <span className="ws-areas-count">{counts.calls}</span> : null}
        </button>
        <button
          type="button"
          className="ws-areas-item"
          onClick={() => {
            setMenuOpen(false);
            onOpenZone("payments");
          }}
        >
          <CardIcon />
          Payments
          {counts.payments > 0 ? <span className="ws-areas-count">{counts.payments}</span> : null}
        </button>
      </div>
    </div>
  );
}
