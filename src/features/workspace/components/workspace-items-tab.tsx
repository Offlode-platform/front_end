"use client";

import { useCallback, useEffect, useState } from "react";
import { transactionsApi } from "@/lib/api/transactions-api";
import { dashboardApi } from "@/lib/api/dashboard-api";
import { chasesApi } from "@/lib/api/chases-api";
import { ledgerApi } from "@/lib/api/ledger-api";
import { documentsApi } from "@/lib/api/documents-api";
import type { ListedClient } from "@/types/clients";
import type { Transaction, TransactionListResponse } from "@/types/transactions";
import type {
  ClientDashboardDetailsResponse,
  ClientDashboardMissingTransaction,
} from "@/types/dashboard";
import type { UniversalInvoice } from "@/types/ledger";
import type { Document } from "@/types/documents";

type Props = {
  client: ListedClient;
};

type MissingData = {
  total: number;
  grouped: [string, { id?: string; date: string; amount: number | string; description: string }[]][];
};

type ViewMode = "missing" | "all" | "imported" | "documents" | "queried";

function normalizeDashboardData(d: ClientDashboardDetailsResponse): MissingData {
  const grouped = Object.entries(d.missing_documents.grouped_by_supplier).map(
    ([supplier, txns]: [string, ClientDashboardMissingTransaction[]]) => [
      supplier,
      txns.map((t) => ({ date: t.date, amount: t.amount, description: t.description })),
    ] as [string, { date: string; amount: number | string; description: string }[]],
  );
  return { total: d.missing_documents.total, grouped };
}

function normalizeTransactionData(d: TransactionListResponse): MissingData {
  const grouped = Object.entries(d.grouped_by_supplier).map(
    ([supplier, txns]) => [
      supplier,
      txns.map((t) => ({ id: t.id, date: t.date, amount: t.amount, description: t.description || t.supplier_name || "Transaction" })),
    ] as [string, { id: string; date: string; amount: number | string; description: string }[]],
  );
  return { total: d.total_missing, grouped };
}

function docStatusDot(txn: Transaction): { color: string; label: string } {
  if (txn.document_matched) return { color: "var(--success)", label: "Matched" };
  if (txn.document_uploaded) return { color: "var(--warning)", label: "Uploaded" };
  if (txn.document_received) return { color: "var(--info)", label: "Received" };
  return { color: "var(--danger)", label: "Missing" };
}

const CHANNEL_LABEL: Record<"email" | "sms" | "whatsapp", string> = {
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

function IconEmail() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="2,4 12,13 22,4" />
    </svg>
  );
}

function IconSms() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg width="13" height="13" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M16 2C8.28 2 2 8.28 2 16c0 2.44.66 4.73 1.8 6.71L2 30l7.47-1.76A13.92 13.92 0 0 0 16 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm0 25.5c-2.13 0-4.13-.57-5.86-1.57l-.42-.25-4.44 1.05 1.1-4.32-.28-.45A11.46 11.46 0 0 1 4.5 16C4.5 9.6 9.6 4.5 16 4.5S27.5 9.6 27.5 16 22.4 27.5 16 27.5zm6.3-8.6c-.35-.17-2.05-1.01-2.37-1.13-.32-.12-.55-.17-.78.17-.23.35-.89 1.13-1.09 1.36-.2.23-.4.26-.75.09-.35-.17-1.47-.54-2.8-1.72-1.03-.92-1.73-2.06-1.93-2.41-.2-.35-.02-.54.15-.71.15-.15.35-.4.52-.6.17-.2.23-.35.35-.58.12-.23.06-.43-.03-.6-.09-.17-.78-1.87-1.07-2.56-.28-.67-.57-.58-.78-.59h-.67c-.23 0-.6.09-.91.43-.31.35-1.2 1.17-1.2 2.86s1.23 3.32 1.4 3.55c.17.23 2.42 3.69 5.86 5.17.82.35 1.46.56 1.96.72.82.26 1.57.22 2.16.13.66-.1 2.05-.84 2.34-1.65.29-.81.29-1.5.2-1.65-.08-.15-.31-.23-.66-.4z"/>
    </svg>
  );
}

export function WorkspaceItemsTab({ client }: Props) {
  const [missingData, setMissingData] = useState<MissingData | null>(null);
  const [allTransactions, setAllTransactions] = useState<Transaction[] | null>(null);
  const [importedInvoices, setImportedInvoices] = useState<UniversalInvoice[] | null>(null);
  const [clientDocs, setClientDocs] = useState<Document[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("missing");
  const [itemSending, setItemSending] = useState<{ txId: string; channel: string } | null>(null);
  const [itemSendResult, setItemSendResult] = useState<{ txId: string; channel: string; ok: boolean } | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);

  // Transactions the client has responded to — these are hidden from the
  // default missing view (per backend chase filters) so we surface them in
  // a dedicated Queried tab with the client's message and a Resolve action.
  const queriedTransactions = (allTransactions || []).filter(
    (tx) =>
      tx.client_query_status === "cannot_provide" ||
      tx.client_query_status === "queried",
  );

  useEffect(() => {
    let cancelled = false;

    // Load missing docs
    transactionsApi.missing(client.id).then(
      (result) => {
        if (!cancelled) { setMissingData(normalizeTransactionData(result)); setLoading(false); }
      },
      () => {
        dashboardApi.clientDetails(client.id).then(
          (result) => {
            if (!cancelled) { setMissingData(normalizeDashboardData(result)); setLoading(false); }
          },
          () => {
            if (!cancelled) { setError("Unable to load missing documents."); setLoading(false); }
          },
        );
      },
    );

    // Load all transactions (secondary, silent fail)
    transactionsApi.list(client.id).then(
      (result) => { if (!cancelled) setAllTransactions(result); },
      () => { /* silent */ },
    );

    // Load imported invoices for this client (filter by contact name).
    // This pulls UniversalInvoice rows that came from CSV/Xero so users can see
    // the full picture of imported financial data alongside Transaction rows.
    ledgerApi.listInvoices({ contact_name: client.name, limit: 200 }).then(
      (result) => { if (!cancelled) setImportedInvoices(result.items); },
      () => { /* silent */ },
    );

    // Load documents for this client (shows OCR/scan/quarantine status)
    documentsApi.list(client.id, { limit: 200 }).then(
      (result) => { if (!cancelled) setClientDocs(result.documents); },
      () => { /* silent */ },
    );

    return () => {
      cancelled = true;
      setLoading(true);
      setError(null);
      setMissingData(null);
      setAllTransactions(null);
      setImportedInvoices(null);
      setClientDocs(null);
    };
  }, [client.id, client.name]);

  async function handleResolveQuery(txId: string) {
    setResolvingId(txId);
    try {
      // Clearing client_query_status puts the transaction back into the
      // active chase queue. If the firm received the doc offline they can
      // also mark it uploaded; for now "Resolve" just unblocks chasing.
      await transactionsApi.update(txId, { client_query_status: "" });
      // Refresh the all-transactions list
      const list = await transactionsApi.list(client.id);
      setAllTransactions(list);
    } catch {
      /* fall through — user can retry */
    } finally {
      setResolvingId(null);
    }
  }

  const handleDownloadDoc = useCallback(async (doc: Document) => {
    try {
      const { blob, filename } = await documentsApi.fetchBlob(doc.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || doc.original_filename || doc.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      /* silent — user can retry */
    }
  }, []);

  async function handleSendChase(channel: "email" | "sms" | "whatsapp", transactionId: string) {
    setItemSending({ txId: transactionId, channel });
    setItemSendResult(null);
    try {
      await chasesApi.send(client.id, { client_id: client.id, chase_type: channel, transaction_id: transactionId });
      setItemSendResult({ txId: transactionId, channel, ok: true });
    } catch {
      setItemSendResult({ txId: transactionId, channel, ok: false });
    } finally {
      setItemSending(null);
      setTimeout(() => setItemSendResult(null), 3500);
    }
  }

  if (loading) {
    return (
      <div className="ws-panel active" style={{ padding: "var(--sp-24)", color: "var(--clr-muted)", fontSize: "var(--text-sm)" }}>
        Loading items...
      </div>
    );
  }

  if (error) {
    return (
      <div className="ws-panel active" style={{ padding: "var(--sp-24)" }}>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="ws-panel active">
      <div style={{ padding: "var(--sp-16)" }}>
        {/* View filter pills */}
        <div className="ws-issue-filters">
          <button type="button" className={`ws-issue-filter${view === "missing" ? " active" : ""}`} onClick={() => setView("missing")}>
            Missing{missingData && missingData.total > 0 ? ` (${missingData.total})` : ""}
          </button>
          {allTransactions && (
            <button type="button" className={`ws-issue-filter${view === "all" ? " active" : ""}`} onClick={() => setView("all")}>
              All ({allTransactions.length})
            </button>
          )}
          {importedInvoices && importedInvoices.length > 0 && (
            <button type="button" className={`ws-issue-filter${view === "imported" ? " active" : ""}`} onClick={() => setView("imported")}>
              Imported ({importedInvoices.length})
            </button>
          )}
          {clientDocs && clientDocs.length > 0 && (
            <button type="button" className={`ws-issue-filter${view === "documents" ? " active" : ""}`} onClick={() => setView("documents")}>
              Docs ({clientDocs.length})
            </button>
          )}
          {queriedTransactions.length > 0 && (
            <button
              type="button"
              className={`ws-issue-filter${view === "queried" ? " active" : ""}`}
              onClick={() => setView("queried")}
              style={{ color: "var(--warning)" }}
            >
              Queried ({queriedTransactions.length})
            </button>
          )}
        </div>

        {/* Missing view */}
        {view === "missing" && (
          <>
            {!missingData || missingData.total === 0 ? (
              <div style={{ padding: "var(--sp-32)", textAlign: "center" }}>
                <div style={{ fontSize: "var(--text-md)", fontWeight: "var(--fw-medium)", color: "var(--clr-primary)", marginBottom: "var(--sp-4)" }}>No missing documents</div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>All documents for this client have been received.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-8)" }}>
                {missingData.grouped.map(([supplier, transactions]) => (
                  <div key={supplier} style={{ background: "var(--clr-surface-card)", borderRadius: "var(--r-lg)", border: "1px solid var(--clr-divider)", overflow: "hidden" }}>
                    <button
                      type="button"
                      onClick={() => setExpandedSupplier(expandedSupplier === supplier ? null : supplier)}
                      style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--sp-12) var(--sp-16)", fontSize: "var(--text-sm)", fontWeight: "var(--fw-medium)", color: "var(--clr-primary)", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                    >
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{supplier}</span>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", flexShrink: 0, marginLeft: "var(--sp-8)" }}>
                        {transactions.length} item{transactions.length !== 1 ? "s" : ""}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 4, verticalAlign: "middle", transform: expandedSupplier === supplier ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.15s" }}>
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </button>
                    {expandedSupplier === supplier && (
                      <div style={{ borderTop: "1px solid var(--clr-divider)", padding: "var(--sp-8) var(--sp-16) var(--sp-12)" }}>
                        {transactions.map((txn, i) => (
                          <div key={`${supplier}-${i}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--sp-6) 0", fontSize: "var(--text-sm)", borderBottom: "1px solid var(--clr-divider)" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ color: "var(--clr-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{txn.description}</div>
                              <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginTop: 1 }}>
                                {new Date(txn.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                              </div>
                            </div>
                            {txn.id && (
                              <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0, marginLeft: "var(--sp-8)" }}>
                                {(["email", "sms", "whatsapp"] as const).map((channel) => {
                                  const isSending = itemSending?.txId === txn.id && itemSending.channel === channel;
                                  const resultColor = itemSendResult?.txId === txn.id && itemSendResult.channel === channel
                                    ? (itemSendResult.ok ? { email: "var(--info)", sms: "var(--brand)", whatsapp: "var(--success)" }[channel] : "var(--danger)")
                                    : undefined;
                                  const colors = { email: "var(--info)", sms: "var(--brand)", whatsapp: "var(--success)" };
                                  const icons = { email: <IconEmail />, sms: <IconSms />, whatsapp: <IconWhatsApp /> };
                                  return (
                                    <button
                                      key={channel}
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleSendChase(channel, txn.id); }}
                                      disabled={itemSending !== null}
                                      title={`Send ${CHANNEL_LABEL[channel]} chase for this item`}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: 26,
                                        height: 26,
                                        padding: 0,
                                        color: resultColor ?? (isSending ? colors[channel] : "var(--clr-tertiary)"),
                                        background: isSending ? `color-mix(in srgb, ${colors[channel]} 10%, transparent)` : "transparent",
                                        border: "none",
                                        borderRadius: "var(--r-sm)",
                                        cursor: itemSending !== null ? "not-allowed" : "pointer",
                                        opacity: itemSending !== null && !isSending ? 0.35 : 1,
                                        transition: "color var(--dur)",
                                      }}
                                    >
                                      {isSending ? (
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true" style={{ animation: "spin 0.7s linear infinite" }}>
                                          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                                          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                                        </svg>
                                      ) : icons[channel]}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                            <div style={{ fontWeight: "var(--fw-medium)", color: "var(--clr-primary)", flexShrink: 0, marginLeft: "var(--sp-8)" }}>{txn.amount}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Imported invoices view (from CSV / Xero universal ledger) */}
        {view === "imported" && (
          <>
            {!importedInvoices || importedInvoices.length === 0 ? (
              <div style={{ padding: "var(--sp-32)", textAlign: "center" }}>
                <div style={{ fontSize: "var(--text-md)", fontWeight: "var(--fw-medium)", color: "var(--clr-primary)", marginBottom: "var(--sp-4)" }}>No imported invoices</div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>Imported invoices for this client will appear here.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
                {importedInvoices.map((inv) => {
                  const linked = inv.transaction_id !== null;
                  const dotColor = inv.document_received
                    ? "var(--success)"
                    : linked
                      ? "var(--warning)"
                      : "var(--danger)";
                  const statusLabel = inv.document_received
                    ? "Document received"
                    : linked
                      ? "In chase queue"
                      : "Pending link";
                  return (
                    <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: "var(--sp-12)", padding: "var(--sp-12) var(--sp-16)", background: "var(--clr-surface-card)", borderRadius: "var(--r-md)", border: "1px solid var(--clr-divider)", fontSize: "var(--text-sm)" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: dotColor }} title={statusLabel} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: "var(--clr-primary)", fontWeight: "var(--fw-medium)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {inv.invoice_number || inv.reference || inv.description || "Invoice"}
                        </div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginTop: 1 }}>
                          {new Date(inv.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          <span style={{ marginLeft: "var(--sp-8)", color: dotColor }}>{statusLabel}</span>
                          {inv.source_platform && (
                            <span style={{ marginLeft: "var(--sp-8)", textTransform: "capitalize" }}>· {inv.source_platform}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ fontWeight: "var(--fw-medium)", color: "var(--clr-primary)", flexShrink: 0 }}>
                        {new Intl.NumberFormat("en-GB", { style: "currency", currency: inv.currency_code || "GBP" }).format(Number(inv.total))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* All transactions view */}
        {view === "all" && (
          <>
            {!allTransactions || allTransactions.length === 0 ? (
              <div style={{ padding: "var(--sp-32)", textAlign: "center" }}>
                <div style={{ fontSize: "var(--text-md)", fontWeight: "var(--fw-medium)", color: "var(--clr-primary)", marginBottom: "var(--sp-4)" }}>No transactions</div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>No transactions found for this client.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
                {allTransactions.map((txn) => {
                  const status = docStatusDot(txn);
                  return (
                    <div key={txn.id} style={{ display: "flex", alignItems: "center", gap: "var(--sp-12)", padding: "var(--sp-12) var(--sp-16)", background: "var(--clr-surface-card)", borderRadius: "var(--r-md)", border: "1px solid var(--clr-divider)", fontSize: "var(--text-sm)" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: status.color }} title={status.label} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: "var(--clr-primary)", fontWeight: "var(--fw-medium)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {txn.description || txn.supplier_name || "Transaction"}
                        </div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginTop: 1 }}>
                          {new Date(txn.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          <span style={{ marginLeft: "var(--sp-8)", color: status.color }}>{status.label}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                        {(["email", "sms", "whatsapp"] as const).map((channel) => {
                          const isSending = itemSending?.txId === txn.id && itemSending.channel === channel;
                          const colors = { email: "var(--info)", sms: "var(--brand)", whatsapp: "var(--success)" };
                          const resultColor = itemSendResult?.txId === txn.id && itemSendResult.channel === channel
                            ? (itemSendResult.ok ? colors[channel] : "var(--danger)")
                            : undefined;
                          const icons = { email: <IconEmail />, sms: <IconSms />, whatsapp: <IconWhatsApp /> };
                          return (
                            <button
                              key={channel}
                              type="button"
                              onClick={() => handleSendChase(channel, txn.id)}
                              disabled={itemSending !== null}
                              title={`Send ${CHANNEL_LABEL[channel]} chase for this item`}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 26,
                                height: 26,
                                padding: 0,
                                color: resultColor ?? (isSending ? colors[channel] : "var(--clr-tertiary)"),
                                background: isSending ? `color-mix(in srgb, ${colors[channel]} 10%, transparent)` : "transparent",
                                border: "none",
                                borderRadius: "var(--r-sm)",
                                cursor: itemSending !== null ? "not-allowed" : "pointer",
                                opacity: itemSending !== null && !isSending ? 0.35 : 1,
                                transition: "color var(--dur)",
                              }}
                            >
                              {isSending ? (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true" style={{ animation: "spin 0.7s linear infinite" }}>
                                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                                </svg>
                              ) : icons[channel]}
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ fontWeight: "var(--fw-medium)", color: "var(--clr-primary)", flexShrink: 0 }}>{txn.amount}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Documents view (Phase 2: shows OCR, virus scan, quarantine status) */}
        {view === "documents" && (
          <>
            {!clientDocs || clientDocs.length === 0 ? (
              <div style={{ padding: "var(--sp-32)", textAlign: "center" }}>
                <div style={{ fontSize: "var(--text-md)", fontWeight: "var(--fw-medium)", color: "var(--clr-primary)", marginBottom: "var(--sp-4)" }}>No documents</div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>No documents uploaded for this client yet.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
                {clientDocs.map((doc) => {
                  const docState = docStateBadge(doc);
                  const canView = doc.virus_scan_status !== "infected" && !!doc.s3_url;
                  return (
                    <div
                      key={doc.id}
                      onClick={canView ? () => setViewingDoc(doc) : undefined}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--sp-12)",
                        padding: "var(--sp-12) var(--sp-16)",
                        background: "var(--clr-surface-card)",
                        borderRadius: "var(--r-md)",
                        border: "1px solid var(--clr-divider)",
                        fontSize: "var(--text-sm)",
                        cursor: canView ? "pointer" : "default",
                        transition: "border-color var(--dur)",
                      }}
                      onMouseEnter={canView ? (e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--clr-divider-strong)"; } : undefined}
                      onMouseLeave={canView ? (e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--clr-divider)"; } : undefined}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: docState.color }} title={docState.label} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-6)" }}>
                          <span style={{ color: "var(--clr-primary)", fontWeight: "var(--fw-medium)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {doc.original_filename || doc.filename}
                          </span>
                          {doc.virus_scan_status === "infected" && (
                            <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--fw-semibold)", color: "#fff", background: "var(--danger)", padding: "1px 6px", borderRadius: "var(--r-sm)" }}>
                              QUARANTINED
                            </span>
                          )}
                          {doc.flagged && doc.virus_scan_status !== "infected" && (
                            <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--fw-semibold)", color: "var(--warning)", background: "rgba(245,158,11,0.12)", padding: "1px 6px", borderRadius: "var(--r-sm)" }}>
                              FLAGGED
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginTop: 1, display: "flex", gap: "var(--sp-8)", flexWrap: "wrap" }}>
                          <span>{new Date(doc.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                          <span style={{ color: docState.color }}>{docState.label}</span>
                          {doc.ocr_status === "completed" && doc.ocr_confidence && (
                            <span>OCR {Number(doc.ocr_confidence).toFixed(0)}%</span>
                          )}
                          {doc.extracted_supplier && (
                            <span>{doc.extracted_supplier}</span>
                          )}
                          {doc.forwarded_to_xero && (
                            <span style={{ color: "var(--success)" }}>Sent to Xero</span>
                          )}
                        </div>
                      </div>
                      {doc.extracted_amount && (
                        <div style={{ fontWeight: "var(--fw-medium)", color: "var(--clr-primary)", flexShrink: 0 }}>
                          {new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(doc.extracted_amount))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Queried view — transactions where the client pushed back */}
        {view === "queried" && (
          <>
            {queriedTransactions.length === 0 ? (
              <div style={{ padding: "var(--sp-32)", textAlign: "center" }}>
                <div style={{ fontSize: "var(--text-md)", fontWeight: "var(--fw-medium)", color: "var(--clr-primary)", marginBottom: "var(--sp-4)" }}>No client queries</div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>The client hasn&apos;t flagged anything as &quot;can&apos;t provide&quot; yet.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-8)" }}>
                {queriedTransactions.map((txn) => {
                  const isCantProvide = txn.client_query_status === "cannot_provide";
                  const color = isCantProvide ? "var(--danger)" : "var(--warning)";
                  const label = isCantProvide ? "Can't provide" : "Queried";
                  const resolving = resolvingId === txn.id;
                  return (
                    <div
                      key={txn.id}
                      style={{
                        background: "var(--clr-surface-card)",
                        borderRadius: "var(--r-md)",
                        border: `1px solid ${color}`,
                        borderLeft: `4px solid ${color}`,
                        padding: "var(--sp-12)",
                        fontSize: "var(--text-sm)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--sp-12)", marginBottom: "var(--sp-8)" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-8)" }}>
                            <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--fw-semibold)", color: "#fff", background: color, padding: "2px 8px", borderRadius: "var(--r-sm)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                              {label}
                            </span>
                            <span style={{ color: "var(--clr-primary)", fontWeight: "var(--fw-medium)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {txn.supplier_name || txn.description || "Transaction"}
                            </span>
                          </div>
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginTop: 2 }}>
                            {new Date(txn.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            {txn.client_query_updated_at && (
                              <span style={{ marginLeft: "var(--sp-8)" }}>
                                · Client responded {new Date(txn.client_query_updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ fontWeight: "var(--fw-medium)", color: "var(--clr-primary)", flexShrink: 0 }}>
                          {txn.amount}
                        </div>
                      </div>

                      {txn.client_query_message && (
                        <div style={{ padding: "var(--sp-8) var(--sp-10)", background: "var(--clr-surface)", borderRadius: "var(--r-sm)", color: "var(--clr-secondary)", fontSize: "var(--text-sm)", marginBottom: "var(--sp-8)" }}>
                          &ldquo;{txn.client_query_message}&rdquo;
                        </div>
                      )}

                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleResolveQuery(txn.id)}
                          disabled={resolving}
                          style={{ fontSize: "var(--text-xs)" }}
                        >
                          {resolving ? "Resolving..." : "Mark Resolved"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* File viewer modal */}
      {viewingDoc && (
        <div
          className="modal-overlay open"
          onClick={() => setViewingDoc(null)}
        >
          <div
            className="modal"
            style={{ width: "min(900px, calc(100vw - 48px))", height: "calc(100vh - 80px)", maxHeight: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ borderBottom: "1px solid var(--clr-divider)", padding: "var(--sp-16) var(--sp-20)" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="modal-title" style={{ fontSize: "var(--text-sm)", fontWeight: "var(--fw-semibold)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {viewingDoc.original_filename || viewingDoc.filename}
                </div>
                {viewingDoc.extracted_supplier && (
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginTop: 2 }}>
                    {viewingDoc.extracted_supplier}
                    {viewingDoc.extracted_amount && (
                      <span style={{ marginLeft: "var(--sp-8)" }}>
                        · {new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(viewingDoc.extracted_amount))}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-8)", flexShrink: 0, marginLeft: "var(--sp-16)" }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleDownloadDoc(viewingDoc)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "var(--sp-4)", fontSize: "var(--text-xs)", color: "var(--brand)" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </button>
                <button type="button" className="modal-close" onClick={() => setViewingDoc(null)} aria-label="Close">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            </div>

            <div className="modal-body" style={{ padding: 0, flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", background: "var(--clr-surface-subtle)" }}>
              <DocViewer doc={viewingDoc} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocViewer({ doc }: { doc: Document }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let url: string | null = null;
    setLoadState("loading");
    setBlobUrl(null);

    documentsApi.fetchBlob(doc.id).then(
      ({ blob }) => {
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setLoadState("ready");
      },
      () => setLoadState("error"),
    );

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [doc.id]);

  const mime = doc.mime_type || "";
  const name = (doc.original_filename || doc.filename).toLowerCase();
  const isImage = mime.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(name);
  const isPdf = mime === "application/pdf" || name.endsWith(".pdf");

  if (loadState === "loading") {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--clr-muted)", fontSize: "var(--text-sm)" }}>
        Loading…
      </div>
    );
  }

  if (loadState === "error" || !blobUrl) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--sp-12)", padding: "var(--sp-48)", textAlign: "center" }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--clr-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-secondary)" }}>
          Unable to load file preview.
        </div>
      </div>
    );
  }

  if (isImage) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--sp-24)", overflow: "auto" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={blobUrl}
          alt={doc.original_filename || doc.filename}
          style={{ maxWidth: "100%", maxHeight: "65vh", objectFit: "contain", borderRadius: "var(--r-md)", boxShadow: "var(--shadow-md)" }}
        />
      </div>
    );
  }

  if (isPdf) {
    return (
      <iframe
        src={blobUrl}
        title={doc.original_filename || doc.filename}
        style={{ display: "block", flex: 1, width: "100%", height: 0, minHeight: 0, border: "none" }}
      />
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--sp-12)", padding: "var(--sp-48)", textAlign: "center" }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--clr-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-secondary)" }}>
        Preview not available for this file type.
      </div>
    </div>
  );
}

function docStateBadge(doc: Document): { color: string; label: string } {
  if (doc.virus_scan_status === "infected") return { color: "var(--danger)", label: "Quarantined" };
  if (doc.virus_scan_status === "pending") return { color: "var(--clr-muted)", label: "Scanning" };
  if (doc.ocr_status === "pending" || doc.ocr_status === "processing") return { color: "var(--info)", label: "Processing OCR" };
  if (doc.ocr_status === "failed") return { color: "var(--warning)", label: "OCR failed" };
  if (doc.forwarded_to_xero) return { color: "var(--success)", label: "Complete" };
  if (doc.is_processed) return { color: "var(--success)", label: "Processed" };
  return { color: "var(--warning)", label: "Pending" };
}
