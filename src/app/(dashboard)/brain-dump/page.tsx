import { BrainDumpForm } from "@/components/brain-dump/brain-dump-form";

export default function BrainDumpPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Brain dump</h1>
        <p className="text-muted-foreground">
          Get it out of your head. Write it however it comes out — we&apos;ll turn it into tasks.
        </p>
      </div>
      <BrainDumpForm />
    </div>
  );
}
