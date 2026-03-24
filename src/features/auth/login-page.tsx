"use client";

import { LoginBrandPanel } from "./components/login-brand-panel";
import { LoginCredentialsForm } from "./components/login-credentials-form";

export function LoginPage() {
  return (
    <div className="login-page" data-offlode-theme="light">
      <LoginBrandPanel />
      <div className="login-right">
        <LoginCredentialsForm />
      </div>
    </div>
  );
}
