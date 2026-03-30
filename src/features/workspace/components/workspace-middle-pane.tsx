"use client";

import { useMemo } from "react";
import { WorkspaceCommandCentreRows } from "./workspace-command-centre-rows";
import { WorkspaceJarvisCommand } from "./workspace-jarvis-command";
import type { RefSurface } from "./workspace-ref-surface";
import { WorkspaceRefSurface } from "./workspace-ref-surface";
import { WorkspaceZoneContent } from "./workspace-zone-content";
import type { WorkspaceDemoClient, WorkspaceZone } from "../types";
import { buildWorkspaceTaskStream } from "../workspace-task-stream";

type WorkspaceMiddlePaneProps = {
  client: WorkspaceDemoClient | null;
  focusedZone: WorkspaceZone | null;
  refSurface: RefSurface | null;
  onOpenZone: (zone: WorkspaceZone) => void;
  onExitFocus: () => void;
  onOpenRef: (surface: RefSurface) => void;
  onCloseRef: () => void;
};

function HeaderRefIcons({ onOpenRef }: { onOpenRef: (surface: RefSurface) => void }) {
  return (
    <div className="ws-header-right">
      <button type="button" className="ws-ref-icon" title="Client records" onClick={() => onOpenRef("records")}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      </button>
      <button type="button" className="ws-ref-icon" title="Activity timeline" onClick={() => onOpenRef("activity")}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </button>
      <button type="button" className="ws-ref-icon" title="Client notes" onClick={() => onOpenRef("notes")}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      </button>
      <button type="button" className="ws-ref-icon" title="Client settings" onClick={() => onOpenRef("settings")}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09" />
        </svg>
      </button>
    </div>
  );
}

export function WorkspaceMiddlePane({
  client,
  focusedZone,
  refSurface,
  onOpenZone,
  onExitFocus,
  onOpenRef,
  onCloseRef,
}: WorkspaceMiddlePaneProps) {
  const tasks = useMemo(() => (client ? buildWorkspaceTaskStream(client) : []), [client]);
  const firstName = useMemo(() => {
    if (!client) return "";
    return (client.contact ?? client.name).split(" ")[0] ?? "";
  }, [client]);

  const activeZone = focusedZone
    ? {
        zone: focusedZone,
        label: focusedZone === "documents" ? "Documents" : focusedZone === "calls" ? "Calls" : "Payments",
        color:
          focusedZone === "documents"
            ? "var(--collect)"
            : focusedZone === "calls"
              ? "var(--respond)"
              : "var(--settle)",
        count: tasks.filter((t) => t.category === focusedZone).length,
      }
    : null;

  const showTriage = !focusedZone && !refSurface;
  const showFocusChrome = Boolean(focusedZone || refSurface);

  const handleBack = () => {
    if (refSurface) {
      onCloseRef();
      return;
    }
    if (focusedZone) {
      onExitFocus();
    }
  };

  if (!client) {
    return (
      <div className="ws-middle" id="wsMiddle">
        <div className="ws-content" id="wsContent">
          <div className="ws-brief ws-fade" id="wsBrief">
            <div className="ws-brief-greeting">Needs your input</div>
            <div className="ws-brief-sub">Select a client to open command centre.</div>
          </div>
        </div>
      </div>
    );
  }

  const metaLine = [client.contact, client.legalEntity].filter(Boolean).join(" · ");

  return (
    <div className="ws-middle" id="wsMiddle">
      {showTriage ? (
        <div className="ws-middle-header" id="wsMiddleHeader">
          <div className="ws-prev-header">
            <div className="ws-prev-header-top">
              <div>
                <div className="ws-prev-title">{client.name}</div>
                <div className="ws-prev-subtitle">{metaLine || client.intentDetail || client.intent || "Workspace preview"}</div>
              </div>
              <div className="u-flex-gap-8" style={{ alignItems: "center" }}>
                <HeaderRefIcons onOpenRef={onOpenRef} />
                <button className="btn btn-primary btn-sm" type="button" onClick={() => onOpenZone("documents")}>
                  Open workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showFocusChrome ? (
        <div className="ws-focus-header" id="wsFocusHeader">
          <div className="ws-header-row1">
            <div className="ws-header-left">
              <button className="ws-back" id="wsFocusBack" type="button" onClick={handleBack}>
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back
              </button>
              <div className="ws-focus-identity">
                <div className="ws-focus-name">{client.name}</div>
                <div className="ws-focus-meta">{metaLine || client.intentDetail || client.intent || "Workspace"}</div>
              </div>
            </div>
            <HeaderRefIcons onOpenRef={onOpenRef} />
          </div>
        </div>
      ) : null}

      <div className="ws-content" id="wsContent">
        {showTriage ? (
          <div id="wsTriageContent" className="ws-content-pane active">
            <div className="ws-prev-content" id="wsPrevContent">
              <WorkspaceJarvisCommand
                client={client}
                tasks={tasks}
                firstName={firstName}
                onOpenWorkspace={() => onOpenZone("documents")}
              />
              <WorkspaceCommandCentreRows tasks={tasks} onEnterZone={onOpenZone} />
            </div>
          </div>
        ) : null}

        {refSurface ? (
          <div id="wsRefContent" className="ws-content-pane active">
            <div className="ws-focus-content">
              <WorkspaceRefSurface client={client} surface={refSurface} />
            </div>
          </div>
        ) : null}

        {focusedZone && !refSurface ? (
          <div id="wsFocusContent" className="ws-content-pane active">
            <div className="ws-focus-content">
              <div className="ws-panel active" id="wsPanel-overview">
                <div className="ws-mode-banner" style={{ borderLeft: `4px solid ${activeZone?.color ?? "var(--brand)"}` }}>
                  <span className="ws-mode-title" style={{ color: activeZone?.color ?? "var(--brand)" }}>
                    {activeZone?.label ?? "Zone"}
                  </span>
                  <span className="ws-mode-count">
                    {activeZone?.count ?? 0} item{(activeZone?.count ?? 0) === 1 ? "" : "s"} need attention
                  </span>
                </div>
                <WorkspaceZoneContent client={client} zone={focusedZone} />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
