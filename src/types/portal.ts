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
