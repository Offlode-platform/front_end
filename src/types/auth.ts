export type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export type LoginRequest = {
  email: string;
  password: string;
  two_factor_code?: string;
};

export type SignupRequest = {
  organization_name: string;
  organization_slug: string;
  user_name: string;
  email: string;
  password: string;
};

export type SignupResponse = {
  organization_id: string;
  user_id: string;
  role: string;
  two_factor: {
    secret: string;
    otpauth_url: string;
    setup_token: string;
    expires_in: number;
  };
};

export type Bootstrap2faSetupRequest = {
  email: string;
  password: string;
};

export type Bootstrap2faSetupResponse = {
  secret: string;
  otpauth_url: string;
  setup_token: string;
  expires_in: number;
};

export type Bootstrap2faVerifyRequest = {
  setup_token: string;
  code: string;
};

export type Setup2faResponse = {
  secret: string;
  otpauth_url: string;
};

export type Verify2faRequest = {
  code: string;
};

export type MagicLinkRequest = {
  email: string;
};

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  email_verified: boolean;
  two_factor_enabled: boolean;
  last_login_at: string | null;
  created_at: string | null;
  notification_preferences: Record<string, unknown>;
  organization_id: string;
  organization_name: string | null;
};

export type UpdateMeRequest = {
  name?: string;
  notification_preferences?: Record<string, unknown>;
};

export type ChangePasswordRequest = {
  current_password: string;
  new_password: string;
};

export type Disable2faRequest = {
  password: string;
};

export type FastAPIValidationDetail = {
  loc: (string | number)[];
  msg: string;
  type: string;
};

export type FastAPIValidationErrorBody = {
  detail: FastAPIValidationDetail[];
};
