"use client";

import { useState } from "react";
import { LedgerInvoicesTable } from "./components/ledger-invoices-table";
import { LedgerContactsTable } from "./components/ledger-contacts-table";
import { LedgerPaymentsTable } from "./components/ledger-payments-table";

type Tab = "invoices" | "contacts" | "payments";

const TABS: { key: Tab; label: string }[] = [
  { key: "invoices", label: "Invoices" },
  { key: "contacts", label: "Contacts" },
  { key: "payments", label: "Payments" },
];

export function LedgerPageView() {
  const [tab, setTab] = useState<Tab>("invoices");

  return (
    <div
      className="page active"
      id="page-ledger"
      style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
    >
      {/* Page bar — title + integrated tab navigation */}
      <div
        className="page-bar"
        style={{
          flexShrink: 0,
          height: "auto",
          flexDirection: "column",
          alignItems: "stretch",
          padding: "var(--sp-20) var(--sp-32) 0",
          gap: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            paddingBottom: "var(--sp-16)",
          }}
        >
          <div>
            <div className="pg-title">Universal Ledger</div>
            <div className="pg-subtitle">
              Browse imported invoices, contacts, and payments from CSV and connected accounting systems.
            </div>
          </div>
        </div>

        {/* Tab strip — flush with page-bar bottom border */}
        <div
          className="ws-issue-filters"
          style={{ paddingBottom: "var(--sp-8)", borderBottom: "none", marginBottom: 0 }}
        >
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`ws-issue-filter${tab === key ? " active" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="dash-content">
        {tab === "invoices" && <LedgerInvoicesTable />}
        {tab === "contacts" && <LedgerContactsTable />}
        {tab === "payments" && <LedgerPaymentsTable />}
      </div>
    </div>
  );
}
