"use client";

import { useMemo, useState } from "react";
import { WorkspaceClientList } from "./components/workspace-client-list";
import { WorkspaceContextPanel } from "./components/workspace-context-panel";
import { WorkspaceMiddlePane } from "./components/workspace-middle-pane";
import type { WorkspaceDemoClient, WorkspaceZone } from "./types";

type WorkspacePageViewProps = {
  clients: WorkspaceDemoClient[];
};

export function WorkspacePageView({ clients }: WorkspacePageViewProps) {
  const [activeFilter, setActiveFilter] = useState<"needs-input" | "handled">("needs-input");
  const [showVipOnly, setShowVipOnly] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    clients[0] ? String(clients[0].id) : null,
  );
  const [focusedZone, setFocusedZone] = useState<WorkspaceZone | null>(null);

  const selectedClient = useMemo(
    () => clients.find((client) => String(client.id) === selectedClientId) ?? null,
    [clients, selectedClientId],
  );

  return (
    <div className="page active" id="page-workspace">
      <div className={`ws ${focusedZone ? "focused" : ""}`} id="ws">
        <WorkspaceClientList
          clients={clients}
          activeFilter={activeFilter}
          showVipOnly={showVipOnly}
          onFilterChange={(next) => {
            setActiveFilter(next);
            setFocusedZone(null);
          }}
          onToggleVip={() => setShowVipOnly((prev) => !prev)}
          selectedClientId={selectedClientId}
          onSelectClient={(clientId) => {
            setSelectedClientId(clientId);
            setFocusedZone(null);
          }}
        />

        <WorkspaceMiddlePane
          client={selectedClient}
          focusedZone={focusedZone}
          onOpenZone={(zone) => setFocusedZone(zone)}
          onExitFocus={() => setFocusedZone(null)}
        />

        <WorkspaceContextPanel client={selectedClient} isVisible={Boolean(focusedZone)} />
      </div>
    </div>
  );
}
