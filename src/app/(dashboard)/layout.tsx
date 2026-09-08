import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "../(auth)/actions";
import { Button } from "@/components/ui/button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (isSupabaseConfigured && !user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {!isSupabaseConfigured && (
        <div className="bg-amber-100 px-6 py-2 text-center text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Local demo — Supabase isn&apos;t connected yet, so accounts and data aren&apos;t real.
        </div>
      )}
      <header className="flex items-center justify-between border-b px-6 py-4">
        <nav className="flex gap-4 text-sm font-medium">
          <Link href="/today">Today</Link>
          <Link href="/settings">Settings</Link>
        </nav>
        {isSupabaseConfigured && (
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        )}
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
