import { authenticatedApi } from "./authenticated-client";
import { apiPaths } from "./endpoints";
import type {
  UniversalInvoice,
  UniversalInvoiceListResponse,
  UniversalContact,
  UniversalContactListResponse,
  UniversalPayment,
  UniversalPaymentListResponse,
  InvoiceListQuery,
  ContactListQuery,
  PaymentListQuery,
  UnlinkedContactsResponse,
  ContactSuggestionsResponse,
  LinkContactRequest,
  CreateClientFromContactRequest,
  ReconciliationResult,
  BulkLinkRequest,
  BulkReconciliationResult,
} from "@/types/ledger";

type QueryValue = string | number | boolean | undefined | null;

function withQuery(
  path: string,
  query?: Record<string, QueryValue>,
): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

async function readData<T>(p: Promise<{ data: T }>): Promise<T> {
  const { data } = await p;
  return data;
}

export const ledgerApi = {
  listInvoices(params?: InvoiceListQuery) {
    return readData<UniversalInvoiceListResponse>(
      authenticatedApi.get(withQuery(apiPaths.ledger.invoices, params)),
    );
  },

  getInvoice(invoiceId: string) {
    return readData<UniversalInvoice>(
      authenticatedApi.get(
        `${apiPaths.ledger.invoices}/${encodeURIComponent(invoiceId)}`,
      ),
    );
  },

  listContacts(params?: ContactListQuery) {
    return readData<UniversalContactListResponse>(
      authenticatedApi.get(withQuery(apiPaths.ledger.contacts, params)),
    );
  },

  getContact(contactId: string) {
    return readData<UniversalContact>(
      authenticatedApi.get(
        `${apiPaths.ledger.contacts}/${encodeURIComponent(contactId)}`,
      ),
    );
  },

  listPayments(params?: PaymentListQuery) {
    return readData<UniversalPaymentListResponse>(
      authenticatedApi.get(withQuery(apiPaths.ledger.payments, params)),
    );
  },

  getPayment(paymentId: string) {
    return readData<UniversalPayment>(
      authenticatedApi.get(
        `${apiPaths.ledger.payments}/${encodeURIComponent(paymentId)}`,
      ),
    );
  },

  // ==========================================================================
  // Reconciliation
  // ==========================================================================

  listUnlinkedContacts(params?: { limit?: number; offset?: number }) {
    return readData<UnlinkedContactsResponse>(
      authenticatedApi.get(
        withQuery(apiPaths.ledger.contactsUnlinked, {
          limit: params?.limit,
          offset: params?.offset,
        }),
      ),
    );
  },

  getContactSuggestions(contactId: string, limit: number = 5) {
    return readData<ContactSuggestionsResponse>(
      authenticatedApi.get(
        withQuery(apiPaths.ledger.contactSuggestions(contactId), { limit }),
      ),
    );
  },

  linkContact(contactId: string, body: LinkContactRequest) {
    return readData<ReconciliationResult>(
      authenticatedApi.post(apiPaths.ledger.contactLink(contactId), body),
    );
  },

  createClientFromContact(
    contactId: string,
    body: CreateClientFromContactRequest = {},
  ) {
    return readData<ReconciliationResult>(
      authenticatedApi.post(
        apiPaths.ledger.contactCreateClient(contactId),
        body,
      ),
    );
  },

  bulkLinkContacts(body: BulkLinkRequest) {
    return readData<BulkReconciliationResult>(
      authenticatedApi.post(apiPaths.ledger.contactBulkLink, body),
    );
  },
};
