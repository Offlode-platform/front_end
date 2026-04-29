"use client";

import { useEffect, useState } from "react";
import { ledgerApi } from "@/lib/api/ledger-api";
import type { UniversalPayment } from "@/types/ledger";
import { LedgerPaymentLinkModal } from "./ledger-payment-link-modal";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatMoney(amount: string, currency: string): string {
  const n = Number(amount);
  if (Number.isNaN(n)) return amount;
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "GBP" }).format(n);
}

export function LedgerPaymentsTable() {
  const [payments, setPayments] = useState<UniversalPayment[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [linkingPayment, setLinkingPayment] = useState<UniversalPayment | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    ledgerApi.listPayments({
      limit: 100,
      contact_name: search.trim() || undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }).then(
      (result) => {
        if (!cancelled) {
          setPayments(result.items);
          setTotal(result.total);
          setLoading(false);
        }
      },
      () => {
        if (!cancelled) {
          setError("Unable to load payments.");
          setLoading(false);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  // refreshKey forces a reload after a successful link
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, refreshKey]);

  return (
    <>
      {linkingPayment && (
        <LedgerPaymentLinkModal
          payment={linkingPayment}
          onClose={() => setLinkingPayment(null)}
          onLinked={() => {
            setLinkingPayment(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      <div className="ws-card" style={{ marginBottom: "var(--sp-16)" }}>
        <div className="ws-card-title">Filters</div>
        <input
          type="text"
          placeholder="Search by contact name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "var(--sp-8) var(--sp-12)",
            border: "1px solid var(--clr-divider-strong)",
            borderRadius: "var(--r-md)",
            fontSize: "var(--text-sm)",
            background: "var(--canvas-bg)",
            color: "var(--clr-primary)",
            fontFamily: "inherit",
            outline: "none",
          }}
        />
      </div>

      {loading && (
        <div className="ws-card" style={{ textAlign: "center", color: "var(--clr-muted)", fontSize: "var(--text-sm)" }}>
          Loading payments...
        </div>
      )}

      {error && (
        <div className="ws-card" style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", fontSize: "var(--text-sm)" }}>
          {error}
        </div>
      )}

      {!loading && !error && payments && payments.length === 0 && (
        <div className="ws-card" style={{ padding: "var(--sp-40)", textAlign: "center" }}>
          <div className="pg-title">No payments found</div>
        </div>
      )}

      {!loading && !error && payments && payments.length > 0 && (
        <div className="ws-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "110px 1fr 110px 130px 110px 80px 110px",
            gap: "var(--sp-8)",
            padding: "var(--sp-10) var(--sp-16)",
            borderBottom: "1px solid var(--clr-divider)",
            fontSize: "var(--text-xs)",
            fontWeight: "var(--fw-semibold)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--clr-muted)",
          }}>
            <span>Date</span>
            <span>Contact</span>
            <span>Type</span>
            <span>Reference</span>
            <span style={{ textAlign: "right" }}>Amount</span>
            <span>Source</span>
            <span>Invoice</span>
          </div>
          {payments.map((p) => (
            <div
              key={p.id}
              style={{
                display: "grid",
                gridTemplateColumns: "110px 1fr 110px 130px 110px 80px 110px",
                gap: "var(--sp-8)",
                padding: "var(--sp-10) var(--sp-16)",
                borderBottom: "1px solid var(--clr-divider)",
                fontSize: "var(--text-sm)",
                alignItems: "center",
              }}
            >
              <span style={{ color: "var(--clr-muted)", fontSize: "var(--text-xs)" }}>
                {formatDate(p.payment_date)}
              </span>
              <span style={{ color: "var(--clr-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.contact_name || "—"}
              </span>
              <span style={{ color: "var(--clr-muted)", fontSize: "var(--text-xs)", textTransform: "capitalize" }}>
                {p.payment_type || "—"}
              </span>
              <span style={{ color: "var(--clr-muted)", fontSize: "var(--text-xs)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.reference || "—"}
              </span>
              <span style={{ color: "var(--clr-primary)", fontWeight: "var(--fw-medium)", textAlign: "right" }}>
                {formatMoney(p.amount, p.currency_code)}
              </span>
              <span style={{ color: "var(--clr-muted)", fontSize: "var(--text-xs)", textTransform: "capitalize" }}>
                {p.source_platform || "—"}
              </span>
              <span>
                {p.invoice_id ? (
                  <span style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--success, #16a34a)",
                    background: "rgba(34,197,94,0.1)",
                    borderRadius: "var(--r-full)",
                    padding: "2px 8px",
                  }}>
                    Linked
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setLinkingPayment(p)}
                    style={{
                      fontSize: "var(--text-xs)",
                      padding: "3px 10px",
                      border: "1px solid var(--clr-divider-strong)",
                      borderRadius: "var(--r-md)",
                      background: "var(--canvas-bg)",
                      color: "var(--clr-primary)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Link Invoice
                  </button>
                )}
              </span>
            </div>
          ))}
          <div style={{
            padding: "var(--sp-10) var(--sp-16)",
            fontSize: "var(--text-xs)",
            color: "var(--clr-muted)",
            background: "var(--clr-surface-subtle)",
          }}>
            Showing {payments.length} of {total}
          </div>
        </div>
      )}
    </>
  );
}
