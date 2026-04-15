import { env } from "@/config/env";

export const apiPaths = {
  health: "/health",
  auth: {
    login: "/api/v1/auth/login",
    signup: "/api/v1/auth/signup",
    logout: "/api/v1/auth/logout",
    me: "/api/v1/auth/me",
    updateMe: "/api/v1/auth/me",
    changePassword: "/api/v1/auth/change-password",
    twoFaBootstrapSetup: "/api/v1/auth/2fa/bootstrap/setup",
    twoFaBootstrapVerify: "/api/v1/auth/2fa/bootstrap/verify",
    twoFaSetup: "/api/v1/auth/2fa/setup",
    twoFaVerify: "/api/v1/auth/2fa/verify",
    twoFaDisable: "/api/v1/auth/2fa/disable",
    magicLink: "/api/v1/auth/magic-link",
  },
  dashboard: {
    summary: "/api/v1/dashboard/summary",
    missingByClient: "/api/v1/dashboard/missing-by-client",
    needsAttentionV2: "/api/v1/dashboard/needs-attention-v2",
    recentChases: "/api/v1/dashboard/recent-chases",
    needsAttention: "/api/v1/dashboard/needs-attention",
    onTrack: "/api/v1/dashboard/on-track",
    clientDetails: "/api/v1/dashboard/client",
    bulkAction: "/api/v1/dashboard/bulk-action",
    exportCsv: "/api/v1/dashboard/export/csv",
  },
  clients: {
    base: "/api/v1/clients",
  },
  users: {
    base: "/api/v1/users",
  },
  organizations: {
    base: "/api/v1/organizations",
  },
  chases: {
    send: "/api/v1/chases",
    bulk: "/api/v1/chases/bulk",
    configure: "/api/v1/chases",
    pause: "/api/v1/chases",
    resume: "/api/v1/chases",
    history: "/api/v1/chases",
    get: "/api/v1/chases",
  },
  transactions: {
    base: "/api/v1/transactions",
  },
  documents: {
    base: "/api/v1/documents",
    reviewQueue: "/api/v1/documents/review-queue",
    confirmMatch: (id: string) =>
      `/api/v1/documents/${encodeURIComponent(id)}/confirm-match`,
    rejectMatch: (id: string) =>
      `/api/v1/documents/${encodeURIComponent(id)}/reject-match`,
    manualMatch: (id: string) =>
      `/api/v1/documents/${encodeURIComponent(id)}/manual-match`,
  },
  clientAssignments: {
    base: "/api/v1/client-assignments",
  },
  imports: {
    base: "/api/v1/imports",
  },
  importTemplates: {
    base: "/api/v1/import-templates",
  },
  ledger: {
    invoices: "/api/v1/ledger/invoices",
    contacts: "/api/v1/ledger/contacts",
    payments: "/api/v1/ledger/payments",
    contactsUnlinked: "/api/v1/ledger/contacts/unlinked",
    contactSuggestions: (id: string) =>
      `/api/v1/ledger/contacts/${encodeURIComponent(id)}/suggestions`,
    contactLink: (id: string) =>
      `/api/v1/ledger/contacts/${encodeURIComponent(id)}/link`,
    contactCreateClient: (id: string) =>
      `/api/v1/ledger/contacts/${encodeURIComponent(id)}/create-client`,
    contactBulkLink: "/api/v1/ledger/contacts/bulk-link",
  },
  integrations: {
    xeroStatus: "/api/v1/integrations/xero/status",
  },
  auditLogs: {
    base: "/api/v1/audit-logs",
    critical: "/api/v1/audit-logs/critical/recent",
    actionsSummary: "/api/v1/audit-logs/actions/summary",
  },
  exclusionRules: {
    base: "/api/v1/exclusion-rules",
    bulkCreate: "/api/v1/exclusion-rules/bulk-create",
    initUk: "/api/v1/exclusion-rules/init-common-uk-rules",
  },
  magicLinks: {
    base: "/api/v1/magic-links",
  },
  portal: {
    base: "/api/v1/portal",
    resolve: "/api/v1/portal/resolve",
  },
  xero: {
    connect: "/api/v1/auth/xero/connect",
    callback: "/api/v1/auth/xero/callback",
    authorizeUrl: "/api/v1/auth/xero/authorize-url",
    disconnect: "/api/v1/auth/xero/disconnect",
  },
} as const;

export function apiUrl(path: string): string {
  const base = env.publicApiUrl.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}
