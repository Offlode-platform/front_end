"use client";

import { Search } from "lucide-react";
import type { ListedClient } from "@/types/clients";

type FilterKey = "needs" | "clear";

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

function shortEmail(email: string | null | undefined): string {
  if (!email) return "No email";
  const at = email.indexOf("@");
  if (at <= 0) return truncate(email, 24);
  const user = email.slice(0, at);
  const domain = email.slice(at + 1);
  const shortDomain = domain.split(".")[0];
  return `${truncate(user, 16)}@${shortDomain}`;
}

function getStatusColor(client: ListedClient): "green" | "amber" | "red" {
  if (!client.is_active) return "red";
  if (!client.chase_enabled) return "amber";
  return "green";
}

function isVip(client: ListedClient): boolean {
  return client.chase_frequency_days <= 7;
}

type Props = {
  clients: ListedClient[] | null;
  filteredClients: ListedClient[];
  isLoading: boolean;
  filter: FilterKey;
  onFilterChange: (f: FilterKey) => void;
  search: string;
  onSearchChange: (s: string) => void;
  selectedClientId: string | null;
  onSelectClient: (id: string) => void;
  vipOnly: boolean;
  onToggleVip: () => void;
  needsCount: number;
  vipCount: number;
};

export function WorkspaceClientList({
  clients,
  filteredClients,
  isLoading,
  filter,
  onFilterChange,
  search,
  onSearchChange,
  selectedClientId,
  onSelectClient,
  vipOnly,
  onToggleVip,
  needsCount,
  vipCount,
}: Props) {
  return (
    <div className="ws-list">
      <div className="ws-list-header">
        <div className="ws-search">
          <Search size={14} strokeWidth={2} />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="ws-segment" id="wsSegment">
          <button
            type="button"
            className={`ws-seg${filter === "needs" ? " active" : ""}`}
            onClick={() => onFilterChange("needs")}
          >
            Needs Input
            {needsCount > 0 && (
              <span className="ws-seg-count">{needsCount}</span>
            )}
          </button>
          <button
            type="button"
            className={`ws-seg${filter === "clear" ? " active" : ""}`}
            onClick={() => onFilterChange("clear")}
          >
            Handled
          </button>
        </div>

        {vipCount > 0 && (
          <button
            type="button"
            className={`ws-vip-toggle${vipOnly ? " active" : ""}`}
            onClick={onToggleVip}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            VIP
            <span className="ws-seg-count" style={{ background: "var(--vip)", color: "#fff" }}>
              {vipCount}
            </span>
          </button>
        )}
      </div>

      <div className="ws-items" role="listbox">
        {isLoading && !clients && (
          <div style={{ padding: "var(--sp-32) var(--sp-16)", textAlign: "center", color: "var(--clr-muted)", fontSize: "var(--text-sm)" }}>
            Loading clients...
          </div>
        )}
        {!isLoading && clients && filteredClients.length === 0 && (
          <div style={{ padding: "var(--sp-32) var(--sp-16)", textAlign: "center" }}>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)", marginBottom: "var(--sp-4)" }}>
              {filter === "clear"
                ? "No handled clients yet."
                : "No clients need input."}
            </div>
            <button
              type="button"
              onClick={() => onFilterChange(filter === "needs" ? "clear" : "needs")}
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--brand)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: "var(--fw-medium)",
              }}
            >
              {filter === "needs" ? "Show handled" : "Show needs input"}
            </button>
          </div>
        )}
        {filteredClients.map((client) => (
          <button
            key={client.id}
            type="button"
            className={`ws-item${client.id === selectedClientId ? " selected" : ""}`}
            role="option"
            aria-selected={client.id === selectedClientId}
            onClick={() => onSelectClient(client.id)}
          >
            <div className={`ws-item-bar ${getStatusColor(client)}`} />
            <div className="ws-item-info" style={{ textAlign: "left" }}>
              <div className="ws-item-name">
                {truncate(client.name, 28)}
                {isVip(client) && (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="var(--vip)"
                    style={{ marginLeft: 4, verticalAlign: "middle" }}
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                )}
              </div>
              <div className="ws-item-meta">
                {shortEmail(client.email)}
                {client.assigned_user_name ? ` · ${truncate(client.assigned_user_name, 16)}` : ""}
              </div>
            </div>
            <svg className="ws-item-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ))}
      </div>

      <div className="ws-list-footer">
        {filteredClients.length} Client{filteredClients.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
