import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** A titled panel for one group of settings: a small tinted icon, a serif title, one calm sentence. */
export function SettingsSection({
  id,
  icon: Icon,
  tint,
  title,
  description,
  children,
}: {
  id: string;
  icon: LucideIcon;
  /** A tint class such as "bg-tint-mint". */
  tint: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-24 gap-6 [--card-spacing:--spacing(6)] sm:gap-7 sm:[--card-spacing:--spacing(8)]"
    >
      <CardHeader className="gap-2">
        <div className="flex items-center gap-3">
          <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", tint)}>
            <Icon className="size-[1.1rem]" aria-hidden />
          </span>
          <h2 id={`${id}-title`} className="font-display text-3xl leading-none">
            {title}
          </h2>
        </div>
        <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
