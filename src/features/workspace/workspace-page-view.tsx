"use client";

import { useEffect, useMemo, useState } from "react";
import { clientsApi } from "@/lib/api/clients-api";
import type { ListedClient } from "@/types/clients";
import { WorkspaceClientList } from "./components/workspace-client-list";
import { WorkspaceContextPanel } from "./components/workspace-context-panel";
import { WorkspaceMiddlePane } from "./components/workspace-middle-pane";
import type { RefSurface } from "./components/workspace-ref-surface";
import type { WorkspaceDemoClient, WorkspaceZone } from "./types";

/** Convert a real API client to the WorkspaceDemoClient shape used by middle-pane components. */
function adaptClient(c: ListedClient): WorkspaceDemoClient {
  return {
    id: c.id,
    name: c.name,
    contact: c.name,
    email: c.email,
    phone: c.phone,
    legalEntity: "",
    intent: c.chase_enabled ? "Active chasing" : "Chasing paused",
    intentDetail: c.email,
    vip: c.chase_frequency_days <= 7,
    status: c.chase_enabled ? "active" : "inactive",
    assignedManager: c.assigned_user_name
      ? { name: c.assigned_user_name, initials: c.assigned_user_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) }
      : undefined,
    outstanding: "—",
    thisYear: "—",
    lifetime: "—",
    keyDates: {
      yearEnd: "—",
      vatQuarterEnd: c.vat_period_end_date || "—",
      nextInvoiceDue: "—",
      nextMeeting: null,
      lastContact: "—",
    },
    prefs: [],
    urgentItem: c.chase_enabled
      ? undefined
      : { agent: "collect", desc: "Chasing disabled", severity: "handled" },
  };
}

export function WorkspacePageView() {
  const [clients, setClients] = useState<ListedClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"needs-input" | "handled">(
    "needs-input",
  );
  const [showVipOnly, setShowVipOnly] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [focusedZone, setFocusedZone] = useState<WorkspaceZone | null>(null);
  const [refSurface, setRefSurface] = useState<RefSurface | null>(null);

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
    return () => { cancelled = true; };
  }, []);

  const demoClients = useMemo(
    () => clients.map(adaptClient),
    [clients],
  );

  const selectedDemoClient = useMemo(
    () => demoClients.find((c) => String(c.id) === selectedClientId) ?? null,
    [demoClients, selectedClientId],
  );

  return (
    <div className="page active workspace-page-lock" id="page-workspace">
      <div
        className={`ws ${focusedZone || refSurface ? "focused" : ""}`}
        id="ws"
      >
        <WorkspaceClientList
          clients={clients}
          isLoading={isLoading}
          error={error}
          activeFilter={activeFilter}
          showVipOnly={showVipOnly}
          onFilterChange={(next) => {
            setActiveFilter(next);
            setFocusedZone(null);
            setRefSurface(null);
          }}
          onToggleVip={() => setShowVipOnly((prev) => !prev)}
          selectedClientId={selectedClientId}
          onSelectClient={(clientId) => {
            setSelectedClientId(clientId);
            setFocusedZone(null);
            setRefSurface(null);
          }}
        />

        <WorkspaceMiddlePane
          client={selectedDemoClient}
          focusedZone={focusedZone}
          refSurface={refSurface}
          onOpenZone={(zone) => {
            setRefSurface(null);
            setFocusedZone(zone);
          }}
          onExitFocus={() => setFocusedZone(null)}
          onOpenRef={(surface) => {
            setFocusedZone(null);
            setRefSurface(surface);
          }}
          onCloseRef={() => setRefSurface(null)}
        />

        <WorkspaceContextPanel
          client={clients.find((c) => c.id === selectedClientId) ?? null}
          isVisible={Boolean(focusedZone || refSurface)}
        />
      </div>
    </div>
  );
}
