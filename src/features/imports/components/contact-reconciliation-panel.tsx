"use client";

import { useEffect, useState, useMemo } from "react";
import { ledgerApi } from "@/lib/api/ledger-api";
import type {
  ClientSuggestion,
  UniversalContact,
  UnlinkedContactsResponse,
} from "@/types/ledger";

const PAGE_SIZE = 20;

type Props = {
  embedded?: boolean;
  onAllResolved?: () => void;
};

type ContactState = {
  suggestions: ClientSuggestion[];
  loadingSuggestions: boolean;
  busy: boolean;
  error: string | null;
  resolved: { clientName: string; invoicesMaterialized: number } | null;
  linkedThisSession: boolean;
};

function emptyState(): ContactState {
  return {
    suggestions: [],
    loadingSuggestions: false,
    busy: false,
    error: null,
    resolved: null,
    linkedThisSession: false,
  };
}

export function ContactReconciliationPanel({ embedded = false, onAllResolved }: Props) {
  const [allContacts, setAllContacts] = useState<UniversalContact[]>([]);
  const [invoicesPending, setInvoicesPending] = useState(0);
  const [contactStates, setContactStates] = useState<Record<string, ContactState>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [autoLinkedCount, setAutoLinkedCount] = useState(0);
  const [autoLinkBanner, setAutoLinkBanner] = useState<"idle" | "running" | "done" | "dismissed">("idle");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "linked" | "unlinked">("all");
  const [page, setPage] = useState(0);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    contactIds: string[];
    hasLinked: boolean;
  } | null>(null);

  const [suggestModal, setSuggestModal] = useState<{
    open: boolean;
    contact: UniversalContact | null;
    suggestions: ClientSuggestion[];
    loading: boolean;
    error: string | null;
    creating: boolean;
    newName: string;
    newEmail: string;
    newPhone: string;
    busy: boolean;
    formError: string | null;
  } | null>(null);

  const [createModal, setCreateModal] = useState<{
    open: boolean;
    contact: UniversalContact | null;
    newName: string;
    newEmail: string;
    newPhone: string;
    busy: boolean;
    error: string | null;
  } | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    setAutoLinkBanner("idle");
    try {
      const result = await ledgerApi.listUnlinkedContacts({ limit: 100 });
      setAllContacts(result.items);
      setInvoicesPending(result.invoices_pending_link);

      const initial: Record<string, ContactState> = {};
      for (const c of result.items) initial[c.id] = emptyState();
      setContactStates(initial);

      if (result.items.length > 0) {
        setAutoLinkBanner("running");
        await runAutoLinkPass(result.items);
      }
    } catch {
      setError("Unable to load unlinked contacts.");
    } finally {
      setLoading(false);
    }
  }

  async function runAutoLinkPass(contacts: UniversalContact[]) {
    const results = await Promise.allSettled(
      contacts.map((c) => ledgerApi.getContactSuggestions(c.id, 1))
    );

    const autoLinks: Array<{
      contactId: string;
      clientId: string;
      score: number;
    }> = [];

    results.forEach((r, i) => {
      if (
        r.status === "fulfilled" &&
        r.value.suggestions[0]?.score >= 0.9
      ) {
        autoLinks.push({
          contactId: contacts[i].id,
          clientId: r.value.suggestions[0].client_id,
          score: r.value.suggestions[0].score,
        });
      }
    });

    if (autoLinks.length === 0) {
      setAutoLinkBanner("done");
      setAutoLinkedCount(0);
      return;
    }

    const linkResults = await Promise.allSettled(
      autoLinks.map((al) =>
        ledgerApi.linkContact(al.contactId, { client_id: al.clientId })
      )
    );

    setContactStates((prev) => {
      const next = { ...prev };
      linkResults.forEach((r, i) => {
        if (r.status === "fulfilled") {
          next[autoLinks[i].contactId] = {
            ...next[autoLinks[i].contactId],
            resolved: {
              clientName: r.value.client_name,
              invoicesMaterialized: r.value.invoices_materialized,
            },
            linkedThisSession: true,
          };
        }
      });
      return next;
    });

    setAutoLinkedCount(
      linkResults.filter((r) => r.status === "fulfilled").length
    );
    setAutoLinkBanner("done");
  }

  useEffect(() => {
    load();
  }, []);

  // Reset page when search or filter changes
  useEffect(() => {
    setPage(0);
  }, [search, filter]);

  function patchContactState(
    contactId: string,
    updates: Partial<ContactState>
  ) {
    setContactStates((prev) => ({
      ...prev,
      [contactId]: { ...prev[contactId], ...updates },
    }));
  }

  async function loadSuggestions(contact: UniversalContact) {
    patchContactState(contact.id, { loadingSuggestions: true, error: null });
    try {
      const result = await ledgerApi.getContactSuggestions(contact.id, 5);
      patchContactState(contact.id, {
        suggestions: result.suggestions,
        loadingSuggestions: false,
      });
      setSuggestModal({
        open: true,
        contact,
        suggestions: result.suggestions,
        loading: false,
        error: null,
        creating: false,
        newName: contact.name,
        newEmail: contact.email ?? "",
        newPhone: contact.phone ?? "",
        busy: false,
        formError: null,
      });
    } catch {
      patchContactState(contact.id, {
        loadingSuggestions: false,
        error: "Could not load suggestions.",
      });
    }
  }

  async function linkToClient(contactId: string, clientId: string) {
    patchContactState(contactId, { busy: true, error: null });
    try {
      const result = await ledgerApi.linkContact(contactId, { client_id: clientId });
      patchContactState(contactId, {
        busy: false,
        resolved: {
          clientName: result.client_name,
          invoicesMaterialized: result.invoices_materialized,
        },
        linkedThisSession: true,
      });
      setSuggestModal(null);
      checkAllResolved();
    } catch {
      patchContactState(contactId, { busy: false, error: "Failed to link contact." });
    }
  }

  async function createClient(contactId: string, name: string, email?: string, phone?: string) {
    if (!name.trim()) {
      if (suggestModal?.contact?.id === contactId) {
        setSuggestModal({ ...suggestModal, formError: "Client name is required." });
      } else if (createModal?.contact?.id === contactId) {
        setCreateModal({ ...createModal, error: "Client name is required." });
      }
      return;
    }

    patchContactState(contactId, { busy: true, error: null });
    try {
      const result = await ledgerApi.createClientFromContact(contactId, {
        name: name.trim(),
        email: email?.trim() || undefined,
        phone: phone?.trim() || undefined,
      });
      patchContactState(contactId, {
        busy: false,
        resolved: {
          clientName: result.client_name,
          invoicesMaterialized: result.invoices_materialized,
        },
        linkedThisSession: true,
      });
      setSuggestModal(null);
      setCreateModal(null);
      checkAllResolved();
    } catch {
      patchContactState(contactId, { busy: false, error: "Failed to create client." });
    }
  }

  async function bulkCreateClients(contactIds: string[]) {
    const unresolved = contactIds.filter(
      (id) => !contactStates[id]?.resolved
    );
    if (unresolved.length === 0) return;

    setContactStates((prev) => {
      const next = { ...prev };
      unresolved.forEach((id) => {
        next[id] = { ...next[id], busy: true, error: null };
      });
      return next;
    });

    const results = await Promise.allSettled(
      unresolved.map((id) => {
        const contact = allContacts.find((c) => c.id === id);
        if (!contact) return Promise.reject(new Error("Contact not found"));
        return ledgerApi.createClientFromContact(id, {
          name: contact.name,
          email: contact.email ?? undefined,
          phone: contact.phone ?? undefined,
        });
      })
    );

    setContactStates((prev) => {
      const next = { ...prev };
      results.forEach((r, i) => {
        const contactId = unresolved[i];
        if (r.status === "fulfilled") {
          next[contactId] = {
            ...next[contactId],
            busy: false,
            resolved: {
              clientName: r.value.client_name,
              invoicesMaterialized: r.value.invoices_materialized,
            },
            linkedThisSession: true,
          };
        } else {
          next[contactId] = { ...next[contactId], busy: false, error: "Failed to create client." };
        }
      });
      return next;
    });

    setSelectedIds(new Set());
    checkAllResolved();
  }

  function handleDeleteConfirmed(contactIds: string[]) {
    const idsSet = new Set(contactIds);
    setAllContacts((prev) => prev.filter((c) => !idsSet.has(c.id)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      contactIds.forEach((id) => next.delete(id));
      return next;
    });
    setDeleteModal(null);
    checkAllResolved();
  }

  function checkAllResolved() {
    setTimeout(() => {
      setAllContacts((current) => {
        const remaining = current.filter(
          (c) => !contactStates[c.id]?.resolved && !c.is_linked
        );
        if (remaining.length === 0 && current.length > 0 && onAllResolved) {
          onAllResolved();
        }
        return current;
      });
    }, 0);
  }

  // Derived data: filter and search
  const filteredContacts = useMemo(() => {
    let result = allContacts;

    // Apply filter
    if (filter === "linked") {
      result = result.filter(
        (c) => contactStates[c.id]?.resolved || c.is_linked
      );
    } else if (filter === "unlinked") {
      result = result.filter(
        (c) => !contactStates[c.id]?.resolved && !c.is_linked
      );
    }

    // Apply search
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [allContacts, filter, search, contactStates]);

  const totalPages = Math.ceil(filteredContacts.length / PAGE_SIZE);
  const pageContacts = filteredContacts.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );

  const selectAllChecked =
    pageContacts.length > 0 &&
    pageContacts.every((c) => selectedIds.has(c.id));
  const selectAllIndeterminate =
    pageContacts.length > 0 &&
    pageContacts.some((c) => selectedIds.has(c.id)) &&
    !selectAllChecked;

  function toggleSelectAll() {
    if (selectAllChecked) {
      const idsToRemove = new Set(pageContacts.map((c) => c.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        idsToRemove.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageContacts.forEach((c) => next.add(c.id));
        return next;
      });
    }
  }

  function toggleSelectContact(contactId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(contactId)) {
        next.delete(contactId);
      } else {
        next.add(contactId);
      }
      return next;
    });
  }

  function openDeleteModal(contactIds: string[]) {
    const hasLinked = contactIds.some((id) => {
      const contact = allContacts.find((c) => c.id === id);
      return contact?.is_linked || contactStates[id]?.resolved;
    });
    setDeleteModal({ open: true, contactIds, hasLinked });
  }

  if (loading) {
    return (
      <div
        className="ws-card"
        style={{
          textAlign: "center",
          color: "var(--clr-muted)",
          fontSize: "var(--text-sm)",
        }}
      >
        Loading unlinked contacts...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="ws-card"
        style={{
          background: "rgba(239,68,68,0.08)",
          color: "var(--danger)",
          fontSize: "var(--text-sm)",
        }}
      >
        {error}
      </div>
    );
  }

  if (allContacts.length === 0) {
    return (
      <div className="ws-card" style={{ padding: "var(--sp-40)", textAlign: "center" }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "rgba(34,160,107,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto var(--sp-12)",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--success)"
            strokeWidth="2"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className="pg-title" style={{ marginBottom: "var(--sp-4)" }}>
          Nothing to reconcile
        </div>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>
          All imported contacts are linked to clients.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Auto-Link Banner */}
      {autoLinkBanner === "done" && autoLinkedCount > 0 && (
        <div
          className="ws-card"
          style={{
            background: "rgba(34,160,107,0.08)",
            borderColor: "rgba(34,160,107,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "var(--sp-16)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--fw-semibold)",
                color: "var(--success)",
                marginBottom: 2,
              }}
            >
              {autoLinkedCount} {autoLinkedCount === 1 ? "contact" : "contacts"} auto-linked
            </div>
            <div
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--clr-muted)",
                lineHeight: "var(--lh-body)",
              }}
            >
              High-confidence matches were automatically linked to existing clients.
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setAutoLinkBanner("dismissed")}
            style={{ fontSize: "var(--text-xs)", flexShrink: 0 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary Banner */}
      <div
        className="ws-card"
        style={{
          background: "rgba(224,148,34,0.08)",
          borderColor: "rgba(224,148,34,0.25)",
          marginBottom: "var(--sp-16)",
        }}
      >
        <div
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: "var(--fw-semibold)",
            color: "var(--clr-primary)",
            marginBottom: 2,
          }}
        >
          {filteredContacts.filter((c) => !contactStates[c.id]?.resolved && !c.is_linked).length}{" "}
          {filteredContacts.filter((c) => !contactStates[c.id]?.resolved && !c.is_linked).length ===
          1
            ? "contact"
            : "contacts"}{" "}
          need a client link
        </div>
        <div
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--clr-muted)",
            lineHeight: "var(--lh-body)",
          }}
        >
          {invoicesPending} imported {invoicesPending === 1 ? "invoice is" : "invoices are"} waiting
          on these links.
        </div>
      </div>

      {/* Toolbar: Search + Filters + Refresh */}
      <div
        className="ws-card"
        style={{
          marginBottom: "var(--sp-16)",
          padding: "var(--sp-12) var(--sp-16)",
          display: "flex",
          gap: "var(--sp-16)",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "var(--sp-12)", alignItems: "center", flex: 1 }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                position: "absolute",
                left: "var(--sp-10)",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--clr-muted)",
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="input"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                paddingLeft: "var(--sp-32)",
                width: "100%",
                fontSize: "var(--text-sm)",
              }}
            />
          </div>

          {/* Filter Tabs */}
          <div className="ws-issue-filters" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: "none" }}>
            <button
              type="button"
              className={`ws-issue-filter${filter === "all" ? " active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              type="button"
              className={`ws-issue-filter${filter === "linked" ? " active" : ""}`}
              onClick={() => setFilter("linked")}
            >
              Linked
            </button>
            <button
              type="button"
              className={`ws-issue-filter${filter === "unlinked" ? " active" : ""}`}
              onClick={() => setFilter("unlinked")}
            >
              Unlinked
            </button>
          </div>
        </div>

        {/* Refresh Button */}
        {!embedded && (
          <button
            type="button"
            onClick={load}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: "var(--text-xs)", flexShrink: 0 }}
          >
            ↻ Refresh
          </button>
        )}
      </div>

      {/* Table */}
      <div
        className="ws-card"
        style={{
          padding: 0,
          overflow: "hidden",
          marginBottom: selectedIds.size > 0 ? "var(--sp-80)" : "var(--sp-16)",
        }}
      >
        {/* Table Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "32px 1fr 180px 90px 100px 140px 100px",
            gap: "var(--sp-8)",
            padding: "var(--sp-10) var(--sp-16)",
            borderBottom: "1px solid var(--clr-divider)",
            fontSize: "var(--text-xs)",
            fontWeight: "var(--fw-semibold)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--clr-muted)",
            position: "sticky",
            top: 0,
            background: "var(--clr-surface-card)",
            zIndex: 10,
          }}
        >
          <input
            type="checkbox"
            checked={selectAllChecked}
            indeterminate={selectAllIndeterminate ? "true" : undefined}
            onChange={toggleSelectAll}
            style={{ cursor: "pointer", width: 16, height: 16 }}
          />
          <span>Name</span>
          <span>Email</span>
          <span>Status</span>
          <span>Source</span>
          <span>Match Status</span>
          <span>Actions</span>
        </div>

        {/* Table Rows */}
        <div style={{ maxHeight: embedded ? "400px" : "600px", overflowY: "auto" }}>
          {pageContacts.map((contact) => {
            const state = contactStates[contact.id] ?? emptyState();
            const isResolved = state.resolved || contact.is_linked;
            const isHovered = hoveredId === contact.id;

            return (
              <div
                key={contact.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "32px 1fr 180px 90px 100px 140px 100px",
                  gap: "var(--sp-8)",
                  padding: "var(--sp-10) var(--sp-16)",
                  borderBottom: "1px solid var(--clr-divider)",
                  fontSize: "var(--text-sm)",
                  alignItems: "center",
                  background: isHovered ? "var(--clr-surface-hover)" : "transparent",
                  transition: "background 0.15s",
                }}
                onMouseEnter={() => setHoveredId(contact.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedIds.has(contact.id)}
                  onChange={() => toggleSelectContact(contact.id)}
                  style={{ cursor: "pointer", width: 16, height: 16 }}
                />

                {/* Name */}
                <div>
                  <div style={{ color: "var(--clr-primary)", fontWeight: "var(--fw-medium)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {contact.name}
                  </div>
                </div>

                {/* Email */}
                <div style={{
                  color: "var(--clr-secondary)",
                  fontSize: "var(--text-xs)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {contact.email || "—"}
                </div>

                {/* Status */}
                <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)" }}>
                  {contact.contact_type || "—"}
                </div>

                {/* Source */}
                <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)" }}>
                  {contact.source_platform || "Import"}
                </div>

                {/* Match Status */}
                <div>
                  {isResolved ? (
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        fontWeight: "var(--fw-medium)",
                        color: "var(--success)",
                        background: "rgba(34,160,107,0.1)",
                        padding: "var(--sp-4) var(--sp-10)",
                        borderRadius: "var(--r-full)",
                        display: "inline-block",
                      }}
                      title={state.resolved?.clientName ? `Linked to ${state.resolved.clientName}` : "Linked"}
                    >
                      Linked
                    </span>
                  ) : state.loadingSuggestions ? (
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)" }}>
                      Checking...
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        fontWeight: "var(--fw-medium)",
                        color: "var(--warning)",
                        background: "rgba(224,148,34,0.1)",
                        padding: "var(--sp-4) var(--sp-10)",
                        borderRadius: "var(--r-full)",
                        display: "inline-block",
                      }}
                    >
                      Unlinked
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "var(--sp-6)" }}>
                  {!isResolved && (
                    <button
                      type="button"
                      className="btn btn-icon btn-sm btn-ghost"
                      onClick={() => loadSuggestions(contact)}
                      disabled={state.busy}
                      title="Find matching client"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-icon btn-sm btn-ghost"
                    onClick={() => openDeleteModal([contact.id])}
                    disabled={state.busy}
                    title="Remove from list"
                    style={{ color: "var(--danger)" }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div
            style={{
              padding: "var(--sp-12) var(--sp-16)",
              borderTop: "1px solid var(--clr-divider)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "var(--text-xs)",
              color: "var(--clr-muted)",
              background: "var(--clr-surface-subtle)",
            }}
          >
            <div>
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredContacts.length)}{" "}
              of {filteredContacts.length} contacts
            </div>
            <div style={{ display: "flex", gap: "var(--sp-8)" }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                style={{ fontSize: "var(--text-xs)" }}
              >
                ← Prev
              </button>
              <span style={{ padding: "var(--sp-4) var(--sp-8)" }}>
                Page {page + 1} of {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page === totalPages - 1}
                style={{ fontSize: "var(--text-xs)" }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div
          style={{
            position: "sticky",
            bottom: 0,
            display: "flex",
            alignItems: "center",
            gap: "var(--sp-12)",
            padding: "var(--sp-12) var(--sp-16)",
            background: "var(--clr-surface-card)",
            borderTop: "1px solid var(--clr-divider-strong)",
            boxShadow: "0 -4px 12px rgba(0,0,0,0.08)",
            zIndex: 10,
          }}
        >
          <span style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>
            {selectedIds.size} selected
          </span>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => bulkCreateClients(Array.from(selectedIds))}
            style={{ fontSize: "var(--text-xs)" }}
          >
            Create accounts for {selectedIds.size}
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() => openDeleteModal(Array.from(selectedIds))}
            style={{ fontSize: "var(--text-xs)" }}
          >
            Remove {selectedIds.size} from list
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setSelectedIds(new Set())}
            style={{ fontSize: "var(--text-xs)" }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal?.open && (
        <div
          className="modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteModal(null);
          }}
          style={{ zIndex: 1000 }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Remove from import list?</span>
              <button
                type="button"
                className="modal-close"
                onClick={() => setDeleteModal(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ fontSize: "var(--text-sm)", color: "var(--clr-secondary)", lineHeight: "var(--lh-body)" }}>
              {deleteModal.hasLinked ? (
                <>
                  <p style={{ marginBottom: "var(--sp-12)" }}>
                    {deleteModal.contactIds.length > 1
                      ? `${deleteModal.contactIds.length} of these contacts have`
                      : "This contact has"}{" "}
                    been linked to a client.
                  </p>
                  <p style={{ marginBottom: 0 }}>
                    Removing {deleteModal.contactIds.length === 1 ? "it" : "them"} will only remove from this import list, not from your existing clients.
                  </p>
                </>
              ) : (
                <p style={{ marginBottom: 0 }}>
                  Remove {deleteModal.contactIds.length} contact{deleteModal.contactIds.length === 1 ? "" : "s"} from the import list? This doesn't delete{" "}
                  {deleteModal.contactIds.length === 1 ? "them" : "them"} from the system.
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setDeleteModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => handleDeleteConfirmed(deleteModal.contactIds)}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions Modal */}
      {suggestModal?.open && suggestModal.contact && (
        <div
          className="modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSuggestModal(null);
          }}
          style={{ zIndex: 1000 }}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 500 }}
          >
            <div className="modal-header">
              <span className="modal-title">Link contact</span>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSuggestModal(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {suggestModal.creating ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-8)" }}>
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      fontWeight: "var(--fw-semibold)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--clr-muted)",
                    }}
                  >
                    Create new client
                  </div>
                  <Field
                    label="Name"
                    value={suggestModal.newName}
                    onChange={(v) =>
                      setSuggestModal({
                        ...suggestModal,
                        newName: v,
                        formError: null,
                      })
                    }
                  />
                  <Field
                    label="Email"
                    type="email"
                    value={suggestModal.newEmail}
                    onChange={(v) =>
                      setSuggestModal({ ...suggestModal, newEmail: v })
                    }
                  />
                  <Field
                    label="Phone"
                    type="tel"
                    value={suggestModal.newPhone}
                    onChange={(v) =>
                      setSuggestModal({ ...suggestModal, newPhone: v })
                    }
                  />
                  {suggestModal.formError && (
                    <div
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--danger)",
                        marginTop: "var(--sp-4)",
                      }}
                    >
                      {suggestModal.formError}
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      gap: "var(--sp-8)",
                      marginTop: "var(--sp-4)",
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() =>
                        createClient(
                          suggestModal.contact!.id,
                          suggestModal.newName,
                          suggestModal.newEmail,
                          suggestModal.newPhone
                        )
                      }
                      disabled={suggestModal.busy}
                      style={{ fontSize: "var(--text-xs)" }}
                    >
                      {suggestModal.busy ? "Creating..." : "Create client"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() =>
                        setSuggestModal({ ...suggestModal, creating: false })
                      }
                      disabled={suggestModal.busy}
                      style={{ fontSize: "var(--text-xs)" }}
                    >
                      Back
                    </button>
                  </div>
                </div>
              ) : suggestModal.loading ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--clr-muted)",
                    fontSize: "var(--text-sm)",
                  }}
                >
                  Searching for matches...
                </div>
              ) : suggestModal.error ? (
                <div
                  style={{
                    color: "var(--danger)",
                    fontSize: "var(--text-sm)",
                  }}
                >
                  {suggestModal.error}
                </div>
              ) : suggestModal.suggestions.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--sp-8)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      fontWeight: "var(--fw-semibold)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--clr-muted)",
                    }}
                  >
                    Suggested matches
                  </div>
                  {suggestModal.suggestions.map((s) => (
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
                        <div
                          style={{
                            color: "var(--clr-primary)",
                            fontWeight: "var(--fw-medium)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {s.name}
                        </div>
                        {s.email && (
                          <div
                            style={{
                              fontSize: "var(--text-xs)",
                              color: "var(--clr-muted)",
                              marginTop: 1,
                            }}
                          >
                            {s.email}
                          </div>
                        )}
                      </div>
                      <ConfidenceBadge score={s.score} />
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => linkToClient(suggestModal.contact!.id, s.client_id)}
                        disabled={suggestModal.busy}
                        style={{ fontSize: "var(--text-xs)" }}
                      >
                        Link
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() =>
                      setSuggestModal({ ...suggestModal, creating: true })
                    }
                    disabled={suggestModal.busy}
                    style={{
                      alignSelf: "flex-start",
                      fontSize: "var(--text-xs)",
                      marginTop: "var(--sp-4)",
                    }}
                  >
                    None of these — create new client
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--clr-muted)",
                    fontSize: "var(--text-sm)",
                  }}
                >
                  No matches found. Create a new client instead?
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() =>
                      setSuggestModal({ ...suggestModal, creating: true })
                    }
                    style={{
                      fontSize: "var(--text-xs)",
                      display: "block",
                      marginTop: "var(--sp-8)",
                    }}
                  >
                    Create new client
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Client Modal */}
      {createModal?.open && createModal.contact && (
        <div
          className="modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCreateModal(null);
          }}
          style={{ zIndex: 1000 }}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 500 }}
          >
            <div className="modal-header">
              <span className="modal-title">Create new client</span>
              <button
                type="button"
                className="modal-close"
                onClick={() => setCreateModal(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-8)" }}>
                <Field
                  label="Name"
                  value={createModal.newName}
                  onChange={(v) =>
                    setCreateModal({ ...createModal, newName: v, error: null })
                  }
                />
                <Field
                  label="Email"
                  type="email"
                  value={createModal.newEmail}
                  onChange={(v) =>
                    setCreateModal({ ...createModal, newEmail: v })
                  }
                />
                <Field
                  label="Phone"
                  type="tel"
                  value={createModal.newPhone}
                  onChange={(v) =>
                    setCreateModal({ ...createModal, newPhone: v })
                  }
                />
                {createModal.error && (
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--danger)",
                      marginTop: "var(--sp-4)",
                    }}
                  >
                    {createModal.error}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setCreateModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() =>
                  createClient(
                    createModal.contact!.id,
                    createModal.newName,
                    createModal.newEmail,
                    createModal.newPhone
                  )
                }
                disabled={createModal.busy}
              >
                {createModal.busy ? "Creating..." : "Create client"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 90 ? "var(--success)" :
    pct >= 70 ? "var(--warning)" :
    "var(--clr-muted)";
  return (
    <span
      style={{
        fontSize: "var(--text-micro)",
        fontWeight: "var(--fw-medium)",
        color,
        flexShrink: 0,
      }}
    >
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
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          fontSize: "var(--text-sm)",
        }}
      />
    </div>
  );
}
