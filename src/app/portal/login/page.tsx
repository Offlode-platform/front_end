import { Suspense } from "react";
import { PortalLoginView } from "@/features/portal";

export const metadata = {
  title: "Client Portal Login | Offlode",
  description: "Sign in to your document portal",
};

export default function PortalLoginPage() {
  return (
    <Suspense fallback={null}>
      <PortalLoginView />
    </Suspense>
  );
}
