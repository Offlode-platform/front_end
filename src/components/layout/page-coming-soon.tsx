type PageComingSoonProps = {
  title: string;
};

export function PageComingSoon({ title }: PageComingSoonProps) {
  return (
    <section className="offlode-shell__panel" style={{ maxWidth: 900 }}>
      <h1 className="offlode-shell__panel-title">{title}</h1>
      <p className="offlode-shell__subtitle" style={{ marginBottom: 8 }}>
        This page is not implemented yet.
      </p>
      <p style={{ fontSize: 14, opacity: 0.9 }}>
        The shell, topbar, sidebar, and theme behavior are active. Content for this module will
        be added next.
      </p>
    </section>
  );
}
