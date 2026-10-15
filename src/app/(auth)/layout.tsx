/**
 * Two columns from `lg` up: the form on one side, a decorative panel on the other
 * (each page supplies both through <AuthShell>). Below `lg` it's just the form.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="grid min-h-dvh bg-background lg:grid-cols-2">
      {children}
    </main>
  );
}
