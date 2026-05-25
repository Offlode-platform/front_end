"use client";

import { useEffect, useState } from "react";
import { ledgerApi } from "@/lib/api/ledger-api";
import { ContactReconciliationPanel } from "@/features/imports/components/contact-reconciliation-panel";
import type { UniversalContact } from "@/types/ledger";

const GRID = "1.3fr 1.1fr 140px 96px 108px";

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
    return () => { cancelled = true; };
  }, [search, linkedFilter, showReconcile]);

  if (showReconcile) {
    return (
      <>
        <div className="ws-card" style={{ marginBottom: "var(--sp-16)", padding: "var(--sp-12) var(--sp-20)" }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowReconcile(false)}>
            ← Back to contacts
          </button>
        </div>
        <ContactReconciliationPanel onAllResolved={() => setShowReconcile(false)} />
      </>
    );
  }

  const linkedCount = contacts?.filter((c) => c.is_linked).length ?? 0;
  const unlinkedCount = contacts?.filter((c) => !c.is_linked).length ?? 0;

  return (
    <>
      <style>{`
        .lct-row { transition: background 120ms ease; }
        .lct-row:hover { background: rgba(0,0,0,0.022) !important; }
        [data-theme="dark"] .lct-row:hover { background: rgba(255,255,255,0.035) !important; }
      `}</style>

      {/* ── Filter bar ── */}
      <div
        className="ws-card"
        style={{
          marginBottom: "var(--sp-16)",
          padding: "var(--sp-12) var(--sp-20)",
        }}
      >
        <div style={{ display: "flex", gap: "var(--sp-12)", alignItems: "center", flexWrap: "wrap" }}>

          {/* Search with icon */}
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
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
              placeholder="Search by name or email…"
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

          {/* Filter pills */}
          <div style={{ display: "flex", gap: "var(--sp-4)", alignItems: "center" }}>
            {(["all", "linked", "unlinked"] as const).map((f) => {
              const active = linkedFilter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setLinkedFilter(f)}
                  style={{
                    padding: "var(--sp-6) var(--sp-12)",
                    borderRadius: "var(--r-full)",
                    fontSize: "var(--text-sm)",
                    fontWeight: active ? "var(--fw-semibold)" : "var(--fw-normal)",
                    fontFamily: "inherit",
                    cursor: "pointer",
                    border: active ? "none" : "1px solid var(--clr-divider-strong)",
                    background: active ? "var(--text-primary-lt)" : "transparent",
                    color: active ? "#fff" : "var(--clr-secondary)",
                    transition: "all var(--dur)",
                    lineHeight: 1,
                  }}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              );
            })}
          </div>

          {/* Reconcile CTA */}
          <button
            type="button"
            onClick={() => setShowReconcile(true)}
            style={{
              padding: "var(--sp-8) var(--sp-20)",
              borderRadius: "var(--r-md)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--fw-semibold)",
              fontFamily: "inherit",
              cursor: "pointer",
              border: "none",
              background: "var(--brand)",
              color: "#fff",
              flexShrink: 0,
              transition: "opacity var(--dur)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Reconcile
          </button>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="ws-card" style={{ textAlign: "center", color: "var(--clr-muted)", fontSize: "var(--text-sm)", padding: "var(--sp-48)" }}>
          Loading contacts…
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="ws-card" style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", fontSize: "var(--text-sm)" }}>
          {error}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && contacts && contacts.length === 0 && (
        <div className="ws-card" style={{ padding: "var(--sp-48)", textAlign: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(53,126,146,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--sp-12)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="pg-title" style={{ marginBottom: "var(--sp-4)" }}>No contacts found</div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>
            Imported contacts will appear here once you run an import.
          </div>
        </div>
      )}

      {/* ── Table ── */}
      {!loading && !error && contacts && contacts.length > 0 && (
        <div className="ws-card" style={{ padding: 0, overflow: "hidden" }}>

          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: GRID,
            gap: "var(--sp-8)",
            padding: "var(--sp-10) var(--sp-20)",
            borderBottom: "1px solid var(--clr-divider-strong)",
            fontSize: "var(--text-2xs)",
            fontWeight: "var(--fw-semibold)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--clr-muted)",
            background: "rgba(0,0,0,0.015)",
          }}>
            <span>Name</span>
            <span>Email</span>
            <span>Phone</span>
            <span>Source</span>
            <span>Status</span>
          </div>

          {/* Rows */}
          {contacts.map((c) => (
            <div
              key={c.id}
              className="lct-row"
              style={{
                display: "grid",
                gridTemplateColumns: GRID,
                gap: "var(--sp-8)",
                padding: "var(--sp-12) var(--sp-20)",
                borderBottom: "1px solid var(--clr-divider)",
                fontSize: "var(--text-sm)",
                alignItems: "center",
                background: !c.is_linked ? "rgba(224,148,34,0.025)" : "transparent",
              }}
            >
              <span style={{
                color: "var(--clr-primary)",
                fontWeight: "var(--fw-medium)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {c.name}
              </span>

              <span style={{
                color: "var(--clr-secondary)",
                fontSize: "var(--text-xs)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {c.email || <span style={{ color: "var(--clr-faint)" }}>—</span>}
              </span>

              <span style={{ color: "var(--clr-muted)", fontSize: "var(--text-xs)" }}>
                {c.phone || <span style={{ color: "var(--clr-faint)" }}>—</span>}
              </span>

              <span style={{
                color: "var(--clr-muted)",
                fontSize: "var(--text-xs)",
                textTransform: "capitalize",
              }}>
                {c.source_platform || "—"}
              </span>

              {c.is_linked ? (
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
                  background: "rgba(224,148,34,0.1)",
                  color: "var(--warning)",
                  width: "fit-content",
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--warning)", display: "inline-block", flexShrink: 0 }} />
                  Unlinked
                </span>
              )}
            </div>
          ))}

          {/* Footer */}
          <div style={{
            padding: "var(--sp-10) var(--sp-20)",
            fontSize: "var(--text-xs)",
            color: "var(--clr-muted)",
            background: "var(--clr-surface-subtle)",
            borderTop: "1px solid var(--clr-divider)",
            display: "flex",
            alignItems: "center",
            gap: "var(--sp-16)",
          }}>
            <span>Showing {contacts.length} of {total}</span>
            {linkedCount > 0 && (
              <span style={{ color: "var(--success)" }}>
                {linkedCount} linked
              </span>
            )}
            {unlinkedCount > 0 && (
              <span style={{ color: "var(--warning)" }}>
                {unlinkedCount} unlinked
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
