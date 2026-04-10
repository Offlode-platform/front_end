"use client";

import { useState } from "react";
import { LedgerInvoicesTable } from "./components/ledger-invoices-table";
import { LedgerContactsTable } from "./components/ledger-contacts-table";
import { LedgerPaymentsTable } from "./components/ledger-payments-table";

type Tab = "invoices" | "contacts" | "payments";

export function LedgerPageView() {
  const [tab, setTab] = useState<Tab>("invoices");

  return (
    <div
      className="page active"
      id="page-ledger"
      style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
    >
      {/* Top page bar — matches Dashboard / Clients / Imports */}
      <div className="page-bar" style={{ flexShrink: 0 }}>
        <div className="page-bar-left">
          <div>
            <div className="pg-title">Universal Ledger</div>
            <div className="pg-subtitle">
              Browse imported invoices, contacts, and payments from CSV and connected accounting systems.
            </div>
          </div>
        </div>
        <div className="page-bar-right" />
      </div>

      <div className="dash-content">
        {/* Tab strip */}
        <div className="ws-card" style={{ marginBottom: "var(--sp-16)" }}>
          <div className="ws-issue-filters">
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
        </div>

        {tab === "invoices" && <LedgerInvoicesTable />}
        {tab === "contacts" && <LedgerContactsTable />}
        {tab === "payments" && <LedgerPaymentsTable />}
      </div>
    </div>
  );
}
