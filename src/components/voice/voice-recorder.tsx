"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Keyboard, Mic, Square } from "lucide-react";
import { BrainDumpForm } from "@/components/brain-dump/brain-dump-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Minimal shape of the browser's speech-to-text API (not in TypeScript's built-in types).
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
}

function getRecognitionConstructor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noop = () => () => {};

/** Plain-language help for each way the browser's speech service can fail. */
function explain(code: string | undefined): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "The microphone is blocked. Click the lock or mic icon next to the web address, allow the microphone, then try again.";
    case "audio-capture":
      return "I couldn't find a microphone. Check one is plugged in and not being used by another app.";
    case "no-speech":
      return "I didn't hear anything. Try again and speak a little closer to the mic.";
    case "network":
      return "This browser couldn't reach its speech service. Voice works best in Google Chrome or Microsoft Edge. You can also use the box below.";
    case "aborted":
      return "";
    default:
      return "Voice didn't work this time. You can try again, or use the box below.";
  }
}

/**
 * Say it out loud, see the words appear, then review them like a brain dump.
 * If the browser can't do speech-to-text, the typing box below still works
 * (and Windows + H gives you the computer's own dictation).
 */
export function VoiceRecorder() {
  // Known only in the browser; the server assumes it works so the page doesn't jump.
  const supported = useSyncExternalStore(noop, () => getRecognitionConstructor() !== null, () => true);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [committed, setCommitted] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const baseRef = useRef("");

  // Never leave the microphone on after leaving the page.
  useEffect(() => () => recognitionRef.current?.abort(), []);

  function start() {
    const Recognition = getRecognitionConstructor();
    if (!Recognition) return;
    setError(null);
    baseRef.current = transcript ? `${transcript.trim()} ` : "";

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";
    recognition.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setTranscript(baseRef.current + text);
    };
    recognition.onerror = (e) => {
      const message = explain(e.error);
      if (message) setError(message);
      setRecording(false);
    };
    recognition.onend = () => setRecording(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setRecording(true);
    } catch {
      setError(explain(undefined));
    }
  }

  function stop() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  if (committed) return <BrainDumpForm source="voice" defaultText={transcript} />;

  return (
    <div className="space-y-8">
      {supported ? (
        <div className="flex flex-col items-center gap-4 rounded-[2rem] bg-tint-sky px-6 py-10 text-center">
          <button
            type="button"
            onClick={recording ? stop : start}
            aria-label={recording ? "Stop recording" : "Start recording"}
            className={cn(
              "relative grid size-24 place-items-center rounded-full text-white shadow-lift transition-transform active:scale-95",
              recording ? "bg-destructive" : "bg-primary",
            )}
          >
            {recording && <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-destructive/40" />}
            {recording ? <Square size={30} /> : <Mic size={34} />}
          </button>
          <p className="font-medium" aria-live="polite">
            {recording ? "Listening… tap to stop" : transcript ? "Tap to add more" : "Tap the mic and say what's on your mind"}
          </p>
          <p className="text-xs text-foreground/60">Your browser turns your voice into text. Works best in Chrome or Edge.</p>
        </div>
      ) : (
        <div className="rounded-3xl bg-tint-butter p-5 text-sm">
          This browser can&apos;t turn speech into text. Open this page in <strong>Google Chrome</strong> or{" "}
          <strong>Microsoft Edge</strong>, or use the box below.
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-2xl border border-border bg-card px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <div className="space-y-3">
        <label htmlFor="voice-text" className="flex items-center gap-2 text-sm font-medium">
          <Keyboard size={16} /> What I heard (you can edit it)
        </label>
        <Textarea
          id="voice-text"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={5}
          placeholder="Your words appear here. Or click in this box, press Windows key + H, and speak."
          className="min-h-36 text-base"
        />
        <Button variant="brand" size="lg" disabled={!transcript.trim() || recording} onClick={() => setCommitted(true)}>
          Turn this into tasks
        </Button>
      </div>
    </div>
  );
}
