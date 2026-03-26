type DashboardKpisProps = {
  totalClients: number;
  needsAttentionCount: number;
  onTrackCount: number;
  recentChasesCount: number;
};

export function DashboardKpis({
  totalClients,
  needsAttentionCount,
  onTrackCount,
  recentChasesCount,
}: DashboardKpisProps) {
  return (
    <section className="offlode-shell__kpis">
      <article className="offlode-shell__kpi">
        <div className="offlode-shell__kpi-label">Total Clients</div>
        <div className="offlode-shell__kpi-value">{totalClients}</div>
      </article>
      <article className="offlode-shell__kpi">
        <div className="offlode-shell__kpi-label">Needs Attention</div>
        <div className="offlode-shell__kpi-value">{needsAttentionCount}</div>
      </article>
      <article className="offlode-shell__kpi">
        <div className="offlode-shell__kpi-label">On Track</div>
        <div className="offlode-shell__kpi-value">{onTrackCount}</div>
      </article>
      <article className="offlode-shell__kpi">
        <div className="offlode-shell__kpi-label">Recent Chases</div>
        <div className="offlode-shell__kpi-value">{recentChasesCount}</div>
      </article>
    </section>
  );
}
