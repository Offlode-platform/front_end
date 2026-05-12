"use client";

import { useCallback, useRef, useState } from "react";
import { importsApi } from "@/lib/api/imports-api";
import type { FieldDetectionResponse, ImportDataType } from "@/types/imports";
import type { CsvPlatform } from "../imports-page-view";

const PLATFORM_LABELS: Record<CsvPlatform, string> = {
  xero: "Xero",
  quickbooks: "QuickBooks",
  sage: "Sage",
  generic: "Custom / Generic",
};

type Props = {
  // Controlled by the parent so the dataType the user picked survives
  // round-trips through the wizard (back/forward navigation).
  dataType: ImportDataType;
  csvPlatform: CsvPlatform;
  onDataTypeChange: (dt: ImportDataType) => void;
  onComplete: (result: FieldDetectionResponse, dataType: ImportDataType) => void;
};

export function ImportUploadStep({ dataType, csvPlatform, onDataTypeChange, onComplete }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Only CSV files are supported.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("File size must be under 20MB.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const result = await importsApi.upload(file, dataType);
      onComplete(result, dataType);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed. Please try again.";
      setError(message);
    } finally {
      setUploading(false);
    }
  }, [dataType, onComplete]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <>
      {/* Data type selector */}
      <div className="ws-card">
        <div className="ws-card-title">What are you importing?</div>
        <div className="ws-issue-filters" style={{ marginBottom: 0, borderBottom: "none", paddingBottom: 0 }}>
          {(["invoices", "contacts", "payments"] as const).map((dt) => (
            <button
              key={dt}
              type="button"
              className={`ws-issue-filter${dataType === dt ? " active" : ""}`}
              onClick={() => onDataTypeChange(dt)}
            >
              {dt.charAt(0).toUpperCase() + dt.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <div
        className="ws-card"
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          borderStyle: "dashed",
          borderWidth: 2,
          borderColor: dragging ? "var(--brand)" : "var(--clr-divider-strong)",
          background: dragging ? "rgba(53,126,146,0.04)" : undefined,
          padding: "var(--sp-48) var(--sp-24)",
          textAlign: "center",
          cursor: uploading ? "wait" : "pointer",
          transition: "border-color var(--dur-sm) var(--ease), background var(--dur-sm) var(--ease)",
          boxShadow: "none",
        }}
      >
        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} style={{ display: "none" }} />

        {uploading ? (
          <>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "3px solid var(--clr-divider-strong)",
              borderTopColor: "var(--brand)",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto var(--sp-16)",
            }} />
            <div style={{ fontSize: "var(--text-base)", fontWeight: "var(--fw-medium)", color: "var(--clr-primary)" }}>
              Uploading and analysing…
            </div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)", marginTop: "var(--sp-4)" }}>
              Detecting columns and source platform
            </div>
          </>
        ) : (
          <>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--clr-surface-subtle)",
              border: "1px solid var(--clr-divider-strong)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto var(--sp-16)",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--clr-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div style={{ fontSize: "var(--text-base)", fontWeight: "var(--fw-medium)", color: "var(--clr-primary)", marginBottom: "var(--sp-4)" }}>
              {dragging ? "Drop your CSV file here" : "Drag and drop your CSV file here"}
            </div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>
              or click to browse
              {csvPlatform !== "generic"
                ? <> — <span style={{ color: "var(--success)" }}>{PLATFORM_LABELS[csvPlatform]} columns will be auto-mapped</span></>
                : " — columns will be mapped manually in the next step"
              }
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="ws-card" style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.15)", color: "var(--danger)", fontSize: "var(--text-sm)", padding: "var(--sp-12) var(--sp-16)" }}>
          {error}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
