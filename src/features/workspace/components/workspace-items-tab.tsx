"use client";

import { useEffect, useState } from "react";
import { transactionsApi } from "@/lib/api/transactions-api";
import { dashboardApi } from "@/lib/api/dashboard-api";
import type { ListedClient } from "@/types/clients";
import type { TransactionListResponse } from "@/types/transactions";
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

function normalizeDashboardData(
  d: ClientDashboardDetailsResponse,
): MissingData {
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
      txns.map((t) => ({
        date: t.date,
        amount: t.amount,
        description: t.description || t.supplier_name || "Transaction",
      })),
    ] as [string, { date: string; amount: number | string; description: string }[]],
  );
  return { total: d.total_missing, grouped };
}

export function WorkspaceItemsTab({ client }: Props) {
  const [data, setData] = useState<MissingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Try the transactions API first, fall back to dashboard endpoint
    transactionsApi.missing(client.id).then(
      (result) => {
        if (!cancelled) {
          setData(normalizeTransactionData(result));
          setLoading(false);
        }
      },
      () => {
        // Fallback to dashboard client details
        dashboardApi.clientDetails(client.id).then(
          (result) => {
            if (!cancelled) {
              setData(normalizeDashboardData(result));
              setLoading(false);
            }
          },
          () => {
            if (!cancelled) {
              setError("Unable to load missing documents.");
              setLoading(false);
            }
          },
        );
      },
    );

    return () => {
      cancelled = true;
      setLoading(true);
      setError(null);
      setData(null);
    };
  }, [client.id]);

  if (loading) {
    return (
      <div className="ws-panel active" style={{ padding: "var(--sp-24)", color: "var(--clr-muted)" }}>
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

  if (!data || data.total === 0) {
    return (
      <div className="ws-panel active">
        <div style={{ padding: "var(--sp-32)", textAlign: "center" }}>
          <div style={{ fontSize: "var(--text-md)", fontWeight: "var(--fw-medium)", color: "var(--clr-primary)", marginBottom: "var(--sp-4)" }}>
            No missing documents
          </div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>
            All documents for this client have been received.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ws-panel active">
      <div style={{ padding: "var(--sp-16)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-12)" }}>
          <div className="ws-section-title" style={{ margin: 0 }}>
            Missing Documents
            <span className="ws-list-section-count">{data.total}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-8)" }}>
          {data.grouped.map(([supplier, transactions]) => (
            <div
              key={supplier}
              style={{
                background: "var(--canvas-bg)",
                borderRadius: "var(--r-lg)",
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                onClick={() => setExpandedSupplier(expandedSupplier === supplier ? null : supplier)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "var(--sp-12) var(--sp-16)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--fw-medium)",
                  color: "var(--clr-primary)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span>{supplier}</span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)" }}>
                  {transactions.length} item{transactions.length !== 1 ? "s" : ""}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{
                      marginLeft: 4,
                      verticalAlign: "middle",
                      transform: expandedSupplier === supplier ? "rotate(180deg)" : "rotate(0)",
                      transition: "transform 0.15s",
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </button>

              {expandedSupplier === supplier && (
                <div style={{ borderTop: "1px solid var(--clr-divider)", padding: "var(--sp-8) var(--sp-16) var(--sp-12)" }}>
                  {transactions.map((txn, i) => (
                    <div
                      key={`${supplier}-${i}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "var(--sp-6) 0",
                        fontSize: "var(--text-sm)",
                        borderBottom: "1px solid var(--clr-divider)",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: "var(--clr-secondary)" }}>
                          {txn.description}
                        </div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginTop: 1 }}>
                          {new Date(txn.date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                      <div style={{ fontWeight: "var(--fw-medium)", color: "var(--clr-primary)", flexShrink: 0, marginLeft: "var(--sp-12)" }}>
                        {txn.amount}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
