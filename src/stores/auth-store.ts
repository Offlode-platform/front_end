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
  TokenResponse,
  Verify2faRequest,
} from "@/types/auth";

type PersistedAuth = {
  accessToken: string | null;
  tokenType: string | null;
  expiresAt: number | null;
};

type AuthState = PersistedAuth & {
  setSession: (tokens: TokenResponse) => void;
  clearSession: () => void;
  login: (payload: LoginRequest) => Promise<TokenResponse>;
  logout: () => Promise<void>;
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      tokenType: null,
      expiresAt: null,

      setSession: (tokens) => set(tokenResponseToState(tokens)),

      clearSession: () =>
        set({
          accessToken: null,
          tokenType: null,
          expiresAt: null,
        }),

      login: async (payload) => {
        const tokens = await authApi.login(payload);
        set(tokenResponseToState(tokens));
        return tokens;
      },

      logout: async () => {
        try {
          await authApi.logout();
        } finally {
          get().clearSession();
        }
      },

      bootstrap2faSetup: (payload) => authApi.bootstrap2faSetup(payload),

      bootstrap2faVerify: async (payload) => {
        const tokens = await authApi.bootstrap2faVerify(payload);
        set(tokenResponseToState(tokens));
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
      }),
    }
  )
);

registerUnauthorizedHandler(() => {
  useAuthStore.getState().clearSession();
});
