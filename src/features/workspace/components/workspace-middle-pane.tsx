import { WorkspaceZoneContent } from "./workspace-zone-content";
import type { WorkspaceDemoClient, WorkspaceZone } from "../types";

type WorkspaceMiddlePaneProps = {
  client: WorkspaceDemoClient | null;
  focusedZone: WorkspaceZone | null;
  onOpenZone: (zone: WorkspaceZone) => void;
  onExitFocus: () => void;
};

export function WorkspaceMiddlePane({
  client,
  focusedZone,
  onOpenZone,
  onExitFocus,
}: WorkspaceMiddlePaneProps) {
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
        count:
          focusedZone === "documents"
            ? client.collect?.documentSets?.flatMap((set) => set.items ?? []).filter((item) => item.status !== "received")
                .length ?? 0
            : focusedZone === "calls"
              ? (client.respond?.pendingCallbacks?.length ?? 0) || (client.respond?.summary ? 1 : 0)
              : client.settle?.invoices?.filter((invoice) => invoice.status !== "paid").length ?? 0,
      }
    : null;
  const zoneSummary = [
    {
      zone: "documents" as const,
      label: "Documents",
      color: "var(--collect)",
      count: client.collect?.documentSets?.flatMap((set) => set.items ?? []).filter((item) => item.status !== "received").length ?? 0,
      headline:
        client.collect?.nextEscalation ??
        client.collect?.pendingReview?.[0]?.name ??
        "All clear",
      urgency: client.collect?.status === "action" ? "Escalation" : null,
    },
    {
      zone: "calls" as const,
      label: "Calls",
      color: "var(--respond)",
      count: (client.respond?.pendingCallbacks?.length ?? 0) || (client.respond?.summary ? 1 : 0),
      headline: client.respond?.summary ?? "All clear",
      urgency: client.respond?.pendingCallbacks?.some((call) => call.overdue) ? "Due today" : null,
    },
    {
      zone: "payments" as const,
      label: "Payments",
      color: "var(--settle)",
      count: client.settle?.invoices?.filter((invoice) => invoice.status !== "paid").length ?? 0,
      headline:
        client.settle?.invoices?.find((invoice) => invoice.status === "disputed")?.description ??
        client.settle?.invoices?.[0]?.description ??
        "All clear",
      urgency: client.settle?.invoices?.some((invoice) => invoice.status === "disputed") ? "Escalation" : null,
    },
  ];

  return (
    <div className="ws-middle" id="wsMiddle">
      {!focusedZone ? (
        <div className="ws-middle-header" id="wsMiddleHeader">
          <div className="ws-prev-header">
            <div className="ws-prev-header-top">
              <div>
                <div className="ws-prev-title">{client.name}</div>
                <div className="ws-prev-subtitle">{client.intentDetail ?? client.intent ?? "Workspace preview"}</div>
              </div>
              <div className="u-flex-gap-8">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onOpenZone("documents")}
                >
                  Open workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="ws-focus-header" id="wsFocusHeader">
          <div className="ws-header-row1">
            <div className="ws-header-left">
              <button className="ws-back" id="wsFocusBack" onClick={onExitFocus}>
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back
              </button>
              <div className="ws-focus-identity">
                <div className="ws-focus-name">{client.name}</div>
                <div className="ws-focus-meta">{client.intentDetail ?? client.intent ?? "Workspace focus"}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="ws-content" id="wsContent">
        {!focusedZone ? (
          <div id="wsTriageContent" className="ws-content-pane">
            <div className="ws-prev-content" id="wsPrevContent">
              <div className="ws-section-divider">Command Centre</div>
              <div className="ws-card">
                {zoneSummary.map((zone) => {
                  return (
                    <button
                      key={zone.zone}
                      className={`ws-cmd-row ${zone.count === 0 ? "ws-cmd-clear" : ""}`}
                      onClick={() => onOpenZone(zone.zone)}
                      style={{ borderLeftColor: zone.color }}
                    >
                      <div className="ws-cmd-id" style={{ color: zone.color }}>
                        <span className="ws-cmd-label">{zone.label}</span>
                        {zone.count > 0 ? (
                          <span className="ws-cmd-count" style={{ background: zone.color }}>
                            {zone.count}
                          </span>
                        ) : null}
                      </div>
                      <div className="ws-cmd-headline">
                        {zone.headline || <span className="ws-cmd-allclear">All clear</span>}
                      </div>
                      <div className="ws-cmd-right">
                        {urgency ? <span className="ws-cmd-urg">{urgency}</span> : null}
                        <svg viewBox="0 0 24 24" className="ws-cmd-arrow" aria-hidden="true">
                          <polyline points="9 6 15 12 9 18" />
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div id="wsFocusContent" className="ws-content-pane">
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
        )}
      </div>
    </div>
  );
}
