import type { NeedsAttentionV2Response } from "@/types/dashboard";

type DashboardNeedsAttentionProps = {
  data: NeedsAttentionV2Response | null;
  fallbackText: string | null;
  error: string | undefined;
};

export function DashboardNeedsAttention({
  data,
  fallbackText,
  error,
}: DashboardNeedsAttentionProps) {
  return (
    <article className="offlode-shell__panel">
      <h2 className="offlode-shell__panel-title">Needs Attention</h2>
      {error ? <p className="offlode-dashboard__error">{error}</p> : null}
      {!error && data?.clients?.length ? (
        <div className="offlode-dashboard__rows">
          {data.clients.slice(0, 6).map((client) => (
            <div className="offlode-dashboard__row" key={client.client_id}>
              <div>
                <div className="offlode-dashboard__row-name">{client.client_name}</div>
                <div className="offlode-dashboard__row-meta">
                  Missing docs: {client.missing_count}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {!error && !data?.clients?.length ? (
        <p>{fallbackText || "No clients currently need attention."}</p>
      ) : null}
    </article>
  );
}
