import { AppProviders } from "@/components/providers/app-providers";

/** Focus Mode sits outside the app shell (no sidebar or nav) but still needs the person's context and celebrations. */
export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
