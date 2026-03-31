export type Organization = {
  name: string;
  slug: string;
  id: string;
  subscription_status: string;
  subscription_tier: string;
  xero_connected: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateOrganizationRequest = {
  name: string;
  slug: string;
  subscription_tier: string;
};

export type CreateOrganizationResponse = Organization;

export type ListOrganizationsQuery = {
  skip?: number;
  limit?: number;
};

export type ListOrganizationsResponse = Organization[];

export type GetOrganizationResponse = Organization;

export type UpdateOrganizationRequest = {
  name?: string;
  subscription_status?: string;
  subscription_tier?: string;
  xero_connected?: boolean;
};

export type UpdateOrganizationResponse = Organization;

