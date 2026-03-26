import type { MissingByClientResponse } from "@/types/dashboard";

type DashboardOnTrackProps = {
  data: MissingByClientResponse | null;
  onTrackText: string | null;
  error: string | undefined;
};

export function DashboardOnTrack({
  data,
  onTrackText,
  error,
}: DashboardOnTrackProps) {
  return (
    <article className="offlode-shell__panel">
      <h2 className="offlode-shell__panel-title">Missing Docs By Client</h2>
      {error ? <p className="offlode-dashboard__error">{error}</p> : null}
      {!error && data?.items?.length ? (
        <div className="offlode-dashboard__rows">
          {data.items.slice(0, 6).map((item) => (
            <div className="offlode-dashboard__row" key={item.client_id}>
              <div className="offlode-dashboard__row-name">{item.client_name}</div>
              <div className="offlode-dashboard__badge">{item.missing_count}</div>
            </div>
          ))}
        </div>
      ) : null}
      {!error && !data?.items?.length ? <p>{onTrackText || "No missing documents."}</p> : null}
    </article>
  );
}
