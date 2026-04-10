"use client";

import { useState } from "react";
import { LedgerInvoicesTable } from "./components/ledger-invoices-table";
import { LedgerContactsTable } from "./components/ledger-contacts-table";
import { LedgerPaymentsTable } from "./components/ledger-payments-table";

type Tab = "invoices" | "contacts" | "payments";

export function LedgerPageView() {
  const [tab, setTab] = useState<Tab>("invoices");

  return (
    <div style={{ padding: "var(--sp-24)", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "var(--sp-20)" }}>
        <h1 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--fw-bold)", color: "var(--clr-primary)", margin: 0, fontFamily: "var(--font-display)" }}>
          Universal Ledger
        </h1>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)", marginTop: "var(--sp-4)" }}>
          Browse imported invoices, contacts, and payments from CSV and connected accounting systems.
        </p>
      </div>

      {/* Tabs */}
      <div className="ws-issue-filters" style={{ marginBottom: "var(--sp-20)" }}>
        <button
          type="button"
          className={`ws-issue-filter${tab === "invoices" ? " active" : ""}`}
          onClick={() => setTab("invoices")}
        >
          Invoices
        </button>
        <button
          type="button"
          className={`ws-issue-filter${tab === "contacts" ? " active" : ""}`}
          onClick={() => setTab("contacts")}
        >
          Contacts
        </button>
        <button
          type="button"
          className={`ws-issue-filter${tab === "payments" ? " active" : ""}`}
          onClick={() => setTab("payments")}
        >
          Payments
        </button>
      </div>

      {tab === "invoices" && <LedgerInvoicesTable />}
      {tab === "contacts" && <LedgerContactsTable />}
      {tab === "payments" && <LedgerPaymentsTable />}
    </div>
  );
}
