"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { portalApi } from "@/lib/api/portal-api";
import type { PortalResolveResponse } from "@/types/portal";
import type { TransactionListResponse, Transaction } from "@/types/transactions";

// ── types ──────────────────────────────────────────────────────────────────

type UploadStatus = "idle" | "uploading" | "processing" | "done" | "error";

type OcrPreview = {
  extracted_amount?: string | null;
  extracted_date?: string | null;
  extracted_supplier?: string | null;
};

type UploadState = {
  filename: string;
  status: UploadStatus;
  progress: number; // 0–100 real
  error?: string;
  ocr?: OcrPreview; // set after OCR polling completes
};

type UploadMap = Record<string, UploadState>;

// ── helpers ────────────────────────────────────────────────────────────────

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB

function formatAmount(raw: string | number | null | undefined): string {
  if (raw == null) return "";
  const n = typeof raw === "number" ? raw : parseFloat(String(raw));
  if (isNaN(n)) return String(raw);
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

// ── sub-components ─────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  return (
    <div style={{ height: 4, background: "#e5e7eb", borderRadius: 99, overflow: "hidden", marginTop: 8 }}>
      <div
        style={{
          height: "100%",
          width: `${value}%`,
          background: "#2563eb",
          borderRadius: 99,
          transition: "width 0.2s ease",
        }}
      />
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

// ── main component ─────────────────────────────────────────────────────────

export function PortalPageView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("magic_link");

  const [resolving, setResolving] = useState(true);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [session, setSession] = useState<PortalResolveResponse | null>(null);
  const [missing, setMissing] = useState<TransactionListResponse | null>(null);
  const [uploads, setUploads] = useState<UploadMap>({});
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null);
  const [confirmTxId, setConfirmTxId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const cameraInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Resolve token on mount
  useEffect(() => {
    if (!token) {
      setResolveError("No upload link provided.");
      setResolving(false);
      return;
    }

    portalApi
      .resolve(token)
      .then((res) => {
        setSession(res);
        setResolving(false);
        return portalApi.missingDocs(res.client_id, token);
      })
      .then((list) => {
        if (list) {
          setMissing(list);
          // Auto-expand the first supplier group
          const firstSupplier = Object.keys(list.grouped_by_supplier ?? {})[0];
          if (firstSupplier) setExpandedSupplier(firstSupplier);
        }
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.detail ||
          err?.message ||
          "This link has expired or is invalid.";
        setResolveError(msg);
        setResolving(false);
      });
  }, [token]);

  const refreshMissing = useCallback(async () => {
    if (!session || !token) return;
    try {
      const list = await portalApi.missingDocs(session.client_id, token);
      setMissing(list);
    } catch {
      // keep existing view
    }
  }, [session, token]);

  async function handleFileSelected(txId: string, file: File) {
    if (!session || !token) return;

    if (file.size > MAX_FILE_BYTES) {
      setUploads((prev) => ({
        ...prev,
        [txId]: { filename: file.name, status: "error", progress: 0, error: "File too large (max 20 MB)" },
      }));
      return;
    }

    setUploads((prev) => ({
      ...prev,
      [txId]: { filename: file.name, status: "uploading", progress: 0 },
    }));

    try {
      const doc = await portalApi.directUpload(
        session.client_id,
        token,
        file,
        txId,
        (percent) => {
          setUploads((prev) => ({
            ...prev,
            [txId]: { ...prev[txId], progress: percent },
          }));
        },
      );

      // Upload done — now poll for OCR result (non-blocking)
      setUploads((prev) => ({
        ...prev,
        [txId]: { filename: file.name, status: "processing", progress: 95 },
      }));

      // Poll in background; don't block the UI
      portalApi.pollDocumentOcr(doc.id, token).then((result) => {
        const ocr: OcrPreview | undefined =
          result?.ocr_status === "completed"
            ? {
                extracted_amount: result.extracted_amount != null ? String(result.extracted_amount) : null,
                extracted_date: result.extracted_date ?? null,
                extracted_supplier: result.extracted_supplier ?? null,
              }
            : undefined;

        setUploads((prev) => ({
          ...prev,
          [txId]: { filename: file.name, status: "done", progress: 100, ocr },
        }));
      });

      await refreshMissing();
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      const msg = detail || (err as { message?: string })?.message || "Upload failed. Please try again.";
      setUploads((prev) => ({
        ...prev,
        [txId]: { filename: file.name, status: "error", progress: 0, error: msg },
      }));
    }
  }

  async function confirmCantProvide() {
    if (!session || !token || !confirmTxId) return;
    setConfirming(true);
    try {
      await portalApi.cantProvide(session.client_id, confirmTxId, token);
      setConfirmTxId(null);
      await refreshMissing();
    } catch {
      setConfirmTxId(null);
    } finally {
      setConfirming(false);
    }
  }

  const doneCount = Object.values(uploads).filter((u) => u.status === "done" || u.status === "processing").length;
  const totalMissing = missing?.total_missing ?? 0;
  const remaining = Math.max(0, totalMissing - doneCount);

  // ── loading ──────────────────────────────────────────────────────────────

  if (resolving) {
    return (
      <PortalShell>
        <div style={centerFlex}>
          <div style={{ textAlign: "center" }}>
            <div style={spinner} />
            <div style={{ fontSize: 15, color: "#6b7280", marginTop: 16 }}>Loading your upload portal…</div>
          </div>
        </div>
      </PortalShell>
    );
  }

  // ── error / expired ───────────────────────────────────────────────────────

  if (resolveError || !session) {
    return (
      <PortalShell>
        <div style={{ ...centerFlex, padding: "0 16px" }}>
          <div style={errorCard}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⛔</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
              Link expired or invalid
            </div>
            <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, marginBottom: 24 }}>
              {resolveError || "This upload link is no longer valid. Please request a new one from your accountant."}
            </div>
            <button type="button" onClick={() => router.push("/login")} style={primaryBtn}>
              Go to Sign In
            </button>
          </div>
        </div>
      </PortalShell>
    );
  }

  const grouped = missing ? Object.entries(missing.grouped_by_supplier) : [];

  return (
    <PortalShell>
      {/* Confirm "can't provide" dialog */}
      {confirmTxId && (
        <div
          style={overlayStyle}
          onClick={() => { if (!confirming) setConfirmTxId(null); }}
        >
          <div style={dialogCard} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, color: "#111827", marginBottom: 8 }}>
              Can&apos;t provide this document?
            </div>
            <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>
              Your accountant will be notified. You can still upload it later if you find it.
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <button
                type="button"
                disabled={confirming}
                onClick={() => setConfirmTxId(null)}
                style={ghostBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirming}
                onClick={confirmCantProvide}
                style={{ ...primaryBtn, background: "#d97706", opacity: confirming ? 0.7 : 1 }}
              >
                {confirming ? "Confirming…" : "Yes, can't provide"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky header */}
      <div style={headerStyle}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 16px" }}>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>
            {session.organization_name || "Document Portal"}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
              Hello, {session.client_name}
            </div>
            {remaining > 0 && (
              <div style={{ fontSize: 13, fontWeight: 600, color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 99, padding: "3px 12px", whiteSpace: "nowrap" }}>
                {remaining} remaining
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 100px" }}>

        {/* All done */}
        {(!missing || totalMissing === 0) ? (
          <div style={allDoneCard}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 6 }}>
              All caught up!
            </div>
            <div style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6 }}>
              There are no documents outstanding. Thank you for keeping your records up to date.
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 14, color: "#374151", marginBottom: 16, fontWeight: 500 }}>
              Please upload the following {totalMissing} document{totalMissing !== 1 ? "s" : ""}:
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {grouped.map(([supplier, txns]) => {
                const isOpen = expandedSupplier === supplier;
                const txList = txns as unknown as Transaction[];
                const groupDone = txList.filter((tx) => uploads[tx.id]?.status === "done" || uploads[tx.id]?.status === "processing").length;

                return (
                  <div key={supplier} style={groupCard}>
                    {/* Group header */}
                    <button
                      type="button"
                      onClick={() => setExpandedSupplier(isOpen ? null : supplier)}
                      style={groupHeaderBtn}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, textAlign: "left" }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{supplier}</span>
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>
                          {txList.length} item{txList.length !== 1 ? "s" : ""}
                          {groupDone > 0 ? ` · ${groupDone} uploaded` : ""}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {groupDone === txList.length && txList.length > 0 && (
                          <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>✓ Done</span>
                        )}
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#9ca3af"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </button>

                    {/* Transaction rows */}
                    {isOpen && (
                      <div style={{ borderTop: "1px solid #f3f4f6" }}>
                        {txList.map((tx) => {
                          const up = uploads[tx.id];
                          const isDone = up?.status === "done";
                          const isUploading = up?.status === "uploading";
                          const isProcessing = up?.status === "processing";
                          const isError = up?.status === "error";

                          return (
                            <div
                              key={tx.id}
                              style={{
                                padding: "16px",
                                borderBottom: "1px solid #f9fafb",
                                background: isDone ? "#f0fdf4" : isProcessing ? "#eff6ff" : "transparent",
                                transition: "background 0.3s",
                              }}
                            >
                              {/* Transaction info */}
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 14, fontWeight: 500, color: "#111827", lineHeight: 1.4 }}>
                                    {tx.description || tx.supplier_name || "Transaction"}
                                  </div>
                                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>
                                    {new Date(tx.date).toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </div>
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", flexShrink: 0 }}>
                                  {formatAmount(tx.amount)}
                                </div>
                              </div>

                              {/* Upload / processing progress bar */}
                              {(isUploading || isProcessing) && <ProgressBar value={up.progress} />}

                              {/* Filename when uploading/processing/done */}
                              {(isUploading || isProcessing || isDone || isError) && up.filename && (
                                <div style={{ fontSize: 12, color: isDone ? "#16a34a" : isError ? "#dc2626" : "#6b7280", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                                  {isDone && <CheckIcon />}
                                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {isDone
                                      ? `Uploaded: ${up.filename}`
                                      : isProcessing
                                        ? `Processing ${up.filename}…`
                                        : isUploading
                                          ? `Uploading ${up.filename}…`
                                          : up.filename}
                                  </span>
                                </div>
                              )}

                              {/* Error message */}
                              {isError && up.error && (
                                <div style={{ fontSize: 12, color: "#dc2626", marginTop: 4 }}>{up.error}</div>
                              )}

                              {/* Hidden file inputs */}
                              <input
                                ref={(el) => { fileInputRefs.current[tx.id] = el; }}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.heic,.heif"
                                style={{ display: "none" }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileSelected(tx.id, file);
                                  if (e.target) e.target.value = "";
                                }}
                              />
                              {/* Camera input — only appears on mobile, captures directly from camera */}
                              <input
                                ref={(el) => { cameraInputRefs.current[tx.id] = el; }}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                style={{ display: "none" }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileSelected(tx.id, file);
                                  if (e.target) e.target.value = "";
                                }}
                              />

                              {/* Action buttons */}
                              {!isDone && !isProcessing && (
                                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                                  {/* Primary: upload file */}
                                  <button
                                    type="button"
                                    disabled={isUploading}
                                    onClick={() => fileInputRefs.current[tx.id]?.click()}
                                    style={{
                                      ...uploadBtn,
                                      flex: 1,
                                      opacity: isUploading ? 0.7 : 1,
                                      cursor: isUploading ? "not-allowed" : "pointer",
                                    }}
                                  >
                                    <UploadIcon />
                                    <span>
                                      {isUploading ? "Uploading…" : isError ? "Try again" : "Upload file"}
                                    </span>
                                  </button>

                                  {/* Camera shortcut — visible on all devices, especially useful on mobile */}
                                  <button
                                    type="button"
                                    disabled={isUploading}
                                    onClick={() => cameraInputRefs.current[tx.id]?.click()}
                                    title="Take a photo with your camera"
                                    style={{
                                      ...cameraBtn,
                                      opacity: isUploading ? 0.7 : 1,
                                      cursor: isUploading ? "not-allowed" : "pointer",
                                    }}
                                  >
                                    <CameraIcon />
                                  </button>

                                  {/* Can't provide */}
                                  <button
                                    type="button"
                                    disabled={isUploading}
                                    onClick={() => setConfirmTxId(tx.id)}
                                    style={cantProvideBtn}
                                  >
                                    Can&apos;t provide
                                  </button>
                                </div>
                              )}

                              {/* Done state + OCR preview */}
                              {isDone && (
                                <div style={{ marginTop: 10 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#16a34a", fontSize: 13, fontWeight: 600 }}>
                                    <CheckIcon />
                                    Document received — thank you!
                                  </div>
                                  {up?.ocr && (up.ocr.extracted_amount || up.ocr.extracted_supplier || up.ocr.extracted_date) && (
                                    <div
                                      style={{
                                        marginTop: 8,
                                        padding: "10px 12px",
                                        background: "#f0fdf4",
                                        border: "1px solid #bbf7d0",
                                        borderRadius: 8,
                                        fontSize: 12,
                                        color: "#15803d",
                                        lineHeight: 1.6,
                                      }}
                                    >
                                      <div style={{ fontWeight: 600, marginBottom: 4 }}>We extracted:</div>
                                      {up.ocr.extracted_supplier && <div>Supplier: <strong>{up.ocr.extracted_supplier}</strong></div>}
                                      {up.ocr.extracted_amount && (
                                        <div>
                                          Amount: <strong>
                                            {new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(up.ocr.extracted_amount))}
                                          </strong>
                                        </div>
                                      )}
                                      {up.ocr.extracted_date && <div>Date: <strong>{up.ocr.extracted_date}</strong></div>}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Sticky footer progress bar */}
      {totalMissing > 0 && (
        <div style={stickyFooter}>
          <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
                {doneCount} of {totalMissing} uploaded
              </span>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>
                {Math.round((doneCount / totalMissing) * 100)}%
              </span>
            </div>
            <div style={{ height: 6, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${(doneCount / totalMissing) * 100}%`,
                  background: doneCount === totalMissing ? "#16a34a" : "#2563eb",
                  borderRadius: 99,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </PortalShell>
  );
}

// ── layout wrappers ────────────────────────────────────────────────────────

function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#f9fafb",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      WebkitFontSmoothing: "antialiased",
    }}>
      {children}
    </div>
  );
}

// ── style constants ────────────────────────────────────────────────────────

const centerFlex: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
};

const errorCard: React.CSSProperties = {
  maxWidth: 420,
  background: "#fff",
  borderRadius: 16,
  border: "1px solid #e5e7eb",
  padding: "36px 32px",
  textAlign: "center",
  boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
};

const headerStyle: React.CSSProperties = {
  background: "#fff",
  borderBottom: "1px solid #e5e7eb",
  padding: "16px 0",
  position: "sticky",
  top: 0,
  zIndex: 10,
};

const allDoneCard: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: "56px 24px",
  textAlign: "center",
};

const groupCard: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  overflow: "hidden",
};

const groupHeaderBtn: React.CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px",
  background: "none",
  border: "none",
  cursor: "pointer",
  textAlign: "left",
  minHeight: 64,
  WebkitTapHighlightColor: "transparent",
};

const uploadBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  background: "#111827",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "12px 16px",
  fontSize: 14,
  fontWeight: 600,
  minHeight: 48,
  WebkitTapHighlightColor: "transparent",
};

const cameraBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f3f4f6",
  color: "#374151",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "12px 14px",
  fontSize: 14,
  minHeight: 48,
  minWidth: 48,
  WebkitTapHighlightColor: "transparent",
};

const cantProvideBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "none",
  color: "#6b7280",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "12px 14px",
  fontSize: 13,
  minHeight: 48,
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
};

const primaryBtn: React.CSSProperties = {
  background: "#111827",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "12px 24px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  minHeight: 48,
  WebkitTapHighlightColor: "transparent",
};

const ghostBtn: React.CSSProperties = {
  background: "none",
  color: "#374151",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "10px 18px",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  minHeight: 48,
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  zIndex: 9999,
  padding: "0 0 env(safe-area-inset-bottom, 0)",
};

const dialogCard: React.CSSProperties = {
  background: "#fff",
  borderRadius: "20px 20px 0 0",
  padding: "28px 24px 32px",
  width: "100%",
  maxWidth: 480,
  boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
};

const stickyFooter: React.CSSProperties = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  background: "#fff",
  borderTop: "1px solid #e5e7eb",
  padding: "12px 0 calc(12px + env(safe-area-inset-bottom, 0))",
  zIndex: 10,
};

const spinner: React.CSSProperties = {
  width: 36,
  height: 36,
  border: "3px solid #e5e7eb",
  borderTop: "3px solid #2563eb",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
  margin: "0 auto",
};
