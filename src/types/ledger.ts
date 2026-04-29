export type InvoiceType = "accounts_payable" | "accounts_receivable";
export type ContactType = "customer" | "supplier" | "both";

export type UniversalInvoice = {
  id: string;
  organization_id: string;
  invoice_number: string | null;
  invoice_type: InvoiceType;
  status: string;
  date: string;
  due_date: string | null;
  subtotal: string | null;
  tax_amount: string | null;
  total: string;
  amount_due: string | null;
  amount_paid: string | null;
  currency_code: string;
  contact_name: string | null;
  contact_id: string | null;
  transaction_id: string | null;
  description: string | null;
  reference: string | null;
  line_items: Record<string, unknown>[] | null;
  source_platform: string | null;
  document_received: boolean;
  chase_status: string | null;
  last_chased_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UniversalInvoiceListResponse = {
  items: UniversalInvoice[];
  total: number;
};

export type UniversalContact = {
  id: string;
  organization_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  tax_number: string | null;
  contact_type: ContactType | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  currency_code: string;
  client_id: string | null;
  status: string;
  is_linked: boolean;
  source_platform: string | null;
  created_at: string;
  updated_at: string;
};

export type UniversalContactListResponse = {
  items: UniversalContact[];
  total: number;
};

export type UniversalPayment = {
  id: string;
  organization_id: string;
  payment_date: string;
  amount: string;
  currency_code: string;
  payment_type: string | null;
  reference: string | null;
  account_code: string | null;
  contact_name: string | null;
  invoice_id: string | null;
  contact_id: string | null;
  source_platform: string | null;
  created_at: string;
  updated_at: string;
};

export type UniversalPaymentListResponse = {
  items: UniversalPayment[];
  total: number;
};

export type InvoiceListQuery = {
  status?: string;
  invoice_type?: InvoiceType;
  contact_name?: string;
  date_from?: string;
  date_to?: string;
  source_platform?: string;
  limit?: number;
  offset?: number;
};

export type ContactListQuery = {
  contact_type?: ContactType;
  search?: string;
  linked_only?: boolean;
  limit?: number;
  offset?: number;
};

export type PaymentListQuery = {
  date_from?: string;
  date_to?: string;
  contact_name?: string;
  limit?: number;
  offset?: number;
};

// ============================================================================
// Reconciliation
// ============================================================================
//
// After a CSV/Xero import, contacts that don't auto-link to an existing Client
// land in the unlinked-contacts queue. The reconciliation panel walks the user
// through linking each one (or creating a new Client from it).

export type ClientSuggestion = {
  client_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  score: number;
};

export type ContactSuggestionsResponse = {
  contact_id: string;
  contact_name: string;
  contact_email: string | null;
  suggestions: ClientSuggestion[];
};

export type UnlinkedContactsResponse = {
  items: UniversalContact[];
  total: number;
  invoices_pending_link: number;
};

export type LinkContactRequest = {
  client_id: string;
};

export type CreateClientFromContactRequest = {
  name?: string;
  email?: string;
  phone?: string;
  chase_enabled?: boolean;
  chase_frequency_days?: number;
  escalation_days?: number;
};

export type ReconciliationResult = {
  contact_id: string;
  client_id: string;
  contact_name: string;
  client_name: string;
  invoices_materialized: number;
};

export type BulkLinkItem = {
  contact_id: string;
  client_id: string;
};

export type BulkLinkRequest = {
  links: BulkLinkItem[];
};

export type BulkReconciliationResult = {
  linked_count: number;
  skipped_count: number;
  total_invoices_materialized: number;
  results: ReconciliationResult[];
};

// ============================================================================
// Payment → Invoice reconciliation
// ============================================================================

export type LinkPaymentToInvoiceRequest = {
  invoice_id: string;
};

export type PaymentLinkResult = {
  payment_id: string;
  invoice_id: string;
  invoice_number: string | null;
  invoice_status: string;
  amount_paid: string;
  amount_due: string;
};
