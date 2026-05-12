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

export type IntegrationsConfigStatus = {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  email_from: string | null;
  sms_from: string | null;
  whatsapp_phone_number_id: string | null;
};

export type TestResult = {
  service: string;
  status: string;
  detail: Record<string, unknown> | null;
};

export const integrationsApi = {
  xeroStatus() {
    return readData<XeroConnectionStatus>(
      authenticatedApi.get(apiPaths.integrations.xeroStatus),
    );
  },

  testStatus() {
    return readData<IntegrationsConfigStatus>(
      authenticatedApi.get(apiPaths.integrations.testStatus),
    );
  },

  testEmail(to: string, message?: string) {
    return readData<TestResult>(
      authenticatedApi.post(apiPaths.integrations.testEmail, { to, message }),
    );
  },

  testSms(to: string, message?: string) {
    return readData<TestResult>(
      authenticatedApi.post(apiPaths.integrations.testSms, { to, message }),
    );
  },

  testWhatsapp(to: string, message?: string) {
    return readData<TestResult>(
      authenticatedApi.post(apiPaths.integrations.testWhatsapp, { to, message }),
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
