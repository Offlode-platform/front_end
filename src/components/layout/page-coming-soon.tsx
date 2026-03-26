type PageComingSoonProps = {
  title: string;
};

export function PageComingSoon({ title }: PageComingSoonProps) {
  return (
    <section className="ws-card" style={{ maxWidth: 900, margin: "var(--sp-24)" }}>
      <h1 className="ws-card-title">{title}</h1>
      <p className="dash-kpi-sub" style={{ marginBottom: 8 }}>
        This page is not implemented yet.
      </p>
      <p style={{ fontSize: 14, opacity: 0.9 }}>
        The shell, topbar, sidebar, and theme behavior are active. Content for this module will
        be added next.
      </p>
    </section>
  );
}
