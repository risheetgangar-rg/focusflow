import type { Metadata } from "next";
import { BrainDumpForm } from "@/components/brain-dump/brain-dump-form";
import { MAX_CHARS } from "@/components/brain-dump/brain-dump-items";
import { requireSession } from "@/lib/auth/session";
import { listNotes } from "@/repositories/welcome-repository";

export const metadata: Metadata = { title: "Brain dump" };

export default async function BrainDumpPage({ searchParams }: { searchParams: Promise<{ text?: string | string[] }> }) {
  const { text } = await searchParams;
  // Quick capture hands over whatever was typed when it found several tasks in one line.
  const prefill = typeof text === "string" ? text.slice(0, MAX_CHARS) : "";
  const { supabase, userId } = await requireSession();
  const notes = await listNotes(supabase, userId, 12).catch(() => []);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="animate-rise mb-8 sm:mb-10">
        <p className="text-eyebrow text-muted-foreground">Get it out of your head</p>
        <h1 className="mt-2 font-display text-5xl leading-none sm:text-7xl">Brain dump</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Write it however it comes out. I&apos;ll split it into tasks, pick up the dates, and let you check everything before it&apos;s saved.
        </p>
      </header>
      {/* Keyed so a new hand-off from quick capture starts a fresh form. */}
      <BrainDumpForm key={prefill} defaultText={prefill} />

      {notes.length > 0 && (
        <section aria-labelledby="notes" className="mt-14 space-y-4">
          <h2 id="notes" className="font-display text-3xl">
            Your notes
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {notes.map((note) => (
              <li key={note.id} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-soft">
                {note.body}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
