export type ManagerPermission = {
  client_visibility: string;
  document_chasing: string;
  upload_portal: string;
  ai_receptionist: string;
  billing_module: string;
  reporting: string;
  firm_settings: string;
  can_override_ai_validation: boolean;
  id: string;
  user_id: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
};

export type User = {
  email: string;
  name: string;
  id: string;
  organization_id: string;
  role: string;
  email_verified: boolean;
  two_factor_enabled: boolean;
  last_login_at: string;
  created_at: string;
  updated_at: string;
  deactivated_at: string;
  is_active: boolean;
  manager_permission?: ManagerPermission;
  reason?: string;
};

export type CreateUserRequestUser = {
  email: string;
  name: string;
  role: string;
  organization_id: string;
  password: string;
};

export type CreateUserRequestPermissions = {
  client_visibility: string;
  document_chasing: string;
  upload_portal: string;
  ai_receptionist: string;
  billing_module: string;
  reporting: string;
  firm_settings: string;
  can_override_ai_validation: boolean;
  user_id: string;
};

export type CreateUserRequest = {
  user: CreateUserRequestUser;
  permissions?: CreateUserRequestPermissions;
};

export type CreateUserResponse = User;

export type ListUsersQuery = {
  organization_id?: string;
  role?: string;
  include_deactivated?: boolean;
  skip?: number;
  limit?: number;
};

export type ListUsersResponse = User[];

export type GetUserResponse = User;

export type UpdateUserRequest = {
  name?: string;
  role?: string;
  two_factor_enabled?: boolean;
  notification_preferences?: Record<string, unknown>;
  password?: string;
};

export type UpdateUserResponse = User;

export type DeactivateUserRequest = {
  reason: string;
};

export type DeactivateUserResponse = User;

export type ManagerPermissionsRequest = {
  client_visibility: string;
  document_chasing: string;
  upload_portal: string;
  ai_receptionist: string;
  billing_module: string;
  reporting: string;
  firm_settings: string;
  can_override_ai_validation: boolean;
  user_id: string;
};

export type ManagerPermissionsResponse = ManagerPermission;

