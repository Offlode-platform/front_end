import { Suspense } from "react";
import { PortalForgotPasswordView } from "@/features/portal";

export const metadata = { title: "Forgot Password | Offlode Portal" };

export default function PortalForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <PortalForgotPasswordView />
    </Suspense>
  );
}
