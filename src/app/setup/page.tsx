import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { CopyButton } from "@/components/marketing/copy-button";
import { LogoLink } from "@/components/marketing/logo";
import { Rise } from "@/components/marketing/rise";
import { buttonVariants } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Finish setting up", robots: { index: false } };

// Placeholders only: the real values come from your own Supabase project, and stay in your .env.local.
const ENV_TEMPLATE = `NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000`;

const STEPS = [
  {
    title: "Create a Supabase project",
    body: "It's free to start. Once it's ready, run the SQL files in the supabase/migrations folder to set up the tables.",
  },
  {
    title: "Copy your project's keys",
    body: "In Supabase, open Project Settings, then API, and copy the project URL and the anon (public) key. For guest mode, also switch on anonymous sign-ins under Authentication.",
  },
  {
    title: "Add them to .env.local",
    body: "Create a file called .env.local in the project folder with these three lines. The site URL is where email links (confirm, reset) should point back to.",
    code: true,
  },
  {
    title: "Restart the dev server",
    body: "Stop it, start it again, and refresh this page. That's everything.",
  },
];

export default function SetupPage() {
  // Already connected: nothing to set up, so don't show the instructions.
  if (isSupabaseConfigured) redirect("/");

  return (
    <main id="main" className="bg-grain relative flex-1 overflow-hidden px-5 py-8 sm:px-8">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        <div className="animate-float-slow absolute -top-40 -left-40 size-[34rem] rounded-full bg-tint-mint blur-3xl" />
        <div className="animate-float-slow absolute -top-24 -right-40 size-[30rem] rounded-full bg-tint-lavender blur-3xl [animation-delay:-5s]" />
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <LogoLink />

        <div className="py-16 sm:py-24">
          <Rise>
            <p className="text-eyebrow">One quick thing</p>
            <h1 className="mt-4 font-display text-5xl leading-[1.02] tracking-[-0.03em] sm:text-7xl">
              Let&apos;s connect <em className="text-brand">Supabase.</em>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              This copy of Unstuck isn&apos;t connected to a database yet, so there&apos;s nowhere to keep your tasks.
              It takes about five minutes, and you only do it once.
            </p>
          </Rise>

          <Rise delay={0.12}>
            <ol className="mt-12 space-y-4">
              {STEPS.map((step, index) => (
                <li key={step.title} className="rounded-3xl border border-border/80 bg-card p-6 shadow-soft sm:p-7">
                  <div className="flex items-start gap-4">
                    <span
                      aria-hidden
                      className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft font-display text-xl text-brand"
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold tracking-tight">{step.title}</h2>
                      <p className="mt-1.5 leading-relaxed text-muted-foreground">{step.body}</p>
                      {step.code ? (
                        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-muted">
                          <div className="flex items-center justify-between gap-3 border-b border-border/80 px-4 py-2.5">
                            <span className="font-mono text-xs text-muted-foreground">.env.local</span>
                            <CopyButton text={ENV_TEMPLATE} label="Copy lines" />
                          </div>
                          <pre className="overflow-x-auto px-4 py-4 font-mono text-[0.8rem] leading-relaxed">
                            <code>{ENV_TEMPLATE}</code>
                          </pre>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </Rise>

          <Rise delay={0.2}>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/" className={buttonVariants({ size: "lg" })}>
                Back to the start
                <ArrowRight aria-hidden />
              </Link>
              <p className="text-sm text-muted-foreground">The anon key is safe to use in the browser. Keep any secret keys out of NEXT_PUBLIC_ variables.</p>
            </div>
          </Rise>
        </div>
      </div>
    </main>
  );
}
