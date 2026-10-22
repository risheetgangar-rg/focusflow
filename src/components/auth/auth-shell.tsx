import { LogoLink } from "@/components/marketing/logo";
import { Rise } from "@/components/marketing/rise";
import { AuthPanel, type AuthPanelVariant } from "./auth-panels";

/**
 * One half of the split auth layout is the form column, the other a decorative panel.
 * Returns two grid cells; the (auth) layout supplies the two-column grid they sit in.
 */
export function AuthShell({ panel, children }: { panel: AuthPanelVariant; children: React.ReactNode }) {
  return (
    <>
      <div className="flex min-h-dvh flex-col px-5 py-6 sm:px-10 lg:px-14 lg:py-8">
        <header>
          <LogoLink onLight />
        </header>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10 sm:py-14">
          <Rise>{children}</Rise>
        </div>
        <p className="text-center text-xs text-muted-foreground lg:text-left">Made with care for busy brains.</p>
      </div>
      <AuthPanel variant={panel} />
    </>
  );
}
