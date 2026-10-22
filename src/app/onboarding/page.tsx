import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HelpQuestion } from "@/components/onboarding/help-question";
import { requireSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Welcome", robots: { index: false } };

/** First visit: one skippable question, then straight to Today. */
export default async function OnboardingPage() {
  const session = await requireSession();
  if (session.profile.onboardingCompleted) redirect("/today");
  return <HelpQuestion />;
}
