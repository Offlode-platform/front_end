"use client";

import { useMemo, useState } from "react";
import { importsApi } from "@/lib/api/imports-api";
import type {
  FieldDetectionResponse,
  ImportSessionResponse,
  ColumnMappingRequest,
  ImportDataType,
} from "@/types/imports";

type Props = {
  detection: FieldDetectionResponse;
  dataType: ImportDataType;
  onComplete: (result: ImportSessionResponse) => void;
  onBack?: () => void;
};

type FieldOption = { value: string; label: string };

// Universal "skip" choice — always first in every list.
const SKIP: FieldOption = { value: "", label: "-- Skip --" };

// Per-data-type field catalogs. Each list only exposes the fields that make
// sense for the selected import type, so a user importing contacts never
// sees invoice-only options like "Invoice Number" or "Due Date".
const INVOICE_FIELDS: FieldOption[] = [
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
  { value: "account_code", label: "Account Code" },
];

// IMPORTANT: these `value`s must match the field keys the backend's
// `_validate_contact_row` (csv_importer.py) reads via `reverse_map.get(...)`.
// A mismatch silently produces "Contact name is required" errors on every row
// because the validator can't find the column the user mapped.
const CONTACT_FIELDS: FieldOption[] = [
  { value: "name", label: "Contact / Full Name" },
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "tax_number", label: "Tax / VAT Number" },
  { value: "contact_type", label: "Contact Type (customer / supplier)" },
  { value: "address_line_1", label: "Address Line 1" },
  { value: "address_line_2", label: "Address Line 2" },
  { value: "city", label: "City" },
  { value: "postal_code", label: "Postal Code" },
  { value: "country", label: "Country" },
  { value: "currency_code", label: "Currency" },
];

const PAYMENT_FIELDS: FieldOption[] = [
  { value: "invoice_number", label: "Invoice Number" },
  { value: "contact_name", label: "Contact/Client Name" },
  { value: "payment_date", label: "Payment Date" },
  { value: "payment_method", label: "Payment Method" },
  { value: "amount", label: "Amount" },
  { value: "currency_code", label: "Currency" },
  { value: "reference", label: "Reference" },
  { value: "account_code", label: "Account Code" },
];

function fieldsForDataType(dataType: ImportDataType): FieldOption[] {
  switch (dataType) {
    case "invoices":
      return [SKIP, ...INVOICE_FIELDS];
    case "contacts":
      return [SKIP, ...CONTACT_FIELDS];
    case "payments":
      return [SKIP, ...PAYMENT_FIELDS];
    default:
      return [SKIP];
  }
}

export function ImportMappingStep({ detection, dataType, onComplete, onBack }: Props) {
  // Per-type catalog. Memoised so the select options don't rebuild on every render.
  const availableFields = useMemo(() => fieldsForDataType(dataType), [dataType]);
  const validValues = useMemo(
    () => new Set(availableFields.map((f) => f.value)),
    [availableFields],
  );

  // Initial mapping: the backend's suggested mapping MAY include fields that
  // aren't in this data type's catalog (e.g. "invoice_number" suggested on a
  // contacts import). Drop any such suggestions so the <select> doesn't end
  // up with an out-of-range value that renders as a blank option.
  const [mapping, setMapping] = useState<Record<string, string>>(() => {
    const cleaned: Record<string, string> = {};
    for (const [col, field] of Object.entries(detection.suggested_mapping ?? {})) {
      cleaned[col] = validValues.has(field) ? field : "";
    }
    return cleaned;
  });
  const [dateFormat, setDateFormat] = useState("%d/%m/%Y");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  // Detect duplicate target fields. If the user maps two CSV columns to the
  // same backend field (e.g. both "First Name" and "Last Name" → "name"),
  // the backend's reverse_map collapses one of them and silently drops data.
  // Block submission until the conflict is resolved — except for first_name
  // and last_name which we DON'T treat as duplicates of each other (they're
  // different fields), and we let the backend combine them into `name`.
  const duplicates = useMemo(() => {
    const counts = new Map<string, number>();
    for (const field of Object.values(mapping)) {
      if (!field) continue;
      counts.set(field, (counts.get(field) ?? 0) + 1);
    }
    const dupSet = new Set<string>();
    for (const [field, count] of counts) {
      if (count > 1) dupSet.add(field);
    }
    return dupSet;
  }, [mapping]);

  const hasDuplicates = duplicates.size > 0;

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
                  border: `1px solid ${
                    mapping[col] && duplicates.has(mapping[col])
                      ? "var(--danger)"
                      : "var(--clr-divider-strong)"
                  }`,
                  borderRadius: "var(--r-sm)",
                  fontSize: "var(--text-sm)",
                  background:
                    mapping[col] && duplicates.has(mapping[col])
                      ? "rgba(239,68,68,0.04)"
                      : "var(--canvas-bg)",
                  color: "var(--clr-primary)",
                  width: "100%",
                }}
              >
                {availableFields.map((f) => (
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

      {hasDuplicates && (
        <div
          style={{
            padding: "var(--sp-12) var(--sp-16)",
            background: "rgba(239,68,68,0.08)",
            borderRadius: "var(--r-md)",
            color: "var(--danger)",
            fontSize: "var(--text-sm)",
            border: "1px solid rgba(239,68,68,0.2)",
            display: "flex",
            alignItems: "flex-start",
            gap: "var(--sp-8)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <div style={{ fontWeight: "var(--fw-semibold)", marginBottom: 2 }}>
              Multiple columns mapped to the same field
            </div>
            <div style={{ color: "var(--clr-secondary)" }}>
              {Array.from(duplicates).map((f) => (
                <span key={f} style={{ fontFamily: "ui-monospace, monospace" }}>
                  {f}
                </span>
              ))}{" "}
              — each backend field can only receive one CSV column. Pick one,
              or use the dedicated <strong>First Name</strong> /{" "}
              <strong>Last Name</strong> options if you want them combined into
              the contact&apos;s full name.
            </div>
          </div>
        </div>
      )}

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
            disabled={saving}
            style={{ fontSize: "var(--text-sm)" }}
          >
            ← Back
          </button>
        ) : <span />}
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleConfirm}
          disabled={saving || hasDuplicates}
          title={hasDuplicates ? "Resolve duplicate field mappings first" : undefined}
          style={{ fontSize: "var(--text-sm)", padding: "var(--sp-8) var(--sp-20)" }}
        >
          {saving ? "Saving..." : "Confirm Mapping & Validate"}
        </button>
      </div>
    </div>
  );
}
