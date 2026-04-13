"use client";

import { useEffect, useState } from "react";
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
  grouped: [string, { date: string; amount: number | string; description: string }[]][];
};

type ViewMode = "missing" | "all" | "imported" | "documents";

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
      txns.map((t) => ({ date: t.date, amount: t.amount, description: t.description || t.supplier_name || "Transaction" })),
    ] as [string, { date: string; amount: number | string; description: string }[]],
  );
  return { total: d.total_missing, grouped };
}

function docStatusDot(txn: Transaction): { color: string; label: string } {
  if (txn.document_matched) return { color: "var(--success)", label: "Matched" };
  if (txn.document_uploaded) return { color: "var(--warning)", label: "Uploaded" };
  if (txn.document_received) return { color: "var(--info)", label: "Received" };
  return { color: "var(--danger)", label: "Missing" };
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
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState<string | null>(null);

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

  async function handleSendChase() {
    setSending(true);
    setSendMsg(null);
    try {
      await chasesApi.send(client.id, { client_id: client.id, chase_type: "email" });
      setSendMsg("Chase sent.");
    } catch {
      setSendMsg("Failed to send.");
    } finally {
      setSending(false);
      setTimeout(() => setSendMsg(null), 3000);
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
        {/* Header: title + send chase + view toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-12)" }}>
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
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-8)" }}>
            {sendMsg && (
              <span style={{ fontSize: "var(--text-xs)", color: sendMsg.includes("sent") ? "var(--success)" : "var(--danger)" }}>{sendMsg}</span>
            )}
            {missingData && missingData.total > 0 && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleSendChase} disabled={sending} style={{ fontSize: "var(--text-xs)" }}>
                {sending ? "Sending..." : "Send Chase"}
              </button>
            )}
          </div>
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
                            <div style={{ fontWeight: "var(--fw-medium)", color: "var(--clr-primary)", flexShrink: 0, marginLeft: "var(--sp-12)" }}>{txn.amount}</div>
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
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
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
                    <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: "var(--sp-10)", padding: "var(--sp-10) var(--sp-12)", background: "var(--clr-surface-card)", borderRadius: "var(--r-md)", border: "1px solid var(--clr-divider)", fontSize: "var(--text-sm)" }}>
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
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
                {allTransactions.map((txn) => {
                  const status = docStatusDot(txn);
                  return (
                    <div key={txn.id} style={{ display: "flex", alignItems: "center", gap: "var(--sp-10)", padding: "var(--sp-10) var(--sp-12)", background: "var(--clr-surface-card)", borderRadius: "var(--r-md)", border: "1px solid var(--clr-divider)", fontSize: "var(--text-sm)" }}>
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
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
                {clientDocs.map((doc) => {
                  const docState = docStateBadge(doc);
                  return (
                    <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: "var(--sp-10)", padding: "var(--sp-10) var(--sp-12)", background: "var(--clr-surface-card)", borderRadius: "var(--r-md)", border: "1px solid var(--clr-divider)", fontSize: "var(--text-sm)" }}>
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
