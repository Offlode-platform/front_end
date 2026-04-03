"use client";

import { useEffect, useState } from "react";
import { transactionsApi } from "@/lib/api/transactions-api";
import { dashboardApi } from "@/lib/api/dashboard-api";
import { chasesApi } from "@/lib/api/chases-api";
import type { ListedClient } from "@/types/clients";
import type { Transaction, TransactionListResponse } from "@/types/transactions";
import type {
  ClientDashboardDetailsResponse,
  ClientDashboardMissingTransaction,
} from "@/types/dashboard";

type Props = {
  client: ListedClient;
};

type MissingData = {
  total: number;
  grouped: [string, { date: string; amount: number | string; description: string }[]][];
};

type ViewMode = "missing" | "all";

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

    return () => {
      cancelled = true;
      setLoading(true);
      setError(null);
      setMissingData(null);
      setAllTransactions(null);
    };
  }, [client.id]);

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
      </div>
    </div>
  );
}
