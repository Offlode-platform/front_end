import type { RecentChasesResponse } from "@/types/dashboard";

type DashboardRecentChasesProps = {
  data: RecentChasesResponse | null;
  error: string | undefined;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export function DashboardRecentChases({
  data,
  error,
}: DashboardRecentChasesProps) {
  return (
    <article className="ws-card u-mb-0">
      <div className="ws-settings-row" style={{ border: "none", paddingBottom: "var(--sp-4)" }}>
        <span className="ws-card-title u-mb-0">Recent Chase Events</span>
        <span className="ws-settings-value u-text-muted">{data?.events?.length ?? 0}</span>
      </div>
      {error ? <p className="dash-kpi-sub">{error}</p> : null}
      {!error && data?.events?.length ? (
        <div>
          {data.events.slice(0, 8).map((event) => (
            <div className="dash-row ws-row-hover" key={event.chase_id}>
              <div className="dash-row-info">
                <div className="dash-row-name">{event.client_name}</div>
                <div className="dash-row-meta">
                  {event.chase_type} - {event.status}
                </div>
              </div>
              <div className="act-dot-time">{formatDate(event.created_at)}</div>
            </div>
          ))}
        </div>
      ) : null}
      {!error && !data?.events?.length ? (
        <p className="dash-kpi-sub">No chase events available right now.</p>
      ) : null}
    </article>
  );
}
