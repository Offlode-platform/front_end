"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { documentsApi } from "@/lib/api/documents-api";
import type { AuditLogEntry } from "@/lib/api/documents-api";
import { transactionsApi } from "@/lib/api/transactions-api";
import type { DocumentReviewItem, SuggestedMatch } from "@/types/documents";
import type { Transaction } from "@/types/transactions";

type Props = {
  document: DocumentReviewItem;
  onClose: () => void;
  onResolved: () => void;
};

type OcrEditState = {
  extracted_amount: string;
  extracted_date: string;
  extracted_supplier: string;
};

// ─── status helpers ──────────────────────────────────────────────────────────

function virusPillClass(status: string) {
  if (status === "clean") return "pill pill-success";
  if (status === "infected") return "pill pill-danger";
  return "pill pill-neutral";
}

function statePillClass(state: string) {
  if (state === "processed" || state === "matched") return "pill pill-success";
  if (state === "failed") return "pill pill-danger";
  if (state === "pending" || state === "review") return "pill pill-warning";
  return "pill pill-neutral";
}

function ocrPillClass(status: string) {
  if (status === "completed") return "pill pill-success";
  if (status === "failed") return "pill pill-danger";
  if (status === "processing") return "pill pill-brand";
  return "pill pill-neutral";
}

function formatLabel(raw: string) {
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── main component ──────────────────────────────────────────────────────────

export function DocumentReviewDrawer({ document: doc, onClose, onResolved }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editingOcr, setEditingOcr] = useState(false);
  const [ocrEdit, setOcrEdit] = useState<OcrEditState>({
    extracted_amount: doc.extracted_amount ? String(doc.extracted_amount) : "",
    extracted_date: doc.extracted_date ?? "",
    extracted_supplier: doc.extracted_supplier ?? "",
  });
  const [ocrBusy, setOcrBusy] = useState(false);

  const [showManual, setShowManual] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [txSearch, setTxSearch] = useState("");
  const [manualTxId, setManualTxId] = useState("");
  const [comboOpen, setComboOpen] = useState(false);
  const comboRef = useRef<HTMLDivElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState(false);

  const [auditLog, setAuditLog] = useState<AuditLogEntry[] | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  const [editingFlag, setEditingFlag] = useState(false);
  const [flagReason, setFlagReason] = useState(doc.flag_reason ?? "");

  const isImage = doc.mime_type?.startsWith("image/");
  const isPdf = doc.mime_type === "application/pdf";
  const canPreview = isImage || isPdf;

  useEffect(() => {
    if (!canPreview) { setPreviewLoading(false); return; }
    let objectUrl: string | null = null;
    documentsApi.fetchBlob(doc.id)
      .then(({ blob }) => {
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
        setPreviewLoading(false);
      })
      .catch(() => { setPreviewError(true); setPreviewLoading(false); });
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [doc.id, canPreview]);

  useEffect(() => {
    if (showManual && doc.client_id) {
      transactionsApi.list(doc.client_id, { limit: 500 }).then(
        (list) => setTransactions(list),
        () => setTransactions([]),
      );
    }
  }, [showManual, doc.client_id]);

  useEffect(() => {
    setAuditLoading(true);
    documentsApi.fetchAuditLog(doc.id)
      .then((res) => setAuditLog(res))
      .catch(() => setAuditLog([]))
      .finally(() => setAuditLoading(false));
  }, [doc.id]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) setComboOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTransactions = (transactions ?? [])
    .filter((tx) => !tx.document_matched)
    .filter((tx) => {
      if (!txSearch) return true;
      const q = txSearch.toLowerCase();
      return tx.supplier_name?.toLowerCase().includes(q) || tx.description?.toLowerCase().includes(q) || String(tx.amount ?? "").includes(q);
    })
    .slice(0, 50);

  const selectedTx = (transactions ?? []).find((t) => t.id === manualTxId);

  async function handleConfirm(transactionId: string) {
    setBusy(true); setError(null);
    try { await documentsApi.confirmMatch(doc.id, transactionId); setSuccess("Match confirmed."); setTimeout(onResolved, 800); }
    catch { setError("Failed to confirm match."); }
    finally { setBusy(false); }
  }

  async function handleReject() {
    setBusy(true); setError(null);
    try { await documentsApi.rejectMatch(doc.id); setSuccess("Suggestions rejected."); setTimeout(onResolved, 800); }
    catch { setError("Failed to reject match."); }
    finally { setBusy(false); }
  }

  async function handleManualMatch() {
    if (!manualTxId) return;
    setBusy(true); setError(null);
    try { await documentsApi.manualMatch(doc.id, manualTxId); setSuccess("Document matched."); setTimeout(onResolved, 800); }
    catch { setError("Failed to match document."); }
    finally { setBusy(false); }
  }

  async function handleSaveOcr() {
    setOcrBusy(true); setError(null);
    try {
      await documentsApi.updateOcrFields(doc.id, {
        extracted_amount: ocrEdit.extracted_amount || undefined,
        extracted_date: ocrEdit.extracted_date || undefined,
        extracted_supplier: ocrEdit.extracted_supplier || undefined,
      });
      setEditingOcr(false);
      setSuccess("OCR fields updated. Re-matching in background…");
    } catch { setError("Failed to save OCR corrections."); }
    finally { setOcrBusy(false); }
  }

  async function handleRetryOcr() {
    setBusy(true); setError(null);
    try { await documentsApi.retryOcr(doc.id); setSuccess("OCR queued. Document will reappear once processed."); setTimeout(onResolved, 1500); }
    catch { setError("Failed to queue OCR retry."); }
    finally { setBusy(false); }
  }

  async function handleResolveFlag() {
    setBusy(true); setError(null);
    try { await documentsApi.updateFlag(doc.id, { flagged: false }); setSuccess("Flag resolved."); setTimeout(onResolved, 800); }
    catch { setError("Failed to resolve flag."); }
    finally { setBusy(false); }
  }

  async function handleSaveFlag() {
    setBusy(true); setError(null);
    try {
      await documentsApi.updateFlag(doc.id, { flagged: true, flag_reason: flagReason, flag_category: doc.flag_category ?? undefined });
      setEditingFlag(false); setSuccess("Flag updated.");
    } catch { setError("Failed to update flag."); }
    finally { setBusy(false); }
  }

  const fileSizeLabel = doc.file_size
    ? doc.file_size < 1024 * 1024
      ? `${(doc.file_size / 1024).toFixed(0)} KB`
      : `${(doc.file_size / 1024 / 1024).toFixed(1)} MB`
    : null;

  const uploadedAt = new Date(doc.uploaded_at).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const hasOcr = doc.extracted_amount || doc.extracted_date || doc.extracted_supplier;

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 900, backdropFilter: "blur(2px)" }}
      />

      <div
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: canPreview ? "min(980px, 96vw)" : "min(560px, 90vw)",
          background: "var(--clr-surface-card)",
          borderLeft: "1px solid var(--clr-divider)",
          zIndex: 901, display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "var(--sp-16) var(--sp-20)",
          borderBottom: "1px solid var(--clr-divider)", flexShrink: 0,
          background: "var(--clr-surface-card)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-12)", minWidth: 0 }}>
            <FileTypeIcon mimeType={doc.mime_type} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "var(--text-md)", fontWeight: "var(--fw-semibold)", color: "var(--clr-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {doc.original_filename || doc.filename}
              </div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: "var(--sp-6)" }}>
                {doc.client_name && <span>{doc.client_name}</span>}
                {doc.client_name && fileSizeLabel && <span style={{ opacity: 0.4 }}>·</span>}
                {fileSizeLabel && <span>{fileSizeLabel}</span>}
                {fileSizeLabel && <span style={{ opacity: 0.4 }}>·</span>}
                <span>{uploadedAt}</span>
              </div>
            </div>
          </div>
          <button
            type="button" onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "var(--sp-6)", color: "var(--clr-muted)", fontSize: 20, lineHeight: 1, borderRadius: "var(--r-md)", flexShrink: 0 }}
          >
            ×
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>

          {/* LEFT PANE */}
          <div style={{
            width: canPreview ? "420px" : "100%", flexShrink: 0,
            overflow: "auto", padding: "var(--sp-20)",
            display: "flex", flexDirection: "column", gap: "var(--sp-12)",
            borderRight: canPreview ? "1px solid var(--clr-divider)" : "none",
          }}>

            {/* Feedback */}
            {error && (
              <div style={{ padding: "var(--sp-10) var(--sp-14)", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--r-md)", fontSize: "var(--text-sm)", color: "var(--danger)", display: "flex", alignItems: "flex-start", gap: "var(--sp-8)" }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div style={{ padding: "var(--sp-10) var(--sp-14)", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "var(--r-md)", fontSize: "var(--text-sm)", color: "var(--success)", display: "flex", alignItems: "center", gap: "var(--sp-8)" }}>
                <span>✓</span>
                <span>{success}</span>
              </div>
            )}

            {/* Flag banner */}
            {doc.flagged && (
              <div style={{
                padding: "var(--sp-12) var(--sp-14)",
                background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)",
                borderRadius: "var(--r-md)", fontSize: "var(--text-sm)",
              }}>
                {!editingFlag ? (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--sp-8)" }}>
                    <div>
                      <div style={{ fontWeight: "var(--fw-medium)", color: "var(--danger)", marginBottom: 3 }}>Flagged</div>
                      <div style={{ color: "var(--clr-secondary)", fontSize: "var(--text-xs)" }}>{doc.flag_reason || "No reason provided"}</div>
                    </div>
                    <div style={{ display: "flex", gap: "var(--sp-8)", flexShrink: 0 }}>
                      <button type="button" onClick={() => setEditingFlag(true)}
                        style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                        Edit
                      </button>
                      <button type="button" onClick={handleResolveFlag} disabled={busy}
                        style={{ fontSize: "var(--text-xs)", color: "var(--danger)", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                        Resolve
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-8)" }}>
                    <textarea
                      value={flagReason} onChange={(e) => setFlagReason(e.target.value)} rows={2}
                      placeholder="Flag reason…"
                      style={{ width: "100%", padding: "var(--sp-8)", borderRadius: "var(--r-md)", border: "1px solid rgba(239,68,68,0.3)", background: "var(--clr-surface-card)", color: "var(--clr-primary)", fontSize: "var(--text-sm)", resize: "none", boxSizing: "border-box" }}
                    />
                    <div style={{ display: "flex", gap: "var(--sp-6)" }}>
                      <button type="button" onClick={handleSaveFlag} disabled={busy} className="btn btn-sm" style={{ fontSize: "var(--text-xs)", borderColor: "rgba(239,68,68,0.4)", color: "var(--danger)" }}>Save</button>
                      <button type="button" onClick={() => setEditingFlag(false)} className="btn btn-ghost btn-sm" style={{ fontSize: "var(--text-xs)" }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Document meta */}
            <Section label="Details">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
                <MetaRow label="Type" value={doc.mime_type || "—"} />
                <MetaRow label="Virus scan">
                  <span className={virusPillClass(doc.virus_scan_status)} style={{ fontSize: "var(--text-xs)" }}>
                    {formatLabel(doc.virus_scan_status)}
                  </span>
                </MetaRow>
                <MetaRow label="State">
                  <span className={statePillClass(doc.state)} style={{ fontSize: "var(--text-xs)" }}>
                    {formatLabel(doc.state)}
                  </span>
                </MetaRow>
              </div>
            </Section>

            {/* OCR data */}
            <Section
              label="Extracted data"
              action={
                !editingOcr && doc.ocr_status !== "failed" ? (
                  <button type="button" onClick={() => setEditingOcr(true)}
                    style={{ fontSize: "var(--text-xs)", color: "var(--brand)", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: "var(--fw-medium)" }}>
                    Edit
                  </button>
                ) : undefined
              }
            >
              {!editingOcr ? (
                <>
                  {hasOcr ? (
                    <>
                      {doc.extracted_amount && (
                        <div style={{ marginBottom: "var(--sp-12)" }}>
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginBottom: 3 }}>Amount</div>
                          <div style={{ fontSize: "var(--text-xl)", fontWeight: "var(--fw-semibold)", color: "var(--clr-primary)", letterSpacing: "-0.02em" }}>
                            {new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(doc.extracted_amount))}
                          </div>
                        </div>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
                        {doc.extracted_supplier && <MetaRow label="Supplier" value={doc.extracted_supplier} />}
                        {doc.extracted_date && <MetaRow label="Date" value={doc.extracted_date} />}
                        <MetaRow label="OCR confidence" value={doc.ocr_confidence ? `${Number(doc.ocr_confidence).toFixed(0)}%` : "—"} />
                        <MetaRow label="OCR status">
                          <span className={ocrPillClass(doc.ocr_status)} style={{ fontSize: "var(--text-xs)" }}>
                            {formatLabel(doc.ocr_status)}
                          </span>
                        </MetaRow>
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)", padding: "var(--sp-4) 0" }}>
                      No data extracted yet.
                      <span className={ocrPillClass(doc.ocr_status)} style={{ fontSize: "var(--text-xs)", marginLeft: "var(--sp-8)" }}>
                        {formatLabel(doc.ocr_status)}
                      </span>
                    </div>
                  )}
                  {doc.ocr_status === "failed" && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={handleRetryOcr} disabled={busy}
                      style={{ marginTop: "var(--sp-10)", fontSize: "var(--text-sm)", width: "100%" }}>
                      {busy ? "Queuing…" : "Retry OCR"}
                    </button>
                  )}
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-10)" }}>
                  <OcrField label="Amount" value={ocrEdit.extracted_amount} placeholder="e.g. 1250.00"
                    onChange={(v) => setOcrEdit((p) => ({ ...p, extracted_amount: v }))} />
                  <OcrField label="Date" value={ocrEdit.extracted_date} placeholder="DD/MM/YYYY"
                    onChange={(v) => setOcrEdit((p) => ({ ...p, extracted_date: v }))} />
                  <OcrField label="Supplier" value={ocrEdit.extracted_supplier} placeholder="Supplier name"
                    onChange={(v) => setOcrEdit((p) => ({ ...p, extracted_supplier: v }))} />
                  <div style={{ display: "flex", gap: "var(--sp-8)", marginTop: "var(--sp-4)" }}>
                    <button type="button" className="btn btn-primary btn-sm" onClick={handleSaveOcr} disabled={ocrBusy} style={{ fontSize: "var(--text-sm)" }}>
                      {ocrBusy ? "Saving…" : "Save & Re-match"}
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingOcr(false)} style={{ fontSize: "var(--text-sm)" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </Section>

            {/* Suggested matches */}
            {doc.suggested_matches.length > 0 && (
              <Section label={`Suggested matches (${doc.suggested_matches.length})`}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-8)" }}>
                  {doc.suggested_matches.map((match, idx) => (
                    <SuggestedMatchCard key={match.transaction_id} match={match} rank={idx + 1} onConfirm={() => handleConfirm(match.transaction_id)} busy={busy} />
                  ))}
                  {!success && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={handleReject} disabled={busy}
                      style={{ fontSize: "var(--text-xs)", marginTop: "var(--sp-4)" }}>
                      {busy ? "Rejecting…" : "Reject all suggestions"}
                    </button>
                  )}
                </div>
              </Section>
            )}

            {/* Manual match */}
            {!success && (
              <>
                {!showManual ? (
                  <button type="button" className="btn btn-ghost" onClick={() => setShowManual(true)}
                    style={{ fontSize: "var(--text-sm)", width: "100%", textAlign: "center" }}>
                    Manual match to transaction
                  </button>
                ) : (
                  <Section label="Select transaction">
                    {!transactions ? (
                      <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>Loading…</div>
                    ) : (
                      <>
                        <div ref={comboRef} style={{ position: "relative", marginBottom: "var(--sp-8)" }}>
                          <input
                            type="text" placeholder="Search supplier, description or amount…"
                            value={txSearch} onFocus={() => setComboOpen(true)}
                            onChange={(e) => { setTxSearch(e.target.value); setManualTxId(""); setComboOpen(true); }}
                            style={{ width: "100%", padding: "var(--sp-8) var(--sp-12)", borderRadius: "var(--r-md)", border: "1px solid var(--clr-divider)", background: "var(--clr-surface-card)", color: "var(--clr-primary)", fontSize: "var(--text-sm)", boxSizing: "border-box" }}
                          />
                          {comboOpen && filteredTransactions.length > 0 && (
                            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--clr-surface-card)", border: "1px solid var(--clr-divider)", borderRadius: "var(--r-md)", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 10, maxHeight: 220, overflow: "auto", marginTop: 2 }}>
                              {filteredTransactions.map((tx) => (
                                <button key={tx.id} type="button"
                                  onClick={() => { setManualTxId(tx.id); setTxSearch(`${tx.supplier_name || tx.description || "Transaction"} — £${tx.amount} — ${new Date(tx.date).toLocaleDateString("en-GB")}`); setComboOpen(false); }}
                                  style={{ display: "block", width: "100%", padding: "var(--sp-8) var(--sp-12)", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: "var(--text-sm)", color: "var(--clr-primary)", borderBottom: "1px solid var(--clr-divider)" }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--clr-surface-hover)"; }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                                >
                                  <div style={{ fontWeight: "var(--fw-medium)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {tx.supplier_name || tx.description || "Transaction"}
                                  </div>
                                  <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginTop: 1 }}>
                                    £{tx.amount} · {new Date(tx.date).toLocaleDateString("en-GB")}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                          {comboOpen && filteredTransactions.length === 0 && txSearch && (
                            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--clr-surface-card)", border: "1px solid var(--clr-divider)", borderRadius: "var(--r-md)", padding: "var(--sp-12)", fontSize: "var(--text-sm)", color: "var(--clr-muted)", marginTop: 2 }}>
                              No unmatched transactions found.
                            </div>
                          )}
                        </div>
                        {selectedTx && (
                          <div style={{ padding: "var(--sp-8) var(--sp-12)", background: "rgba(53,126,146,0.06)", border: "1px solid rgba(53,126,146,0.2)", borderRadius: "var(--r-md)", fontSize: "var(--text-xs)", color: "var(--clr-primary)", marginBottom: "var(--sp-8)" }}>
                            <strong>{selectedTx.supplier_name || selectedTx.description}</strong> · £{selectedTx.amount}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: "var(--sp-8)" }}>
                          <button type="button" className="btn btn-primary btn-sm" onClick={handleManualMatch} disabled={busy || !manualTxId} style={{ fontSize: "var(--text-sm)" }}>
                            {busy ? "Matching…" : "Confirm match"}
                          </button>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowManual(false); setManualTxId(""); setTxSearch(""); }} style={{ fontSize: "var(--text-sm)" }}>
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </Section>
                )}
              </>
            )}

            {/* Audit trail */}
            <Section label="History">
              {auditLoading ? (
                <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)" }}>Loading…</div>
              ) : !auditLog || auditLog.length === 0 ? (
                <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)" }}>No history yet.</div>
              ) : (
                <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 0 }}>
                  {/* vertical line */}
                  <div style={{ position: "absolute", left: 5, top: 8, bottom: 8, width: 1, background: "var(--clr-divider)" }} />
                  {auditLog.map((entry, i) => (
                    <div key={entry.id} style={{ display: "flex", gap: "var(--sp-12)", alignItems: "flex-start", paddingBottom: i < auditLog.length - 1 ? "var(--sp-12)" : 0 }}>
                      <div style={{
                        width: 11, height: 11, borderRadius: "50%", marginTop: 3, flexShrink: 0, zIndex: 1,
                        border: "2px solid var(--clr-surface-card)",
                        background: entry.severity === "critical" ? "var(--danger)" : entry.severity === "warning" ? "var(--warning)" : "var(--clr-muted)",
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-primary)", fontWeight: "var(--fw-medium)" }}>
                          {formatLabel(entry.action)}
                        </div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginTop: 2 }}>
                          {new Date(entry.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>

          {/* RIGHT PANE — preview */}
          {canPreview && (
            <div style={{ flex: 1, background: "var(--clr-surface)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "var(--sp-10) var(--sp-16)", borderBottom: "1px solid var(--clr-divider)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {doc.original_filename || doc.filename}
                </span>
                {previewUrl && (
                  <a href={previewUrl} download={doc.original_filename || doc.filename}
                    style={{ fontSize: "var(--text-xs)", color: "var(--brand)", textDecoration: "none", fontWeight: "var(--fw-medium)", flexShrink: 0, marginLeft: "var(--sp-12)" }}>
                    Download
                  </a>
                )}
              </div>
              <div style={{ flex: 1, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {previewLoading && (
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>Loading preview…</div>
                )}
                {!previewLoading && previewError && (
                  <div style={{ textAlign: "center", padding: "var(--sp-32)" }}>
                    <div style={{ fontSize: 40, marginBottom: "var(--sp-12)", opacity: 0.25 }}>📄</div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)", marginBottom: "var(--sp-10)" }}>Preview unavailable</div>
                    {previewUrl && (
                      <a href={previewUrl} download={doc.original_filename || doc.filename}
                        style={{ fontSize: "var(--text-sm)", color: "var(--brand)", textDecoration: "none", fontWeight: "var(--fw-medium)" }}>
                        Download file
                      </a>
                    )}
                  </div>
                )}
                {!previewLoading && !previewError && previewUrl && isImage && (
                  <img src={previewUrl} alt={doc.original_filename || "document"} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                )}
                {!previewLoading && !previewError && previewUrl && isPdf && (
                  <iframe src={previewUrl} title={doc.original_filename || "document"} style={{ width: "100%", height: "100%", border: "none" }} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── sub-components ──────────────────────────────────────────────────────────

function FileTypeIcon({ mimeType }: { mimeType?: string | null }) {
  const isPdf = mimeType === "application/pdf";
  const isImage = mimeType?.startsWith("image/");
  const label = isPdf ? "PDF" : isImage ? "IMG" : "DOC";
  const bg = isPdf ? "rgba(239,68,68,0.1)" : isImage ? "rgba(59,130,246,0.1)" : "rgba(107,114,128,0.1)";
  const color = isPdf ? "var(--danger)" : isImage ? "#3b82f6" : "var(--clr-muted)";
  return (
    <div style={{
      width: 40, height: 40, borderRadius: "var(--r-md)", flexShrink: 0,
      background: bg, display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "var(--text-xs)", fontWeight: "var(--fw-semibold)", color, letterSpacing: "0.04em",
    }}>
      {label}
    </div>
  );
}

function Section({ label, children, action }: { label: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--clr-surface)", borderRadius: "var(--r-lg)",
      border: "1px solid var(--clr-divider)", padding: "var(--sp-14) var(--sp-16)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-10)" }}>
        <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--fw-semibold)", color: "var(--clr-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function MetaRow({
  label, value, children,
}: {
  label: string; value?: string; children?: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "var(--sp-5) 0",
    }}>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", flexShrink: 0 }}>{label}</div>
      {children ?? <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-primary)", fontWeight: "var(--fw-medium)", textAlign: "right" }}>{value ?? "—"}</div>}
    </div>
  );
}

function OcrField({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", display: "block", marginBottom: 4, fontWeight: "var(--fw-medium)" }}>
        {label}
      </label>
      <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: "var(--sp-8) var(--sp-10)", borderRadius: "var(--r-md)", border: "1px solid var(--clr-divider)", background: "var(--clr-surface-card)", color: "var(--clr-primary)", fontSize: "var(--text-sm)", boxSizing: "border-box" }}
      />
    </div>
  );
}

function SuggestedMatchCard({ match, rank, onConfirm, busy }: { match: SuggestedMatch; rank: number; onConfirm: () => void; busy: boolean }) {
  const scorePercent = Math.round(match.score * 100);
  const scoreClass = scorePercent >= 85 ? "pill pill-success" : scorePercent >= 60 ? "pill pill-warning" : "pill pill-danger";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "var(--sp-10)",
      padding: "var(--sp-10) var(--sp-12)",
      background: "var(--clr-surface-card)", borderRadius: "var(--r-md)", border: "1px solid var(--clr-divider)",
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        background: rank === 1 ? "rgba(53,126,146,0.12)" : "var(--clr-surface)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "var(--text-xs)", fontWeight: "var(--fw-semibold)", color: rank === 1 ? "var(--brand)" : "var(--clr-muted)", flexShrink: 0,
      }}>
        {rank}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--fw-medium)", color: "var(--clr-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {match.supplier || "Transaction"}
        </div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginTop: 1 }}>
          {match.amount ? new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(match.amount)) : ""}
          {match.date ? ` · ${new Date(match.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}
        </div>
      </div>
      <span className={scoreClass} style={{ fontSize: "var(--text-xs)", flexShrink: 0 }}>{scorePercent}%</span>
      <button type="button" className="btn btn-primary btn-sm" onClick={onConfirm} disabled={busy} style={{ fontSize: "var(--text-xs)", flexShrink: 0 }}>
        {busy ? "…" : "Accept"}
      </button>
    </div>
  );
}
