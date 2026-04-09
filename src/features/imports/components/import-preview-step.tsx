"use client";

import { useEffect, useState } from "react";
import { importsApi } from "@/lib/api/imports-api";
import type { ImportSessionResponse, ImportPreviewResponse } from "@/types/imports";

type Props = {
  session: ImportSessionResponse;
  onPreviewReady: (result: ImportPreviewResponse) => void;
};

export function ImportPreviewStep({ session, onPreviewReady }: Props) {
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    importsApi.validate(session.id).then(
      (result) => {
        if (!cancelled) {
          setPreview(result);
          setLoading(false);
        }
      },
      () => {
        // Try getting existing preview
        importsApi.preview(session.id).then(
          (result) => {
            if (!cancelled) { setPreview(result); setLoading(false); }
          },
          () => {
            if (!cancelled) { setError("Validation failed. Please try again."); setLoading(false); }
          },
        );
      },
    );

    return () => { cancelled = true; };
  }, [session.id]);

  if (loading) {
    return (
      <div style={{
        background: "var(--clr-surface-card)",
        borderRadius: "var(--r-lg)",
        border: "1px solid var(--clr-divider)",
        padding: "var(--sp-40)",
        textAlign: "center",
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "3px solid var(--clr-divider)",
          borderTopColor: "var(--brand)",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto var(--sp-16)",
        }} />
        <div style={{ fontSize: "var(--text-md)", fontWeight: "var(--fw-medium)", color: "var(--clr-primary)" }}>
          Validating your data...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "var(--sp-16)", background: "rgba(239,68,68,0.08)", borderRadius: "var(--r-md)", color: "var(--danger)", fontSize: "var(--text-sm)" }}>
        {error}
      </div>
    );
  }

  if (!preview) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-20)" }}>
      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--sp-12)" }}>
        <SummaryCard value={preview.total_rows} label="Total rows" />
        <SummaryCard value={preview.valid_rows} label="Valid" color="var(--success)" />
        <SummaryCard value={preview.warning_rows} label="Warnings" color="var(--warning)" />
        <SummaryCard value={preview.error_rows} label="Errors" color="var(--danger)" />
      </div>

      {/* Errors list */}
      {preview.errors_summary.length > 0 && (
        <div style={{
          background: "var(--clr-surface-card)",
          borderRadius: "var(--r-lg)",
          border: "1px solid var(--clr-divider)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "var(--sp-14) var(--sp-16)",
            borderBottom: "1px solid var(--clr-divider)",
            fontSize: "var(--text-xs)",
            fontWeight: "var(--fw-semibold)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--danger)",
          }}>
            Validation Issues ({preview.errors_summary.length})
          </div>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {preview.errors_summary.map((err, i) => (
              <div
                key={`err-${i}`}
                style={{
                  display: "flex",
                  gap: "var(--sp-8)",
                  padding: "var(--sp-8) var(--sp-16)",
                  borderBottom: "1px solid var(--clr-divider)",
                  fontSize: "var(--text-sm)",
                  alignItems: "flex-start",
                }}
              >
                <span style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--fw-medium)",
                  color: err.severity === "error" ? "var(--danger)" : "var(--warning)",
                  background: err.severity === "error" ? "rgba(239,68,68,0.08)" : "rgba(224,148,34,0.08)",
                  padding: "var(--sp-2) var(--sp-6)",
                  borderRadius: "var(--r-full)",
                  flexShrink: 0,
                }}>
                  Row {err.row}
                </span>
                <span style={{ color: "var(--clr-secondary)", flex: 1 }}>
                  <strong style={{ color: "var(--clr-primary)" }}>{err.field}:</strong>{" "}
                  {err.error}
                  {err.value && (
                    <span style={{ color: "var(--clr-faint)", marginLeft: "var(--sp-4)" }}>
                      (got: &ldquo;{err.value}&rdquo;)
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview rows */}
      {preview.preview_rows.length > 0 && (
        <div style={{
          background: "var(--clr-surface-card)",
          borderRadius: "var(--r-lg)",
          border: "1px solid var(--clr-divider)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "var(--sp-14) var(--sp-16)",
            borderBottom: "1px solid var(--clr-divider)",
            fontSize: "var(--text-xs)",
            fontWeight: "var(--fw-semibold)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--clr-muted)",
          }}>
            Data Preview (first {preview.preview_rows.length} rows)
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
              <thead>
                <tr>
                  <th style={{ padding: "var(--sp-8) var(--sp-12)", textAlign: "left", fontSize: "var(--text-xs)", color: "var(--clr-muted)", borderBottom: "1px solid var(--clr-divider)" }}>
                    #
                  </th>
                  {preview.preview_rows[0] && Object.keys(preview.preview_rows[0].data).map((key) => (
                    <th key={key} style={{ padding: "var(--sp-8) var(--sp-12)", textAlign: "left", fontSize: "var(--text-xs)", color: "var(--clr-muted)", borderBottom: "1px solid var(--clr-divider)", whiteSpace: "nowrap" }}>
                      {key}
                    </th>
                  ))}
                  <th style={{ padding: "var(--sp-8) var(--sp-12)", textAlign: "left", fontSize: "var(--text-xs)", color: "var(--clr-muted)", borderBottom: "1px solid var(--clr-divider)" }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {preview.preview_rows.slice(0, 10).map((row) => (
                  <tr key={row.row_number} style={{ background: row.status === "error" ? "rgba(239,68,68,0.03)" : row.status === "warning" ? "rgba(224,148,34,0.03)" : "transparent" }}>
                    <td style={{ padding: "var(--sp-6) var(--sp-12)", color: "var(--clr-muted)", borderBottom: "1px solid var(--clr-divider)" }}>
                      {row.row_number}
                    </td>
                    {Object.values(row.data).map((val, i) => (
                      <td key={i} style={{ padding: "var(--sp-6) var(--sp-12)", color: "var(--clr-primary)", borderBottom: "1px solid var(--clr-divider)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {String(val ?? "")}
                      </td>
                    ))}
                    <td style={{ padding: "var(--sp-6) var(--sp-12)", borderBottom: "1px solid var(--clr-divider)" }}>
                      <span style={{
                        fontSize: "var(--text-micro)",
                        fontWeight: "var(--fw-medium)",
                        color: row.status === "valid" ? "var(--success)" : row.status === "warning" ? "var(--warning)" : "var(--danger)",
                        background: row.status === "valid" ? "rgba(34,160,107,0.08)" : row.status === "warning" ? "rgba(224,148,34,0.08)" : "rgba(239,68,68,0.08)",
                        padding: "var(--sp-2) var(--sp-8)",
                        borderRadius: "var(--r-full)",
                      }}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => onPreviewReady(preview)}
          disabled={preview.error_rows > 0 && preview.valid_rows === 0}
          style={{ fontSize: "var(--text-sm)", padding: "var(--sp-8) var(--sp-20)" }}
        >
          {preview.error_rows > 0
            ? `Continue with ${preview.valid_rows} valid rows`
            : "Approve & Continue"}
        </button>
      </div>
    </div>
  );
}

function SummaryCard({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <div style={{
      padding: "var(--sp-14) var(--sp-16)",
      background: "var(--clr-surface-card)",
      borderRadius: "var(--r-lg)",
      border: "1px solid var(--clr-divider)",
    }}>
      <div style={{
        fontSize: "var(--text-xl)",
        fontFamily: "var(--font-display)",
        fontWeight: "var(--fw-bold)",
        color: color ?? "var(--clr-primary)",
        lineHeight: "var(--lh-tight)",
      }}>
        {value}
      </div>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginTop: "var(--sp-4)" }}>
        {label}
      </div>
    </div>
  );
}
