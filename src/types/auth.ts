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

export type FastAPIValidationDetail = {
  loc: (string | number)[];
  msg: string;
  type: string;
};

export type FastAPIValidationErrorBody = {
  detail: FastAPIValidationDetail[];
};
