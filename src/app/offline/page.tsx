export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">You&apos;re offline</h1>
      <p className="text-muted-foreground max-w-sm">
        FocusFlow needs a connection for this page. Anything you completed while offline will sync
        once you&apos;re back.
      </p>
    </main>
  );
}
