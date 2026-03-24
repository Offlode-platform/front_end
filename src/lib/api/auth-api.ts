import { authenticatedApi } from "./authenticated-client";
import { apiPaths } from "./endpoints";
import { publicApi } from "./public-client";
import type {
  Bootstrap2faSetupRequest,
  Bootstrap2faSetupResponse,
  Bootstrap2faVerifyRequest,
  LoginRequest,
  MagicLinkRequest,
  Setup2faResponse,
  TokenResponse,
  Verify2faRequest,
} from "@/types/auth";

async function readData<T>(p: Promise<{ data: T }>): Promise<T> {
  const { data } = await p;
  return data;
}

export const authApi = {
  login(body: LoginRequest) {
    return readData(
      publicApi.post<TokenResponse>(apiPaths.auth.login, body)
    );
  },

  logout() {
    return authenticatedApi.post(apiPaths.auth.logout).then((r) => r.data);
  },

  bootstrap2faSetup(body: Bootstrap2faSetupRequest) {
    return readData(
      publicApi.post<Bootstrap2faSetupResponse>(
        apiPaths.auth.twoFaBootstrapSetup,
        body
      )
    );
  },

  bootstrap2faVerify(body: Bootstrap2faVerifyRequest) {
    return readData(
      publicApi.post<TokenResponse>(
        apiPaths.auth.twoFaBootstrapVerify,
        body
      )
    );
  },

  setup2fa() {
    return readData(
      authenticatedApi.post<Setup2faResponse>(apiPaths.auth.twoFaSetup)
    );
  },

  verify2fa(body: Verify2faRequest) {
    return readData(
      authenticatedApi.post<string>(apiPaths.auth.twoFaVerify, body)
    );
  },

  requestMagicLink(body: MagicLinkRequest) {
    return readData(
      publicApi.post<string>(apiPaths.auth.magicLink, body)
    );
  },
};
