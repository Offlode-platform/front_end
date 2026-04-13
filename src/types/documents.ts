// Phase 2: Shared types (must be before Document since it references SuggestedMatch)

export type SuggestedMatch = {
  transaction_id: string;
  score: number;
  amount: string | null;
  date: string | null;
  supplier: string | null;
};

export type Document = {
  id: string;
  organization_id: string;
  client_id: string;
  transaction_id: string | null;
  filename: string;
  original_filename: string;
  file_size: number | null;
  mime_type: string | null;
  s3_key: string;
  s3_bucket: string;
  s3_url: string;
  ocr_status: string;
  ocr_text: string | null;
  ocr_confidence: string | null;
  virus_scan_status: string;
  virus_scanned_at: string | null;
  extracted_amount: string | null;
  extracted_date: string | null;
  extracted_supplier: string | null;
  xero_file_id: string | null;
  forwarded_to_xero: boolean;
  forwarded_at: string | null;
  forwarding_status: string;
  forwarding_attempts: number;
  forwarding_last_error: string | null;
  flagged: boolean;
  flag_reason: string | null;
  flag_category: string | null;
  file_hash: string | null;
  validation_status: string | null;
  match_confidence: number | null;
  auto_matched: boolean;
  suggested_matches: SuggestedMatch[];
  uploaded_by: string | null;
  uploaded_at: string;
  created_at: string;
  is_processed: boolean;
};

export type DocumentListResponse = {
  total: number;
  processed: number;
  pending: number;
  flagged: number;
  documents: Document[];
};

export type S3PresignedUrlResponse = {
  upload_url: string;
  upload_key: string;
  expires_in: number;
  content_type: string;
};

// Phase 2: Document review queue types

export type DocumentReviewItem = {
  id: string;
  organization_id: string;
  client_id: string;
  client_name: string | null;
  transaction_id: string | null;
  filename: string;
  original_filename: string | null;
  file_size: number | null;
  mime_type: string | null;
  s3_url: string;
  state: string;
  ocr_status: string;
  ocr_confidence: string | null;
  extracted_amount: string | null;
  extracted_date: string | null;
  extracted_supplier: string | null;
  virus_scan_status: string;
  validation_status: string;
  match_confidence: number | null;
  auto_matched: boolean;
  suggested_matches: SuggestedMatch[];
  flagged: boolean;
  flag_reason: string | null;
  flag_category: string | null;
  uploaded_at: string;
  created_at: string;
};

export type ReviewQueueResponse = {
  total: number;
  items: DocumentReviewItem[];
};

export type ConfirmMatchRequest = {
  transaction_id: string;
};

export type ManualMatchRequest = {
  transaction_id: string;
};

export type MatchActionResponse = {
  status: string;
  document_id: string;
  transaction_id?: string;
};
