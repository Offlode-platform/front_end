"use client";

import { useEffect, useRef, useState } from "react";
import { ledgerApi } from "@/lib/api/ledger-api";
import type { UniversalInvoice, UniversalPayment } from "@/types/ledger";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(amount: string | null | undefined, currency = "GBP"): string {
  const n = Number(amount);
  if (!amount || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(n);
}

type Props = {
  payment: UniversalPayment;
  onClose: () => void;
  onLinked: () => void;
};

export function LedgerPaymentLinkModal({ payment, onClose, onLinked }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const [invoices, setInvoices] = useState<UniversalInvoice[] | null>(null);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [search, setSearch] = useState(payment.contact_name ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load candidate invoices whenever the search term changes
  useEffect(() => {
    let cancelled = false;
    setLoadingInvoices(true);
    setError(null);
    ledgerApi
      .listInvoices({
        contact_name: search.trim() || undefined,
        status: "authorised",
        limit: 50,
      })
      .then(
        (result) => {
          if (!cancelled) {
            setInvoices(result.items);
            setLoadingInvoices(false);
          }
        },
        () => {
          if (!cancelled) {
            setError("Unable to load invoices.");
            setLoadingInvoices(false);
          }
        },
      );
    return () => {
      cancelled = true;
    };
  }, [search]);

  async function handleLink() {
    if (!selectedId) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await ledgerApi.linkPaymentToInvoice(payment.id, {
        invoice_id: selectedId,
      });
      const msg =
        result.invoice_status === "paid"
          ? `Invoice marked as paid. Amount due: ${formatMoney(result.amount_due, payment.currency_code)}`
          : `Partial payment applied. Amount due: ${formatMoney(result.amount_due, payment.currency_code)}`;
      setSuccessMsg(msg);
      setTimeout(() => {
        onLinked();
      }, 1500);
    } catch (e: unknown) {
      const detail =
        e instanceof Error
          ? e.message
          : typeof e === "object" && e !== null && "detail" in e
            ? String((e as { detail: unknown }).detail)
            : "Failed to link payment.";
      setError(detail);
      setSubmitting(false);
    }
  }

  // Close on overlay click
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 9000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--sp-16)",
      }}
    >
      <div
        style={{
          background: "var(--canvas-bg)",
          borderRadius: "var(--r-lg)",
          width: "100%",
          maxWidth: 640,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "var(--sp-20) var(--sp-24)",
            borderBottom: "1px solid var(--clr-divider)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div className="pg-title" style={{ fontSize: "var(--text-base)" }}>
                Link Payment to Invoice
              </div>
              <div
                style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginTop: 2 }}
              >
                {payment.contact_name || "Unknown contact"} &mdash;{" "}
                {formatMoney(payment.amount, payment.currency_code)} on{" "}
                {formatDate(payment.payment_date)}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--clr-muted)",
                fontSize: "var(--text-lg)",
                lineHeight: 1,
                padding: "var(--sp-4)",
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Payment summary pill */}
          <div
            style={{
              marginTop: "var(--sp-12)",
              display: "flex",
              gap: "var(--sp-8)",
              flexWrap: "wrap",
            }}
          >
            {payment.reference && (
              <span
                style={{
                  background: "var(--clr-surface-subtle)",
                  borderRadius: "var(--r-full)",
                  padding: "2px 10px",
                  fontSize: "var(--text-xs)",
                  color: "var(--clr-muted)",
                }}
              >
                Ref: {payment.reference}
              </span>
            )}
            {payment.payment_type && (
              <span
                style={{
                  background: "var(--clr-surface-subtle)",
                  borderRadius: "var(--r-full)",
                  padding: "2px 10px",
                  fontSize: "var(--text-xs)",
                  color: "var(--clr-muted)",
                  textTransform: "capitalize",
                }}
              >
                {payment.payment_type}
              </span>
            )}
            {payment.invoice_id && (
              <span
                style={{
                  background: "rgba(34,197,94,0.12)",
                  borderRadius: "var(--r-full)",
                  padding: "2px 10px",
                  fontSize: "var(--text-xs)",
                  color: "var(--success, #16a34a)",
                }}
              >
                Already linked
              </span>
            )}
          </div>
        </div>

        {/* Search */}
        <div
          style={{
            padding: "var(--sp-16) var(--sp-24)",
            borderBottom: "1px solid var(--clr-divider)",
            flexShrink: 0,
          }}
        >
          <input
            type="text"
            placeholder="Search invoices by contact name…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedId(null);
            }}
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
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Invoice list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loadingInvoices && (
            <div
              style={{
                padding: "var(--sp-24)",
                textAlign: "center",
                color: "var(--clr-muted)",
                fontSize: "var(--text-sm)",
              }}
            >
              Loading invoices…
            </div>
          )}

          {!loadingInvoices && invoices && invoices.length === 0 && (
            <div
              style={{
                padding: "var(--sp-32)",
                textAlign: "center",
                color: "var(--clr-muted)",
                fontSize: "var(--text-sm)",
              }}
            >
              No unpaid invoices found{search ? ` matching "${search}"` : ""}.
            </div>
          )}

          {!loadingInvoices &&
            invoices &&
            invoices.map((inv) => {
              const isSelected = selectedId === inv.id;
              return (
                <button
                  key={inv.id}
                  type="button"
                  onClick={() => setSelectedId(isSelected ? null : inv.id)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "var(--sp-12)",
                    alignItems: "center",
                    width: "100%",
                    padding: "var(--sp-12) var(--sp-24)",
                    borderBottom: "1px solid var(--clr-divider)",
                    background: isSelected
                      ? "rgba(99,102,241,0.06)"
                      : "transparent",
                    border: "none",
                    borderBottomWidth: 1,
                    borderBottomStyle: "solid",
                    borderBottomColor: "var(--clr-divider)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.1s",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: "var(--fw-medium)",
                        fontSize: "var(--text-sm)",
                        color: "var(--clr-primary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--sp-8)",
                      }}
                    >
                      {inv.invoice_number ? `#${inv.invoice_number}` : "No invoice number"}
                      {isSelected && (
                        <span
                          style={{
                            background: "var(--accent, #6366f1)",
                            color: "#fff",
                            borderRadius: "var(--r-full)",
                            padding: "0 8px",
                            fontSize: "var(--text-xs)",
                            lineHeight: "18px",
                          }}
                        >
                          Selected
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--clr-muted)",
                        marginTop: 2,
                      }}
                    >
                      {inv.contact_name || "—"}
                      {inv.due_date ? ` · Due ${formatDate(inv.due_date)}` : ""}
                      {inv.amount_paid && Number(inv.amount_paid) > 0
                        ? ` · ${formatMoney(inv.amount_paid, inv.currency_code)} paid`
                        : ""}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--fw-semibold)",
                      color: "var(--clr-primary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatMoney(inv.amount_due ?? inv.total, inv.currency_code)}
                    <div
                      style={{
                        fontSize: "var(--text-xs)",
                        fontWeight: "normal",
                        color: "var(--clr-muted)",
                        textAlign: "right",
                      }}
                    >
                      due
                    </div>
                  </div>
                </button>
              );
            })}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "var(--sp-16) var(--sp-24)",
            borderTop: "1px solid var(--clr-divider)",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: "var(--sp-8)",
          }}
        >
          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.08)",
                color: "var(--danger, #ef4444)",
                borderRadius: "var(--r-md)",
                padding: "var(--sp-8) var(--sp-12)",
                fontSize: "var(--text-xs)",
              }}
            >
              {error}
            </div>
          )}
          {successMsg && (
            <div
              style={{
                background: "rgba(34,197,94,0.08)",
                color: "var(--success, #16a34a)",
                borderRadius: "var(--r-md)",
                padding: "var(--sp-8) var(--sp-12)",
                fontSize: "var(--text-xs)",
              }}
            >
              {successMsg}
            </div>
          )}
          <div style={{ display: "flex", gap: "var(--sp-8)", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleLink}
              disabled={!selectedId || submitting}
              className="btn btn-primary"
            >
              {submitting ? "Linking…" : "Link to Invoice"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
