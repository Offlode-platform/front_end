import type { Metadata } from "next";
import { SignupPage } from "@/features/auth/signup-page";

export const metadata: Metadata = {
  title: "Sign up | Offlode",
  description: "Create your Offlode workspace",
};

export default function SignupRoutePage() {
  return <SignupPage />;
}
