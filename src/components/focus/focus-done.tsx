import Link from "next/link";
import type { VariantProps } from "class-variance-authority";
import { Check, Flame, Sparkles, Swords, Trophy, Zap } from "lucide-react";
import { Companion } from "@/components/gamification/companion";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/primitives";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { companionStage } from "@/lib/gamification/rules";
import type { CompletionOutcome } from "@/types/gamification";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

interface RewardChip {
  key: string;
  variant: BadgeVariant;
  icon?: React.ReactNode;
  text: string;
}

/** Only what was actually earned, and only as much as the person's game mode allows. */
function rewardChips(outcome: CompletionOutcome | null): RewardChip[] {
  if (!outcome) return [];
  const chips: RewardChip[] = [];
  const { reward } = outcome;

  if (reward) {
    chips.push({ key: "xp", variant: "brand", icon: <Sparkles />, text: `+${reward.xpAwarded} XP` });
    if (reward.momentum > 1) chips.push({ key: "momentum", variant: "peach", icon: <Flame />, text: `Momentum ${reward.momentum}` });
    if (reward.leveledUp) chips.push({ key: "level", variant: "butter", icon: <Zap />, text: `Level ${reward.newLevel}` });
    if (reward.isComeback) chips.push({ key: "comeback", variant: "mint", text: "Welcome back" });
    for (const name of reward.unlockedAchievements) {
      chips.push({ key: `achievement-${name}`, variant: "lavender", icon: <Trophy />, text: name });
    }
  }
  if (outcome.bossDefeated) {
    chips.push({ key: "boss", variant: "rose", icon: <Swords />, text: `Boss defeated: ${outcome.bossDefeated}` });
  }
  if (outcome.questCompleted) {
    chips.push({ key: "quest", variant: "sky", icon: <Check />, text: `Quest complete: ${outcome.questCompleted}` });
  }
  return chips;
}

/** The finish line: one calm line, the task crossed off, and what it earned. */
export function FocusDone({ taskTitle, outcome }: { taskTitle: string; outcome: CompletionOutcome | null }) {
  const chips = rewardChips(outcome);
  const reward = outcome?.reward ?? null;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 text-center">
      {reward && (
        <Reveal>
          <Companion stage={companionStage(reward.newLevel)} mood="cheer" size={112} />
        </Reveal>
      )}

      <Reveal delay={0.05}>
        <h1 className="font-display text-6xl leading-none sm:text-8xl">Nice work.</h1>
      </Reveal>

      <Reveal delay={0.15}>
        <p className="max-w-md text-lg text-muted-foreground line-through decoration-muted-foreground/50 [overflow-wrap:anywhere]">
          {taskTitle}
        </p>
      </Reveal>

      {chips.length > 0 && (
        <Stagger className="flex flex-wrap justify-center gap-2" delay={0.3}>
          {chips.map((chip) => (
            <StaggerItem key={chip.key}>
              <Badge variant={chip.variant} className="h-8 gap-1.5 px-3.5 text-sm [&>svg]:size-4!">
                {chip.icon}
                {chip.text}
              </Badge>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Reveal delay={0.4}>
        <Link href="/today" className={buttonVariants({ variant: "brand", size: "xl" })}>
          Back to Today
        </Link>
      </Reveal>
    </div>
  );
}
