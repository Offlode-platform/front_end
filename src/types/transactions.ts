export type Transaction = {
  id: string;
  organization_id: string;
  client_id: string;
  date: string;
  amount: string;
  description: string | null;
  supplier_name: string | null;
  xero_transaction_id: string;
  xero_type: string | null;
  document_required: boolean;
  document_received: boolean;
  document_uploaded_at: string | null;
  document_uploaded: boolean;
  document_matched: boolean;
  client_query_status: string;
  client_query_message: string | null;
  client_query_updated_at: string | null;
  excluded: boolean;
  exclusion_reason: string | null;
  created_at: string;
  updated_at: string;
  needs_document: boolean;
};

export type TransactionListResponse = {
  client_id: string;
  total_missing: number;
  grouped_by_supplier: Record<string, Transaction[]>;
};

export type TransactionUpdate = {
  description?: string | null;
  supplier_name?: string | null;
  document_required?: boolean | null;
  document_received?: boolean | null;
  document_uploaded?: boolean | null;
  document_matched?: boolean | null;
  excluded?: boolean | null;
  client_query_status?: string | null;
  client_query_message?: string | null;
};
