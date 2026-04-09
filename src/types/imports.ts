export type ImportPlatform = "csv" | "xero" | "quickbooks" | "sage";
export type ImportDataType = "invoices" | "contacts" | "payments" | "mixed";
export type ValidationSeverity = "error" | "warning";
export type PreviewRowStatus = "valid" | "warning" | "error";

export type ImportValidationError = {
  row: number;
  field: string;
  error: string;
  value: string | null;
  severity: ValidationSeverity;
};

export type ImportPreviewRow = {
  row_number: number;
  data: Record<string, unknown>;
  errors: ImportValidationError[];
  status: PreviewRowStatus;
};

export type ImportPreviewResponse = {
  session_id: string;
  total_rows: number;
  valid_rows: number;
  error_rows: number;
  warning_rows: number;
  preview_rows: ImportPreviewRow[];
  errors_summary: ImportValidationError[];
};

export type FieldDetectionResponse = {
  session_id: string;
  detected_columns: string[];
  suggested_mapping: Record<string, string>;
  confidence_scores: Record<string, number>;
  sample_data: Record<string, string>[];
  available_templates: Record<string, unknown>[];
};

export type ImportSessionResponse = {
  id: string;
  status: string;
  platform: string;
  data_type: string;
  filename: string | null;
  total_rows: number | null;
  valid_rows: number | null;
  error_rows: number | null;
  warning_rows: number | null;
  records_created: number;
  records_updated: number;
  records_skipped: number;
  detected_columns: string[] | null;
  column_mapping: Record<string, string> | null;
  mapping_confidence: Record<string, number> | null;
  validation_errors: Record<string, unknown>[] | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type ImportSessionListResponse = {
  items: ImportSessionResponse[];
  total: number;
};

export type ColumnMappingRequest = {
  column_mapping: Record<string, string>;
  date_format?: string;
  decimal_separator?: string;
  thousand_separator?: string;
  save_as_template?: boolean;
  template_name?: string | null;
};
