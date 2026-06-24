import { Suspense } from "react";
import { PortalLayoutChrome } from "@/features/portal";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <PortalLayoutChrome>{children}</PortalLayoutChrome>
    </Suspense>
  );
}
