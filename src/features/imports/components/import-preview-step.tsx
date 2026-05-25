"use client";

import { useEffect, useRef, useState } from "react";
import { importsApi } from "@/lib/api/imports-api";
import type { ImportSessionResponse, ImportPreviewResponse, ImportPreviewRow } from "@/types/imports";

type Props = {
  session: ImportSessionResponse;
  onPreviewReady: (result: ImportPreviewResponse) => void;
  onBack?: () => void;
};

export function ImportPreviewStep({ session, onPreviewReady, onBack }: Props) {
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [excludedRows, setExcludedRows] = useState<Set<number>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    importsApi.validate(session.id).then(
      (result) => {
        if (!cancelled) {
          setPreview(result);
          if (result.excluded_rows && result.excluded_rows.length > 0) {
            setExcludedRows(new Set(result.excluded_rows));
          }
          setLoading(false);
        }
      },
      () => {
        importsApi.preview(session.id).then(
          (result) => {
            if (!cancelled) {
              setPreview(result);
              if (result.excluded_rows && result.excluded_rows.length > 0) {
                setExcludedRows(new Set(result.excluded_rows));
              }
              setLoading(false);
            }
          },
          () => {
            if (!cancelled) { setError("Validation failed. Please try again."); setLoading(false); }
          },
        );
      },
    );

    return () => { cancelled = true; };
  }, [session.id]);

  function toggleExclude(rowNumber: number) {
    setExcludedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
      return next;
    });
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.delete(rowNumber);
      return next;
    });
  }

  function toggleSelectRow(rowNumber: number) {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
      return next;
    });
  }

  const visibleRows = preview?.preview_rows ?? [];
  const selectableRows = visibleRows.filter((r) => !excludedRows.has(r.row_number));
  const allSelected = selectableRows.length > 0 && selectableRows.every((r) => selectedRows.has(r.row_number));
  const someSelected = selectableRows.some((r) => selectedRows.has(r.row_number));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected && !allSelected;
    }
  }, [someSelected, allSelected]);

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(selectableRows.map((r) => r.row_number)));
    }
  }

  function bulkExclude() {
    setExcludedRows((prev) => {
      const next = new Set(prev);
      selectedRows.forEach((id) => next.add(id));
      return next;
    });
    setSelectedRows(new Set());
  }

  async function handleContinue() {
    if (!preview) return;
    setSaving(true);
    setError(null);

    try {
      const excludedList = [...excludedRows];
      await importsApi.setExcludedRows(session.id, excludedList);

      const excludedStatusCounts: Record<string, number> = {};
      for (const row of preview.preview_rows) {
        if (excludedRows.has(row.row_number)) {
          excludedStatusCounts[row.status] = (excludedStatusCounts[row.status] || 0) + 1;
        }
      }

      const adjustedPreview: ImportPreviewResponse = {
        ...preview,
        excluded_rows: excludedList,
        total_rows: preview.total_rows - excludedList.length,
        valid_rows: preview.valid_rows - (excludedStatusCounts.valid || 0),
        error_rows: preview.error_rows - (excludedStatusCounts.error || 0),
        warning_rows: preview.warning_rows - (excludedStatusCounts.warning || 0),
      };

      onPreviewReady(adjustedPreview);
    } catch {
      setError("Failed to save row exclusions. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{
        background: "var(--clr-surface-card)",
        borderRadius: "var(--r-lg)",
        border: "1px solid var(--clr-divider)",
        padding: "56px var(--sp-32)",
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

  if (error && !preview) {
    return (
      <div style={{ padding: "var(--sp-16)", background: "rgba(239,68,68,0.08)", borderRadius: "var(--r-md)", color: "var(--danger)", fontSize: "var(--text-sm)" }}>
        {error}
      </div>
    );
  }

  if (!preview) return null;

  const excludedStatusCounts: Record<string, number> = {};
  for (const row of preview.preview_rows) {
    if (excludedRows.has(row.row_number)) {
      excludedStatusCounts[row.status] = (excludedStatusCounts[row.status] || 0) + 1;
    }
  }
  const displayTotal = preview.total_rows - excludedRows.size;
  const displayValid = preview.valid_rows - (excludedStatusCounts.valid || 0);
  const displayErrors = preview.error_rows - (excludedStatusCounts.error || 0);
  const displayWarnings = preview.warning_rows - (excludedStatusCounts.warning || 0);
  const canContinue = displayValid > 0 || (displayErrors === 0 && displayTotal > 0);
  const activeErrors = preview.errors_summary.filter((e) => !excludedRows.has(e.row));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-20)" }}>

      {/* ── Summary cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--sp-12)" }}>
        <SummaryCard value={displayTotal} label="Total rows" />
        <SummaryCard value={displayValid} label="Valid" color="var(--success)" />
        <SummaryCard value={displayWarnings} label="Warnings" color="var(--warning)" />
        <SummaryCard value={displayErrors} label="Errors" color="var(--danger)" />
      </div>

      {/* ── Exclusion banner ── */}
      {excludedRows.size > 0 && (
        <div style={{
          padding: "var(--sp-12) var(--sp-16)",
          background: "rgba(120,120,140,0.06)",
          borderRadius: "var(--r-md)",
          border: "1px solid var(--clr-divider)",
          fontSize: "var(--text-sm)",
          color: "var(--clr-secondary)",
          display: "flex",
          alignItems: "center",
          gap: "var(--sp-8)",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: "var(--clr-muted)", marginTop: 1 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>
            <strong>{excludedRows.size} {excludedRows.size === 1 ? "row" : "rows"} excluded</strong>
            {" "}— will not be imported. Click &ldquo;Restore&rdquo; on any row to undo.
          </span>
        </div>
      )}

      {/* ── Validation issues section ── */}
      {activeErrors.length > 0 && (
        <div style={{
          background: "var(--clr-surface-card)",
          borderRadius: "var(--r-lg)",
          border: "1px solid var(--clr-divider)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "var(--sp-12) var(--sp-20)",
            borderBottom: "1px solid var(--clr-divider)",
            background: "rgba(239,68,68,0.03)",
            display: "flex",
            alignItems: "center",
            gap: "var(--sp-8)",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{
              fontSize: "var(--text-xs)",
              fontWeight: "var(--fw-semibold)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--danger)",
            }}>
              Validation Issues ({activeErrors.length})
            </span>
          </div>

          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {activeErrors.map((err, i) => (
              <div
                key={`err-${i}`}
                style={{
                  display: "flex",
                  gap: "var(--sp-12)",
                  padding: "var(--sp-12) var(--sp-20)",
                  borderBottom: i < activeErrors.length - 1 ? "1px solid var(--clr-divider)" : "none",
                  fontSize: "var(--text-sm)",
                  alignItems: "flex-start",
                }}
              >
                <span style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--fw-medium)",
                  color: err.severity === "error" ? "var(--danger)" : "var(--warning)",
                  background: err.severity === "error" ? "rgba(239,68,68,0.08)" : "rgba(224,148,34,0.08)",
                  padding: "2px var(--sp-8)",
                  borderRadius: "var(--r-full)",
                  flexShrink: 0,
                  lineHeight: "20px",
                }}>
                  Row {err.row}
                </span>
                <span style={{ color: "var(--clr-secondary)", flex: 1, lineHeight: "var(--lh-normal)" }}>
                  <strong style={{ color: "var(--clr-primary)" }}>{err.field}:</strong>{" "}
                  {err.error}
                  {err.value && (
                    <span style={{ color: "var(--clr-faint)", marginLeft: "var(--sp-6)" }}>
                      (got: &ldquo;{err.value}&rdquo;)
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── All rows table ── */}
      {preview.preview_rows.length > 0 && (
        <div style={{
          background: "var(--clr-surface-card)",
          borderRadius: "var(--r-lg)",
          border: "1px solid var(--clr-divider)",
          overflow: "hidden",
          marginBottom: selectedRows.size > 0 ? "60px" : 0,
        }}>
          {/* Section heading */}
          <div style={{
            padding: "var(--sp-12) var(--sp-20)",
            borderBottom: "1px solid var(--clr-divider)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "var(--sp-16)",
          }}>
            <span style={{
              fontSize: "var(--text-xs)",
              fontWeight: "var(--fw-semibold)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--clr-muted)",
            }}>
              All Rows ({preview.preview_rows.length})
            </span>
            <span style={{
              fontSize: "var(--text-xs)",
              color: "var(--clr-faint)",
              fontStyle: "italic",
            }}>
              Select rows to bulk exclude, or use the trash icon per row
            </span>
          </div>

          {/* Scrollable table */}
          <div style={{ overflowX: "auto", maxHeight: 440, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 1, background: "var(--clr-surface-card)" }}>
                <tr>
                  {/* Select-all */}
                  <th style={{ ...thStyle, width: 44, paddingLeft: "var(--sp-20)" }}>
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      title="Select all rows"
                      style={{ cursor: "pointer", width: 15, height: 15, accentColor: "var(--brand)" }}
                    />
                  </th>
                  {/* Action (trash) — first, before data */}
                  <th style={{ ...thStyle, width: 48 }} />
                  {/* Row # */}
                  <th style={{ ...thStyle, width: 52 }}>#</th>
                  {/* Data columns */}
                  {preview.preview_rows[0] && Object.keys(preview.preview_rows[0].data).map((key) => (
                    <th key={key} style={thStyle}>{key}</th>
                  ))}
                  {/* Status */}
                  <th style={{ ...thStyle, width: 92, textAlign: "right", paddingRight: "var(--sp-20)" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.preview_rows.map((row) => (
                  <RowLine
                    key={row.row_number}
                    row={row}
                    excluded={excludedRows.has(row.row_number)}
                    selected={selectedRows.has(row.row_number)}
                    onToggleExclude={toggleExclude}
                    onToggleSelect={toggleSelectRow}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Bulk action bar — sticky inside the card */}
          {selectedRows.size > 0 && (
            <div style={{
              position: "sticky",
              bottom: 0,
              display: "flex",
              alignItems: "center",
              gap: "var(--sp-12)",
              padding: "var(--sp-12) var(--sp-20)",
              background: "var(--clr-surface-card)",
              borderTop: "1px solid var(--clr-divider-strong)",
              boxShadow: "0 -4px 16px rgba(0,0,0,0.07)",
              zIndex: 10,
            }}>
              <span style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--fw-medium)",
                color: "var(--clr-secondary)",
                minWidth: 90,
              }}>
                {selectedRows.size} {selectedRows.size === 1 ? "row" : "rows"} selected
              </span>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={bulkExclude}
                style={{ fontSize: "var(--text-xs)" }}
              >
                Exclude {selectedRows.size} {selectedRows.size === 1 ? "row" : "rows"}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedRows(new Set())}
                style={{ fontSize: "var(--text-xs)" }}
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Inline error ── */}
      {error && (
        <div style={{ padding: "var(--sp-12) var(--sp-16)", background: "rgba(239,68,68,0.08)", borderRadius: "var(--r-md)", color: "var(--danger)", fontSize: "var(--text-sm)" }}>
          {error}
        </div>
      )}

      {/* ── Footer actions ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "var(--sp-4)" }}>
        {onBack ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onBack}
            disabled={saving}
            style={{ fontSize: "var(--text-sm)" }}
          >
            ← Back
          </button>
        ) : <span />}
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleContinue}
          disabled={saving || !canContinue}
          style={{ fontSize: "var(--text-sm)", padding: "var(--sp-8) var(--sp-24)" }}
        >
          {saving
            ? "Saving..."
            : displayErrors > 0
              ? `Continue with ${displayValid} valid rows`
              : excludedRows.size > 0
                ? `Import ${displayTotal} rows (${excludedRows.size} excluded)`
                : "Approve & Continue"}
        </button>
      </div>
    </div>
  );
}

/* ── Table styles ── */

const thStyle: React.CSSProperties = {
  padding: "var(--sp-8) var(--sp-12)",
  textAlign: "left",
  fontSize: "var(--text-xs)",
  color: "var(--clr-muted)",
  borderBottom: "1px solid var(--clr-divider)",
  whiteSpace: "nowrap",
  fontWeight: "var(--fw-semibold)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  background: "rgba(0,0,0,0.01)",
};

const tdStyle: React.CSSProperties = {
  padding: "var(--sp-8) var(--sp-12)",
  color: "var(--clr-primary)",
  borderBottom: "1px solid var(--clr-divider)",
};

/* ── Row component ── */

function RowLine({
  row,
  excluded,
  selected,
  onToggleExclude,
  onToggleSelect,
}: {
  row: ImportPreviewRow;
  excluded: boolean;
  selected: boolean;
  onToggleExclude: (rowNumber: number) => void;
  onToggleSelect: (rowNumber: number) => void;
}) {
  const rowBg = selected
    ? "rgba(53,126,146,0.05)"
    : excluded
      ? "rgba(120,120,140,0.04)"
      : row.status === "error"
        ? "rgba(239,68,68,0.03)"
        : row.status === "warning"
          ? "rgba(224,148,34,0.025)"
          : "transparent";

  const textStyle: React.CSSProperties = excluded
    ? { opacity: 0.38, textDecoration: "line-through" }
    : {};

  return (
    <tr style={{ background: rowBg, transition: "background 0.1s" }}>

      {/* Checkbox */}
      <td style={{ ...tdStyle, width: 44, paddingLeft: "var(--sp-20)" }}>
        {!excluded && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(row.row_number)}
            style={{ cursor: "pointer", width: 15, height: 15, accentColor: "var(--brand)" }}
          />
        )}
      </td>

      {/* Action — trash or restore, positioned FIRST before data */}
      <td style={{ ...tdStyle, width: 48 }}>
        {excluded ? (
          <button
            type="button"
            onClick={() => onToggleExclude(row.row_number)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "var(--text-xs)",
              color: "var(--brand)",
              padding: "2px var(--sp-6)",
              borderRadius: "var(--r-sm)",
              fontWeight: "var(--fw-medium)",
              whiteSpace: "nowrap",
            }}
          >
            Restore
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onToggleExclude(row.row_number)}
            title="Exclude this row from import"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--clr-muted)",
              padding: "var(--sp-4)",
              borderRadius: "var(--r-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.45,
              transition: "opacity 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "1";
              (e.currentTarget as HTMLElement).style.color = "var(--danger)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "0.45";
              (e.currentTarget as HTMLElement).style.color = "var(--clr-muted)";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        )}
      </td>

      {/* Row number */}
      <td style={{ ...tdStyle, ...textStyle, width: 52, color: "var(--clr-faint)", fontSize: "var(--text-xs)" }}>
        {row.row_number}
      </td>

      {/* Data cells */}
      {Object.values(row.data).map((val, i) => (
        <td
          key={i}
          style={{
            ...tdStyle,
            ...textStyle,
            maxWidth: 180,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: "var(--clr-secondary)",
          }}
        >
          {String(val ?? "")}
        </td>
      ))}

      {/* Status badge */}
      <td style={{ ...tdStyle, width: 92, textAlign: "right", paddingRight: "var(--sp-20)" }}>
        {excluded ? (
          <span style={{
            fontSize: "var(--text-micro)",
            fontWeight: "var(--fw-medium)",
            color: "var(--clr-muted)",
            background: "rgba(120,120,140,0.1)",
            padding: "2px var(--sp-8)",
            borderRadius: "var(--r-full)",
          }}>
            excluded
          </span>
        ) : (
          <span style={{
            fontSize: "var(--text-micro)",
            fontWeight: "var(--fw-medium)",
            color: row.status === "valid" ? "var(--success)" : row.status === "warning" ? "var(--warning)" : "var(--danger)",
            background: row.status === "valid" ? "rgba(34,160,107,0.08)" : row.status === "warning" ? "rgba(224,148,34,0.08)" : "rgba(239,68,68,0.08)",
            padding: "2px var(--sp-8)",
            borderRadius: "var(--r-full)",
          }}>
            {row.status}
          </span>
        )}
      </td>
    </tr>
  );
}

/* ── Summary card ── */

function SummaryCard({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <div style={{
      padding: "var(--sp-16) var(--sp-20)",
      background: "var(--clr-surface-card)",
      borderRadius: "var(--r-lg)",
      border: "1px solid var(--clr-divider)",
    }}>
      <div style={{
        fontSize: "var(--text-stat)",
        fontFamily: "var(--font-display)",
        fontWeight: "var(--fw-bold)",
        color: color ?? "var(--clr-primary)",
        lineHeight: "var(--lh-tight)",
      }}>
        {value}
      </div>
      <div style={{
        fontSize: "var(--text-xs)",
        color: "var(--clr-muted)",
        marginTop: "var(--sp-6)",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        fontWeight: "var(--fw-medium)",
      }}>
        {label}
      </div>
    </div>
  );
}
