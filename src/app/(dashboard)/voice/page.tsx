import { VoiceRecorder } from "@/components/voice/voice-recorder";

export default function VoicePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Voice capture</h1>
        <p className="text-muted-foreground">
          Say what&apos;s on your mind. You&apos;ll get to review it before anything is saved.
        </p>
      </div>
      <VoiceRecorder />
    </div>
  );
}
