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
