import type { ListedClient } from "@/types/clients";
import type { ClientNote, ClientNoteType, ClientTabKey } from "../clients-page-view";

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

export type ClientDetailProps = {
  client: ListedClient;
  tab: ClientTabKey;
  onTabChange: (tab: ClientTabKey) => void;
  notes: ClientNote[];
  noteDraft: { text: string; type: ClientNoteType };
  onNoteDraftChange: (draft: { text: string; type: ClientNoteType }) => void;
  onAddNote: () => void;
  onDeleteNote: (noteId: string) => void;
  onRequestAddClient: () => void;
};

export function ClientDetail({
  client,
  tab,
  onTabChange,
  notes,
  noteDraft,
  onNoteDraftChange,
  onAddNote,
  onDeleteNote,
  onRequestAddClient,
}: ClientDetailProps) {
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
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={onRequestAddClient}
          >
            Add Client
          </button>
        </div>
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
              <div className="ws-card-title">Recent Activity</div>
              <div className="act-dot-row">
                <span className="act-dot u-bg-brand" />
                <div className="u-flex-1-min">
                  <div className="act-dot-text">Client record last updated</div>
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
            <>
              <div className="ws-card ws-pinned">
                <div className="ws-card-title u-text-warning">
                  <svg
                    viewBox="0 0 24 24"
                    style={{
                      width: 13,
                      height: 13,
                      fill: "none",
                      stroke: "var(--warning)",
                      strokeWidth: 2,
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                      verticalAlign: "-1px",
                      marginRight: "var(--sp-4)",
                    }}
                  >
                    <path d="M12 17v5" />
                    <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
                  </svg>
                  Pinned
                </div>
                {isVipClient(client) && (
                  <div
                    style={{
                      fontSize: "var(--text-base)",
                      fontWeight: "var(--fw-medium)",
                      color: "var(--clr-secondary)",
                      marginBottom: "var(--sp-4)",
                    }}
                  >
                    VIP client — handle with extra care
                  </div>
                )}
              </div>

              <div className="ws-card">
                <textarea
                  className="textarea"
                  rows={3}
                  placeholder={`Add a note about ${client.name}...`}
                  value={noteDraft.text}
                  onChange={(e) =>
                    onNoteDraftChange({ ...noteDraft, text: e.target.value })
                  }
                />
                <div className="u-flex-between">
                  <div className="u-flex" style={{ gap: "var(--sp-4)" }}>
                    {(
                      [
                        ["pin", "Pin"],
                        ["promise", "Promise"],
                        ["dispute", "Dispute"],
                        ["critical", "Critical"],
                      ] as [ClientNoteType, string][]
                    ).map(([val, label]) => {
                      const active = noteDraft.type === val;
                      return (
                        <button
                          key={val ?? "none"}
                          type="button"
                          className={`btn btn-ghost btn-sm${
                            active ? " btn-primary" : ""
                          }`}
                          onClick={() =>
                            onNoteDraftChange({
                              ...noteDraft,
                              type: active ? null : val,
                            })
                          }
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    type="button"
                    onClick={onAddNote}
                  >
                    Add note
                  </button>
                </div>
              </div>

              <details className="ws-card" style={{ padding: 0 }}>
                <summary
                  style={{
                    padding: "var(--sp-16) var(--sp-20)",
                    cursor: "pointer",
                    listStyle: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span className="ws-card-title u-mb-0">
                    <span
                      style={{
                        fontSize: "var(--text-base)",
                        color: "var(--brand)",
                        verticalAlign: "-1px",
                        marginRight: "var(--sp-4)",
                      }}
                    >
                      ✦
                    </span>
                    What Offlode Has Learned
                  </span>
                </summary>
                <div
                  style={{
                    padding: "0 var(--sp-20) var(--sp-16)",
                    borderTop: "1px solid var(--clr-divider)",
                  }}
                >
                  <div className="ws-ctx-row">
                    <span className="ws-ctx-label">Best contact time</span>
                    <span className="ws-ctx-value">Morning</span>
                  </div>
                  <div className="ws-ctx-row">
                    <span className="ws-ctx-label">Preferred channel</span>
                    <span className="ws-ctx-value">Email</span>
                  </div>
                </div>
              </details>

              <div className="ws-card">
                <div className="u-flex-between u-mb-8">
                  <div className="ws-card-title u-mb-0">Notes</div>
                  <span className="u-text-faint">
                    {notes.length} note{notes.length === 1 ? "" : "s"}
                  </span>
                </div>
                {notes.length > 0 ? (
                  notes.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: "var(--sp-12) 0",
                        borderBottom: "1px solid var(--clr-divider)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "var(--text-base)",
                          color: "var(--clr-secondary)",
                          lineHeight: "var(--lh-relaxed)",
                        }}
                      >
                        {n.text}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: "var(--sp-4)",
                        }}
                      >
                        <span className="u-text-muted">
                          {n.author}
                          {n.time ? ` · ${n.time}` : ""}
                        </span>
                        <div className="u-flex" style={{ gap: "var(--sp-4)" }}>
                          {n.type && (
                            <span className="tag tag-neutral">{n.type}</span>
                          )}
                          <button
                            type="button"
                            style={{
                              fontSize: "var(--text-xs)",
                              color: "var(--clr-muted)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            style={{
                              fontSize: "var(--text-xs)",
                              color: "var(--clr-muted)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            Pin
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteNote(n.id)}
                            style={{
                              fontSize: "var(--text-xs)",
                              color: "var(--danger)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: "var(--clr-muted)", padding: "var(--sp-8)" }}>
                    No notes yet — add one above
                  </div>
                )}
              </div>
            </>
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

