import { Suspense } from "react";
import { PortalProfileView } from "@/features/portal";

export const metadata = {
  title: "Profile | Offlode Portal",
};

export default function PortalProfilePage() {
  return (
    <Suspense fallback={null}>
      <PortalProfileView />
    </Suspense>
  );
}
