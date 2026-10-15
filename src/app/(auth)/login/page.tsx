import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { readNotice, safeNextPath } from "@/components/auth/safe-next";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { next, error } = await searchParams;

  return (
    <AuthShell panel="login">
      <LoginForm next={safeNextPath(next)} notice={readNotice(error)} />
    </AuthShell>
  );
}
