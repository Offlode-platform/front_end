type ShellBreadcrumbProps = {
  text: string;
};

export function ShellBreadcrumb({ text }: ShellBreadcrumbProps) {
  return (
    <div className="shell-breadcrumb" aria-label="Current page">
      <span>{text}</span>
    </div>
  );
}
