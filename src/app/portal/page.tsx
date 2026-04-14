import { Suspense } from "react";
import { PortalPageView } from "@/features/portal";

export default function PortalPage() {
  return (
    <Suspense fallback={null}>
      <PortalPageView />
    </Suspense>
  );
}
