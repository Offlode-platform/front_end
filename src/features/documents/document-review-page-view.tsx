"use client";

import { useEffect, useState, useCallback } from "react";
import { documentsApi } from "@/lib/api/documents-api";
import type { DocumentReviewItem, ReviewQueueResponse } from "@/types/documents";
import { DocumentReviewDrawer } from "./components/document-review-drawer";

// ─── filter state ──────────────────────────────────────────────────────────

type Filters = {
  client_id: string;
  validation_status: string;
  confidence: string; // "any" | "high" | "medium" | "low"
  sort_by: string;
  sort_order: string;
};

const DEFAULT_FILTERS: Filters = {
  client_id: "",
  validation_status: "",
  confidence: "any",
  sort_by: "created_at",
  sort_order: "desc",
};

function confidenceRange(conf: string): { min?: number; max?: number } {
  if (conf === "high") return { min: 85 };
  if (conf === "medium") return { min: 60, max: 84 };
  if (conf === "low") return { max: 59 };
  return {};
}

// ─── main component ────────────────────────────────────────────────────────

export function DocumentReviewPageView() {
  const [data, setData] = useState<ReviewQueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentReviewItem | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 25;

  // Filters
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  // Collect unique client names from loaded data for filter dropdown
  const [clientOptions, setClientOptions] = useState<{ id: string; name: string }[]>([]);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const { min: min_confidence, max: max_confidence } = confidenceRange(filters.confidence);
    documentsApi
      .reviewQueue({
        skip: page * pageSize,
        limit: pageSize,
        client_id: filters.client_id || undefined,
        validation_status: filters.validation_status || undefined,
        min_confidence,
        max_confidence,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
      })
      .then((res) => {
        setData(res);
        setLoading(false);
        // Accumulate unique clients for filter dropdown
        setClientOptions((prev) => {
          const map = new Map(prev.map((c) => [c.id, c]));
          for (const item of res.items) {
            if (item.client_id && item.client_name) {
              map.set(String(item.client_id), { id: String(item.client_id), name: item.client_name });
            }
          }
          return Array.from(map.values());
        });
      })
      .catch(() => {
        setError("Failed to load review queue.");
        setLoading(false);
      });
  }, [page, filters]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
    setSelectedIds(new Set());
  }, [filters]);

  function handleResolved() {
    setSelectedDoc(null);
    setSelectedIds(new Set());
    load();
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (!data) return;
    const allIds = data.items.map((d) => d.id);
    const allSelected = allIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  }

  async function handleBulkReject() {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    setBulkMsg(null);
    const ids = Array.from(selectedIds);
    let succeeded = 0;
    await Promise.all(
      ids.map((id) =>
        documentsApi.rejectMatch(id).then(() => { succeeded++; }).catch(() => {}),
      ),
    );
    setBulkBusy(false);
    setBulkMsg(`Rejected ${succeeded} of ${ids.length} documents.`);
    setSelectedIds(new Set());
    setTimeout(() => {
      setBulkMsg(null);
      load();
    }, 1500);
  }

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;
  const allOnPageSelected = data ? data.items.every((d) => selectedIds.has(d.id)) : false;

  return (
    <div
      className="page active"
      id="page-document-review"
      style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
    >
      <div className="page-bar" style={{ flexShrink: 0 }}>
        <div className="page-bar-left">
          <div>
            <div className="pg-title">Document Review</div>
            <div className="pg-subtitle">
              Review documents with low OCR confidence or uncertain transaction matches.
            </div>
          </div>
        </div>
        <div className="page-bar-right">
          {data && (
            <span style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>
              {data.total} document{data.total !== 1 ? "s" : ""} pending review
            </span>
          )}
        </div>
      </div>

      <div className="dash-content">
        {/* Bulk action toast */}
        {bulkMsg && (
          <div
            style={{
              padding: "var(--sp-10) var(--sp-16)",
              background: "rgba(34,197,94,0.1)",
              borderRadius: "var(--r-md)",
              fontSize: "var(--text-sm)",
              color: "var(--success)",
              marginBottom: "var(--sp-12)",
            }}
          >
            {bulkMsg}
          </div>
        )}

        {/* Filter bar */}
        <div
          style={{
            display: "flex",
            gap: "var(--sp-10)",
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: "var(--sp-12)",
          }}
        >
          {/* Client filter */}
          {clientOptions.length > 0 && (
            <select
              value={filters.client_id}
              onChange={(e) => setFilters((f) => ({ ...f, client_id: e.target.value }))}
              style={selectStyle}
            >
              <option value="">All clients</option>
              {clientOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          {/* Status filter */}
          <select
            value={filters.validation_status}
            onChange={(e) => setFilters((f) => ({ ...f, validation_status: e.target.value }))}
            style={selectStyle}
          >
            <option value="">All statuses</option>
            <option value="needs_review">Needs review</option>
            <option value="no_match">No match</option>
          </select>

          {/* Confidence filter */}
          <select
            value={filters.confidence}
            onChange={(e) => setFilters((f) => ({ ...f, confidence: e.target.value }))}
            style={selectStyle}
          >
            <option value="any">Any confidence</option>
            <option value="high">High (≥85%)</option>
            <option value="medium">Medium (60–84%)</option>
            <option value="low">Low (&lt;60%)</option>
          </select>

          {/* Sort */}
          <select
            value={`${filters.sort_by}:${filters.sort_order}`}
            onChange={(e) => {
              const [sort_by, sort_order] = e.target.value.split(":");
              setFilters((f) => ({ ...f, sort_by, sort_order }));
            }}
            style={selectStyle}
          >
            <option value="created_at:desc">Newest first</option>
            <option value="created_at:asc">Oldest first</option>
            <option value="ocr_confidence:asc">OCR confidence ↑</option>
            <option value="ocr_confidence:desc">OCR confidence ↓</option>
            <option value="match_confidence:asc">Match confidence ↑</option>
            <option value="match_confidence:desc">Match confidence ↓</option>
          </select>

          {/* Reset */}
          {JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS) && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setFilters(DEFAULT_FILTERS)}
              style={{ fontSize: "var(--text-xs)" }}
            >
              Reset filters
            </button>
          )}
        </div>

        {/* Floating bulk action bar */}
        {selectedIds.size > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--sp-12)",
              padding: "var(--sp-10) var(--sp-16)",
              background: "var(--clr-surface-card)",
              border: "1px solid var(--clr-divider)",
              borderRadius: "var(--r-md)",
              marginBottom: "var(--sp-12)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--fw-medium)", color: "var(--clr-primary)" }}>
              {selectedIds.size} selected
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleBulkReject}
              disabled={bulkBusy}
              style={{ fontSize: "var(--text-sm)" }}
            >
              {bulkBusy ? "Rejecting…" : `Reject Selected (${selectedIds.size})`}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setSelectedIds(new Set())}
              style={{ fontSize: "var(--text-sm)", marginLeft: "auto" }}
            >
              Clear selection
            </button>
          </div>
        )}

        <div className="ws-card">
          {loading && (
            <div style={{ padding: "var(--sp-32)", textAlign: "center", color: "var(--clr-muted)", fontSize: "var(--text-sm)" }}>
              Loading review queue…
            </div>
          )}

          {error && (
            <div style={{ padding: "var(--sp-24)", textAlign: "center", color: "var(--danger)", fontSize: "var(--text-sm)" }}>
              {error}
            </div>
          )}

          {!loading && !error && data && data.items.length === 0 && (
            <div style={{ padding: "var(--sp-48)", textAlign: "center" }}>
              <div style={{ fontSize: "var(--text-md)", fontWeight: "var(--fw-medium)", color: "var(--clr-primary)", marginBottom: "var(--sp-4)" }}>
                No documents pending review
              </div>
              <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>
                {JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS)
                  ? "Try adjusting your filters."
                  : "All documents have been automatically matched or are awaiting upload."}
              </div>
            </div>
          )}

          {!loading && !error && data && data.items.length > 0 && (
            <>
              {/* Table header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "24px 2fr 1.2fr 1fr 1fr 1fr 0.8fr",
                  gap: "var(--sp-8)",
                  padding: "var(--sp-12) var(--sp-16)",
                  borderBottom: "1px solid var(--clr-divider)",
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--fw-semibold)",
                  color: "var(--clr-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  alignItems: "center",
                }}
              >
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleSelectAll}
                  style={{ cursor: "pointer" }}
                  title="Select all on this page"
                />
                <span>Document</span>
                <span>Client</span>
                <span>Extracted</span>
                <span>OCR</span>
                <span>Match</span>
                <span>Status</span>
              </div>

              {/* Rows */}
              {data.items.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "24px 2fr 1.2fr 1fr 1fr 1fr 0.8fr",
                    gap: "var(--sp-8)",
                    padding: "var(--sp-12) var(--sp-16)",
                    borderBottom: "1px solid var(--clr-divider)",
                    fontSize: "var(--text-sm)",
                    color: "var(--clr-primary)",
                    alignItems: "center",
                    background: selectedIds.has(doc.id) ? "var(--clr-surface-hover)" : "none",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedIds.has(doc.id)) {
                      (e.currentTarget as HTMLElement).style.background = "var(--clr-surface-hover)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedIds.has(doc.id)) {
                      (e.currentTarget as HTMLElement).style.background = "none";
                    }
                  }}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedIds.has(doc.id)}
                    onChange={(e) => { e.stopPropagation(); toggleSelect(doc.id); }}
                    style={{ cursor: "pointer" }}
                  />

                  {/* Document — clickable */}
                  <button
                    type="button"
                    onClick={() => setSelectedDoc(doc)}
                    style={{ display: "block", background: "none", border: "none", cursor: "pointer", textAlign: "left", minWidth: 0, padding: 0 }}
                  >
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: "var(--fw-medium)" }}>
                      {doc.original_filename || doc.filename}
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginTop: 1 }}>
                      {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : ""}
                      {doc.mime_type ? ` · ${doc.mime_type.split("/")[1]?.toUpperCase()}` : ""}
                    </div>
                  </button>

                  {/* Client */}
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {doc.client_name || "Unknown"}
                  </div>

                  {/* Extracted */}
                  <div style={{ minWidth: 0 }}>
                    {doc.extracted_amount && (
                      <div style={{ fontWeight: "var(--fw-medium)" }}>
                        {new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(doc.extracted_amount))}
                      </div>
                    )}
                    {doc.extracted_supplier && (
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {doc.extracted_supplier}
                      </div>
                    )}
                    {!doc.extracted_amount && !doc.extracted_supplier && (
                      <span style={{ color: "var(--clr-muted)" }}>--</span>
                    )}
                  </div>

                  {/* OCR confidence */}
                  <div>
                    <ConfidenceBadge value={doc.ocr_confidence ? Number(doc.ocr_confidence) : null} />
                  </div>

                  {/* Match confidence */}
                  <div>
                    {doc.match_confidence !== null && doc.match_confidence > 0 ? (
                      <ConfidenceBadge value={doc.match_confidence * 100} />
                    ) : (
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)" }}>No match</span>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <StatusBadge status={doc.validation_status} flagged={doc.flagged} />
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "var(--sp-8)",
                    padding: "var(--sp-12)",
                    fontSize: "var(--text-sm)",
                  }}
                >
                  <button type="button" className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                    Previous
                  </button>
                  <span style={{ color: "var(--clr-muted)" }}>Page {page + 1} of {totalPages}</span>
                  <button type="button" className="btn btn-ghost btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedDoc && (
        <DocumentReviewDrawer
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onResolved={handleResolved}
        />
      )}
    </div>
  );
}

// ─── helpers ───────────────────────────────────────────────────────────────

const selectStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: "var(--r-md)",
  border: "1px solid var(--clr-divider)",
  background: "var(--clr-surface-card)",
  color: "var(--clr-primary)",
  fontSize: "var(--text-sm)",
  cursor: "pointer",
};

function ConfidenceBadge({ value }: { value: number | null }) {
  if (value === null) {
    return <span style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)" }}>--</span>;
  }
  const color = value >= 85 ? "var(--success)" : value >= 60 ? "var(--warning)" : "var(--danger)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "var(--text-xs)", fontWeight: "var(--fw-medium)" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ color }}>{Math.round(value)}%</span>
    </span>
  );
}

function StatusBadge({ status, flagged }: { status: string; flagged: boolean }) {
  let label = status.replace(/_/g, " ");
  let color = "var(--clr-muted)";
  if (flagged) { label = "Flagged"; color = "var(--danger)"; }
  else if (status === "needs_review") { label = "Review"; color = "var(--warning)"; }
  else if (status === "no_match") { label = "No match"; color = "var(--danger)"; }
  else if (["confirmed", "manual_match", "auto_matched"].includes(status)) { label = "Resolved"; color = "var(--success)"; }
  return (
    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--fw-medium)", color, textTransform: "capitalize" }}>
      {label}
    </span>
  );
}
