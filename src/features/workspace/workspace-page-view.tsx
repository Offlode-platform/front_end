"use client";

import { useEffect, useMemo, useState } from "react";
import { clientsApi } from "@/lib/api/clients-api";
import type { ListedClient } from "@/types/clients";
import { WorkspaceClientList } from "./components/workspace-client-list";
import { WorkspaceFocusHeader } from "./components/workspace-focus-header";
import type { WorkspaceTab } from "./components/workspace-focus-header";
import { WorkspaceOverviewTab } from "./components/workspace-overview-tab";
import { WorkspaceContactTab } from "./components/workspace-contact-tab";
import { WorkspaceItemsTab } from "./components/workspace-items-tab";
import { WorkspaceActivityTab } from "./components/workspace-activity-tab";
import { WorkspaceSettingsTab } from "./components/workspace-settings-tab";

export function WorkspacePageView() {
  const [clients, setClients] = useState<ListedClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"needs-input" | "handled">(
    "needs-input",
  );
  const [showVipOnly, setShowVipOnly] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("items");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    clientsApi.list().then(
      (data) => {
        if (!cancelled) {
          setClients(data);
          if (data.length > 0 && !selectedClientId) {
            setSelectedClientId(data[0].id);
          }
          setIsLoading(false);
        }
      },
      () => {
        if (!cancelled) {
          setError("Unable to load clients.");
          setIsLoading(false);
        }
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );

  const selectedIndex = useMemo(
    () => (selectedClient ? clients.findIndex((c) => c.id === selectedClient.id) : -1),
    [clients, selectedClient],
  );

  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex >= 0 && selectedIndex < clients.length - 1;

  function handleClientUpdated(updated: ListedClient) {
    setClients((prev) =>
      prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
    );
  }

  return (
    <div className="page active workspace-page-lock" id="page-workspace">
      <div className="ws" id="ws" style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <WorkspaceClientList
          clients={clients}
          isLoading={isLoading}
          error={error}
          activeFilter={activeFilter}
          showVipOnly={showVipOnly}
          onFilterChange={(next) => setActiveFilter(next)}
          onToggleVip={() => setShowVipOnly((prev) => !prev)}
          selectedClientId={selectedClientId}
          onSelectClient={(clientId) => setSelectedClientId(clientId)}
        />

        <div
          className="ws-middle"
          style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}
        >
          {!selectedClient ? (
            <div
              style={{
                display: "flex",
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                padding: "var(--sp-32)",
                color: "var(--clr-muted)",
                fontSize: "var(--text-sm)",
              }}
            >
              {isLoading
                ? "Loading clients..."
                : clients.length === 0
                  ? "No clients yet. Create one from the Clients page."
                  : "Select a client to get started."}
            </div>
          ) : (
            <>
              <WorkspaceFocusHeader
                client={selectedClient}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onBack={() => setSelectedClientId(null)}
                onPrev={() => {
                  if (hasPrev) setSelectedClientId(clients[selectedIndex - 1].id);
                }}
                onNext={() => {
                  if (hasNext) setSelectedClientId(clients[selectedIndex + 1].id);
                }}
                hasPrev={hasPrev}
                hasNext={hasNext}
              />

              <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
                {activeTab === "overview" && (
                  <WorkspaceOverviewTab client={selectedClient} />
                )}
                {activeTab === "contact" && (
                  <WorkspaceContactTab
                    client={selectedClient}
                    onUpdated={handleClientUpdated}
                  />
                )}
                {activeTab === "items" && (
                  <WorkspaceItemsTab client={selectedClient} />
                )}
                {activeTab === "activity" && (
                  <WorkspaceActivityTab client={selectedClient} />
                )}
                {activeTab === "settings" && (
                  <WorkspaceSettingsTab
                    client={selectedClient}
                    onUpdated={handleClientUpdated}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
