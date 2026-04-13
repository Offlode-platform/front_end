"use client";

import { useState, useEffect } from "react";
import { documentsApi } from "@/lib/api/documents-api";
import { transactionsApi } from "@/lib/api/transactions-api";
import type { DocumentReviewItem, SuggestedMatch } from "@/types/documents";
import type { Transaction } from "@/types/transactions";

type Props = {
  document: DocumentReviewItem;
  onClose: () => void;
  onResolved: () => void;
};

export function DocumentReviewDrawer({ document: doc, onClose, onResolved }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [manualTxId, setManualTxId] = useState("");

  // Load client transactions for manual match
  useEffect(() => {
    if (showManual && doc.client_id) {
      transactionsApi.list(doc.client_id, { limit: 200 }).then(
        (list) => setTransactions(list),
        () => setTransactions([]),
      );
    }
  }, [showManual, doc.client_id]);

  async function handleConfirm(transactionId: string) {
    setBusy(true);
    setError(null);
    try {
      await documentsApi.confirmMatch(doc.id, transactionId);
      setSuccess("Match confirmed.");
      setTimeout(onResolved, 800);
    } catch {
      setError("Failed to confirm match.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    setBusy(true);
    setError(null);
    try {
      await documentsApi.rejectMatch(doc.id);
      setSuccess("Match rejected.");
      setTimeout(onResolved, 800);
    } catch {
      setError("Failed to reject match.");
    } finally {
      setBusy(false);
    }
  }

  async function handleManualMatch() {
    if (!manualTxId) return;
    setBusy(true);
    setError(null);
    try {
      await documentsApi.manualMatch(doc.id, manualTxId);
      setSuccess("Document matched.");
      setTimeout(onResolved, 800);
    } catch {
      setError("Failed to match document.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          zIndex: 900,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(560px, 90vw)",
          background: "var(--clr-surface-card)",
          borderLeft: "1px solid var(--clr-divider)",
          zIndex: 901,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "var(--sp-16) var(--sp-20)",
            borderBottom: "1px solid var(--clr-divider)",
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontSize: "var(--text-md)",
                fontWeight: "var(--fw-semibold)",
                color: "var(--clr-primary)",
              }}
            >
              Review Document
            </div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginTop: 2 }}>
              {doc.original_filename || doc.filename}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "var(--sp-4)",
              color: "var(--clr-muted)",
              fontSize: "var(--text-lg)",
            }}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "var(--sp-20)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--sp-20)",
          }}
        >
          {/* Feedback messages */}
          {error && (
            <div
              style={{
                padding: "var(--sp-10) var(--sp-12)",
                background: "var(--danger-bg, rgba(239,68,68,0.1))",
                borderRadius: "var(--r-md)",
                fontSize: "var(--text-sm)",
                color: "var(--danger)",
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              style={{
                padding: "var(--sp-10) var(--sp-12)",
                background: "var(--success-bg, rgba(34,197,94,0.1))",
                borderRadius: "var(--r-md)",
                fontSize: "var(--text-sm)",
                color: "var(--success)",
              }}
            >
              {success}
            </div>
          )}

          {/* Document info card */}
          <div
            style={{
              background: "var(--clr-surface)",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--clr-divider)",
              padding: "var(--sp-16)",
            }}
          >
            <div
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: "var(--fw-semibold)",
                color: "var(--clr-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "var(--sp-12)",
              }}
            >
              Document Details
            </div>
            <InfoGrid
              rows={[
                ["Client", doc.client_name || "Unknown"],
                [
                  "File",
                  `${doc.original_filename || doc.filename}${doc.file_size ? ` (${(doc.file_size / 1024).toFixed(0)} KB)` : ""}`,
                ],
                ["Type", doc.mime_type || "--"],
                [
                  "Uploaded",
                  new Date(doc.uploaded_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                ],
                ["Virus Scan", doc.virus_scan_status],
                ["State", doc.state],
              ]}
            />
          </div>

          {/* OCR results card */}
          <div
            style={{
              background: "var(--clr-surface)",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--clr-divider)",
              padding: "var(--sp-16)",
            }}
          >
            <div
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: "var(--fw-semibold)",
                color: "var(--clr-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "var(--sp-12)",
              }}
            >
              OCR Extracted Data
            </div>
            <InfoGrid
              rows={[
                [
                  "Amount",
                  doc.extracted_amount
                    ? new Intl.NumberFormat("en-GB", {
                        style: "currency",
                        currency: "GBP",
                      }).format(Number(doc.extracted_amount))
                    : "--",
                ],
                ["Date", doc.extracted_date || "--"],
                ["Supplier", doc.extracted_supplier || "--"],
                [
                  "OCR Confidence",
                  doc.ocr_confidence
                    ? `${Number(doc.ocr_confidence).toFixed(0)}%`
                    : "--",
                ],
                ["OCR Status", doc.ocr_status],
              ]}
            />
          </div>

          {/* Suggested matches */}
          {doc.suggested_matches.length > 0 && (
            <div
              style={{
                background: "var(--clr-surface)",
                borderRadius: "var(--r-lg)",
                border: "1px solid var(--clr-divider)",
                padding: "var(--sp-16)",
              }}
            >
              <div
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--fw-semibold)",
                  color: "var(--clr-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "var(--sp-12)",
                }}
              >
                Suggested Matches
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-8)" }}>
                {doc.suggested_matches.map((match, idx) => (
                  <SuggestedMatchCard
                    key={match.transaction_id}
                    match={match}
                    rank={idx + 1}
                    onConfirm={() => handleConfirm(match.transaction_id)}
                    busy={busy}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {!success && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--sp-8)",
              }}
            >
              {doc.suggested_matches.length > 0 && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleReject}
                  disabled={busy}
                  style={{ fontSize: "var(--text-sm)" }}
                >
                  {busy ? "Rejecting..." : "Reject All Suggestions"}
                </button>
              )}

              {!showManual ? (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowManual(true)}
                  style={{ fontSize: "var(--text-sm)" }}
                >
                  Manual Match to Transaction
                </button>
              ) : (
                <div
                  style={{
                    background: "var(--clr-surface)",
                    borderRadius: "var(--r-lg)",
                    border: "1px solid var(--clr-divider)",
                    padding: "var(--sp-16)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      fontWeight: "var(--fw-semibold)",
                      color: "var(--clr-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "var(--sp-12)",
                    }}
                  >
                    Select Transaction
                  </div>

                  {!transactions ? (
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>
                      Loading transactions...
                    </div>
                  ) : transactions.length === 0 ? (
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>
                      No unmatched transactions for this client.
                    </div>
                  ) : (
                    <>
                      <select
                        value={manualTxId}
                        onChange={(e) => setManualTxId(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "var(--sp-8) var(--sp-12)",
                          borderRadius: "var(--r-md)",
                          border: "1px solid var(--clr-divider)",
                          background: "var(--clr-surface-card)",
                          color: "var(--clr-primary)",
                          fontSize: "var(--text-sm)",
                          marginBottom: "var(--sp-8)",
                        }}
                      >
                        <option value="">Choose a transaction...</option>
                        {transactions
                          .filter((tx) => !tx.document_matched)
                          .map((tx) => (
                            <option key={tx.id} value={tx.id}>
                              {tx.supplier_name || tx.description || "Transaction"} —{" "}
                              {tx.amount} —{" "}
                              {new Date(tx.date).toLocaleDateString("en-GB")}
                            </option>
                          ))}
                      </select>
                      <div style={{ display: "flex", gap: "var(--sp-8)" }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={handleManualMatch}
                          disabled={busy || !manualTxId}
                          style={{ fontSize: "var(--text-sm)" }}
                        >
                          {busy ? "Matching..." : "Confirm Match"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setShowManual(false);
                            setManualTxId("");
                          }}
                          style={{ fontSize: "var(--text-sm)" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Flags */}
          {doc.flagged && doc.flag_reason && (
            <div
              style={{
                padding: "var(--sp-10) var(--sp-12)",
                background: "rgba(239,68,68,0.08)",
                borderRadius: "var(--r-md)",
                border: "1px solid rgba(239,68,68,0.2)",
                fontSize: "var(--text-sm)",
                color: "var(--danger)",
              }}
            >
              <strong>Flagged:</strong> {doc.flag_reason}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// -- Sub-components --

function InfoGrid({ rows }: { rows: [string, string][] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "var(--sp-6) var(--sp-16)" }}>
      {rows.map(([label, value]) => (
        <div key={label} style={{ display: "contents" }}>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>
            {label}
          </div>
          <div
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--clr-primary)",
              fontWeight: "var(--fw-medium)",
            }}
          >
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

function SuggestedMatchCard({
  match,
  rank,
  onConfirm,
  busy,
}: {
  match: SuggestedMatch;
  rank: number;
  onConfirm: () => void;
  busy: boolean;
}) {
  const scorePercent = Math.round(match.score * 100);
  const scoreColor =
    scorePercent >= 85
      ? "var(--success)"
      : scorePercent >= 60
        ? "var(--warning)"
        : "var(--danger)";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--sp-12)",
        padding: "var(--sp-10) var(--sp-12)",
        background: "var(--clr-surface-card)",
        borderRadius: "var(--r-md)",
        border: "1px solid var(--clr-divider)",
      }}
    >
      {/* Rank badge */}
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: rank === 1 ? "var(--clr-accent-soft, rgba(59,130,246,0.1))" : "var(--clr-surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "var(--text-xs)",
          fontWeight: "var(--fw-semibold)",
          color: "var(--clr-muted)",
          flexShrink: 0,
        }}
      >
        {rank}
      </div>

      {/* Transaction info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: "var(--fw-medium)",
            color: "var(--clr-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {match.supplier || "Transaction"}
        </div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginTop: 1 }}>
          {match.amount
            ? new Intl.NumberFormat("en-GB", {
                style: "currency",
                currency: "GBP",
              }).format(Number(match.amount))
            : ""}
          {match.date
            ? ` · ${new Date(match.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
            : ""}
        </div>
      </div>

      {/* Score */}
      <div
        style={{
          fontSize: "var(--text-sm)",
          fontWeight: "var(--fw-semibold)",
          color: scoreColor,
          flexShrink: 0,
        }}
      >
        {scorePercent}%
      </div>

      {/* Accept button */}
      <button
        type="button"
        className="btn btn-primary btn-sm"
        onClick={onConfirm}
        disabled={busy}
        style={{ fontSize: "var(--text-xs)", flexShrink: 0 }}
      >
        {busy ? "..." : "Accept"}
      </button>
    </div>
  );
}
