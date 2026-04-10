"use client";

import { useEffect, useState } from "react";
import { ledgerApi } from "@/lib/api/ledger-api";
import { ContactReconciliationPanel } from "@/features/imports/components/contact-reconciliation-panel";
import type { UniversalContact } from "@/types/ledger";

export function LedgerContactsTable() {
  const [contacts, setContacts] = useState<UniversalContact[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [linkedFilter, setLinkedFilter] = useState<"all" | "linked" | "unlinked">("all");
  const [showReconcile, setShowReconcile] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    ledgerApi.listContacts({
      limit: 100,
      search: search.trim() || undefined,
      linked_only: linkedFilter === "linked" ? true : undefined,
    }).then(
      (result) => {
        if (!cancelled) {
          // Apply unlinked filter client-side since the API only has linked_only
          const filtered = linkedFilter === "unlinked"
            ? result.items.filter((c) => !c.is_linked)
            : result.items;
          setContacts(filtered);
          setTotal(linkedFilter === "unlinked" ? filtered.length : result.total);
          setLoading(false);
        }
      },
      () => {
        if (!cancelled) {
          setError("Unable to load contacts.");
          setLoading(false);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [search, linkedFilter, showReconcile]);

  if (showReconcile) {
    return (
      <>
        <div className="ws-card" style={{ marginBottom: "var(--sp-16)" }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowReconcile(false)}
          >
            ← Back to contacts
          </button>
        </div>
        <ContactReconciliationPanel onAllResolved={() => setShowReconcile(false)} />
      </>
    );
  }

  return (
    <>
      {/* Filter bar */}
      <div className="ws-card" style={{ marginBottom: "var(--sp-16)" }}>
        <div className="ws-card-title">Filters</div>
        <div style={{ display: "flex", gap: "var(--sp-8)", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: 220,
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
          <div className="ws-issue-filters">
            <button
              type="button"
              className={`ws-issue-filter${linkedFilter === "all" ? " active" : ""}`}
              onClick={() => setLinkedFilter("all")}
            >
              All
            </button>
            <button
              type="button"
              className={`ws-issue-filter${linkedFilter === "linked" ? " active" : ""}`}
              onClick={() => setLinkedFilter("linked")}
            >
              Linked
            </button>
            <button
              type="button"
              className={`ws-issue-filter${linkedFilter === "unlinked" ? " active" : ""}`}
              onClick={() => setLinkedFilter("unlinked")}
            >
              Unlinked
            </button>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowReconcile(true)}
          >
            Reconcile
          </button>
        </div>
      </div>

      {loading && (
        <div className="ws-card" style={{ textAlign: "center", color: "var(--clr-muted)", fontSize: "var(--text-sm)" }}>
          Loading contacts...
        </div>
      )}

      {error && (
        <div className="ws-card" style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", fontSize: "var(--text-sm)" }}>
          {error}
        </div>
      )}

      {!loading && !error && contacts && contacts.length === 0 && (
        <div className="ws-card" style={{ padding: "var(--sp-40)", textAlign: "center" }}>
          <div className="pg-title" style={{ marginBottom: "var(--sp-4)" }}>
            No contacts found
          </div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>
            Imported contacts will appear here.
          </div>
        </div>
      )}

      {!loading && !error && contacts && contacts.length > 0 && (
        <div className="ws-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 120px 100px 100px",
            gap: "var(--sp-8)",
            padding: "var(--sp-10) var(--sp-16)",
            borderBottom: "1px solid var(--clr-divider)",
            fontSize: "var(--text-xs)",
            fontWeight: "var(--fw-semibold)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--clr-muted)",
          }}>
            <span>Name</span>
            <span>Email</span>
            <span>Phone</span>
            <span>Source</span>
            <span>Linked</span>
          </div>
          {contacts.map((c) => (
            <div
              key={c.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 120px 100px 100px",
                gap: "var(--sp-8)",
                padding: "var(--sp-10) var(--sp-16)",
                borderBottom: "1px solid var(--clr-divider)",
                fontSize: "var(--text-sm)",
                alignItems: "center",
              }}
            >
              <span style={{ color: "var(--clr-primary)", fontWeight: "var(--fw-medium)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.name}
              </span>
              <span style={{ color: "var(--clr-secondary)", fontSize: "var(--text-xs)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.email || "—"}
              </span>
              <span style={{ color: "var(--clr-muted)", fontSize: "var(--text-xs)" }}>
                {c.phone || "—"}
              </span>
              <span style={{ color: "var(--clr-muted)", fontSize: "var(--text-xs)", textTransform: "capitalize" }}>
                {c.source_platform || "—"}
              </span>
              <span style={{
                fontSize: "var(--text-micro)",
                fontWeight: "var(--fw-medium)",
                color: c.is_linked ? "var(--success)" : "var(--warning)",
              }}>
                {c.is_linked ? "Linked" : "Unlinked"}
              </span>
            </div>
          ))}
          <div style={{
            padding: "var(--sp-10) var(--sp-16)",
            fontSize: "var(--text-xs)",
            color: "var(--clr-muted)",
            background: "var(--clr-surface-subtle)",
          }}>
            Showing {contacts.length} of {total}
          </div>
        </div>
      )}
    </>
  );
}
