"use client";

import { useEffect, useState, useCallback } from "react";
import { documentsApi } from "@/lib/api/documents-api";
import type { DocumentReviewItem, ReviewQueueResponse } from "@/types/documents";
import { DocumentReviewDrawer } from "./components/document-review-drawer";

export function DocumentReviewPageView() {
  const [data, setData] = useState<ReviewQueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentReviewItem | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    documentsApi
      .reviewQueue({ skip: page * pageSize, limit: pageSize })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load review queue.");
        setLoading(false);
      });
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  function handleResolved() {
    setSelectedDoc(null);
    load();
  }

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

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
            <span
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--clr-muted)",
              }}
            >
              {data.total} document{data.total !== 1 ? "s" : ""} pending review
            </span>
          )}
        </div>
      </div>

      <div className="dash-content">
        <div className="ws-card">
          {loading && (
            <div
              style={{
                padding: "var(--sp-32)",
                textAlign: "center",
                color: "var(--clr-muted)",
                fontSize: "var(--text-sm)",
              }}
            >
              Loading review queue...
            </div>
          )}

          {error && (
            <div
              style={{
                padding: "var(--sp-24)",
                textAlign: "center",
                color: "var(--danger)",
                fontSize: "var(--text-sm)",
              }}
            >
              {error}
            </div>
          )}

          {!loading && !error && data && data.items.length === 0 && (
            <div
              style={{
                padding: "var(--sp-48)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "var(--text-md)",
                  fontWeight: "var(--fw-medium)",
                  color: "var(--clr-primary)",
                  marginBottom: "var(--sp-4)",
                }}
              >
                No documents pending review
              </div>
              <div
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--clr-muted)",
                }}
              >
                All documents have been automatically matched or are awaiting upload.
              </div>
            </div>
          )}

          {!loading && !error && data && data.items.length > 0 && (
            <>
              {/* Table header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1fr 0.8fr",
                  gap: "var(--sp-8)",
                  padding: "var(--sp-12) var(--sp-16)",
                  borderBottom: "1px solid var(--clr-divider)",
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--fw-semibold)",
                  color: "var(--clr-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <span>Document</span>
                <span>Client</span>
                <span>Extracted</span>
                <span>OCR</span>
                <span>Match</span>
                <span>Status</span>
              </div>

              {/* Rows */}
              {data.items.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedDoc(doc)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1fr 0.8fr",
                    gap: "var(--sp-8)",
                    padding: "var(--sp-12) var(--sp-16)",
                    borderBottom: "1px solid var(--clr-divider)",
                    fontSize: "var(--text-sm)",
                    color: "var(--clr-primary)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--clr-surface-hover)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "none";
                  }}
                >
                  {/* Document */}
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontWeight: "var(--fw-medium)",
                      }}
                    >
                      {doc.original_filename || doc.filename}
                    </div>
                    <div
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--clr-muted)",
                        marginTop: 1,
                      }}
                    >
                      {doc.file_size
                        ? `${(doc.file_size / 1024).toFixed(0)} KB`
                        : ""}
                      {doc.mime_type ? ` · ${doc.mime_type.split("/")[1]?.toUpperCase()}` : ""}
                    </div>
                  </div>

                  {/* Client */}
                  <div
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {doc.client_name || "Unknown"}
                  </div>

                  {/* Extracted info */}
                  <div style={{ minWidth: 0 }}>
                    {doc.extracted_amount && (
                      <div style={{ fontWeight: "var(--fw-medium)" }}>
                        {new Intl.NumberFormat("en-GB", {
                          style: "currency",
                          currency: "GBP",
                        }).format(Number(doc.extracted_amount))}
                      </div>
                    )}
                    {doc.extracted_supplier && (
                      <div
                        style={{
                          fontSize: "var(--text-xs)",
                          color: "var(--clr-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {doc.extracted_supplier}
                      </div>
                    )}
                    {!doc.extracted_amount && !doc.extracted_supplier && (
                      <span style={{ color: "var(--clr-muted)" }}>--</span>
                    )}
                  </div>

                  {/* OCR confidence */}
                  <div>
                    <ConfidenceBadge
                      value={doc.ocr_confidence ? Number(doc.ocr_confidence) : null}
                      label="OCR"
                    />
                  </div>

                  {/* Match confidence */}
                  <div>
                    {doc.match_confidence !== null && doc.match_confidence > 0 ? (
                      <ConfidenceBadge
                        value={doc.match_confidence * 100}
                        label="Match"
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: "var(--text-xs)",
                          color: "var(--clr-muted)",
                        }}
                      >
                        No match
                      </span>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <StatusBadge status={doc.validation_status} flagged={doc.flagged} />
                  </div>
                </button>
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
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    Previous
                  </button>
                  <span style={{ color: "var(--clr-muted)" }}>
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Review drawer */}
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

// -- Helper components --

function ConfidenceBadge({
  value,
  label,
}: {
  value: number | null;
  label: string;
}) {
  if (value === null) {
    return (
      <span style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)" }}>
        --
      </span>
    );
  }

  const color =
    value >= 85
      ? "var(--success)"
      : value >= 60
        ? "var(--warning)"
        : "var(--danger)";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: "var(--text-xs)",
        fontWeight: "var(--fw-medium)",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />
      <span style={{ color }}>{Math.round(value)}%</span>
    </span>
  );
}

function StatusBadge({
  status,
  flagged,
}: {
  status: string;
  flagged: boolean;
}) {
  let label = status.replace(/_/g, " ");
  let color = "var(--clr-muted)";

  if (flagged) {
    label = "Flagged";
    color = "var(--danger)";
  } else if (status === "needs_review") {
    label = "Review";
    color = "var(--warning)";
  } else if (status === "no_match") {
    label = "No match";
    color = "var(--danger)";
  } else if (status === "confirmed" || status === "manual_match" || status === "auto_matched") {
    label = "Resolved";
    color = "var(--success)";
  }

  return (
    <span
      style={{
        fontSize: "var(--text-xs)",
        fontWeight: "var(--fw-medium)",
        color,
        textTransform: "capitalize",
      }}
    >
      {label}
    </span>
  );
}
