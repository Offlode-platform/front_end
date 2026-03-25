import type { Metadata } from "next";
import { TwoFaBootstrapSetupPage } from "@/features/auth";

export const metadata: Metadata = {
  title: "2FA Setup | Offlode",
  description: "Bootstrap and verify your two-factor authentication",
};

export default function TwoFaBootstrapSetupRoute({
  searchParams,
}: {
  searchParams?: { email?: string };
}) {
  return (
    <TwoFaBootstrapSetupPage initialEmail={searchParams?.email} />
  );
}

