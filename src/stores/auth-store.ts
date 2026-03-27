"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { AUTH_STORAGE_KEY } from "@/constants/auth-storage";
import { authApi } from "@/lib/api/auth-api";
import { registerUnauthorizedHandler } from "@/lib/auth/auth-handlers";
import type {
  Bootstrap2faSetupRequest,
  Bootstrap2faSetupResponse,
  Bootstrap2faVerifyRequest,
  LoginRequest,
  MagicLinkRequest,
  Setup2faResponse,
  SignupResponse,
  TokenResponse,
  Verify2faRequest,
} from "@/types/auth";

type PersistedAuth = {
  accessToken: string | null;
  tokenType: string | null;
  expiresAt: number | null;
  twoFaSetupToken: string | null;
  twoFaSecret: string | null;
  twoFaOtpAuthUrl: string | null;
  twoFaSetupExpiresAt: number | null;
};

type AuthState = PersistedAuth & {
  setSession: (tokens: TokenResponse) => void;
  clearSession: () => void;
  login: (payload: LoginRequest) => Promise<TokenResponse>;
  logout: () => Promise<void>;
  twoFaSetupStatus: "idle" | "loading" | "error";
  twoFaSetupError: string | null;
  bootstrap2faSetup: (
    payload: Bootstrap2faSetupRequest
  ) => Promise<Bootstrap2faSetupResponse>;
  bootstrap2faVerify: (
    payload: Bootstrap2faVerifyRequest
  ) => Promise<TokenResponse>;
  setup2fa: () => Promise<Setup2faResponse>;
  verify2fa: (payload: Verify2faRequest) => Promise<string>;
  requestMagicLink: (payload: MagicLinkRequest) => Promise<string>;
  isTokenExpired: () => boolean;
  clearTwoFaBootstrap: () => void;
  setTwoFaBootstrapFromSignup: (
    payload: SignupResponse["two_factor"]
  ) => void;
};

function tokenResponseToState(
  tokens: TokenResponse
): Pick<PersistedAuth, "accessToken" | "tokenType" | "expiresAt"> {
  return {
    accessToken: tokens.access_token,
    tokenType: tokens.token_type,
    expiresAt: Date.now() + tokens.expires_in * 1000,
  };
}

function clearBrowserStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      tokenType: null,
      expiresAt: null,
      twoFaSetupToken: null,
      twoFaSecret: null,
      twoFaOtpAuthUrl: null,
      twoFaSetupExpiresAt: null,
      twoFaSetupStatus: "idle",
      twoFaSetupError: null,

      setSession: (tokens) => set(tokenResponseToState(tokens)),

      clearSession: () =>
        set({
          accessToken: null,
          tokenType: null,
          expiresAt: null,
          twoFaSetupToken: null,
          twoFaSecret: null,
          twoFaOtpAuthUrl: null,
          twoFaSetupExpiresAt: null,
          twoFaSetupStatus: "idle",
          twoFaSetupError: null,
        }),

      clearTwoFaBootstrap: () =>
        set({
          twoFaSetupToken: null,
          twoFaSecret: null,
          twoFaOtpAuthUrl: null,
          twoFaSetupExpiresAt: null,
          twoFaSetupStatus: "idle",
          twoFaSetupError: null,
        }),

      setTwoFaBootstrapFromSignup: (payload) =>
        set({
          twoFaSetupToken: payload.setup_token,
          twoFaSecret: payload.secret,
          twoFaOtpAuthUrl: payload.otpauth_url,
          twoFaSetupExpiresAt: Date.now() + payload.expires_in * 1000,
          twoFaSetupStatus: "idle",
          twoFaSetupError: null,
        }),

      login: async (payload) => {
        const tokens = await authApi.login(payload);
        set(tokenResponseToState(tokens));
        return tokens;
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Logout should still complete locally even if API logout fails.
        } finally {
          get().clearSession();
          clearBrowserStorage();
        }
      },

      bootstrap2faSetup: async (payload) => {
        set({ twoFaSetupStatus: "loading", twoFaSetupError: null });
        try {
          const res = await authApi.bootstrap2faSetup(payload);
          set({
            twoFaSetupToken: res.setup_token,
            twoFaSecret: res.secret,
            twoFaOtpAuthUrl: res.otpauth_url,
            twoFaSetupExpiresAt: Date.now() + res.expires_in * 1000,
            twoFaSetupStatus: "idle",
            twoFaSetupError: null,
          });
          return res;
        } catch (err) {
          const message =
            err instanceof Error && err.message ? err.message : "2FA setup failed";
          set({ twoFaSetupStatus: "error", twoFaSetupError: message });
          throw err;
        }
      },

      bootstrap2faVerify: async (payload) => {
        const tokens = await authApi.bootstrap2faVerify(payload);
        set(tokenResponseToState(tokens));
        get().clearTwoFaBootstrap();
        return tokens;
      },

      setup2fa: () => authApi.setup2fa(),

      verify2fa: (payload) => authApi.verify2fa(payload),

      requestMagicLink: (payload) => authApi.requestMagicLink(payload),

      isTokenExpired: () => {
        const exp = get().expiresAt;
        if (exp == null) return true;
        return Date.now() >= exp;
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        tokenType: state.tokenType,
        expiresAt: state.expiresAt,
        twoFaSetupToken: state.twoFaSetupToken,
        twoFaSecret: state.twoFaSecret,
        twoFaOtpAuthUrl: state.twoFaOtpAuthUrl,
        twoFaSetupExpiresAt: state.twoFaSetupExpiresAt,
      }),
    }
  )
);

registerUnauthorizedHandler(() => {
  useAuthStore.getState().clearSession();
});
