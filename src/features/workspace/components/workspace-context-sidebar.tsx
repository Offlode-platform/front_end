"use client";

import type { ListedClient } from "@/types/clients";

type Props = {
  client: ListedClient;
};

function isVip(client: ListedClient): boolean {
  return client.is_vip === true;
}

function CtxValue({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <span className="ws-ctx-value" style={{ textAlign: "left", ...style }}>{children}</span>;
}

export function WorkspaceContextSidebar({ client }: Props) {
  const isPaused = client.chase_paused_until && new Date(client.chase_paused_until) > new Date();

  return (
    <div className="ws-ctx">
      {/* Status */}
      <div className="ws-ctx-section">
        <div className="ws-ctx-title">Status</div>
        <span className={`ws-status-pill${client.is_active ? " active" : ""}`}>
          {client.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Contact */}
      <div className="ws-ctx-section">
        <div className="ws-ctx-title">Contact</div>
        <div className="ws-ctx-row">
          <span className="ws-ctx-label">Name</span>
          <CtxValue>{client.name}</CtxValue>
        </div>
        <div className="ws-ctx-row">
          <span className="ws-ctx-label">Email</span>
          <CtxValue>{client.email || "—"}</CtxValue>
        </div>
        <div className="ws-ctx-row">
          <span className="ws-ctx-label">Phone</span>
          <CtxValue>{client.phone || "—"}</CtxValue>
        </div>
        <div className="ws-ctx-row">
          <span className="ws-ctx-label">Manager</span>
          <CtxValue>{client.assigned_user_name || "Unassigned"}</CtxValue>
        </div>
      </div>

      {/* Automation */}
      <div className="ws-ctx-section">
        <div className="ws-ctx-title">Automation</div>
        <div className="ws-ctx-agents">
          <div className="ws-ctx-agent">
            <div
              className="ws-ctx-agent-dot"
              style={{ background: client.chase_enabled ? "var(--collect)" : "var(--clr-muted)" }}
            />
            <span className="ws-ctx-agent-name">Collect</span>
            <span className="ws-ctx-agent-status" style={{ color: client.chase_enabled ? "var(--success)" : "var(--clr-muted)" }}>
              {client.chase_enabled ? (isPaused ? "Paused" : "On") : "Off"}
            </span>
          </div>
        </div>
        {isPaused && (
          <div style={{ fontSize: "var(--text-xs)", color: "var(--warning)", marginTop: "var(--sp-4)" }}>
            Paused until {new Date(client.chase_paused_until).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </div>
        )}
      </div>

      {/* Key Dates */}
      <div className="ws-ctx-section">
        <div className="ws-ctx-title">Key Dates</div>
        <div className="ws-ctx-row">
          <span className="ws-ctx-label">VAT period end</span>
          <CtxValue>
            {client.vat_period_end_date
              ? new Date(client.vat_period_end_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
              : "—"}
          </CtxValue>
        </div>
        <div className="ws-ctx-row">
          <span className="ws-ctx-label">Created</span>
          <CtxValue>
            {new Date(client.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </CtxValue>
        </div>
        <div className="ws-ctx-row">
          <span className="ws-ctx-label">Updated</span>
          <CtxValue>
            {new Date(client.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </CtxValue>
        </div>
      </div>

      {/* Chase config */}
      <div className="ws-ctx-section">
        <div className="ws-ctx-title">Chase Config</div>
        <div className="ws-ctx-row">
          <span className="ws-ctx-label">Frequency</span>
          <CtxValue>Every {client.chase_frequency_days} day{client.chase_frequency_days !== 1 ? "s" : ""}</CtxValue>
        </div>
        <div className="ws-ctx-row">
          <span className="ws-ctx-label">Escalation</span>
          <CtxValue>After {client.escalation_days} day{client.escalation_days !== 1 ? "s" : ""}</CtxValue>
        </div>
        {isVip(client) && (
          <div style={{ marginTop: "var(--sp-4)" }}>
            <span className="ws-ctx-tag vip">VIP</span>
          </div>
        )}
      </div>

      {/* Xero */}
      <div className="ws-ctx-section">
        <div className="ws-ctx-title">Xero</div>
        <div className="ws-ctx-row">
          <span className="ws-ctx-label">Connected</span>
          <CtxValue style={{ color: client.xero_contact_id ? "var(--success)" : "var(--clr-muted)" }}>
            {client.xero_contact_id ? "Yes" : "No"}
          </CtxValue>
        </div>
        {client.xero_files_inbox_email && (
          <div className="ws-ctx-row">
            <span className="ws-ctx-label">Files inbox</span>
            <CtxValue style={{ fontSize: "var(--text-xs)" }}>
              {client.xero_files_inbox_email}
            </CtxValue>
          </div>
        )}
      </div>
    </div>
  );
}
