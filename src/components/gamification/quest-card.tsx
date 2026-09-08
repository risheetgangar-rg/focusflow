"use client";

import { useTransition } from "react";
import { completeSideQuestAction } from "@/app/(dashboard)/today/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import type { Quest } from "@/types/gamification";

export function QuestCard({ quests }: { quests: Quest[] }) {
  const [, startTransition] = useTransition();
  const daily = quests.find((q) => q.type === "daily");
  const side = quests.find((q) => q.type === "side");

  if (!daily && !side) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Today&apos;s quests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {daily && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{daily.title}</span>
              <span className="text-muted-foreground">
                {daily.progress}/{daily.target} · +{daily.xpReward} XP
              </span>
            </div>
            <Progress value={(daily.progress / daily.target) * 100} />
          </div>
        )}
        {side && (
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={side.completed}
              disabled={side.completed}
              onCheckedChange={(checked) =>
                checked === true && startTransition(() => completeSideQuestAction(side.id))
              }
            />
            <span className={side.completed ? "text-muted-foreground line-through" : ""}>
              {side.title}
            </span>
            <span className="text-muted-foreground ml-auto">+{side.xpReward} XP</span>
          </label>
        )}
      </CardContent>
    </Card>
  );
}
