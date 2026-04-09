export type MagicLinkCreateRequest = {
  client_id: string;
};

export type MagicLinkResponse = {
  token: string;
  expires_at: string;
  link: string;
};
