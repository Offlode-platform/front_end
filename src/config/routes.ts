export const routes = {
  home: "/",
  dashboard: "/dashboard",
  workspace: "/workspace",
  clients: "/clients",
  organizations: "/organizations",
  team: "/team",
  schedule: "/schedule",
  reports: "/reports",
  auditLog: "/audit-log",
  imports: "/imports",
  ledger: "/ledger",
  documentReview: "/documents/review",
  portal: "/portal",
  settings: "/settings",
  login: "/login",
  signup: "/signup",
  twoFaBootstrapSetup: "/login/2fa-setup",
  staffHome: "/staff",
  architectureDiagram: "/synapse-architecture-diagram.html",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
