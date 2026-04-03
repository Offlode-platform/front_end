import type { WorkspaceDemoClient } from "../types";

type WorkspaceContextPanelProps = {
  client: WorkspaceDemoClient | null;
  isVisible: boolean;
};

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
          <span className="ws-status-pill active">Active</span>
        </div>
      </div>

      <div className="ws-ctx-section">
        <div className="ws-ctx-title">Contact</div>
        <div className="ws-ctx-row"><span className="ws-ctx-label">Name</span><span className="ws-ctx-value">{client?.contact ?? "—"}</span></div>
        <div className="ws-ctx-row"><span className="ws-ctx-label">Email</span><span className="ws-ctx-value">{client?.email ?? "—"}</span></div>
        <div className="ws-ctx-row"><span className="ws-ctx-label">Phone</span><span className="ws-ctx-value">{client?.phone ?? "—"}</span></div>
        <div className="ws-ctx-row"><span className="ws-ctx-label">Manager</span><span className="ws-ctx-value">{client?.assignedManager?.name ?? "—"}</span></div>
      </div>

      <div className="ws-ctx-section">
        <div className="ws-ctx-title">Automation</div>
        <div className="ws-ctx-tags">
          {(["Collect", "Respond", "Settle"] as const)
            .filter((zone) => {
              if (!client) return false;
              const status =
                zone === "Collect"
                  ? client.collect?.status
                  : zone === "Respond"
                    ? client.respond?.status
                    : client.settle?.status;
              return Boolean(status);
            })
            .map((item) => (
            <span key={item} className="chip">{item}</span>
            ))}
        </div>
      </div>

      <div className="ws-ctx-section">
        <div className="ws-ctx-title">Financials</div>
        <div className="ws-ctx-row"><span className="ws-ctx-label">Outstanding</span><span className="ws-ctx-value">{client?.outstanding ?? "—"}</span></div>
        <div className="ws-ctx-row"><span className="ws-ctx-label">This year</span><span className="ws-ctx-value">{client?.thisYear ?? "—"}</span></div>
        <div className="ws-ctx-row"><span className="ws-ctx-label">Lifetime</span><span className="ws-ctx-value">{client?.lifetime ?? "—"}</span></div>
      </div>

      <div className="ws-ctx-section">
        <div className="ws-ctx-title">Key Dates</div>
        <div className="ws-ctx-row"><span className="ws-ctx-label">VAT due</span><span className="ws-ctx-value">{client?.keyDates?.vatQuarterEnd ?? "—"}</span></div>
        <div className="ws-ctx-row"><span className="ws-ctx-label">Year end</span><span className="ws-ctx-value">{client?.keyDates?.yearEnd ?? "—"}</span></div>
        <div className="ws-ctx-row"><span className="ws-ctx-label">Last contact</span><span className="ws-ctx-value">{client?.keyDates?.lastContact ?? "—"}</span></div>
      </div>

      <div className="ws-ctx-section">
        <div className="ws-ctx-title">Preferences</div>
        <div className="ws-ctx-tags">
          {(client?.prefs ?? []).map((item) => (
            <span key={item} className="chip">{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
