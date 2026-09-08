import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import type { Recommendation } from "@/services/recommendation-service";

export function WhatsNextCard({ recommendation }: { recommendation: Recommendation | null }) {
  if (!recommendation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>What&apos;s next</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">You&apos;re clear for now.</p>
        </CardContent>
      </Card>
    );
  }

  const { task, reason } = recommendation;

  return (
    <Card>
      <CardHeader>
        <CardTitle>What&apos;s next</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xl font-medium">{task.title}</p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline">{reason}</Badge>
          {task.estimatedMinutes && (
            <span className="text-muted-foreground">{task.estimatedMinutes} min</span>
          )}
          {task.friction >= 4 && <Badge variant="outline">needs a push — try breaking it down</Badge>}
        </div>
        <Link href={`/focus/${task.id}`} className={buttonVariants()}>
          Start
        </Link>
      </CardContent>
    </Card>
  );
}
