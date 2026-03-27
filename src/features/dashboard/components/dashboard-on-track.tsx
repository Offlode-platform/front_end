import type { MissingByClientResponse } from "@/types/dashboard";

type DashboardOnTrackProps = {
  data: MissingByClientResponse | null;
  error: string | undefined;
};

export function DashboardOnTrack({
  data,
  error,
}: DashboardOnTrackProps) {
  const clients = data?.items ?? data?.clients ?? [];
  const total = data?.total_clients ?? data?.total ?? clients.length;

  return (
    <article className="ws-card u-mb-0">
      <div className="ws-settings-row" style={{ border: "none", paddingBottom: "var(--sp-4)" }}>
        <span className="ws-card-title u-mb-0">Missing Docs By Client</span>
        <span className="ws-settings-value u-text-muted">{total}</span>
      </div>
      {error ? <p className="dash-kpi-sub">{error}</p> : null}
      {!error && clients.length ? (
        <div>
          {clients.slice(0, 6).map((item) => (
            <div className="dash-row ws-row-hover" key={item.client_id}>
              <div className="dash-row-info">
                <div className="dash-row-name">{item.client_name}</div>
                <div className="dash-row-meta">
                  {item.missing_count === 0
                    ? "No missing documents"
                    : `${item.missing_count} documents missing`}
                </div>
              </div>
              <span className={item.missing_count > 0 ? "ws-item-task-count urgent" : "ws-item-task-count"}>
                {item.missing_count}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {!error && !clients.length ? (
        <p className="dash-kpi-sub">No missing documents.</p>
      ) : null}
    </article>
  );
}
