"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { importsApi } from "@/lib/api/imports-api";
import type { ImportSessionResponse, ImportPreviewResponse } from "@/types/imports";

type Props = {
  session: ImportSessionResponse;
  preview: ImportPreviewResponse;
  onComplete: (result: ImportSessionResponse) => void;
  onBack?: () => void;
};

export function ImportConfirmStep({ session, preview, onComplete, onBack }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ImportSessionResponse | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollStatus = useCallback(async () => {
    try {
      const result = await importsApi.getStatus(session.id);
      setStatus(result);
      if (result.status === "completed" || result.status === "failed") {
        if (timerRef.current) clearInterval(timerRef.current);
        setPolling(false);
        if (result.status === "completed") {
          onComplete(result);
        } else {
          setError("Import failed. Check the import history for details.");
        }
      }
    } catch {
      // Keep polling on transient errors
    }
  }, [session.id, onComplete]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function handleConfirm() {
    setConfirming(true);
    setError(null);
    try {
      const result = await importsApi.confirm(session.id);
      if (result.status === "completed") {
        onComplete(result);
        return;
      }
      // Start polling
      setPolling(true);
      setStatus(result);
      timerRef.current = setInterval(pollStatus, 2000);
    } catch {
      setError("Failed to confirm import.");
    } finally {
      setConfirming(false);
    }
  }

  if (polling && status) {
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
          border: "3px solid var(--clr-divider)",
          borderTopColor: "var(--brand)",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto var(--sp-16)",
        }} />
        <div style={{ fontSize: "var(--text-md)", fontWeight: "var(--fw-medium)", color: "var(--clr-primary)" }}>
          Processing import...
        </div>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)", marginTop: "var(--sp-4)" }}>
          {status.records_created} records created so far
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-20)" }}>
      {/* Confirmation summary */}
      <div style={{
        background: "var(--clr-surface-card)",
        borderRadius: "var(--r-lg)",
        border: "1px solid var(--clr-divider)",
        padding: "var(--sp-24)",
      }}>
        <h3 style={{ fontSize: "var(--text-md)", fontWeight: "var(--fw-bold)", color: "var(--clr-primary)", marginBottom: "var(--sp-16)" }}>
          Ready to Import
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-12)" }}>
          <InfoRow label="File" value={session.filename || "Uploaded CSV"} />
          <InfoRow label="Platform" value={session.platform} />
          <InfoRow label="Data Type" value={session.data_type} />
          <InfoRow label="Total Rows" value={String(preview.total_rows)} />
          <InfoRow label="Valid" value={String(preview.valid_rows)} valueColor="var(--success)" />
          {preview.error_rows > 0 && (
            <InfoRow label="Will be skipped" value={String(preview.error_rows)} valueColor="var(--danger)" />
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: "var(--sp-12) var(--sp-16)", background: "rgba(239,68,68,0.08)", borderRadius: "var(--r-md)", color: "var(--danger)", fontSize: "var(--text-sm)" }}>
          {error}
        </div>
      )}

      {/* Footer actions — Back (optional) + Confirm */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--sp-8)" }}>
        {onBack ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onBack}
            disabled={confirming}
            style={{ fontSize: "var(--text-sm)" }}
          >
            ← Back
          </button>
        ) : <span />}
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleConfirm}
          disabled={confirming}
          style={{ fontSize: "var(--text-sm)", padding: "var(--sp-8) var(--sp-24)" }}
        >
          {confirming ? "Confirming..." : `Import ${preview.valid_rows} Records`}
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "var(--sp-6) 0" }}>
      <span style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)" }}>{label}</span>
      <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--fw-medium)", color: valueColor ?? "var(--clr-primary)", textTransform: "capitalize" }}>{value}</span>
    </div>
  );
}
