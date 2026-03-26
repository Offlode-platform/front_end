export default function DashboardPage() {
  return (
    <>
      <h1 className="offlode-shell__title">Dashboard</h1>
      <p className="offlode-shell__subtitle">
        Unified workspace shell based on Offlode v5 structure.
      </p>

      <section className="offlode-shell__kpis">
        <article className="offlode-shell__kpi">
          <div className="offlode-shell__kpi-label">Tasks Due Today</div>
          <div className="offlode-shell__kpi-value">12</div>
        </article>
        <article className="offlode-shell__kpi">
          <div className="offlode-shell__kpi-label">Active Clients</div>
          <div className="offlode-shell__kpi-value">38</div>
        </article>
        <article className="offlode-shell__kpi">
          <div className="offlode-shell__kpi-label">Overdue Cases</div>
          <div className="offlode-shell__kpi-value">4</div>
        </article>
        <article className="offlode-shell__kpi">
          <div className="offlode-shell__kpi-label">Collections Rate</div>
          <div className="offlode-shell__kpi-value">91%</div>
        </article>
      </section>

      <section className="offlode-shell__grid">
        <article className="offlode-shell__panel">
          <h2 className="offlode-shell__panel-title">Needs Attention</h2>
          <p>3 clients need follow-up within 24 hours.</p>
        </article>
        <article className="offlode-shell__panel">
          <h2 className="offlode-shell__panel-title">Team Activity</h2>
          <p>Respond handled 28 calls today, Collect processed 16 documents.</p>
        </article>
        <article className="offlode-shell__panel">
          <h2 className="offlode-shell__panel-title">AI Insights</h2>
          <p>Payment risk is elevated for 2 accounts based on recent behavior.</p>
        </article>
      </section>
    </>
  );
}
