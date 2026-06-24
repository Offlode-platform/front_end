"use client";

import { useEffect, useState } from "react";
import { portalApi } from "@/lib/api/portal-api";
import type { PortalUploadedDoc } from "@/types/portal";
import { usePortalContext } from "./portal-layout-chrome";

function fmtSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    completed: { bg: "#dcfce7", fg: "#15803d", label: "Processed" },
    processing: { bg: "#dbeafe", fg: "#1d4ed8", label: "Processing" },
    pending: { bg: "#fef9c3", fg: "#a16207", label: "Pending" },
    failed: { bg: "#fee2e2", fg: "#b91c1c", label: "Failed" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span style={{ background: s.bg, color: s.fg, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99 }}>
      {s.label}
    </span>
  );
}

export function PortalFilesView() {
  const { token, profile } = usePortalContext();
  const orgName = profile?.organization_name;

  const [docs, setDocs] = useState<PortalUploadedDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    portalApi.listUploaded(token)
      .then((res) => setDocs(res.documents))
      .catch(() => setError("Could not load your files. Please try again."));
  }, [token]);

  return (
    <>
      <h1 style={h1}>My files</h1>
      <p style={sub}>Documents you&apos;ve uploaded to {orgName || "your accountant"}.</p>

      {error && <div style={errorBox}>{error}</div>}

      {docs === null && !error ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ ...card, height: 64 }}>
              <div style={skeletonLine} />
              <div style={{ ...skeletonLine, width: "40%", marginTop: 8 }} />
            </div>
          ))}
        </div>
      ) : docs && docs.length === 0 ? (
        <div style={card}>
          <div style={{ textAlign: "center", padding: "32px 16px", color: "#64748b" }}>
            You haven&apos;t uploaded any documents yet.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {docs?.map((d) => (
            <div key={d.id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {d.filename}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
                    {fmtDate(d.uploaded_at)}{d.file_size ? ` · ${fmtSize(d.file_size)}` : ""}
                  </div>
                  {(d.extracted_supplier || d.extracted_amount) && (
                    <div style={{ fontSize: 12, color: "#15803d", marginTop: 6 }}>
                      {d.extracted_supplier ? `${d.extracted_supplier}` : ""}
                      {d.extracted_amount ? ` · £${d.extracted_amount}` : ""}
                    </div>
                  )}
                </div>
                <StatusPill status={d.ocr_status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

const h1: React.CSSProperties = { fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" };
const sub: React.CSSProperties = { fontSize: 14, color: "#64748b", margin: "0 0 20px" };
const card: React.CSSProperties = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px" };
const skeletonLine: React.CSSProperties = { height: 12, borderRadius: 6, background: "#e2e8f0", width: "70%" };
const errorBox: React.CSSProperties = { background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 };
