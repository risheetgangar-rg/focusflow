"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Keyboard, ListChecks, Mic, Repeat, Sparkles, Square, X } from "lucide-react";
import { addManyAction } from "@/app/(dashboard)/today/card-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PillGroup } from "@/components/ui/pill-group";
import { splitSpoken } from "@/lib/tasks/voice-split";
import { cn } from "@/lib/utils";
import { PRIORITIES } from "./task-form";

/*
 * Adding, one question at a time: task or reminder? For a task: is it a
 * non-negotiable (on a rhythm, like laundry) or new stuff (a one-off)? Then
 * say or type everything, and check each item before it's saved.
 */

type Level = "low" | "medium" | "high" | "critical";
/** reminder · routine (a non-negotiable) · fresh (new stuff) */
type Lane = "reminder" | "routine" | "fresh";
type Rhythm = "daily" | "twice_weekly" | "thrice_weekly" | "weekly";

interface Draft {
  key: number;
  title: string;
  lane: Lane;
  level: Level;
  rhythm: Rhythm;
  /** Value of the datetime-local input, in the person's own clock. */
  at: string;
}

const RHYTHMS = [
  { value: "daily", label: "Every day" },
  { value: "thrice_weekly", label: "3× a week" },
  { value: "twice_weekly", label: "2× a week" },
  { value: "weekly", label: "Every week" },
];

const LANE_TITLE: Record<Lane, string> = {
  reminder: "Reminders",
  routine: "Non-negotiables",
  fresh: "New stuff",
};

const EXAMPLE: Record<Lane, string> = {
  reminder: "Take my meds at 9, call the bank tomorrow…",
  routine: "Laundry, gym, water the plants…",
  fresh: "Pay rent, book the dentist, send the report…",
};

let nextKey = 0;

function Choice({
  icon: Icon,
  title,
  hint,
  onClick,
}: {
  icon: typeof Bell;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 items-center gap-3 rounded-2xl border-2 border-border bg-card p-4 text-left shadow-[0_4px_0_var(--border)] transition-transform hover:border-brand active:translate-y-[4px] active:shadow-none"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
        <Icon size={22} />
      </span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </button>
  );
}

export function VoiceAdd() {
  const router = useRouter();
  // Step 1 asks task or reminder; step 2 (tasks only) asks which kind; then the mic.
  const [lane, setLane] = useState<Lane | null>(null);
  const [askKind, setAskKind] = useState(false);
  const [phase, setPhase] = useState<"idle" | "recording" | "hearing">("idle");
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const recorder = useRef<MediaRecorder | null>(null);

  function addFrom(transcript: string) {
    if (!lane) return;
    const items = splitSpoken(transcript);
    if (items.length === 0) {
      setMessage("Didn't catch anything. Try again?");
      return;
    }
    setMessage(null);
    setDrafts((d) => [
      ...d,
      ...items.map((i) => ({ key: nextKey++, title: i.title, lane, level: "medium" as Level, rhythm: "daily" as Rhythm, at: "" })),
    ]);
  }

  async function startRecording() {
    setMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setPhase("hearing");
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        try {
          const res = await fetch("/api/transcribe", { method: "POST", headers: { "Content-Type": blob.type }, body: blob });
          const data = (await res.json()) as { transcript?: string; error?: string };
          if (!res.ok || data.error) {
            setMessage(data.error ?? "Couldn't hear that. Try typing instead.");
            setTyping(true);
          } else addFrom(data.transcript ?? "");
        } catch {
          setMessage("Couldn't reach the voice service. Try typing instead.");
          setTyping(true);
        } finally {
          setPhase("idle");
        }
      };
      recorder.current = rec;
      rec.start();
      setPhase("recording");
    } catch {
      setMessage("The mic is blocked. Allow it in your browser, or type instead.");
      setTyping(true);
    }
  }

  function update(key: number, patch: Partial<Draft>) {
    setDrafts((d) => d.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  }

  function reset() {
    setLane(null);
    setAskKind(false);
    setTyping(false);
    setMessage(null);
  }

  function save() {
    const items = drafts.filter((d) => d.title.trim());
    if (items.some((d) => d.lane === "reminder" && !d.at)) {
      setMessage("Give each reminder a time.");
      return;
    }
    startSaving(async () => {
      const result = await addManyAction(
        items.map((d) => ({
          title: d.title.trim(),
          kind: d.lane === "reminder" ? "reminder" : "task",
          level: d.level,
          repeat: d.lane === "routine" ? d.rhythm : null,
          at: d.at ? new Date(d.at).toISOString() : null,
        })),
      );
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setDrafts([]);
      setText("");
      reset();
      setMessage(`Added ${result.count}. Nice.`);
      router.refresh();
    });
  }

  return (
    <section className="rounded-[2rem] border border-border bg-card p-5 shadow-soft sm:p-7">
      {!lane && !askKind && (
        <div className="space-y-3">
          <p className="text-center font-semibold">Is it a task or a reminder?</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Choice icon={ListChecks} title="Task" hint="Something you do. Has a timer." onClick={() => setAskKind(true)} />
            <Choice icon={Bell} title="Reminder" hint="A nudge at a time. No timer." onClick={() => setLane("reminder")} />
          </div>
        </div>
      )}

      {!lane && askKind && (
        <div className="space-y-3">
          <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={14} /> Back
          </button>
          <p className="text-center font-semibold">What kind of task?</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Choice icon={Repeat} title="Non-negotiable" hint="On a rhythm: daily, 2× or 3× a week. Like laundry." onClick={() => setLane("routine")} />
            <Choice icon={Sparkles} title="New stuff" hint="A one-off, or once in a while." onClick={() => setLane("fresh")} />
          </div>
        </div>
      )}

      {lane && (
        <div className="flex flex-col items-center gap-3 text-center">
          <button type="button" onClick={reset} className="inline-flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={14} /> {LANE_TITLE[lane]}
          </button>
          <button
            type="button"
            onClick={() => (phase === "recording" ? recorder.current?.stop() : startRecording())}
            disabled={phase === "hearing"}
            aria-label={phase === "recording" ? "Stop recording" : "Say your tasks"}
            className={cn(
              "grid size-20 place-items-center rounded-full text-white shadow-[0_5px_0_#0b2c86] transition-transform active:translate-y-[5px] active:shadow-none disabled:opacity-60",
              phase === "recording" ? "animate-pulse bg-primary" : "bg-brand",
            )}
          >
            {phase === "recording" ? <Square size={28} fill="currentColor" /> : <Mic size={32} />}
          </button>
          <p className="font-semibold">
            {phase === "recording" ? "Listening… tap to stop" : phase === "hearing" ? "Writing it down…" : "Say them all, or type them"}
          </p>
          <p className="text-sm text-muted-foreground">Like: &ldquo;{EXAMPLE[lane]}&rdquo;</p>
          {!typing && (
            <button type="button" onClick={() => setTyping(true)} className="inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4">
              <Keyboard size={15} /> Type instead
            </button>
          )}
        </div>
      )}

      {lane && typing && (
        <form
          className="mt-5 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) addFrom(text);
            setText("");
          }}
        >
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={EXAMPLE[lane]} aria-label="Type your tasks" className="h-12" />
          <Button type="submit" variant="outline" size="lg">
            Add
          </Button>
        </form>
      )}

      {message && <p className="mt-4 text-center text-sm font-medium text-brand">{message}</p>}

      {drafts.length > 0 && (
        <div className="mt-6 space-y-3">
          {drafts.map((d) => (
            <div key={d.key} className="rounded-2xl border border-border p-3.5">
              <div className="flex items-center gap-2">
                {d.lane === "reminder" ? (
                  <Bell size={18} className="shrink-0 text-brand" />
                ) : d.lane === "routine" ? (
                  <Repeat size={18} className="shrink-0 text-brand" />
                ) : (
                  <ListChecks size={18} className="shrink-0 text-brand" />
                )}
                <Input value={d.title} onChange={(e) => update(d.key, { title: e.target.value })} aria-label="Title" className="h-10 font-medium" />
                <Button variant="ghost" size="icon-sm" aria-label={`Remove ${d.title}`} onClick={() => setDrafts((x) => x.filter((y) => y.key !== d.key))}>
                  <X />
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <PillGroup name={`level-${d.key}`} ariaLabel="Priority" options={PRIORITIES} value={d.level} onValueChange={(v) => update(d.key, { level: v as Level })} optionClassName="h-8 px-3 text-xs" />
                {d.lane === "routine" ? (
                  <PillGroup name={`rhythm-${d.key}`} ariaLabel="How often" options={RHYTHMS} value={d.rhythm} onValueChange={(v) => update(d.key, { rhythm: v as Rhythm })} optionClassName="h-8 px-3 text-xs" />
                ) : (
                  <Input
                    type="datetime-local"
                    value={d.at}
                    onChange={(e) => update(d.key, { at: e.target.value })}
                    aria-label={d.lane === "reminder" ? "Remind me at" : "Do it by (optional)"}
                    className={cn("h-9 w-auto", d.lane === "reminder" && !d.at && "border-brand")}
                  />
                )}
              </div>
            </div>
          ))}
          <Button variant="brand" size="lg" className="w-full" onClick={save} disabled={saving}>
            {saving ? "Adding…" : `Add ${drafts.length} ${drafts.length === 1 ? "item" : "items"}`}
          </Button>
        </div>
      )}
    </section>
  );
}
