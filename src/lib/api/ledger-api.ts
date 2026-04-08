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
};
