"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AnimatePresence, m } from "motion/react";
import { ArrowRight, Check, Mic, Sparkles } from "lucide-react";
import {
  confirmBrainDumpAction,
  parseBrainDumpAction,
  type BrainDumpParseState,
  type ConfirmState,
} from "@/app/(dashboard)/brain-dump/actions";
import {
  EXAMPLES,
  MAX_CHARS,
  hasBlankTitle,
  saveLabel,
  toEditable,
  toPayload,
  wordCount,
  type EditableItem,
} from "@/components/brain-dump/brain-dump-items";
import { ReviewCard } from "@/components/brain-dump/review-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const parseInitial: BrainDumpParseState = {};
const confirmInitial: ConfirmState = {};
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Write it all down, see it split into tasks, fix anything, then save.
 * Nothing is stored as a task until the very last button.
 */
export function BrainDumpForm({
  source = "text",
  defaultText = "",
}: {
  source?: "text" | "voice";
  defaultText?: string;
}) {
  const [parseState, parseAction, parsing] = useActionState(parseBrainDumpAction, parseInitial);
  const [confirmState, confirmAction, confirming] = useActionState(confirmBrainDumpAction, confirmInitial);

  const [text, setText] = useState(defaultText);
  const [items, setItems] = useState<EditableItem[] | null>(null);
  const [batch, setBatch] = useState(0);
  const [saved, setSaved] = useState<string[] | null>(null);
  const [savedLabel, setSavedLabel] = useState("");

  // React to a fresh server result in the same render (no effect needed).
  const [seenParse, setSeenParse] = useState(parseState);
  if (parseState !== seenParse) {
    setSeenParse(parseState);
    if (parseState.items) {
      setItems(toEditable(parseState.items, batch + 1));
      setBatch(batch + 1);
    }
  }
  const [seenConfirm, setSeenConfirm] = useState(confirmState);
  if (confirmState !== seenConfirm) {
    setSeenConfirm(confirmState);
    if (confirmState.message && items) {
      setSaved(items.filter((item) => item.choice !== "skip").map((item) => item.title.trim()));
      setSavedLabel(saveLabel(items));
      setItems(null);
      setText("");
    }
  }

  function updateItem(key: string, patch: Partial<EditableItem>) {
    setItems((prev) => prev?.map((item) => (item.key === key ? { ...item, ...patch } : item)) ?? null);
  }

  function removeItem(key: string) {
    setItems((prev) => {
      const next = prev?.filter((item) => item.key !== key) ?? null;
      return next && next.length > 0 ? next : null;
    });
  }

  /* ---------- 3. Saved ---------- */
  if (saved) {
    return (
      <m.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="rounded-[2rem] bg-tint-mint px-6 py-10 text-center sm:px-10 sm:py-14"
      >
        <span className="mx-auto grid size-14 animate-pop place-items-center rounded-full bg-card/80">
          <Check size={26} />
        </span>
        <p className="mt-5 font-display text-5xl sm:text-6xl">Saved {savedLabel}.</p>
        <ul className="mx-auto mt-5 max-w-md space-y-1 text-foreground/70">
          {saved.slice(0, 4).map((title, i) => (
            <li key={`${title}-${i}`} className="truncate">
              {title}
            </li>
          ))}
          {saved.length > 4 && <li>and {saved.length - 4} more</li>}
        </ul>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/tasks" className={buttonVariants({ variant: "default", size: "lg" })}>
            See your tasks <ArrowRight />
          </Link>
          <Button variant="outline" size="lg" onClick={() => setSaved(null)}>
            Dump some more
          </Button>
        </div>
      </m.div>
    );
  }

  /* ---------- 2. Review ---------- */
  if (items) {
    return (
      <m.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="space-y-6"
      >
        <div>
          <p className="text-eyebrow">Step 2 of 2</p>
          <h2 className="mt-1.5 font-display text-4xl sm:text-5xl">
            I found <em className="text-brand">{items.length} {items.length === 1 ? "thing" : "things"}</em>.
          </h2>
          <p className="mt-2 text-muted-foreground">Mark each one as a task, a note, or skip it. Fix anything that looks off. Nothing is saved until you press Save.</p>
        </div>

        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {items.map((item, i) => (
              <m.div
                key={item.key}
                layout="position"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25, delay: i * 0.04, ease: EASE }}
              >
                <ReviewCard
                  item={item}
                  index={i}
                  onChange={(patch) => updateItem(item.key, patch)}
                  onRemove={() => removeItem(item.key)}
                />
              </m.div>
            ))}
          </AnimatePresence>
        </ul>

        {confirmState.error && (
          <p role="alert" className="text-sm text-destructive">
            {confirmState.error}
          </p>
        )}

        <form action={confirmAction} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input type="hidden" name="items" value={JSON.stringify(toPayload(items))} />
          <input type="hidden" name="source" value={source} />
          <Button
            type="submit"
            variant="brand"
            size="xl"
            disabled={confirming || hasBlankTitle(items) || items.every((i) => i.choice === "skip")}
            className="sm:min-w-56"
          >
            {confirming ? "Saving…" : `Save ${saveLabel(items)}`}
          </Button>
          <Button type="button" variant="ghost" size="lg" onClick={() => setItems(null)} disabled={confirming}>
            Back to my text
          </Button>
        </form>
        {hasBlankTitle(items) && <p className="text-sm text-muted-foreground">Give each task a name, or remove it.</p>}
      </m.div>
    );
  }

  /* ---------- 1. Write ---------- */
  const words = wordCount(text);
  return (
    <form action={parseAction} className="space-y-5">
      <input type="hidden" name="source" value={source} />

      <div className="rounded-[2rem] border border-border bg-card p-3 shadow-soft transition-shadow focus-within:shadow-lift sm:p-4">
        <Textarea
          name="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_CHARS}
          rows={7}
          required
          autoFocus
          aria-label="Everything on your mind"
          placeholder="Everything on your mind, in any order. “Tomorrow call Rahul at 6, finish the presentation, pay the electricity bill Friday…”"
          className="min-h-52 resize-none border-0 bg-transparent px-3 py-3 text-lg leading-relaxed shadow-none hover:border-0 focus-visible:ring-0 sm:text-xl"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 pt-1 pb-1">
          <span className="text-sm text-muted-foreground tabular-nums">
            {words === 0 ? "Messy is fine" : `${words} ${words === 1 ? "word" : "words"}`}
          </span>
          <Button type="submit" variant="brand" size="lg" disabled={parsing || words === 0}>
            <Sparkles /> {parsing ? "Sorting it out…" : "Sort it out"}
          </Button>
        </div>
      </div>

      {parseState.support && (
        <div role="alert" className="rounded-3xl bg-tint-lavender p-5 sm:p-6">
          <p className="font-display text-3xl">That sounds really heavy.</p>
          <p className="mt-2 text-foreground/80">
            Your list can wait. If you&apos;re thinking about hurting yourself, please talk to someone right now. In India you can
            call Tele-MANAS on <a href="tel:14416" className="font-semibold underline underline-offset-4">14416</a> (free, 24/7),
            or reach a friend or family member you trust. If you&apos;re elsewhere, your local emergency number can connect you.
          </p>
        </div>
      )}

      {parseState.error && (
        <p role="alert" className="px-1 text-sm text-destructive">
          {parseState.error}
        </p>
      )}

      <div className="space-y-3">
        <p className="text-eyebrow">Not sure where to start? Try one</p>
        <div className="flex flex-col gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setText(example)}
              className="rounded-2xl border border-border bg-card/60 px-4 py-3 text-left text-sm text-muted-foreground transition-all hover:-translate-y-px hover:border-foreground/25 hover:bg-card hover:text-foreground hover:shadow-soft"
            >
              {example}
            </button>
          ))}
        </div>
        {source === "text" && (
          <p className="pt-1 text-sm text-muted-foreground">
            Easier to say it out loud?{" "}
            <Link href="/voice" className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-4 hover:text-brand">
              <Mic size={14} /> Use your voice
            </Link>
          </p>
        )}
      </div>
    </form>
  );
}
