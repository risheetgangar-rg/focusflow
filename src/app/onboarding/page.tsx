import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { requireSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Welcome", robots: { index: false } };

export default async function OnboardingPage() {
  const session = await requireSession();
  if (session.profile.onboardingCompleted) redirect("/today");

  return <OnboardingWizard initialName={session.profile.displayName ?? ""} isGuest={session.isGuest} />;
}
