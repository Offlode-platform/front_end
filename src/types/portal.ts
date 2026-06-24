export type CantProvideRequest = {
  token: string;
  message?: string | null;
};

export type AskQuestionRequest = {
  token: string;
  message: string;
};

export type PortalActionResponse = {
  status: string;
};

export type PortalResolveResponse = {
  client_id: string;
  client_name: string;
  organization_id: string;
  organization_name: string;
  missing_count: number;
};

export type PortalLoginRequest = {
  email: string;
  password: string;
};

export type PortalLoginResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  client_id: string;
  client_name: string;
  organization_name: string;
};

export type PortalNotificationPrefs = {
  email?: boolean;
  sms?: boolean;
};

export type PortalProfile = {
  client_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  organization_name: string;
  notification_preferences: PortalNotificationPrefs;
  last_login_at: string | null;
};

export type PortalProfileUpdate = {
  name?: string;
  phone?: string;
  notification_preferences?: PortalNotificationPrefs;
};

export type PortalUploadedDoc = {
  id: string;
  filename: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_at: string | null;
  ocr_status: string;
  extracted_supplier: string | null;
  extracted_amount: string | null;
  extracted_date: string | null;
};

export type PortalDocumentList = {
  total: number;
  documents: PortalUploadedDoc[];
};
