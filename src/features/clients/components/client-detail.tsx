import { useEffect, useState } from "react";
import type { ListedClient, UpdateClientRequest } from "@/types/clients";
import type { ClientTabKey } from "../clients-page-view";
import { organizationsApi } from "@/lib/api/organizations";
import type { Organization } from "@/types/organizations";

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

function isVipClient(client: ListedClient): boolean {
  return client.chase_frequency_days <= 7;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  const date = dt.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = dt.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} at ${time}`;
}

export type ClientDetailProps = {
  client: ListedClient;
  tab: ClientTabKey;
  onTabChange: (tab: ClientTabKey) => void;
  onRequestAddClient: () => void;
  onUpdateClient: (clientId: string, updates: UpdateClientRequest) => Promise<void>;
  onDeleteClient: (clientId: string) => Promise<void>;
};

export function ClientDetail({
  client,
  tab,
  onTabChange,
  onRequestAddClient,
  onUpdateClient,
  onDeleteClient,
}: ClientDetailProps) {
  const healthScore = getHealthScore(client);
  const contactLine = formatContactLine(client);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [detailsDraft, setDetailsDraft] = useState<UpdateClientRequest>({
    name: client.name,
    email: client.email,
    phone: client.phone,
    xero_files_inbox_email: client.xero_files_inbox_email,
    chase_frequency_days: client.chase_frequency_days,
    escalation_days: client.escalation_days,
    vat_tracking_enabled: client.vat_tracking_enabled,
    vat_period_end_date: client.vat_period_end_date,
    chase_paused_until: client.chase_paused_until,
  });

  const tabs: { key: ClientTabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "details", label: "Details" },
    { key: "settings", label: "Settings" },
  ];

  const settingsDraft: UpdateClientRequest = {
    chase_enabled: client.chase_enabled,
    chase_frequency_days: client.chase_frequency_days,
    escalation_days: client.escalation_days,
    vat_tracking_enabled: client.vat_tracking_enabled,
    vat_period_end_date: client.vat_period_end_date,
    chase_paused_until: client.chase_paused_until,
  };

  useEffect(() => {
    let cancelled = false;
    async function loadOrganization() {
      if (!client.organization_id) {
        setOrganization(null);
        return;
      }
      try {
        const data = await organizationsApi.get(client.organization_id);
        if (!cancelled) {
          setOrganization(data);
          setOrgError(null);
        }
      } catch {
        if (!cancelled) {
          setOrganization(null);
          setOrgError("Unable to load organization");
        }
      }
    }

    void loadOrganization();
    return () => {
      cancelled = true;
    };
  }, [client.organization_id]);

  useEffect(() => {
    setDetailsDraft({
      name: client.name,
      email: client.email,
      phone: client.phone,
      xero_files_inbox_email: client.xero_files_inbox_email,
      chase_frequency_days: client.chase_frequency_days,
      escalation_days: client.escalation_days,
      vat_tracking_enabled: client.vat_tracking_enabled,
      vat_period_end_date: client.vat_period_end_date,
      chase_paused_until: client.chase_paused_until,
    });
    setIsEditingDetails(false);
  }, [client]);

  function updateDetailsDraft<K extends keyof UpdateClientRequest>(
    key: K,
    value: UpdateClientRequest[K],
  ) {
    setDetailsDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSaveDetails() {
    await onUpdateClient(client.id, detailsDraft);
    setIsEditingDetails(false);
  }

  return (
    <>
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
        <div className="page-bar-right" />
      </div>

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
              <div className="ws-card-title">Client Metadata</div>
              <div className="ws-ctx-row">
                <span className="ws-ctx-label">Created at</span>
                <span className="ws-ctx-value">
                  {formatDateTime(client.created_at)}
                </span>
              </div>
              <div className="ws-ctx-row">
                <span className="ws-ctx-label">Last updated</span>
                <span className="ws-ctx-value">
                  {formatDateTime(client.updated_at)}
                </span>
              </div>
              {client.assigned_user_name && (
                <div className="ws-ctx-row">
                  <span className="ws-ctx-label">Assigned to</span>
                  <span className="ws-ctx-value">{client.assigned_user_name}</span>
                </div>
              )}
            </div>
          )}

          {tab === "details" && (
            <div className="ws-card">
              <div
                className="u-flex-between"
                style={{ marginBottom: "var(--sp-12)" }}
              >
                <div className="ws-card-title u-mb-0">Client Details</div>
                <div style={{ display: "flex", gap: "var(--sp-8)" }}>
                  {isEditingDetails ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setIsEditingDetails(false);
                          setDetailsDraft({
                            name: client.name,
                            email: client.email,
                            phone: client.phone,
                            xero_files_inbox_email: client.xero_files_inbox_email,
                            chase_frequency_days: client.chase_frequency_days,
                            escalation_days: client.escalation_days,
                            vat_tracking_enabled: client.vat_tracking_enabled,
                            vat_period_end_date: client.vat_period_end_date,
                            chase_paused_until: client.chase_paused_until,
                          });
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => void handleSaveDetails()}
                      >
                        Save
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setIsEditingDetails(true)}
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
              <div className="ws-settings-row">
                <span className="ws-settings-label">Name</span>
                {isEditingDetails ? (
                  <input
                    type="text"
                    className="input"
                    value={detailsDraft.name ?? ""}
                    onChange={(e) => updateDetailsDraft("name", e.target.value)}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: "var(--text-base)",
                      color: "var(--clr-secondary)",
                    }}
                  >
                    {client.name}
                  </span>
                )}
              </div>
              {client.email && (
                <div className="ws-settings-row">
                  <span className="ws-settings-label">Email</span>
                  {isEditingDetails ? (
                    <input
                      type="email"
                      className="input"
                      value={detailsDraft.email ?? ""}
                      onChange={(e) => updateDetailsDraft("email", e.target.value)}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: "var(--text-base)",
                        color: "var(--clr-secondary)",
                      }}
                    >
                      {client.email}
                    </span>
                  )}
                </div>
              )}
              {client.phone && (
                <div className="ws-settings-row">
                  <span className="ws-settings-label">Phone</span>
                  {isEditingDetails ? (
                    <input
                      type="tel"
                      className="input"
                      value={detailsDraft.phone ?? ""}
                      onChange={(e) => updateDetailsDraft("phone", e.target.value)}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: "var(--text-base)",
                        color: "var(--clr-secondary)",
                      }}
                    >
                      {client.phone}
                    </span>
                  )}
                </div>
              )}
              <div className="ws-settings-row">
                <span className="ws-settings-label">Organization</span>
                <span
                  style={{
                    fontSize: "var(--text-base)",
                    color: "var(--clr-secondary)",
                  }}
                  title={client.organization_id}
                >
                  {organization?.name ?? client.organization_id}
                  {orgError ? " (unknown)" : ""}
                </span>
              </div>
              <div className="ws-settings-row">
                <span className="ws-settings-label">Chase frequency (days)</span>
                {isEditingDetails ? (
                  <input
                    type="number"
                    className="input"
                    min={0}
                    value={detailsDraft.chase_frequency_days ?? 0}
                    onChange={(e) =>
                      updateDetailsDraft(
                        "chase_frequency_days",
                        Number(e.target.value),
                      )
                    }
                  />
                ) : (
                  <span
                    style={{
                      fontSize: "var(--text-base)",
                      color: "var(--clr-secondary)",
                    }}
                  >
                    {client.chase_frequency_days}
                  </span>
                )}
              </div>
              <div className="ws-settings-row">
                <span className="ws-settings-label">Escalation days</span>
                {isEditingDetails ? (
                  <input
                    type="number"
                    className="input"
                    min={0}
                    value={detailsDraft.escalation_days ?? 0}
                    onChange={(e) =>
                      updateDetailsDraft("escalation_days", Number(e.target.value))
                    }
                  />
                ) : (
                  <span
                    style={{
                      fontSize: "var(--text-base)",
                      color: "var(--clr-secondary)",
                    }}
                  >
                    {client.escalation_days}
                  </span>
                )}
              </div>
              <div className="ws-settings-row">
                <span className="ws-settings-label">VAT tracking</span>
                {isEditingDetails ? (
                  <select
                    className="select"
                    value={detailsDraft.vat_tracking_enabled ? "true" : "false"}
                    onChange={(e) =>
                      updateDetailsDraft("vat_tracking_enabled", e.target.value === "true")
                    }
                  >
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                ) : (
                  <span
                    style={{
                      fontSize: "var(--text-base)",
                      color: "var(--clr-secondary)",
                    }}
                  >
                    {client.vat_tracking_enabled ? "Enabled" : "Disabled"}
                  </span>
                )}
              </div>
              <div className="ws-settings-row">
                <span className="ws-settings-label">VAT period end date</span>
                {isEditingDetails ? (
                  <input
                    type="date"
                    className="input"
                    value={
                      detailsDraft.vat_period_end_date
                        ? String(detailsDraft.vat_period_end_date).slice(0, 10)
                        : ""
                    }
                    onChange={(e) =>
                      updateDetailsDraft("vat_period_end_date", e.target.value)
                    }
                  />
                ) : (
                  <span
                    style={{
                      fontSize: "var(--text-base)",
                      color: "var(--clr-secondary)",
                    }}
                  >
                    {formatDateTime(client.vat_period_end_date)}
                  </span>
                )}
              </div>
              <div className="ws-settings-row">
                <span className="ws-settings-label">Chase paused until</span>
                {isEditingDetails ? (
                  <input
                    type="datetime-local"
                    className="input"
                    value={
                      detailsDraft.chase_paused_until
                        ? String(detailsDraft.chase_paused_until).slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      updateDetailsDraft("chase_paused_until", e.target.value)
                    }
                  />
                ) : (
                  <span
                    style={{
                      fontSize: "var(--text-base)",
                      color: "var(--clr-secondary)",
                    }}
                  >
                    {formatDateTime(client.chase_paused_until)}
                  </span>
                )}
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
                    Controls whether this client appears in chases and reporting.
                  </div>
                </div>
                <button
                  type="button"
                  className={`toggle${client.is_active ? " active" : ""}`}
                  onClick={() =>
                    void onUpdateClient(client.id, {
                      is_active: !client.is_active,
                    } as UpdateClientRequest)
                  }
                />
              </div>
              <div className="set-toggle-row">
                <div>
                  <div className="set-toggle-label">Document chasing</div>
                  <div className="set-toggle-hint">
                    Toggles automated chases for this client.
                  </div>
                </div>
                <button
                  type="button"
                  className={`toggle${client.chase_enabled ? " active" : ""}`}
                  onClick={() =>
                    void onUpdateClient(client.id, {
                      chase_enabled: !client.chase_enabled,
                    })
                  }
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "var(--sp-16)",
                }}
              >
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => void onDeleteClient(client.id)}
                >
                  Delete client
                </button>
                <span className="u-text-muted" style={{ fontSize: "var(--text-xs)" }}>
                  Deleting will remove this client from your directory.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
