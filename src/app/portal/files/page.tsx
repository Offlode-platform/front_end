import { Suspense } from "react";
import { PortalFilesView } from "@/features/portal";

export const metadata = {
  title: "My Files | Offlode Portal",
};

export default function PortalFilesPage() {
  return (
    <Suspense fallback={null}>
      <PortalFilesView />
    </Suspense>
  );
}
