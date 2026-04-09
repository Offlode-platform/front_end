"use client";

import { useState } from "react";
import { importsApi } from "@/lib/api/imports-api";
import type { FieldDetectionResponse, ImportSessionResponse, ColumnMappingRequest } from "@/types/imports";

type Props = {
  detection: FieldDetectionResponse;
  onComplete: (result: ImportSessionResponse) => void;
};

const KNOWN_FIELDS = [
  { value: "", label: "-- Skip --" },
  { value: "invoice_number", label: "Invoice Number" },
  { value: "date", label: "Date" },
  { value: "due_date", label: "Due Date" },
  { value: "contact_name", label: "Contact/Client Name" },
  { value: "amount", label: "Amount" },
  { value: "total", label: "Total" },
  { value: "subtotal", label: "Subtotal" },
  { value: "tax_amount", label: "Tax Amount" },
  { value: "currency_code", label: "Currency" },
  { value: "status", label: "Status" },
  { value: "reference", label: "Reference" },
  { value: "description", label: "Description" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "company", label: "Company" },
  { value: "address_line_1", label: "Address Line 1" },
  { value: "city", label: "City" },
  { value: "postal_code", label: "Postal Code" },
  { value: "country", label: "Country" },
  { value: "payment_date", label: "Payment Date" },
  { value: "payment_method", label: "Payment Method" },
  { value: "account_code", label: "Account Code" },
];

export function ImportMappingStep({ detection, onComplete }: Props) {
  const [mapping, setMapping] = useState<Record<string, string>>(
    { ...detection.suggested_mapping },
  );
  const [dateFormat, setDateFormat] = useState("%d/%m/%Y");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  function updateMapping(csvCol: string, field: string) {
    setMapping((prev) => ({ ...prev, [csvCol]: field }));
  }

  async function handleConfirm() {
    setSaving(true);
    setError(null);
    try {
      const body: ColumnMappingRequest = {
        column_mapping: mapping,
        date_format: dateFormat,
        save_as_template: saveTemplate,
        template_name: saveTemplate && templateName ? templateName : undefined,
      };
      const result = await importsApi.setMapping(detection.session_id, body);
      onComplete(result);
    } catch {
      setError("Failed to save column mapping.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-20)" }}>
      {/* Mapping table */}
      <div style={{
        background: "var(--clr-surface-card)",
        borderRadius: "var(--r-lg)",
        border: "1px solid var(--clr-divider)",
        overflow: "hidden",
      }}>
        <div style={{
          padding: "var(--sp-14) var(--sp-16)",
          borderBottom: "1px solid var(--clr-divider)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--fw-semibold)", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--clr-muted)" }}>
            Column Mapping
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-faint)" }}>
            {detection.detected_columns.length} columns detected
          </div>
        </div>

        {/* Header row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 80px 1fr 120px",
          gap: "var(--sp-8)",
          padding: "var(--sp-8) var(--sp-16)",
          borderBottom: "1px solid var(--clr-divider)",
          fontSize: "var(--text-xs)",
          fontWeight: "var(--fw-semibold)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--clr-muted)",
        }}>
          <span>CSV Column</span>
          <span>Confidence</span>
          <span>Maps To</span>
          <span>Sample</span>
        </div>

        {/* Mapping rows */}
        {detection.detected_columns.map((col) => {
          const confidence = detection.confidence_scores[col] ?? 0;
          const sample = detection.sample_data[0]?.[col] ?? "";
          return (
            <div
              key={col}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 80px 1fr 120px",
                gap: "var(--sp-8)",
                padding: "var(--sp-8) var(--sp-16)",
                borderBottom: "1px solid var(--clr-divider)",
                alignItems: "center",
                fontSize: "var(--text-sm)",
              }}
            >
              <span style={{ color: "var(--clr-primary)", fontWeight: "var(--fw-medium)", fontFamily: "var(--font-mono, monospace)" }}>
                {col}
              </span>
              <span style={{
                fontSize: "var(--text-xs)",
                color: confidence > 0.7 ? "var(--success)" : confidence > 0.4 ? "var(--warning)" : "var(--clr-muted)",
              }}>
                {(confidence * 100).toFixed(0)}%
              </span>
              <select
                value={mapping[col] || ""}
                onChange={(e) => updateMapping(col, e.target.value)}
                style={{
                  padding: "var(--sp-4) var(--sp-8)",
                  border: "1px solid var(--clr-divider-strong)",
                  borderRadius: "var(--r-sm)",
                  fontSize: "var(--text-sm)",
                  background: "var(--canvas-bg)",
                  color: "var(--clr-primary)",
                  width: "100%",
                }}
              >
                {KNOWN_FIELDS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--clr-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {sample}
              </span>
            </div>
          );
        })}
      </div>

      {/* Date format */}
      <div style={{
        background: "var(--clr-surface-card)",
        borderRadius: "var(--r-lg)",
        border: "1px solid var(--clr-divider)",
        padding: "var(--sp-16)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--fw-medium)", color: "var(--clr-primary)" }}>
              Date Format
            </div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginTop: 2 }}>
              Select the format used in your CSV
            </div>
          </div>
          <select
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value)}
            style={{
              padding: "var(--sp-6) var(--sp-12)",
              border: "1px solid var(--clr-divider-strong)",
              borderRadius: "var(--r-md)",
              fontSize: "var(--text-sm)",
              background: "var(--canvas-bg)",
              color: "var(--clr-primary)",
            }}
          >
            <option value="%d/%m/%Y">DD/MM/YYYY (UK)</option>
            <option value="%m/%d/%Y">MM/DD/YYYY (US)</option>
            <option value="%Y-%m-%d">YYYY-MM-DD (ISO)</option>
            <option value="%d-%m-%Y">DD-MM-YYYY</option>
            <option value="%d %b %Y">DD Mon YYYY</option>
          </select>
        </div>
      </div>

      {/* Save as template */}
      <div style={{
        background: "var(--clr-surface-card)",
        borderRadius: "var(--r-lg)",
        border: "1px solid var(--clr-divider)",
        padding: "var(--sp-16)",
      }}>
        <label style={{ display: "flex", alignItems: "center", gap: "var(--sp-8)", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={saveTemplate}
            onChange={(e) => setSaveTemplate(e.target.checked)}
          />
          <span style={{ fontSize: "var(--text-sm)", color: "var(--clr-primary)" }}>
            Save this mapping as a template for future imports
          </span>
        </label>
        {saveTemplate && (
          <input
            type="text"
            placeholder="Template name (e.g. Xero Invoices)"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            style={{
              marginTop: "var(--sp-8)",
              padding: "var(--sp-6) var(--sp-12)",
              border: "1px solid var(--clr-divider-strong)",
              borderRadius: "var(--r-md)",
              fontSize: "var(--text-sm)",
              background: "var(--canvas-bg)",
              color: "var(--clr-primary)",
              width: "100%",
            }}
          />
        )}
      </div>

      {error && (
        <div style={{ padding: "var(--sp-12) var(--sp-16)", background: "rgba(239,68,68,0.08)", borderRadius: "var(--r-md)", color: "var(--danger)", fontSize: "var(--text-sm)" }}>
          {error}
        </div>
      )}

      {/* Confirm button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleConfirm}
          disabled={saving}
          style={{ fontSize: "var(--text-sm)", padding: "var(--sp-8) var(--sp-20)" }}
        >
          {saving ? "Saving..." : "Confirm Mapping & Validate"}
        </button>
      </div>
    </div>
  );
}
