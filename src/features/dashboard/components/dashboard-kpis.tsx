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
    <section className="dash-kpis">
      <article className="ws-card u-mb-0">
        <div className="ws-card-title">Total Clients</div>
        <div className="dash-kpi-val">{totalClients}</div>
      </article>
      <article className="ws-card u-mb-0">
        <div className="ws-card-title">Needs Attention</div>
        <div className="dash-kpi-val">{needsAttentionCount}</div>
      </article>
      <article className="ws-card u-mb-0">
        <div className="ws-card-title">On Track</div>
        <div className="dash-kpi-val">{onTrackCount}</div>
      </article>
      <article className="ws-card u-mb-0">
        <div className="ws-card-title">Recent Chases</div>
        <div className="dash-kpi-val">{recentChasesCount}</div>
      </article>
    </section>
  );
}
