type DashboardHeaderProps = {
  greeting: string;
  summaryLine: string;
  summaryApiText: string | null;
};

export function DashboardHeader({
  greeting,
  summaryLine,
  summaryApiText,
}: DashboardHeaderProps) {
  return (
    <div className="offlode-dashboard__header">
      <div className="offlode-shell__title">{greeting}</div>
      <div className="offlode-shell__subtitle">{summaryLine}</div>
      {summaryApiText ? (
        <p className="offlode-dashboard__summary-text">{summaryApiText}</p>
      ) : null}
    </div>
  );
}
