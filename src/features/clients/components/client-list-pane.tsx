import type { ListedClient } from "@/types/clients";

type FilterKey = "all" | "attention" | "vip";

type Severity = "action" | "review" | "handled";

function shortenName(name: string): string {
  const max = 28;
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

function shortenEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;

  const localShort = local.length <= 6 ? local : `${local.slice(0, 5)}…`;

  const domainShort =
    domain.length <= 4 ? domain : `${domain.slice(0, 2)}…${domain.slice(-2)}`;

  return `${localShort}@${domainShort}`;
}

function getClientSeverity(client: ListedClient): Severity {
  if (!client.is_active) return "review";
  if (!client.chase_enabled) return "action";
  return "handled";
}

function isVipClient(client: ListedClient): boolean {
  return client.chase_frequency_days <= 7;
}

function formatContactLine(client: ListedClient): string {
  const parts: string[] = [];
  if (client.email) parts.push(shortenEmail(client.email));
  if (client.phone) parts.push(client.phone);
  return parts.join(" · ");
}

export type ClientListPaneProps = {
  clients: ListedClient[] | null;
  filteredClients: ListedClient[];
  isLoading: boolean;
  error: string | null;
  filter: FilterKey;
  onFilterChange: (value: FilterKey) => void;
  search: string;
  onSearchChange: (value: string) => void;
  selectedClientId: string | null;
  onSelectClient: (id: string) => void;
  clientDrafts: { id: string; name: string; savedAt: string }[];
  attVipCounts: { attention: number; vip: number };
  totalClients: number;
  onRequestAddClient: () => void;
};

export function ClientListPane({
  clients,
  filteredClients,
  isLoading,
  error,
  filter,
  onFilterChange,
  search,
  onSearchChange,
  selectedClientId,
  onSelectClient,
  clientDrafts,
  attVipCounts,
  totalClients,
  onRequestAddClient,
}: ClientListPaneProps) {
  return (
    <div
      className="ws-list"
      style={{
        minWidth: 0,
        height: "100%",
        alignSelf: "stretch",
        display: "flex",
        flexDirection: "column",
      }}
    >
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
            onChange={(e) => onSearchChange(e.target.value)}
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
              onClick={() => onFilterChange("all")}
              data-seg="all"
            >
              All
            </button>
            <button
              className={`ws-seg${filter === "attention" ? " active" : ""}`}
              type="button"
              onClick={() => onFilterChange("attention")}
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
            onClick={() => onFilterChange(filter === "vip" ? "all" : "vip")}
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

      {clientDrafts.length > 0 && (
        <div className="acm-drafts-bar">
          <span className="acm-draft-badge">Drafts</span>
          <span className="u-text-muted-xs">
            {clientDrafts.length} incomplete
          </span>
        </div>
      )}

      <div
        className="ws-items"
        id="clListItems"
        role="listbox"
        aria-label="Client list"
        style={{
          flex: 1,

          minHeight: 0,
          overflowY: "auto",
        }}
      >
        {!isLoading && !error && filteredClients.length > 0 ? (
          <div className="ws-list-section">
            Client Directory
            <span className="ws-list-section-count">
              {filteredClients.length}
            </span>
          </div>
        ) : null}
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
              Try adjusting your filters or search term, or add a new client.
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ marginTop: "var(--sp-12)" }}
              onClick={onRequestAddClient}
            >
              Add Client
            </button>
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
                onSelectClient(client.id);
              }}
            >
              <span className={`ws-item-bar ${barColor}`} />
              <div className="ws-item-info" style={{ textAlign: "left" }}>
                <div
                  className="ws-item-name"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {shortenName(client.name)}
                  {vipBadge}
                </div>
                <div
                  className="ws-item-meta"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {desc}
                </div>
              </div>
              <svg className="ws-item-chevron" viewBox="0 0 24 24">
                <polyline points="9 6 15 12 9 18" />
              </svg>
            </button>
          );
        })}
      </div>

      <div className="ws-list-footer" id="clListCount">
        {filteredClients.length}
        {filteredClients.length === totalClients
          ? ""
          : ` of ${totalClients}`}{" "}
        client{filteredClients.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}
