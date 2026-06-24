import { authenticatedApi } from "./authenticated-client";
import { apiPaths } from "./endpoints";
import { publicApi } from "./public-client";
import type {
  ActivationCompleteRequest,
  ActivationVerifyResponse,
  Bootstrap2faSetupRequest,
  Bootstrap2faSetupResponse,
  Bootstrap2faVerifyRequest,
  ChangePasswordRequest,
  CurrentUser,
  Disable2faRequest,
  LoginRequest,
  MagicLinkRequest,
  Setup2faResponse,
  SignupRequest,
  SignupResponse,
  TokenResponse,
  UpdateMeRequest,
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

  signup(body: SignupRequest) {
    return readData(
      publicApi.post<SignupResponse>(apiPaths.auth.signup, body)
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

  // Team-member account activation (set-your-own-password invite flow)
  verifyActivation(token: string) {
    return readData(
      publicApi.get<ActivationVerifyResponse>(
        `${apiPaths.auth.activateVerify}?token=${encodeURIComponent(token)}`
      )
    );
  },

  completeActivation(body: ActivationCompleteRequest) {
    return readData(
      publicApi.post<TokenResponse>(apiPaths.auth.activateComplete, body)
    );
  },

  // Current user endpoints
  me() {
    return readData(authenticatedApi.get<CurrentUser>(apiPaths.auth.me));
  },

  updateMe(body: UpdateMeRequest) {
    return readData(authenticatedApi.patch<CurrentUser>(apiPaths.auth.updateMe, body));
  },

  changePassword(body: ChangePasswordRequest) {
    return readData(
      authenticatedApi.post<{ status: string }>(apiPaths.auth.changePassword, body),
    );
  },

  disable2fa(body: Disable2faRequest) {
    return readData(
      authenticatedApi.post<{ status: string }>(apiPaths.auth.twoFaDisable, body),
    );
  },
};
