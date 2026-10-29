import type { Metadata } from "next";
import { ResetPassword } from "@/components/auth/password-reset";

export const metadata: Metadata = { title: "New password" };

export default function ResetPasswordPage() {
  return <ResetPassword />;
}
