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
    <article className="offlode-shell__panel">
      <h2 className="offlode-shell__panel-title">Recent Chase Events</h2>
      {error ? <p className="offlode-dashboard__error">{error}</p> : null}
      {!error && data?.events?.length ? (
        <div className="offlode-dashboard__rows">
          {data.events.slice(0, 8).map((event) => (
            <div className="offlode-dashboard__row" key={event.chase_id}>
              <div>
                <div className="offlode-dashboard__row-name">{event.client_name}</div>
                <div className="offlode-dashboard__row-meta">
                  {event.chase_type} - {event.status}
                </div>
              </div>
              <div className="offlode-dashboard__row-time">
                {formatDate(event.created_at)}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {!error && !data?.events?.length ? (
        <p>No chase events available right now.</p>
      ) : null}
    </article>
  );
}
