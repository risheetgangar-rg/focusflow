"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Keyboard, ListChecks, Mic, Square, X } from "lucide-react";
import { addManyAction } from "@/app/(dashboard)/today/card-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PillGroup } from "@/components/ui/pill-group";
import { splitSpoken } from "@/lib/tasks/voice-split";
import { PRIORITIES } from "./task-form";
import { cn } from "@/lib/utils";
import type { TaskKind } from "@/types/task";

/*
 * The one way in: say (or type) everything on your mind, then check each item.
 * Three small choices per item: task or reminder, how important, and when.
 */

type Level = "low" | "medium" | "high" | "critical";

interface Draft {
  key: number;
  title: string;
  kind: TaskKind;
  level: Level;
  /** Value of the datetime-local input, in the person's own clock. */
  at: string;
}

const KINDS = [
  { value: "task", label: "Task" },
  { value: "reminder", label: "Reminder" },
];

const LEVELS = PRIORITIES;

let nextKey = 0;

export function VoiceAdd() {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "recording" | "hearing">("idle");
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const recorder = useRef<MediaRecorder | null>(null);

  function addFrom(transcript: string) {
    const items = splitSpoken(transcript);
    if (items.length === 0) {
      setMessage("Didn't catch any tasks. Try again?");
      return;
    }
    setMessage(null);
    setDrafts((d) => [...d, ...items.map((i) => ({ key: nextKey++, ...i, level: "medium" as Level, at: "" }))]);
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

  function save() {
    const items = drafts.filter((d) => d.title.trim());
    if (items.some((d) => d.kind === "reminder" && !d.at)) {
      setMessage("Give each reminder a time.");
      return;
    }
    startSaving(async () => {
      const result = await addManyAction(
        items.map((d) => ({
          title: d.title.trim(),
          kind: d.kind,
          level: d.level,
          at: d.at ? new Date(d.at).toISOString() : null,
        })),
      );
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setDrafts([]);
      setText("");
      setMessage(`Added ${result.count}. Nice.`);
      router.refresh();
    });
  }

  return (
    <section className="rounded-[2rem] border border-border bg-card p-5 shadow-soft sm:p-7">
      <div className="flex flex-col items-center gap-3 text-center">
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
          {phase === "recording" ? "Listening… tap to stop" : phase === "hearing" ? "Writing it down…" : "Say everything you need to do"}
        </p>
        <p className="text-sm text-muted-foreground">
          Like: &ldquo;Pay rent, call mom, and remind me to take my meds.&rdquo;
        </p>
        {!typing && (
          <button type="button" onClick={() => setTyping(true)} className="inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4">
            <Keyboard size={15} /> Type instead
          </button>
        )}
      </div>

      {typing && (
        <form
          className="mt-5 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) addFrom(text);
            setText("");
          }}
        >
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Pay rent, call mom, remind me to…" aria-label="Type your tasks" className="h-12" />
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
                {d.kind === "reminder" ? <Bell size={18} className="shrink-0 text-brand" /> : <ListChecks size={18} className="shrink-0 text-brand" />}
                <Input value={d.title} onChange={(e) => update(d.key, { title: e.target.value })} aria-label="Title" className="h-10 font-medium" />
                <Button variant="ghost" size="icon-sm" aria-label={`Remove ${d.title}`} onClick={() => setDrafts((x) => x.filter((y) => y.key !== d.key))}>
                  <X />
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <PillGroup name={`kind-${d.key}`} ariaLabel="Task or reminder" options={KINDS} value={d.kind} onValueChange={(v) => update(d.key, { kind: v as TaskKind })} optionClassName="h-8 px-3 text-xs" />
                <PillGroup name={`level-${d.key}`} ariaLabel="How important" options={LEVELS} value={d.level} onValueChange={(v) => update(d.key, { level: v as Level })} optionClassName="h-8 px-3 text-xs" />
                <Input
                  type="datetime-local"
                  value={d.at}
                  onChange={(e) => update(d.key, { at: e.target.value })}
                  aria-label={d.kind === "reminder" ? "Remind me at" : "Due at (optional)"}
                  className={cn("h-9 w-auto", d.kind === "reminder" && !d.at && "border-brand")}
                />
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
