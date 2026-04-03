"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { clientsApi } from "@/lib/api/clients-api";
import type { ListedClient } from "@/types/clients";
import { WorkspaceClientList } from "./components/workspace-client-list";
import { WorkspaceBrief } from "./components/workspace-brief";
import { WorkspaceFocusHeader, type WorkspaceTab } from "./components/workspace-focus-header";
import { WorkspaceOverviewTab } from "./components/workspace-overview-tab";
import { WorkspaceContactTab } from "./components/workspace-contact-tab";
import { WorkspaceItemsTab } from "./components/workspace-items-tab";
import { WorkspaceActivityTab } from "./components/workspace-activity-tab";
import { WorkspaceSettingsTab } from "./components/workspace-settings-tab";
import { WorkspaceContextSidebar } from "./components/workspace-context-sidebar";

type FilterKey = "needs" | "clear";

function clientNeedsInput(c: ListedClient): boolean {
  return !c.chase_enabled;
}

function isVip(c: ListedClient): boolean {
  return c.chase_frequency_days <= 7;
}

export function WorkspacePageView() {
  const [clients, setClients] = useState<ListedClient[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("needs");
  const [search, setSearch] = useState("");
  const [vipOnly, setVipOnly] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");

  // Load clients
  useEffect(() => {
    let cancelled = false;
    clientsApi.list().then(
      (data) => {
        if (!cancelled) {
          setClients(data);
          setIsLoading(false);
        }
      },
      () => {
        if (!cancelled) setIsLoading(false);
      },
    );
    return () => { cancelled = true; };
  }, []);

  // Counts
  const { needsCount, vipCount } = useMemo(() => {
    let needs = 0;
    let vip = 0;
    if (!clients) return { needsCount: 0, vipCount: 0 };
    for (const c of clients) {
      if (clientNeedsInput(c)) needs++;
      if (isVip(c)) vip++;
    }
    return { needsCount: needs, vipCount: vip };
  }, [clients]);

  // Filtered list
  const filteredClients = useMemo(() => {
    if (!clients) return [];
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q) && !(c.email || "").toLowerCase().includes(q)) {
        return false;
      }
      if (vipOnly && !isVip(c)) return false;
      if (filter === "needs") return clientNeedsInput(c);
      return !clientNeedsInput(c);
    });
  }, [clients, filter, search, vipOnly]);

  // Selected client — derive from filtered list, fallback to first item
  const selectedClient = useMemo(() => {
    const found = filteredClients.find((c) => c.id === selectedClientId);
    return found ?? filteredClients[0] ?? null;
  }, [filteredClients, selectedClientId]);

  const selectedIndex = selectedClient
    ? filteredClients.findIndex((c) => c.id === selectedClient.id)
    : -1;

  function handleSelectClient(id: string) {
    setSelectedClientId(id);
    setFocused(true);
    setActiveTab("overview");
  }

  function handleBack() {
    setFocused(false);
  }

  function handlePrev() {
    if (selectedIndex > 0) {
      setSelectedClientId(filteredClients[selectedIndex - 1].id);
      setActiveTab("overview");
    }
  }

  function handleNext() {
    if (selectedIndex < filteredClients.length - 1) {
      setSelectedClientId(filteredClients[selectedIndex + 1].id);
      setActiveTab("overview");
    }
  }

  const handleClientUpdated = useCallback((updated: ListedClient) => {
    setClients((prev) =>
      prev ? prev.map((c) => (c.id === updated.id ? updated : c)) : prev,
    );
  }, []);

  // Render active tab content
  function renderTabContent() {
    if (!selectedClient) return null;
    switch (activeTab) {
      case "overview":
        return <WorkspaceOverviewTab client={selectedClient} />;
      case "contact":
        return <WorkspaceContactTab client={selectedClient} onUpdated={handleClientUpdated} />;
      case "items":
        return <WorkspaceItemsTab client={selectedClient} />;
      case "activity":
        return <WorkspaceActivityTab client={selectedClient} />;
      case "settings":
        return <WorkspaceSettingsTab client={selectedClient} onUpdated={handleClientUpdated} />;
      default:
        return null;
    }
  }

  return (
    <div className={`page active${focused && selectedClient ? " ws-focused" : ""}`} id="page-workspace">
      <div className="ws" id="ws" style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Left column — client list */}
        <WorkspaceClientList
          clients={clients}
          filteredClients={filteredClients}
          isLoading={isLoading}
          filter={filter}
          onFilterChange={setFilter}
          search={search}
          onSearchChange={setSearch}
          selectedClientId={selectedClient?.id ?? null}
          onSelectClient={handleSelectClient}
          vipOnly={vipOnly}
          onToggleVip={() => setVipOnly((v) => !v)}
          needsCount={needsCount}
          vipCount={vipCount}
        />

        {/* Middle column — content */}
        <div className="ws-middle">
          {!focused || !selectedClient ? (
            <div className="ws-content">
              <WorkspaceBrief
                needsCount={needsCount}
                totalClients={clients?.length ?? 0}
              />
            </div>
          ) : (
            <>
              <WorkspaceFocusHeader
                client={selectedClient}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onBack={handleBack}
                onPrev={handlePrev}
                onNext={handleNext}
                hasPrev={selectedIndex > 0}
                hasNext={selectedIndex < filteredClients.length - 1}
              />
              <div style={{ flex: 1, overflowY: "auto", background: "var(--canvas-bg)", position: "relative" }}>
                {renderTabContent()}
              </div>
            </>
          )}
        </div>

        {/* Right column — context sidebar (focus mode only) */}
        {focused && selectedClient && (
          <WorkspaceContextSidebar client={selectedClient} />
        )}
      </div>
    </div>
  );
}
