import type { Metadata } from "next";
import { LoginPage } from "@/features/auth";

export const metadata: Metadata = {
  title: "Sign in | Offlode",
  description: "Sign in to your Offlode account",
};

export default function LoginRoutePage() {
  return <LoginPage />;
}
