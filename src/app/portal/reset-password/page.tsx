import { Suspense } from "react";
import { PortalResetPasswordView } from "@/features/portal";

export const metadata = { title: "Reset Password | Offlode Portal" };

export default function PortalResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <PortalResetPasswordView />
    </Suspense>
  );
}
