import type { WorkspaceDemoClient } from "../types";

type WorkspaceClientListProps = {
  clients: WorkspaceDemoClient[];
  activeFilter: "needs-input" | "handled";
  showVipOnly: boolean;
  onFilterChange: (next: "needs-input" | "handled") => void;
  onToggleVip: () => void;
  selectedClientId: string | null;
  onSelectClient: (clientId: string) => void;
};

export function WorkspaceClientList({
  clients,
  activeFilter,
  showVipOnly,
  onFilterChange,
  onToggleVip,
  selectedClientId,
  onSelectClient,
}: WorkspaceClientListProps) {
  const filteredClients = clients.filter((client) => {
    const hasWork =
      (client.collect?.status && client.collect.status !== "handled") ||
      (client.respond?.status && client.respond.status !== "handled") ||
      (client.settle?.status && client.settle.status !== "handled");
    const statusBucket = hasWork ? "needs-input" : "handled";
    if (statusBucket !== activeFilter) return false;
    if (showVipOnly && !client.vip) return false;
    return true;
  });

  const needsCount = clients.filter((c) => {
    return (
      (c.collect?.status && c.collect.status !== "handled") ||
      (c.respond?.status && c.respond.status !== "handled") ||
      (c.settle?.status && c.settle.status !== "handled")
    );
  }).length;
  const vipCount = clients.filter((c) => c.vip).length;

  return (
    <div className="ws-list" id="wsList">
      <div className="ws-list-header">
        <div className="ws-search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input type="text" placeholder="Search clients..." disabled />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)", width: "100%" }}>
          <div className="ws-segment" id="wsSegment">
            <button
              className={`ws-seg ${activeFilter === "needs-input" ? "active" : ""}`}
              data-seg="needs"
              onClick={() => onFilterChange("needs-input")}
            >
              Needs Input
              <span className="ws-seg-count" id="wsNeedsCount">
                {needsCount}
              </span>
            </button>
            <button
              className={`ws-seg ${activeFilter === "handled" ? "active" : ""}`}
              data-seg="clear"
              onClick={() => onFilterChange("handled")}
            >
              Handled
            </button>
          </div>

          <button className={`ws-vip-toggle ${showVipOnly ? "active" : ""}`} id="wsVipToggle" onClick={onToggleVip}>
            <svg aria-hidden="true" viewBox="0 0 24 24" style={{ width: 13, height: 13 }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            VIP
            <span className="ws-seg-count" id="wsVipCount">
              {vipCount}
            </span>
          </button>
        </div>
      </div>

      <div className="ws-items" id="wsItems" role="listbox" aria-label="Client list">
        {filteredClients.map((client) => {
          const openIssues =
            (client.collect?.status === "action" ? 1 : 0) +
            (client.respond?.status === "action" ? 1 : 0) +
            (client.settle?.status === "action" ? 1 : 0);
          const urgencyClass = openIssues >= 2 ? "red" : openIssues === 1 ? "amber" : "green";
          const selected = String(client.id) === selectedClientId;
          return (
            <button key={client.id} className={`ws-item ${selected ? "selected" : ""}`} onClick={() => onSelectClient(String(client.id))}>
              <span className={`ws-item-bar ${urgencyClass}`} />
              <div className="ws-item-info">
                <div className="ws-item-name">{client.name}</div>
                <div className="ws-item-meta">{client.intentDetail ?? client.intent ?? "Client workspace"}</div>
              </div>
              <svg className="ws-item-chevron" viewBox="0 0 24 24" aria-hidden="true">
                <polyline points="9 6 15 12 9 18" />
              </svg>
            </button>
          );
        })}
      </div>

      <div className="ws-list-footer" id="wsFooter">
        {filteredClients.length} Clients
      </div>
    </div>
  );
}
