"use client";

import { useEffect, useState } from "react";
import { ledgerApi } from "@/lib/api/ledger-api";
import type {
  ClientSuggestion,
  UniversalContact,
  UnlinkedContactsResponse,
} from "@/types/ledger";

type Props = {
  // When true, the panel renders inside the import wizard as a step.
  // When false (default), it renders as a standalone panel reachable via
  // the import history view or a notification banner.
  embedded?: boolean;
  onAllResolved?: () => void;
};

type ContactState = {
  suggestions: ClientSuggestion[];
  loadingSuggestions: boolean;
  // UI state for the inline "create new client" form
  creating: boolean;
  newName: string;
  newEmail: string;
  newPhone: string;
  // Mutation state
  busy: boolean;
  error: string | null;
  resolved: { clientName: string; invoicesMaterialized: number } | null;
};

function emptyState(contact: UniversalContact): ContactState {
  return {
    suggestions: [],
    loadingSuggestions: false,
    creating: false,
    newName: contact.name,
    newEmail: contact.email ?? "",
    newPhone: contact.phone ?? "",
    busy: false,
    error: null,
    resolved: null,
  };
}

export function ContactReconciliationPanel({ embedded = false, onAllResolved }: Props) {
  const [data, setData] = useState<UnlinkedContactsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactStates, setContactStates] = useState<Record<string, ContactState>>({});

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await ledgerApi.listUnlinkedContacts({ limit: 100 });
      setData(result);
      const initial: Record<string, ContactState> = {};
      for (const c of result.items) initial[c.id] = emptyState(c);
      setContactStates(initial);
    } catch {
      setError("Unable to load unlinked contacts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function patch(contactId: string, updates: Partial<ContactState>) {
    setContactStates((prev) => ({
      ...prev,
      [contactId]: { ...prev[contactId], ...updates },
    }));
  }

  async function loadSuggestions(contact: UniversalContact) {
    patch(contact.id, { loadingSuggestions: true, error: null });
    try {
      const result = await ledgerApi.getContactSuggestions(contact.id, 5);
      patch(contact.id, { suggestions: result.suggestions, loadingSuggestions: false });
    } catch {
      patch(contact.id, {
        loadingSuggestions: false,
        error: "Could not load suggestions.",
      });
    }
  }

  async function linkToClient(contact: UniversalContact, clientId: string) {
    patch(contact.id, { busy: true, error: null });
    try {
      const result = await ledgerApi.linkContact(contact.id, { client_id: clientId });
      patch(contact.id, {
        busy: false,
        resolved: {
          clientName: result.client_name,
          invoicesMaterialized: result.invoices_materialized,
        },
      });
      checkAllResolved();
    } catch {
      patch(contact.id, { busy: false, error: "Failed to link contact." });
    }
  }

  async function createClient(contact: UniversalContact) {
    const state = contactStates[contact.id];
    if (!state || !state.newName.trim()) {
      patch(contact.id, { error: "Client name is required." });
      return;
    }
    patch(contact.id, { busy: true, error: null });
    try {
      const result = await ledgerApi.createClientFromContact(contact.id, {
        name: state.newName.trim(),
        email: state.newEmail.trim() || undefined,
        phone: state.newPhone.trim() || undefined,
      });
      patch(contact.id, {
        busy: false,
        creating: false,
        resolved: {
          clientName: result.client_name,
          invoicesMaterialized: result.invoices_materialized,
        },
      });
      checkAllResolved();
    } catch {
      patch(contact.id, { busy: false, error: "Failed to create client." });
    }
  }

  function checkAllResolved() {
    setTimeout(() => {
      setContactStates((current) => {
        const allDone = Object.values(current).every((s) => s.resolved !== null);
        if (allDone && onAllResolved) onAllResolved();
        return current;
      });
    }, 0);
  }

  if (loading) {
    return (
      <div style={{ padding: "var(--sp-24)", textAlign: "center", color: "var(--clr-muted)", fontSize: "var(--text-sm)" }}>
        Loading unlinked contacts...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "var(--sp-12) var(--sp-16)", background: "rgba(239,68,68,0.08)", borderRadius: "var(--r-md)", color: "var(--danger)", fontSize: "var(--text-sm)" }}>
        {error}
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div style={{
        background: "var(--clr-surface-card)",
        borderRadius: "var(--r-lg)",
        border: "1px solid var(--clr-divider)",
        padding: "var(--sp-40)",
        textAlign: "center",
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "rgba(34,160,107,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto var(--sp-12)",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div style={{ fontSize: "var(--text-md)", fontWeight: "var(--fw-medium)", color: "var(--clr-primary)", marginBottom: "var(--sp-4)" }}>
          Nothing to reconcile
        </div>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>
          All imported contacts are linked to clients.
        </div>
      </div>
    );
  }

  const remaining = data.items.filter((c) => !contactStates[c.id]?.resolved).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-16)" }}>
      {/* Summary banner */}
      <div style={{
        background: "rgba(224,148,34,0.08)",
        borderRadius: "var(--r-lg)",
        border: "1px solid rgba(224,148,34,0.25)",
        padding: "var(--sp-14) var(--sp-16)",
      }}>
        <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--fw-semibold)", color: "var(--clr-primary)", marginBottom: 2 }}>
          {remaining} {remaining === 1 ? "contact" : "contacts"} need a client link
        </div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", lineHeight: "var(--lh-body)" }}>
          {data.invoices_pending_link} imported {data.invoices_pending_link === 1 ? "invoice is" : "invoices are"} waiting on these links before they can enter the chase workflow.
        </div>
      </div>

      {/* Contact list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-10)" }}>
        {data.items.map((contact) => {
          const state = contactStates[contact.id] ?? emptyState(contact);
          return (
            <ContactCard
              key={contact.id}
              contact={contact}
              state={state}
              onLoadSuggestions={() => loadSuggestions(contact)}
              onLink={(clientId) => linkToClient(contact, clientId)}
              onCreate={() => createClient(contact)}
              onPatch={(updates) => patch(contact.id, updates)}
            />
          );
        })}
      </div>

      {!embedded && (
        <button
          type="button"
          onClick={load}
          className="btn btn-ghost btn-sm"
          style={{ alignSelf: "center", fontSize: "var(--text-xs)" }}
        >
          Refresh
        </button>
      )}
    </div>
  );
}

function ContactCard({
  contact,
  state,
  onLoadSuggestions,
  onLink,
  onCreate,
  onPatch,
}: {
  contact: UniversalContact;
  state: ContactState;
  onLoadSuggestions: () => void;
  onLink: (clientId: string) => void;
  onCreate: () => void;
  onPatch: (updates: Partial<ContactState>) => void;
}) {
  const isResolved = state.resolved !== null;

  return (
    <div style={{
      background: "var(--clr-surface-card)",
      borderRadius: "var(--r-lg)",
      border: `1px solid ${isResolved ? "rgba(34,160,107,0.3)" : "var(--clr-divider)"}`,
      padding: "var(--sp-16)",
      opacity: isResolved ? 0.7 : 1,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--sp-12)" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "var(--text-md)", fontWeight: "var(--fw-semibold)", color: "var(--clr-primary)", overflow: "hidden", textOverflow: "ellipsis" }}>
            {contact.name}
          </div>
          {contact.email && (
            <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginTop: 2 }}>
              {contact.email}
            </div>
          )}
        </div>
        {isResolved && state.resolved && (
          <div style={{
            fontSize: "var(--text-xs)",
            fontWeight: "var(--fw-medium)",
            color: "var(--success)",
            background: "rgba(34,160,107,0.1)",
            padding: "var(--sp-4) var(--sp-10)",
            borderRadius: "var(--r-full)",
          }}>
            Linked to {state.resolved.clientName}
            {state.resolved.invoicesMaterialized > 0 && ` · ${state.resolved.invoicesMaterialized} invoices queued`}
          </div>
        )}
      </div>

      {!isResolved && (
        <>
          {/* Action buttons */}
          {state.suggestions.length === 0 && !state.loadingSuggestions && !state.creating && (
            <div style={{ display: "flex", gap: "var(--sp-8)" }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onLoadSuggestions}
                disabled={state.busy}
                style={{ fontSize: "var(--text-xs)" }}
              >
                Find matching client
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onPatch({ creating: true })}
                disabled={state.busy}
                style={{ fontSize: "var(--text-xs)" }}
              >
                Create new client
              </button>
            </div>
          )}

          {state.loadingSuggestions && (
            <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)" }}>
              Searching...
            </div>
          )}

          {/* Suggestions list */}
          {state.suggestions.length > 0 && !state.creating && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
              <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--fw-semibold)", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--clr-muted)", marginBottom: "var(--sp-4)" }}>
                Suggested matches
              </div>
              {state.suggestions.map((s) => (
                <div
                  key={s.client_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--sp-10)",
                    padding: "var(--sp-8) var(--sp-12)",
                    background: "var(--clr-surface-subtle)",
                    borderRadius: "var(--r-md)",
                    fontSize: "var(--text-sm)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "var(--clr-primary)", fontWeight: "var(--fw-medium)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.name}
                    </div>
                    {s.email && (
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginTop: 1 }}>
                        {s.email}
                      </div>
                    )}
                  </div>
                  <ConfidenceBadge score={s.score} />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => onLink(s.client_id)}
                    disabled={state.busy}
                    style={{ fontSize: "var(--text-xs)" }}
                  >
                    Link
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onPatch({ creating: true })}
                disabled={state.busy}
                style={{ alignSelf: "flex-start", fontSize: "var(--text-xs)", marginTop: "var(--sp-4)" }}
              >
                None of these — create new client
              </button>
            </div>
          )}

          {/* Create new client form */}
          {state.creating && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-8)" }}>
              <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--fw-semibold)", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--clr-muted)" }}>
                New client details
              </div>
              <Field label="Name" value={state.newName} onChange={(v) => onPatch({ newName: v })} />
              <Field label="Email" value={state.newEmail} onChange={(v) => onPatch({ newEmail: v })} type="email" />
              <Field label="Phone" value={state.newPhone} onChange={(v) => onPatch({ newPhone: v })} type="tel" />
              <div style={{ display: "flex", gap: "var(--sp-8)", marginTop: "var(--sp-4)" }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={onCreate}
                  disabled={state.busy}
                  style={{ fontSize: "var(--text-xs)" }}
                >
                  {state.busy ? "Creating..." : "Create client"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => onPatch({ creating: false })}
                  disabled={state.busy}
                  style={{ fontSize: "var(--text-xs)" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {state.error && (
            <div style={{ marginTop: "var(--sp-8)", fontSize: "var(--text-xs)", color: "var(--danger)" }}>
              {state.error}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 90 ? "var(--success)" :
    pct >= 70 ? "var(--warning)" :
    "var(--clr-muted)";
  return (
    <span style={{
      fontSize: "var(--text-micro)",
      fontWeight: "var(--fw-medium)",
      color,
      flexShrink: 0,
    }}>
      {pct}% match
    </span>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginBottom: 2 }}>
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "var(--sp-6) var(--sp-10)",
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
  );
}
