"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { routes } from "@/config/routes";
import { authApi } from "@/lib/api/auth-api";
import { ApiRequestError } from "@/lib/api/errors";
import { useAuthStore } from "@/stores/auth-store";

function toSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.validationDetail?.length) {
      return error.validationDetail.map((d) => d.msg).join("; ");
    }
    return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return "Signup failed. Please try again.";
}

export function SignupForm() {
  const router = useRouter();
  const setTwoFaBootstrapFromSignup = useAuthStore(
    (s) => s.setTwoFaBootstrapFromSignup
  );
  const clearSession = useAuthStore((s) => s.clearSession);
  const clearTwoFaBootstrap = useAuthStore((s) => s.clearTwoFaBootstrap);

  const [organizationName, setOrganizationName] = useState("");
  const [organizationSlug, setOrganizationSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computedSlug = useMemo(() => {
    return slugManuallyEdited ? organizationSlug : toSlug(organizationName);
  }, [organizationName, organizationSlug, slugManuallyEdited]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        organization_name: organizationName.trim(),
        organization_slug: computedSlug,
        user_name: userName.trim(),
        email: email.trim(),
        password,
      };

      const res = await authApi.signup(payload);

      clearSession();
      clearTwoFaBootstrap();
      setTwoFaBootstrapFromSignup(res.two_factor);

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("offlode-login-email", email.trim());
        } catch {
          // ignore
        }
      }

      router.push(routes.login);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-form">
      <h2>Create your workspace</h2>
      <p>Set up your organization and owner account.</p>

      {error ? (
        <div className="login-form-error" role="alert">
          {error}
        </div>
      ) : null}

      <form onSubmit={onSubmit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="signup-org-name">
            Organization name
          </label>
          <input
            id="signup-org-name"
            className="form-input"
            type="text"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            placeholder="Acme Accounting Ltd"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="signup-org-slug">
            Organization slug
          </label>
          <input
            id="signup-org-slug"
            className="form-input"
            type="text"
            value={computedSlug}
            onChange={(e) => {
              setSlugManuallyEdited(true);
              setOrganizationSlug(toSlug(e.target.value));
            }}
            placeholder="acme-accounting"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="signup-user-name">
            Your name
          </label>
          <input
            id="signup-user-name"
            className="form-input"
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="James Blackwell"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="signup-email">
            Email address
          </label>
          <input
            id="signup-email"
            className="form-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="owner@example.com"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="signup-password">
            Password
          </label>
          <input
            id="signup-password"
            className="form-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a strong password"
            disabled={loading}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="login-footer">
        <p>
          Already have an account?{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              router.push(routes.login);
            }}
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
