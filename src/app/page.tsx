import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Landing } from "@/components/marketing/landing";

export default async function HomePage() {
  // Signed-in people go straight to the app. getSession() is null when signed out
  // (or when Supabase isn't configured), and the landing page renders fine either way.
  const session = await getSession();
  if (session) redirect("/today");

  return <Landing />;
}
