\"use client\";

import { useEffect, useMemo, useState } from "react";
import { clientsApi } from "@/lib/api/clients-api";
import type { ListedClient } from "@/types/clients";

type ClientTabKey =
  | "overview"
  | "details"
  | "documents"
  | "invoices"
  | "comms"
  | "notes"
  | "settings";

function getInitials(name: string): string {
  if (!name) return "";
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getHealthScore(client: ListedClient): number {
  let score = 75;

  if (!client.is_active) {
    score -= 25;
  }

  if (!client.chase_enabled) {
    score -= 15;
  }

  if (!client.vat_period_completed_at) {
    score -= 10;
  }

  if (score < 10) score = 10;
  if (score > 100) score = 100;
  return score;
}

function formatContactLine(client: ListedClient): string {
  const parts: string[] = [];
  if (client.email) parts.push(client.email);
  if (client.phone) parts.push(client.phone);
  return parts.join(" · ");
}

type Severity = "action" | "review" | "handled";

function getClientSeverity(client: ListedClient): Severity {
  if (!client.is_active) return "review";
  if (!client.chase_enabled) return "action";
  return "handled";
}

function isVipClient(client: ListedClient): boolean {
  // Derive a \"VIP\" signal from chase frequency – faster cadence => more important.
  return client.chase_frequency_days <= 7;
}

type FilterKey = "all" | "attention" | "vip";

export function ClientsPageView() {
  const [clients, setClients] = useState<ListedClient[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ClientTabKey>("overview");

  useEffect(() => {
    let cancelled = false;
    const loadClients = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await clientsApi.list();
        if (!cancelled) {
          setClients(data);
          if (!selectedClientId && data.length > 0) {
            setSelectedClientId(data[0].id);
          }
        }
      } catch (e) {
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

  return (
    <div className="page active" id="page-clients">
      <div style={{ flex: 1, minWidth: 0, display: "flex", overflow: "hidden" }}>
        {/* Client list (left) */}
        <div className="ws-list">
          <div className="ws-list-header">
            <div className="ws-search">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--sp-6)",
                width: "100%",
              }}
            >
              <div className="ws-segment" id="clFilters" style={{ width: "100%" }}>
                <button
                  className={`ws-seg${filter === "all" ? " active" : ""}`}
                  type="button"
                  onClick={() => setFilter("all")}
                  data-seg="all"
                >
                  All
                </button>
                <button
                  className={`ws-seg${filter === "attention" ? " active" : ""}`}
                  type="button"
                  onClick={() => setFilter("attention")}
                  data-seg="attention"
                >
                  Needs Input
                  <span className="ws-seg-count" id="clAttCount">
                    {attVipCounts.attention}
                  </span>
                </button>
              </div>
              <button
                className={`ws-vip-toggle${filter === "vip" ? " active" : ""}`}
                id="clVipToggle"
                type="button"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "var(--sp-6) var(--sp-12)",
                  fontSize: "var(--text-xs)",
                }}
                onClick={() =>
                  setFilter((prev) => (prev === "vip" ? "all" : "vip"))
                }
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  style={{
                    width: 13,
                    height: 13,
                    fill: "var(--vip)",
                    stroke: "var(--vip)",
                    strokeWidth: 1,
                  }}
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                VIP
                <span className="ws-seg-count" id="clVipCount">
                  {attVipCounts.vip}
                </span>
              </button>
            </div>
          </div>

          <div
            className="ws-items"
            id="clListItems"
            role="listbox"
            aria-label="Client list"
          >
            {isLoading && !clients ? (
              <div className="ws-empty-watermark">
                <div className="ws-empty-title">Loading clients…</div>
              </div>
            ) : null}
            {error ? (
              <div className="ws-empty-watermark">
                <div className="ws-empty-title">Unable to load clients</div>
                <div className="ws-empty-desc">{error}</div>
              </div>
            ) : null}
            {!isLoading && !error && filteredClients.length === 0 ? (
              <div className="ws-empty-watermark">
                <div className="ws-empty-title">No clients found</div>
                <div className="ws-empty-desc">
                  Try adjusting your filters or search term.
                </div>
              </div>
            ) : null}
            {filteredClients.map((client) => {
              const selected = selectedClientId === client.id;
              const severity = getClientSeverity(client);
              const barColor =
                severity === "action"
                  ? "red"
                  : severity === "review"
                    ? "amber"
                    : "green";
              const desc = formatContactLine(client) || client.organization_id;
              const vipBadge = isVipClient(client) ? (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  style={{
                    width: 10,
                    height: 10,
                    fill: "var(--vip)",
                    stroke: "var(--vip)",
                    strokeWidth: 1,
                    marginLeft: 4,
                  }}
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ) : null;

              return (
                <button
                  key={client.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`ws-item${selected ? " selected" : ""}`}
                  onClick={() => {
                    setSelectedClientId(client.id);
                  }}
                >
                  <span className={`ws-item-bar ${barColor}`} />
                  <div className="ws-item-info">
                    <div className="ws-item-name">
                      {client.name}
                      {vipBadge}
                    </div>
                    <div className="ws-item-meta">{desc}</div>
                  </div>
                  <svg className="ws-item-chevron" viewBox="0 0 24 24">
                    <polyline points="9 6 15 12 9 18" />
                  </svg>
                </button>
              );
            })}
          </div>

          <div className="ws-list-footer" id="clListCount">
            {totalClients} client{totalClients === 1 ? "" : "s"}
          </div>
        </div>

        {/* Client detail pane (right) */}
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
            <ClientDetail client={selectedClient} tab={activeTab} onTabChange={setActiveTab} />
          )}
        </div>
      </div>
    </div>
  );
}

type ClientDetailProps = {
  client: ListedClient;
  tab: ClientTabKey;
  onTabChange: (tab: ClientTabKey) => void;
};

function ClientDetail({ client, tab, onTabChange }: ClientDetailProps) {
  const healthScore = getHealthScore(client);
  const contactLine = formatContactLine(client);

  const tabs: { key: ClientTabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "details", label: "Details" },
    { key: "documents", label: "Records" },
    { key: "invoices", label: "Payments" },
    { key: "comms", label: "Activity" },
    { key: "notes", label: "Notes" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <>
      {/* Fixed header */}
      <div className="page-bar" style={{ flexShrink: 0 }}>
        <div
          className="page-bar-left"
          style={{ gap: "var(--sp-12)", minWidth: 0 }}
        >
          <div className="cl-avatar">{getInitials(client.name)}</div>
          <div>
            <div className="pg-title">
              {client.name}
              {isVipClient(client) ? (
                <span
                  className="u-text-warning"
                  style={{ marginLeft: "var(--sp-8)" }}
                >
                  ★
                </span>
              ) : null}
              <span
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--fw-medium)",
                  marginLeft: "var(--sp-8)",
                  verticalAlign: "middle",
                  color:
                    healthScore >= 70
                      ? "var(--success)"
                      : healthScore >= 40
                        ? "var(--warning)"
                        : "var(--danger)",
                }}
              >
                Health: {healthScore}
              </span>
            </div>
            <div className="pg-subtitle">
              {contactLine || "No contact details added yet"}
            </div>
          </div>
        </div>
        <div className="page-bar-right">
          <button className="btn btn-ghost btn-sm" type="button">
            Import
          </button>
          <button className="btn btn-ghost btn-sm" type="button">
            Export
          </button>
          <button className="btn btn-primary btn-sm" type="button">
            Add Client
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div
        role="tablist"
        aria-label="Client tabs"
        style={{
          display: "flex",
          gap: 0,
          padding: "0 var(--sp-32)",
          borderBottom: "1px solid var(--clr-divider)",
          flexShrink: 0,
          background: "var(--canvas-bg)",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`rpt-tab-btn${tab === t.key ? " active" : ""}`}
            onClick={() => onTabChange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "var(--sp-24) var(--sp-32) var(--sp-48)",
          background: "var(--canvas-bg)",
        }}
      >
        <div className="detail-wrap">
          {tab === "overview" && (
            <div className="cl-kpi-strip">
              <div className="ws-card kpi-mini u-mb-0">
                <div
                  className={`kpi-mini-val ${
                    healthScore >= 70
                      ? "success"
                      : healthScore >= 40
                        ? "warning"
                        : "danger"
                  }`}
                >
                  {healthScore}
                </div>
                <div className="kpi-mini-label">Health</div>
              </div>
              <div className="ws-card kpi-mini u-mb-0">
                <div className="kpi-mini-val">
                  {client.vat_tracking_enabled ? 1 : 0}
                  <span className="kpi-mini-unit">/1</span>
                </div>
                <div className="kpi-mini-label">VAT Tracking</div>
              </div>
              <div className="ws-card kpi-mini u-mb-0">
                <div className="kpi-mini-val">
                  {client.chase_enabled ? "On" : "Off"}
                </div>
                <div className="kpi-mini-label">Chasing</div>
              </div>
              <div className="ws-card kpi-mini u-mb-0">
                <div className="kpi-mini-val">
                  {client.is_active ? "Active" : "Inactive"}
                </div>
                <div className="kpi-mini-label">Status</div>
              </div>
            </div>
          )}

          {tab === "overview" && (
            <div className="ws-card">
              <div className="ws-card-title">Workflow Status</div>
              <div className="agent-row">
                <span className="agent-row-dot u-bg-brand" />
                <div className="u-flex-1">
                  <div className="agent-row-name">Document Chasing</div>
                  <div className="dash-row-meta">
                    {client.chase_enabled
                      ? "Automated chases enabled"
                      : "Chasing is currently turned off"}
                  </div>
                </div>
                <span
                  className="agent-row-status"
                  style={{
                    color: client.chase_enabled
                      ? "var(--success)"
                      : "var(--clr-muted)",
                  }}
                >
                  {client.chase_enabled ? "On" : "Off"}
                </span>
              </div>
            </div>
          )}

          {tab === "overview" && (
            <div className="ws-card">
              <div className="ws-card-title">Recent Activity</div>
              <div className="act-dot-row">
                <span className="act-dot u-bg-brand" />
                <div className="u-flex-1-min">
                  <div className="act-dot-text">
                    Client record last updated
                  </div>
                  <div className="act-dot-sub">{client.updated_at}</div>
                </div>
              </div>
            </div>
          )}

          {tab === "details" && (
            <div className="ws-card">
              <div className="ws-card-title">Client Details</div>
              <div className="ws-settings-row">
                <span className="ws-settings-label">Name</span>
                <span>{client.name}</span>
              </div>
              {client.email && (
                <div className="ws-settings-row">
                  <span className="ws-settings-label">Email</span>
                  <span>{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="ws-settings-row">
                  <span className="ws-settings-label">Phone</span>
                  <span>{client.phone}</span>
                </div>
              )}
              <div className="ws-settings-row">
                <span className="ws-settings-label">Organization</span>
                <span>{client.organization_id}</span>
              </div>
            </div>
          )}

          {tab === "documents" && (
            <div className="ws-card">
              <div className="ws-card-title">Records</div>
              <div className="ws-empty-desc">
                Document records integration will appear here once available.
              </div>
            </div>
          )}

          {tab === "invoices" && (
            <div className="ws-card">
              <div className="ws-card-title">Payments</div>
              <div className="ws-empty-desc">
                Payments data will appear here once connected.
              </div>
            </div>
          )}

          {tab === "comms" && (
            <div className="ws-card">
              <div className="ws-card-title">Activity</div>
              <div className="ws-empty-desc">
                Call and communication history will appear here.
              </div>
            </div>
          )}

          {tab === "notes" && (
            <div className="ws-card">
              <div className="ws-card-title">Notes</div>
              <div className="ws-empty-desc">
                Notes for this client will be available in a future update.
              </div>
            </div>
          )}

          {tab === "settings" && (
            <div className="ws-card">
              <div className="ws-card-title">Settings</div>
              <div className="set-toggle-row">
                <div>
                  <div className="set-toggle-label">Active client</div>
                  <div className="set-toggle-hint">
                    Controls whether this client appears in chases and
                    reporting.
                  </div>
                </div>
                <button
                  type="button"
                  className={`toggle${client.is_active ? " active" : ""}`}
                  disabled
                />
              </div>
              <div className="set-toggle-row">
                <div>
                  <div className="set-toggle-label">Document chasing</div>
                  <div className="set-toggle-hint">
                    Automation settings are configured in the main
                    configuration screens.
                  </div>
                </div>
                <button
                  type="button"
                  className={`toggle${client.chase_enabled ? " active" : ""}`}
                  disabled
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

