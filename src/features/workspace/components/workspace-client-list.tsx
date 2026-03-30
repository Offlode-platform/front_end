"use client";

import { useMemo, useState } from "react";
import type { WorkspaceDemoClient } from "../types";
import { getClientWorkspaceTaskCount, listSeverityRaw } from "../workspace-task-stream";

type WorkspaceClientListProps = {
  clients: WorkspaceDemoClient[];
  activeFilter: "needs-input" | "handled";
  showVipOnly: boolean;
  onFilterChange: (next: "needs-input" | "handled") => void;
  onToggleVip: () => void;
  selectedClientId: string | null;
  onSelectClient: (clientId: string) => void;
};

function truncateDesc(text: string, max = 50): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

export function WorkspaceClientList({
  clients,
  activeFilter,
  showVipOnly,
  onFilterChange,
  onToggleVip,
  selectedClientId,
  onSelectClient,
}: WorkspaceClientListProps) {
  const [search, setSearch] = useState("");

  const searchLower = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      if (searchLower && !c.name.toLowerCase().includes(searchLower)) return false;
      if (showVipOnly) return Boolean(c.vip);
      const listSev = listSeverityRaw(c);
      const bucket = listSev === "action" || listSev === "review" ? "needs-input" : "handled";
      return bucket === activeFilter;
    });
  }, [clients, searchLower, showVipOnly, activeFilter]);

  const actionClients = useMemo(
    () => filtered.filter((c) => c.urgentItem?.severity === "action"),
    [filtered],
  );
  const reviewClients = useMemo(
    () => filtered.filter((c) => c.urgentItem?.severity === "review"),
    [filtered],
  );

  const needsCount = useMemo(() => {
    return clients.filter((c) => {
      const sev = c.urgentItem?.severity ?? "handled";
      return sev === "action" || sev === "review";
    }).length;
  }, [clients]);

  const vipCount = useMemo(() => clients.filter((c) => c.vip).length, [clients]);

  const showActionReviewGroups = activeFilter === "needs-input" && !showVipOnly;

  return (
    <div className="ws-list" id="wsList">
      <div className="ws-list-header">
        <div className="ws-search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search clients"
          />
        </div>

        <div className="ws-list-header-controls">
          <div className="ws-segment" id="wsSegment">
            <button
              className={`ws-seg ${activeFilter === "needs-input" ? "active" : ""}`}
              data-seg="needs"
              type="button"
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
              type="button"
              onClick={() => onFilterChange("handled")}
            >
              Handled
            </button>
          </div>

          <button
            className={`ws-vip-toggle ws-vip-toggle--full ${showVipOnly ? "active" : ""}`}
            id="wsVipToggle"
            type="button"
            onClick={onToggleVip}
          >
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
        {showActionReviewGroups ? (
          <>
            {actionClients.length > 0 ? (
              <>
                <div className="ws-list-section">
                  Action Required <span className="ws-list-section-count">{actionClients.length}</span>
                </div>
                {actionClients.map((client) => (
                  <ClientListRow
                    key={client.id}
                    client={client}
                    selected={String(client.id) === selectedClientId}
                    onSelect={() => onSelectClient(String(client.id))}
                  />
                ))}
              </>
            ) : null}
            {reviewClients.length > 0 ? (
              <>
                <div className="ws-list-section">
                  Review <span className="ws-list-section-count">{reviewClients.length}</span>
                </div>
                {reviewClients.map((client) => (
                  <ClientListRow
                    key={client.id}
                    client={client}
                    selected={String(client.id) === selectedClientId}
                    onSelect={() => onSelectClient(String(client.id))}
                  />
                ))}
              </>
            ) : null}
          </>
        ) : (
          <>
            {filtered.length > 0 ? (
              <div className="ws-list-section">
                {showVipOnly ? "VIP Clients" : "Handled"}{" "}
                <span className="ws-list-section-count">{filtered.length}</span>
              </div>
            ) : null}
            {filtered.map((client) => (
              <ClientListRow
                key={client.id}
                client={client}
                selected={String(client.id) === selectedClientId}
                onSelect={() => onSelectClient(String(client.id))}
              />
            ))}
          </>
        )}
      </div>

      <div className="ws-list-footer" id="wsFooter">
        {filtered.length} client{filtered.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

type ClientListRowProps = {
  client: WorkspaceDemoClient;
  selected: boolean;
  onSelect: () => void;
};

function ClientListRow({ client, selected, onSelect }: ClientListRowProps) {
  const rawSev = client.urgentItem?.severity ?? "handled";
  const barColor = rawSev === "action" ? "red" : rawSev === "review" ? "amber" : "green";
  const desc = truncateDesc(client.urgentItem?.desc ?? "");
  const taskCount = getClientWorkspaceTaskCount(client);
  const rawSevClass = rawSev === "action" ? " urgent" : rawSev === "review" ? " review" : "";
  const countBadge =
    taskCount > 0 ? (
      <span className={`ws-item-task-count${rawSevClass}`}>{taskCount}</span>
    ) : null;

  return (
    <button
      type="button"
      className={`ws-item${selected ? " selected" : ""}`}
      role="option"
      aria-selected={selected}
      onClick={onSelect}
    >
      <span className={`ws-item-bar ${barColor}`} />
      <div className="ws-item-info">
        <div className="ws-item-name">
          {client.name}
          {client.vip ? (
            <svg
              viewBox="0 0 24 24"
              style={{ width: 10, height: 10, fill: "var(--vip)", stroke: "var(--vip)", strokeWidth: 1, marginLeft: 4, verticalAlign: "middle" }}
              aria-hidden="true"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ) : null}
        </div>
        <div className="ws-item-meta">{desc}</div>
      </div>
      {countBadge}
      <svg className="ws-item-chevron" viewBox="0 0 24 24" aria-hidden="true">
        <polyline points="9 6 15 12 9 18" />
      </svg>
    </button>
  );
}
