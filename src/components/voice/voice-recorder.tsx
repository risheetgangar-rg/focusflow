"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrainDumpForm } from "@/components/brain-dump/brain-dump-form";

// Minimal shape of the non-standard Web Speech API — not in lib.dom.d.ts.
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: unknown) => void) | null;
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

export function VoiceRecorder() {
  const [supported, setSupported] = useState(true);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [committed, setCommitted] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    // Browser feature detection has to happen post-mount to avoid a
    // server/client render mismatch (there's no `window` during SSR).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(getRecognitionConstructor() !== null);
  }, []);

  function start() {
    const Recognition = getRecognitionConstructor();
    if (!Recognition) {
      setSupported(false);
      return;
    }
    setError(null);
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      setTranscript(text);
    };
    recognition.onerror = () => {
      setError("Couldn't access the microphone. You can type instead.");
      setRecording(false);
    };
    recognition.onend = () => setRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }

  function stop() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  if (!supported) {
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground">
          Voice input isn&apos;t supported in this browser. Try Chrome or Edge, or use Brain Dump
          instead.
        </p>
        <Link href="/brain-dump" className="text-sm underline">
          Go to Brain Dump →
        </Link>
      </div>
    );
  }

  if (committed) {
    return <BrainDumpForm source="voice" defaultText={transcript} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {recording ? (
          <Button variant="destructive" onClick={stop}>
            <Square size={16} /> Stop
          </Button>
        ) : (
          <Button onClick={start}>
            <Mic size={16} /> {transcript ? "Record again" : "Start recording"}
          </Button>
        )}
        {recording && <span className="text-muted-foreground text-sm">Listening…</span>}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {transcript && (
        <div className="space-y-3">
          <p className="rounded-lg border p-3 text-sm">{transcript}</p>
          <Button variant="outline" onClick={() => setCommitted(true)}>
            Use this
          </Button>
        </div>
      )}
    </div>
  );
}
