"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { portalApi } from "@/lib/api/portal-api";
import type { PortalResolveResponse } from "@/types/portal";
import type { TransactionListResponse, Transaction } from "@/types/transactions";

type UploadingState = {
  [transactionId: string]: {
    filename: string;
    progress: "uploading" | "done" | "error";
    error?: string;
  };
};

export function PortalPageView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("magic_link");

  const [resolving, setResolving] = useState(true);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [session, setSession] = useState<PortalResolveResponse | null>(null);
  const [missing, setMissing] = useState<TransactionListResponse | null>(null);
  const [uploading, setUploading] = useState<UploadingState>({});
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  // Resolve the token on mount
  useEffect(() => {
    if (!token) {
      setResolveError("No magic link provided.");
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
        if (list) setMissing(list);
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

  async function refreshMissing() {
    if (!session || !token) return;
    try {
      const list = await portalApi.missingDocs(session.client_id, token);
      setMissing(list);
    } catch {
      /* keep existing view */
    }
  }

  async function handleFileSelected(
    transactionId: string,
    file: File,
  ) {
    if (!session || !token) return;

    // Reject files larger than 20MB
    if (file.size > 20 * 1024 * 1024) {
      setUploading((prev) => ({
        ...prev,
        [transactionId]: {
          filename: file.name,
          progress: "error",
          error: "File too large (max 20MB)",
        },
      }));
      return;
    }

    setUploading((prev) => ({
      ...prev,
      [transactionId]: { filename: file.name, progress: "uploading" },
    }));

    try {
      // Single-shot multipart upload — the backend stores the file locally
      // and creates the Document record in one call.
      await portalApi.directUpload(
        session.client_id,
        token,
        file,
        transactionId,
      );

      setUploading((prev) => ({
        ...prev,
        [transactionId]: { filename: file.name, progress: "done" },
      }));

      // Refresh the missing docs list so the uploaded row disappears
      await refreshMissing();
    } catch (err) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      const msg =
        detail ||
        (err as { message?: string })?.message ||
        "Upload failed. Please try again.";
      setUploading((prev) => ({
        ...prev,
        [transactionId]: {
          filename: file.name,
          progress: "error",
          error: msg,
        },
      }));
    }
  }

  async function handleCantProvide(transactionId: string) {
    if (!session || !token) return;
    const confirmed = window.confirm(
      "Mark this document as 'cannot provide'? Your accountant will be notified.",
    );
    if (!confirmed) return;
    try {
      await portalApi.cantProvide(session.client_id, transactionId, token);
      await refreshMissing();
    } catch {
      alert("Failed to update. Please try again.");
    }
  }

  // Loading state
  if (resolving) {
    return (
      <PortalShell>
        <div style={centerText}>
          <div style={{ fontSize: 16, color: "#6b7280" }}>
            Loading your upload portal…
          </div>
        </div>
      </PortalShell>
    );
  }

  // Error state (invalid/expired token)
  if (resolveError || !session) {
    return (
      <PortalShell>
        <div style={centerCard}>
          <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 8, color: "#111827" }}>
            Link expired or invalid
          </div>
          <div style={{ fontSize: 15, color: "#6b7280", marginBottom: 24 }}>
            {resolveError ||
              "This upload link is no longer valid. Please request a new one from your accountant."}
          </div>
          <button
            type="button"
            onClick={() => router.push("/login")}
            style={primaryBtn}
          >
            Go to Sign In
          </button>
        </div>
      </PortalShell>
    );
  }

  const grouped = missing ? Object.entries(missing.grouped_by_supplier) : [];

  return (
    <PortalShell>
      {/* Header */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          padding: "16px 24px",
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            {session.organization_name || "Document Portal"}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: "#111827",
              marginTop: 2,
            }}
          >
            Hello, {session.client_name}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px" }}>
        {!missing || missing.total_missing === 0 ? (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 48,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "#111827",
                marginBottom: 6,
              }}
            >
              All caught up!
            </div>
            <div style={{ color: "#6b7280", fontSize: 14 }}>
              There are no documents outstanding. Thank you.
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                fontSize: 16,
                color: "#111827",
                marginBottom: 16,
                fontWeight: 500,
              }}
            >
              Please upload the following {missing.total_missing} document
              {missing.total_missing !== 1 ? "s" : ""}:
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {grouped.map(([supplier, txns]) => (
                <div
                  key={supplier}
                  style={{
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedSupplier(
                        expandedSupplier === supplier ? null : supplier,
                      )
                    }
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 16px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: 15,
                      fontWeight: 500,
                      color: "#111827",
                    }}
                  >
                    <span>{supplier}</span>
                    <span style={{ color: "#6b7280", fontSize: 13 }}>
                      {(txns as unknown as Transaction[]).length} item
                      {(txns as unknown as Transaction[]).length !== 1 ? "s" : ""}{" "}
                      {expandedSupplier === supplier ? "▲" : "▼"}
                    </span>
                  </button>

                  {expandedSupplier === supplier && (
                    <div
                      style={{
                        borderTop: "1px solid #e5e7eb",
                        padding: "8px 0",
                      }}
                    >
                      {(txns as unknown as Transaction[]).map((tx) => {
                        const uploadState = uploading[tx.id];
                        return (
                          <div
                            key={tx.id}
                            style={{
                              padding: "12px 16px",
                              borderBottom: "1px solid #f3f4f6",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 12,
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: 14,
                                    color: "#111827",
                                    fontWeight: 500,
                                  }}
                                >
                                  {tx.description ||
                                    tx.supplier_name ||
                                    "Transaction"}
                                </div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "#6b7280",
                                    marginTop: 2,
                                  }}
                                >
                                  {new Date(tx.date).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </div>
                              </div>
                              <div
                                style={{
                                  fontSize: 15,
                                  fontWeight: 600,
                                  color: "#111827",
                                  flexShrink: 0,
                                }}
                              >
                                {tx.amount}
                              </div>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                marginTop: 10,
                                alignItems: "center",
                              }}
                            >
                              <input
                                ref={(el) => {
                                  fileInputs.current[tx.id] = el;
                                }}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.heic"
                                style={{ display: "none" }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileSelected(tx.id, file);
                                  if (e.target) e.target.value = "";
                                }}
                              />
                              <button
                                type="button"
                                disabled={uploadState?.progress === "uploading"}
                                onClick={() =>
                                  fileInputs.current[tx.id]?.click()
                                }
                                style={{
                                  ...primaryBtn,
                                  fontSize: 13,
                                  padding: "6px 14px",
                                }}
                              >
                                {uploadState?.progress === "uploading" &&
                                  "Uploading…"}
                                {uploadState?.progress === "done" && "Uploaded ✓"}
                                {(!uploadState ||
                                  uploadState.progress === "error" ||
                                  (uploadState?.progress !== "uploading" &&
                                    uploadState?.progress !== "done")) &&
                                  "Upload receipt"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCantProvide(tx.id)}
                                style={{
                                  background: "none",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: 6,
                                  padding: "6px 12px",
                                  fontSize: 13,
                                  color: "#6b7280",
                                  cursor: "pointer",
                                }}
                              >
                                Can&apos;t provide
                              </button>
                              {uploadState?.progress === "error" &&
                                uploadState.error && (
                                  <span
                                    style={{
                                      fontSize: 12,
                                      color: "#dc2626",
                                      marginLeft: 6,
                                    }}
                                  >
                                    {uploadState.error}
                                  </span>
                                )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </PortalShell>
  );
}

// ---- Styling helpers ----

function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {children}
    </div>
  );
}

const centerText: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
};

const centerCard: React.CSSProperties = {
  maxWidth: 440,
  margin: "10vh auto",
  background: "#fff",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  padding: 32,
  textAlign: "center",
};

const primaryBtn: React.CSSProperties = {
  background: "#111827",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "10px 20px",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
};
