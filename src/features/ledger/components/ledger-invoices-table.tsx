"use client";

import { useEffect, useState } from "react";
import { ledgerApi } from "@/lib/api/ledger-api";
import type { UniversalInvoice, InvoiceListQuery } from "@/types/ledger";

const STATUS_COLOR: Record<string, string> = {
  draft: "var(--clr-muted)",
  submitted: "var(--info)",
  authorised: "var(--warning)",
  paid: "var(--success)",
  voided: "var(--clr-muted)",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatMoney(amount: string, currency: string): string {
  const n = Number(amount);
  if (Number.isNaN(n)) return amount;
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "GBP" }).format(n);
}

export function LedgerInvoicesTable() {
  const [invoices, setInvoices] = useState<UniversalInvoice[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<"" | "accounts_payable" | "accounts_receivable">("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const query: InvoiceListQuery = { limit: 100 };
    if (search.trim()) query.contact_name = search.trim();
    if (statusFilter) query.status = statusFilter;
    if (typeFilter) query.invoice_type = typeFilter;

    ledgerApi.listInvoices(query).then(
      (result) => {
        if (!cancelled) {
          setInvoices(result.items);
          setTotal(result.total);
          setLoading(false);
        }
      },
      () => {
        if (!cancelled) {
          setError("Unable to load invoices.");
          setLoading(false);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [search, statusFilter, typeFilter]);

  const inputStyle: React.CSSProperties = {
    padding: "var(--sp-8) var(--sp-12)",
    border: "1px solid var(--clr-divider-strong)",
    borderRadius: "var(--r-md)",
    fontSize: "var(--text-sm)",
    background: "var(--canvas-bg)",
    color: "var(--clr-primary)",
    fontFamily: "inherit",
    outline: "none",
  };

  return (
    <>
      {/* Filter bar */}
      <div className="ws-card" style={{ marginBottom: "var(--sp-16)" }}>
        <div className="ws-card-title">Filters</div>
        <div style={{ display: "flex", gap: "var(--sp-8)", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Search by contact name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: 200 }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={inputStyle}
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="authorised">Authorised</option>
            <option value="paid">Paid</option>
            <option value="voided">Voided</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            style={inputStyle}
          >
            <option value="">All types</option>
            <option value="accounts_payable">Payable (bills)</option>
            <option value="accounts_receivable">Receivable (sales)</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="ws-card" style={{ textAlign: "center", color: "var(--clr-muted)", fontSize: "var(--text-sm)" }}>
          Loading invoices...
        </div>
      )}

      {error && (
        <div className="ws-card" style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", fontSize: "var(--text-sm)" }}>
          {error}
        </div>
      )}

      {!loading && !error && invoices && invoices.length === 0 && (
        <div className="ws-card" style={{ padding: "var(--sp-40)", textAlign: "center" }}>
          <div className="pg-title" style={{ marginBottom: "var(--sp-4)" }}>
            No invoices found
          </div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>
            Try clearing your filters or import a CSV from the Imports page.
          </div>
        </div>
      )}

      {!loading && !error && invoices && invoices.length > 0 && (
        <div className="ws-card" style={{ padding: 0, overflow: "hidden" }}>
          {/* Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr 100px 110px 110px 110px 90px 90px",
            gap: "var(--sp-8)",
            padding: "var(--sp-10) var(--sp-16)",
            borderBottom: "1px solid var(--clr-divider)",
            fontSize: "var(--text-xs)",
            fontWeight: "var(--fw-semibold)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--clr-muted)",
          }}>
            <span>Invoice #</span>
            <span>Contact</span>
            <span>Type</span>
            <span>Date</span>
            <span>Due</span>
            <span style={{ textAlign: "right" }}>Total</span>
            <span>Source</span>
            <span>Status</span>
          </div>
          {invoices.map((inv) => (
            <div
              key={inv.id}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr 100px 110px 110px 110px 90px 90px",
                gap: "var(--sp-8)",
                padding: "var(--sp-10) var(--sp-16)",
                borderBottom: "1px solid var(--clr-divider)",
                fontSize: "var(--text-sm)",
                alignItems: "center",
              }}
            >
              <span style={{ color: "var(--clr-primary)", fontWeight: "var(--fw-medium)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {inv.invoice_number || "—"}
              </span>
              <span style={{ color: "var(--clr-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {inv.contact_name || "—"}
              </span>
              <span style={{ color: "var(--clr-muted)", fontSize: "var(--text-xs)" }}>
                {inv.invoice_type === "accounts_payable" ? "Bill" : "Sale"}
              </span>
              <span style={{ color: "var(--clr-muted)", fontSize: "var(--text-xs)" }}>{formatDate(inv.date)}</span>
              <span style={{ color: "var(--clr-muted)", fontSize: "var(--text-xs)" }}>{inv.due_date ? formatDate(inv.due_date) : "—"}</span>
              <span style={{ color: "var(--clr-primary)", fontWeight: "var(--fw-medium)", textAlign: "right" }}>
                {formatMoney(inv.total, inv.currency_code)}
              </span>
              <span style={{ color: "var(--clr-muted)", fontSize: "var(--text-xs)", textTransform: "capitalize" }}>
                {inv.source_platform || "—"}
              </span>
              <span style={{
                fontSize: "var(--text-micro)",
                fontWeight: "var(--fw-medium)",
                color: STATUS_COLOR[inv.status] || "var(--clr-muted)",
                textTransform: "capitalize",
              }}>
                {inv.status}
                {!inv.transaction_id && (
                  <div title="Not yet linked to chase workflow" style={{ fontSize: "var(--text-micro)", color: "var(--warning)", marginTop: 1 }}>
                    pending
                  </div>
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
            Showing {invoices.length} of {total}
          </div>
        </div>
      )}
    </>
  );
}
