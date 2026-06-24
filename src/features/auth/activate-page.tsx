"use client";

import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { routes } from "@/config/routes";
import { authApi } from "@/lib/api/auth-api";
import { ApiRequestError } from "@/lib/api/errors";
import { useAuthStore } from "@/stores/auth-store";
import type { ActivationVerifyResponse } from "@/types/auth";
import { LoginBrandPanel } from "./components/login-brand-panel";

function formatError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.isValidationError && error.validationDetail?.length) {
      return error.validationDetail.map((d) => d.msg).join("; ");
    }
    return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}

type Phase = "verifying" | "invalid" | "form" | "submitting" | "already";

export function ActivatePage({ token }: { token?: string }) {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const loadCurrentUser = useAuthStore((s) => s.loadCurrentUser);

  const [phase, setPhase] = useState<Phase>("verifying");
  const [invite, setInvite] = useState<ActivationVerifyResponse | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Verify the token on mount so we can greet the invitee by name.
  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setError("This activation link is missing its token. Please use the link from your email.");
      setPhase("invalid");
      return;
    }
    authApi
      .verifyActivation(token)
      .then((res) => {
        if (cancelled) return;
        setInvite(res);
        setPhase(res.already_activated ? "already" : "form");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(formatError(err));
        setPhase("invalid");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setPhase("submitting");
    try {
      const tokens = await authApi.completeActivation({ token, password });
      setSession(tokens);
      void loadCurrentUser();
      window.location.href = routes.dashboard;
    } catch (err) {
      setError(formatError(err));
      setPhase("form");
    }
  };

  return (
    <div className="login-page">
      <LoginBrandPanel />

      <div className="login-right">
        <div className="login-form">
          <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-flex", alignItems: "center" }}>
              <Lock size={18} color="var(--primary-teal)" />
            </span>
            Activate your account
          </h2>

          {phase === "verifying" ? (
            <p>Checking your invitation…</p>
          ) : null}

          {phase === "invalid" ? (
            <>
              <p>This activation link can&apos;t be used.</p>
              <div className="login-form-error" role="alert">
                {error ?? "The link is invalid or has expired."}
              </div>
              <p style={{ marginTop: 12, fontSize: 14, color: "var(--text-tertiary)" }}>
                Ask your firm administrator to resend your invite, then try the new link.
              </p>
              <div className="login-footer" style={{ marginTop: 14 }}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(routes.login);
                  }}
                >
                  Back to login
                </a>
              </div>
            </>
          ) : null}

          {phase === "already" ? (
            <>
              <p>This account is already active.</p>
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: 14 }}
                onClick={() => router.push(routes.login)}
              >
                Go to sign in
              </button>
            </>
          ) : null}

          {phase === "form" || phase === "submitting" ? (
            <>
              <p>
                {invite
                  ? `Welcome, ${invite.name}. Set a password to finish setting up your ${invite.organization_name} account.`
                  : "Set a password to finish setting up your account."}
              </p>

              {error ? (
                <div className="login-form-error" role="alert">
                  {error}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} noValidate>
                {invite ? (
                  <div className="form-group">
                    <label className="form-label" htmlFor="activate-email">
                      Email address
                    </label>
                    <input
                      id="activate-email"
                      type="email"
                      className="form-input"
                      value={invite.email}
                      readOnly
                      disabled
                    />
                  </div>
                ) : null}

                <div className="form-group">
                  <label className="form-label" htmlFor="activate-password">
                    Choose a password
                  </label>
                  <input
                    id="activate-password"
                    name="password"
                    type="password"
                    className="form-input"
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={phase === "submitting"}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="activate-confirm">
                    Confirm password
                  </label>
                  <input
                    id="activate-confirm"
                    name="confirm"
                    type="password"
                    className="form-input"
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    disabled={phase === "submitting"}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={phase === "submitting"}
                >
                  {phase === "submitting" ? "Activating…" : "Activate & sign in"}
                </button>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
