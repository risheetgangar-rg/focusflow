const QUESTIONS = [
  {
    q: "How is this different from a to-do list?",
    a: "A to-do list shows you the pile. Unstuck shows you one thing, tells you why it's first, and gives you a tiny first step. When you've been away, it shows one small win instead of everything you didn't get to.",
  },
  {
    q: "What if I miss a week?",
    a: "Nothing bad happens. Your tasks are parked, not lost. You'll see one tiny win when you're back, and one tap moves your plan forward (with Undo, in case you change your mind).",
  },
  { q: "Do you have streaks?", a: "No. Nothing here counts the days you missed." },
  { q: "Is it only for ADHD?", a: "Built for ADHD brains. Anyone can use it." },
];

/** A short FAQ: plain answers, open one at a time. Works with no JavaScript. */
export function Faq() {
  return (
    <section id="faq" className="scroll-mt-16 pb-24 sm:pb-32">
      <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
        <h2 className="font-display text-5xl leading-tight sm:text-6xl">Questions</h2>
        <div className="mt-8 divide-y divide-border rounded-3xl border border-border bg-card">
          {QUESTIONS.map(({ q, a }) => (
            <details key={q} className="group px-5 py-4 sm:px-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">
                {q}
                <span aria-hidden className="text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 leading-relaxed text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/** The one sentence to remember. */
export function PileLine() {
  return (
    <section className="px-5 py-20 text-center sm:py-28">
      <p className="mx-auto max-w-4xl font-display text-4xl leading-tight text-balance sm:text-6xl">
        A to-do list shows you the pile. <em className="text-brand">Unstuck shows you one thing.</em>
      </p>
    </section>
  );
}
