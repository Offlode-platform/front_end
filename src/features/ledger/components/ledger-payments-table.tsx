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

const GRID = "110px 1fr 100px 150px 130px 80px 130px";

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
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, refreshKey]);

  const linkedCount = payments?.filter((p) => p.invoice_id).length ?? 0;
  const unlinkedCount = payments?.filter((p) => !p.invoice_id).length ?? 0;

  return (
    <>
      <style>{`
        .lpt-row { transition: background 120ms ease; }
        .lpt-row:hover { background: rgba(0,0,0,0.022) !important; }
        [data-theme="dark"] .lpt-row:hover { background: rgba(255,255,255,0.035) !important; }
        .lpt-link-btn {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 10px;
          border-radius: var(--r-md);
          font-size: var(--text-xs);
          font-weight: var(--fw-medium);
          font-family: inherit;
          white-space: nowrap;
          cursor: pointer;
          border: 1px solid rgba(53,126,146,0.35);
          background: rgba(53,126,146,0.06);
          color: var(--brand);
          transition: all 150ms ease;
        }
        .lpt-link-btn:hover {
          background: rgba(53,126,146,0.12);
          border-color: var(--brand);
        }
      `}</style>

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

      {/* ── Filter bar ── */}
      <div
        className="ws-card"
        style={{
          marginBottom: "var(--sp-16)",
          padding: "var(--sp-12) var(--sp-20)",
        }}
      >
        <div style={{ position: "relative" }}>
          <svg
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{
              position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
              color: "var(--clr-muted)", pointerEvents: "none",
            }}
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by contact name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "var(--sp-8) var(--sp-12) var(--sp-8) 34px",
              border: "1px solid var(--clr-divider-strong)",
              borderRadius: "var(--r-md)",
              fontSize: "var(--text-sm)",
              background: "var(--canvas-bg)",
              color: "var(--clr-primary)",
              fontFamily: "inherit",
              outline: "none",
              transition: "border-color var(--dur)",
            }}
          />
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="ws-card" style={{ textAlign: "center", color: "var(--clr-muted)", fontSize: "var(--text-sm)", padding: "var(--sp-48)" }}>
          Loading payments…
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="ws-card" style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", fontSize: "var(--text-sm)" }}>
          {error}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && payments && payments.length === 0 && (
        <div className="ws-card" style={{ padding: "var(--sp-48)", textAlign: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(53,126,146,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--sp-12)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div className="pg-title" style={{ marginBottom: "var(--sp-4)" }}>No payments found</div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>
            Import payments to see them here.
          </div>
        </div>
      )}

      {/* ── Table ── */}
      {!loading && !error && payments && payments.length > 0 && (
        <div className="ws-card" style={{ padding: 0, overflow: "hidden" }}>

          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: GRID,
            gap: "var(--sp-8)",
            padding: "var(--sp-8) var(--sp-20)",
            borderBottom: "1px solid var(--clr-divider-strong)",
            fontSize: "var(--text-2xs)",
            fontWeight: "var(--fw-semibold)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--clr-muted)",
            background: "rgba(0,0,0,0.015)",
          }}>
            <span>Date</span>
            <span>Contact</span>
            <span>Type</span>
            <span>Reference</span>
            <span style={{ textAlign: "right" }}>Amount</span>
            <span>Source</span>
            <span>Invoice</span>
          </div>

          {/* Rows */}
          {payments.map((p) => {
            const amount = Number(p.amount);
            const isNegative = !Number.isNaN(amount) && amount < 0;

            return (
              <div
                key={p.id}
                className="lpt-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: GRID,
                  gap: "var(--sp-8)",
                  padding: "var(--sp-12) var(--sp-20)",
                  borderBottom: "1px solid var(--clr-divider)",
                  fontSize: "var(--text-sm)",
                  alignItems: "center",
                  background: "transparent",
                }}
              >
                <span style={{ color: "var(--clr-muted)", fontSize: "var(--text-xs)", whiteSpace: "nowrap" }}>
                  {formatDate(p.payment_date)}
                </span>

                <span style={{
                  color: "var(--clr-primary)",
                  fontWeight: "var(--fw-medium)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {p.contact_name || <span style={{ color: "var(--clr-faint)", fontWeight: "var(--fw-normal)" }}>—</span>}
                </span>

                <span style={{
                  color: "var(--clr-muted)",
                  fontSize: "var(--text-xs)",
                  textTransform: "capitalize",
                }}>
                  {p.payment_type || <span style={{ color: "var(--clr-faint)" }}>—</span>}
                </span>

                <span style={{
                  color: "var(--clr-secondary)",
                  fontSize: "var(--text-xs)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {p.reference || <span style={{ color: "var(--clr-faint)" }}>—</span>}
                </span>

                <span style={{
                  color: isNegative ? "var(--danger)" : "var(--clr-primary)",
                  fontWeight: "var(--fw-semibold)",
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {formatMoney(p.amount, p.currency_code)}
                </span>

                <span style={{
                  color: "var(--clr-muted)",
                  fontSize: "var(--text-xs)",
                  textTransform: "capitalize",
                }}>
                  {p.source_platform || "—"}
                </span>

                {/* Invoice link status */}
                {p.invoice_id ? (
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "var(--sp-4)",
                    padding: "3px 10px",
                    borderRadius: "var(--r-full)",
                    fontSize: "var(--text-2xs)",
                    fontWeight: "var(--fw-semibold)",
                    letterSpacing: "0.03em",
                    whiteSpace: "nowrap",
                    background: "rgba(34,160,107,0.1)",
                    color: "var(--success)",
                    width: "fit-content",
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--success)", display: "inline-block", flexShrink: 0 }} />
                    Linked
                  </span>
                ) : (
                  <button
                    type="button"
                    className="lpt-link-btn"
                    onClick={() => setLinkingPayment(p)}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    Link Invoice
                  </button>
                )}
              </div>
            );
          })}

          {/* Footer */}
          <div style={{
            padding: "var(--sp-8) var(--sp-20)",
            fontSize: "var(--text-xs)",
            color: "var(--clr-muted)",
            background: "var(--clr-surface-subtle)",
            borderTop: "1px solid var(--clr-divider)",
            display: "flex",
            alignItems: "center",
            gap: "var(--sp-16)",
          }}>
            <span>Showing {payments.length} of {total}</span>
            {linkedCount > 0 && (
              <span style={{ color: "var(--success)" }}>
                {linkedCount} linked
              </span>
            )}
            {unlinkedCount > 0 && (
              <span style={{ color: "var(--clr-muted)" }}>
                {unlinkedCount} awaiting invoice link
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
