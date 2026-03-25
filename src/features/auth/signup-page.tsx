"use client";

import { LoginBrandPanel } from "./components/login-brand-panel";
import { SignupForm } from "./components/signup-form";

export function SignupPage() {
  return (
    <div className="login-page" data-offlode-theme="light">
      <LoginBrandPanel />
      <div className="login-right">
        <SignupForm />
      </div>
    </div>
  );
}
