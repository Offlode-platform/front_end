import type { ListedClient } from "@/types/clients";

type WorkspaceContextPanelProps = {
  client: ListedClient | null;
  isVisible: boolean;
};

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

export function WorkspaceContextPanel({
  client,
  isVisible,
}: WorkspaceContextPanelProps) {
  return (
    <div className={`ws-ctx ${isVisible ? "" : "ws-ctx-hidden"}`} id="wsCtx">
      <div className="ws-ctx-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="ws-ctx-title" style={{ marginBottom: 0 }}>
            Status
          </div>
          <span className={`ws-status-pill ${client?.is_active ? "active" : ""}`}>
            {client?.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="ws-ctx-section">
        <div className="ws-ctx-title">Contact</div>
        <div className="ws-ctx-row"><span className="ws-ctx-label">Name</span><span className="ws-ctx-value">{client?.name ?? "—"}</span></div>
        <div className="ws-ctx-row"><span className="ws-ctx-label">Email</span><span className="ws-ctx-value">{client?.email ?? "—"}</span></div>
        <div className="ws-ctx-row"><span className="ws-ctx-label">Phone</span><span className="ws-ctx-value">{client?.phone ?? "—"}</span></div>
        <div className="ws-ctx-row"><span className="ws-ctx-label">Manager</span><span className="ws-ctx-value">{client?.assigned_user_name ?? "—"}</span></div>
      </div>

      <div className="ws-ctx-section">
        <div className="ws-ctx-title">Chase Configuration</div>
        <div className="ws-ctx-row">
          <span className="ws-ctx-label">Chasing</span>
          <span className="ws-ctx-value">{client?.chase_enabled ? "Enabled" : "Disabled"}</span>
        </div>
        <div className="ws-ctx-row">
          <span className="ws-ctx-label">Frequency</span>
          <span className="ws-ctx-value">{client?.chase_frequency_days ? `${client.chase_frequency_days} days` : "—"}</span>
        </div>
        <div className="ws-ctx-row">
          <span className="ws-ctx-label">Escalation</span>
          <span className="ws-ctx-value">{client?.escalation_days ? `${client.escalation_days} days` : "—"}</span>
        </div>
        {client?.chase_paused_until ? (
          <div className="ws-ctx-row">
            <span className="ws-ctx-label">Paused until</span>
            <span className="ws-ctx-value">{formatDate(client.chase_paused_until)}</span>
          </div>
        ) : null}
      </div>

      <div className="ws-ctx-section">
        <div className="ws-ctx-title">Key Dates</div>
        <div className="ws-ctx-row"><span className="ws-ctx-label">VAT period end</span><span className="ws-ctx-value">{formatDate(client?.vat_period_end_date)}</span></div>
        <div className="ws-ctx-row"><span className="ws-ctx-label">Created</span><span className="ws-ctx-value">{formatDate(client?.created_at)}</span></div>
        <div className="ws-ctx-row"><span className="ws-ctx-label">Last updated</span><span className="ws-ctx-value">{formatDate(client?.updated_at)}</span></div>
      </div>

      <div className="ws-ctx-section">
        <div className="ws-ctx-title">Xero Integration</div>
        <div className="ws-ctx-row">
          <span className="ws-ctx-label">Connected</span>
          <span className="ws-ctx-value">{client?.xero_contact_id ? "Yes" : "No"}</span>
        </div>
        {client?.xero_files_inbox_email ? (
          <div className="ws-ctx-row">
            <span className="ws-ctx-label">Files inbox</span>
            <span className="ws-ctx-value" style={{ fontSize: "var(--text-xs)", wordBreak: "break-all" }}>{client.xero_files_inbox_email}</span>
          </div>
        ) : null}
      </div>

      <div className="ws-ctx-section">
        <div className="ws-ctx-title">VAT Tracking</div>
        <div className="ws-ctx-row">
          <span className="ws-ctx-label">Enabled</span>
          <span className="ws-ctx-value">{client?.vat_tracking_enabled ? "Yes" : "No"}</span>
        </div>
      </div>
    </div>
  );
}
