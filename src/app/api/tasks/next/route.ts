import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import * as taskRepo from "@/repositories/task-repository";
import { nextUp } from "@/services/win-service";

export const dynamic = "force-dynamic";

/**
 * The one thing to show in the notification bar right now, plus every task
 * still open, so the phone can clear notifications for anything deleted or done.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ next: null, openIds: [] }, { status: 401 });
  const tasks = await taskRepo.listVisibleTasks(session.supabase, session.userId, new Date());
  const openIds = tasks.filter((t) => t.status === "pending").map((t) => t.id);
  return NextResponse.json({ next: await nextUp(session), openIds });
}
