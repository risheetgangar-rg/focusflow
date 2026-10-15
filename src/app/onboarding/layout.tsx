import { AppProviders } from "@/components/providers/app-providers";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
