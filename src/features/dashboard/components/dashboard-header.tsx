type DashboardHeaderProps = {
  greeting: string;
  summaryLine: string;
};

export function DashboardHeader({
  greeting,
  summaryLine,
}: DashboardHeaderProps) {
  return (
    <div className="page-bar" id="dashHeader">
      <div className="page-bar-left" style={{ gap: "var(--sp-12)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "var(--sp-12)" }}>
          <div className="pg-title" id="dashGreeting">
            {greeting}
          </div>
          <div className="pg-subtitle" id="dashSummary" style={{ marginTop: 0 }}>
            {summaryLine}
          </div>
        </div>
      </div>
      <div className="page-bar-right" id="dashHeaderRight" />
    </div>
  );
}
