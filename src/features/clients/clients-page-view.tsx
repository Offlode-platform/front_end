"use client";

import { useEffect, useMemo, useState } from "react";
import { ClientDetail } from "./components/client-detail";
import { ClientAddModal } from "./components/client-add-modal";
import { ClientListPane } from "./components/client-list-pane";
import { clientsApi } from "@/lib/api/clients-api";
import type { ListedClient, UpdateClientRequest } from "@/types/clients";

export type ClientTabKey = "overview" | "details" | "settings";

type FilterKey = "all" | "attention" | "vip";

type Severity = "action" | "review" | "handled";

type ToastKind = "success" | "error" | "info";

type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
};

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

  const [clientDrafts, setClientDrafts] = useState<
    { id: string; name: string; savedAt: string }[]
  >([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  function pushToast(kind: ToastKind, message: string) {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }

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
          pushToast("error", "Unable to load clients. Please try again.");
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
    pushToast("success", `Client "${newClient.name}" created successfully.`);
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
      pushToast("success", "Client details updated.");
    } catch {
      setError("Unable to update client. Please try again.");
      pushToast("error", "Unable to update client. Please try again.");
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
      pushToast("success", "Client deleted.");
    } catch {
      setError("Unable to delete client. Please try again.");
      pushToast("error", "Unable to delete client. Please try again.");
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
              onRequestAddClient={() => setIsAddClientOpen(true)}
              onUpdateClient={handleClientUpdated}
              onDeleteClient={async (id) => {
                setConfirmDelete({ id, name: selectedClient.name });
              }}
            />
          )}
        </div>
      </div>
      {confirmDelete && (
        <div
          className="modal-overlay open"
          role="dialog"
          aria-label="Confirm delete client"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmDelete(null);
          }}
        >
          <div
            className="modal"
            style={{
              width: "100%",
              maxWidth: 420,
              margin: "var(--sp-24) auto",
            }}
          >
            <div className="modal-header">
              <span className="modal-title">Delete client</span>
            </div>
            <div className="modal-body">
              <p
                style={{
                  fontSize: "var(--text-base)",
                  color: "var(--clr-secondary)",
                  lineHeight: "var(--lh-body)",
                }}
              >
                Are you sure you want to delete{" "}
                <strong>{confirmDelete.name}</strong>? This will remove the
                client from your directory.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={async () => {
                  await handleClientDeleted(confirmDelete.id);
                  setConfirmDelete(null);
                }}
              >
                Delete client
              </button>
            </div>
          </div>
        </div>
      )}
      {isLoading && (
        <div className="page-loading-overlay">
          <div className="page-loading-spinner" />
        </div>
      )}
      {toasts.length > 0 && (
        <div className="toast-stack">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`toast toast-${t.kind}`}
            >
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
