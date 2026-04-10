import { authenticatedApi } from "./authenticated-client";
import { apiPaths } from "./endpoints";

async function readData<T>(p: Promise<{ data: T }>): Promise<T> {
  const { data } = await p;
  return data;
}

export type XeroConnectionStatus = {
  connected: boolean;
  tenant_id: string | null;
  tenant_name: string | null;
  sync_status: string | null;
  expires_at: string | null;
  last_sync_at: string | null;
  is_expired: boolean;
  needs_refresh: boolean;
  last_import_session_id: string | null;
  last_import_status: string | null;
  last_import_at: string | null;
};

export type XeroAuthorizeUrlResponse = {
  authorization_url: string;
};

export const integrationsApi = {
  xeroStatus() {
    return readData<XeroConnectionStatus>(
      authenticatedApi.get(apiPaths.integrations.xeroStatus),
    );
  },

  /**
   * Fetch the Xero OAuth authorization URL. The caller is expected to
   * navigate the browser to it via window.location.href so that the user
   * lands on the Xero login page. After authorizing, Xero redirects back
   * to the backend callback, which in turn redirects to /imports?xero=...
   */
  getXeroAuthorizeUrl() {
    return readData<XeroAuthorizeUrlResponse>(
      authenticatedApi.post(apiPaths.xero.authorizeUrl),
    );
  },

  disconnectXero() {
    return authenticatedApi.delete(apiPaths.xero.disconnect);
  },
};
