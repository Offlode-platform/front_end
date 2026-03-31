"use client";

import { useEffect, useMemo, useState } from "react";
import { ClientDetail } from "./components/client-detail";
import { ClientAddModal } from "./components/client-add-modal";
import { ClientListPane } from "./components/client-list-pane";
import { clientsApi } from "@/lib/api/clients-api";
import type { ListedClient, UpdateClientRequest } from "@/types/clients";

export type ClientTabKey =
  | "overview"
  | "details"
  | "documents"
  | "invoices"
  | "comms"
  | "notes"
  | "settings";

type FilterKey = "all" | "attention" | "vip";

export type ClientNoteType = "pin" | "promise" | "dispute" | "critical" | null;

export type ClientNote = {
  id: string;
  text: string;
  author: string;
  time: string;
  type: ClientNoteType;
};

type Severity = "action" | "review" | "handled";

function getClientSeverity(client: ListedClient): Severity {
  if (!client.is_active) return "review";
  if (!client.chase_enabled) return "action";
  return "handled";
}

function isVipClient(client: ListedClient): boolean {
  return client.chase_frequency_days <= 7;
}

export function ClientsPageView() {
  const [clients, setClients] = useState<ListedClient[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ClientTabKey>("overview");
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);

  const [notesByClient, setNotesByClient] = useState<
    Record<string, ClientNote[]>
  >({});
  const [noteDraftByClient, setNoteDraftByClient] = useState<
    Record<string, { text: string; type: ClientNoteType }>
  >({});
  const [clientDrafts, setClientDrafts] = useState<
    { id: string; name: string; savedAt: string }[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    const loadClients = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await clientsApi.list();
        // Debug log so we can see what the API returned
        // and verify it matches the expected ListedClient[] shape.
        // eslint-disable-next-line no-console
        console.log("[ClientsPageView] Loaded clients response", data);
        if (!cancelled) {
          setClients(data);
          if (!selectedClientId && data.length > 0) {
            setSelectedClientId(data[0].id);
          }
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load clients. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadClients();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const attVipCounts = useMemo(() => {
    let attention = 0;
    let vip = 0;
    if (!clients) return { attention, vip };
    for (const c of clients) {
      const sev = getClientSeverity(c);
      if (sev === "action" || sev === "review") attention += 1;
      if (isVipClient(c)) vip += 1;
    }
    return { attention, vip };
  }, [clients]);

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q)) {
        return false;
      }
      if (filter === "attention") {
        const sev = getClientSeverity(c);
        return sev === "action" || sev === "review";
      }
      if (filter === "vip") {
        return isVipClient(c);
      }
      return true;
    });
  }, [clients, filter, search]);

  const selectedClient =
    filteredClients.find((c) => c.id === selectedClientId) ??
    filteredClients[0] ??
    null;

  useEffect(() => {
    if (selectedClient) return;
    if (filteredClients.length > 0) {
      setSelectedClientId(filteredClients[0].id);
    } else {
      setSelectedClientId(null);
    }
  }, [filteredClients, selectedClient]);

  const totalClients = clients?.length ?? 0;

  function handleAddNote(clientId: string) {
    const draft = noteDraftByClient[clientId];
    if (!draft || !draft.text.trim()) return;

    setNotesByClient((prev) => {
      const existing = prev[clientId] ?? [];
      const next: ClientNote = {
        id: `${Date.now()}`,
        text: draft.text.trim(),
        author: "You",
        time: "Just now",
        type: draft.type,
      };
      return { ...prev, [clientId]: [next, ...existing] };
    });

    setNoteDraftByClient((prev) => ({
      ...prev,
      [clientId]: { text: "", type: null },
    }));
  }

  function handleDeleteNote(clientId: string, noteId: string) {
    setNotesByClient((prev) => {
      const existing = prev[clientId] ?? [];
      return {
        ...prev,
        [clientId]: existing.filter((n) => n.id !== noteId),
      };
    });
  }

  function handleSaveClientDraft(payload: { id: string; name: string }) {
    setClientDrafts((prev) => [
      {
        ...payload,
        savedAt: new Date().toLocaleString(),
      },
      ...prev,
    ]);
  }

  async function handleClientCreated(newClient: ListedClient) {
    setIsLoading(true);
    setError(null);
    try {
      const data = await clientsApi.list();
      setClients(data);
      const exists = data.find((c) => c.id === newClient.id);
      setSelectedClientId(exists ? newClient.id : (data[0]?.id ?? null));
    } catch {
      setError("Unable to refresh clients after creating a new one.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleClientUpdated(
    clientId: string,
    updates: UpdateClientRequest,
  ) {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await clientsApi.update(clientId, updates);
      setClients((prev) =>
        prev
          ? prev.map((c) => (c.id === clientId ? { ...c, ...updated } : c))
          : [updated],
      );
    } catch {
      setError("Unable to update client. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleClientDeleted(clientId: string) {
    setIsLoading(true);
    setError(null);
    try {
      await clientsApi.delete(clientId);
      const data = await clientsApi.list();
      setClients(data);
      if (data.length === 0) {
        setSelectedClientId(null);
      } else if (clientId === selectedClientId) {
        setSelectedClientId(data[0].id);
      }
    } catch {
      setError("Unable to delete client. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="page active"
      id="page-clients"
      style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
    >
      <div className="page-bar" style={{ flexShrink: 0 }}>
        <div className="page-bar-left">
          <div>
            <div className="pg-title">Clients</div>
            <div className="pg-subtitle">
              View, filter, and manage your client directory.
            </div>
          </div>
        </div>
        <div className="page-bar-right">
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={() => setIsAddClientOpen(true)}
          >
            Add Client
          </button>
        </div>
      </div>
      {isAddClientOpen && (
        <ClientAddModal
          onClose={() => setIsAddClientOpen(false)}
          onSaveDraft={handleSaveClientDraft}
          onCreated={handleClientCreated}
          organizationId={clients?.[0]?.organization_id}
        />
      )}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flex: "0 0 var(--ws-list-w)",
            minWidth: 0,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <ClientListPane
            clients={clients}
            filteredClients={filteredClients}
            isLoading={isLoading}
            error={error}
            filter={filter}
            onFilterChange={setFilter}
            search={search}
            onSearchChange={setSearch}
            selectedClientId={selectedClientId}
            onSelectClient={setSelectedClientId}
            clientDrafts={clientDrafts}
            attVipCounts={attVipCounts}
            totalClients={totalClients}
            onRequestAddClient={() => setIsAddClientOpen(true)}
          />
        </div>

        <div
          id="clDetail"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "var(--clr-surface-card)",
            position: "relative",
          }}
        >
          {!selectedClient ? (
            <div
              className="ws-empty-watermark"
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div className="ws-empty-title">Select a client</div>
              <div className="ws-empty-desc">
                Choose from the list to view their details.
              </div>
            </div>
          ) : (
            <ClientDetail
              client={selectedClient}
              tab={activeTab}
              onTabChange={setActiveTab}
              notes={notesByClient[selectedClient.id] ?? []}
              noteDraft={
                noteDraftByClient[selectedClient.id] ?? { text: "", type: null }
              }
              onNoteDraftChange={(draft) =>
                setNoteDraftByClient((prev) => ({
                  ...prev,
                  [selectedClient.id]: draft,
                }))
              }
              onAddNote={() => handleAddNote(selectedClient.id)}
              onDeleteNote={(noteId) =>
                handleDeleteNote(selectedClient.id, noteId)
              }
              onRequestAddClient={() => setIsAddClientOpen(true)}
              onUpdateClient={handleClientUpdated}
              onDeleteClient={handleClientDeleted}
            />
          )}
        </div>
      </div>
    </div>
  );
}
