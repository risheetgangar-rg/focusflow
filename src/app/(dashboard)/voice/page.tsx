import type { Metadata } from "next";
import { VoiceRecorder } from "@/components/voice/voice-recorder";

export const metadata: Metadata = { title: "Voice" };

export default function VoicePage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="animate-rise mb-8 sm:mb-10">
        <p className="text-eyebrow text-muted-foreground">Say it out loud</p>
        <h1 className="mt-2 font-display text-5xl leading-none sm:text-7xl">Voice</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Talk it through. You&apos;ll see the words, fix anything, and check every task before it&apos;s saved.
        </p>
      </header>
      <VoiceRecorder />
    </div>
  );
}
