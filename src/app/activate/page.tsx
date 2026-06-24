import type { Metadata } from "next";
import { ActivatePage } from "@/features/auth";

export const metadata: Metadata = {
  title: "Activate your account | Offlode",
  description: "Set your password and activate your Offlode account",
};

export default function ActivateRoute({
  searchParams,
}: {
  searchParams?: { token?: string };
}) {
  return <ActivatePage token={searchParams?.token} />;
}
