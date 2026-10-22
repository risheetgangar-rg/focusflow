import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { finishWithWin } from "@/services/win-service";

export const dynamic = "force-dynamic";

const body = z.object({ taskId: z.string().uuid() });

/**
 * The ✓ on a phone notification: ticks the task off without opening the app,
 * then answers with what it earned and the next task, so the notification can
 * move straight on to it. Same sign-in cookie as the app, so only your own tasks.
 */
export async function POST(request: NextRequest) {
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Which task?" }, { status: 400 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const win = await finishWithWin(session, parsed.data.taskId);
  revalidatePath("/today");
  revalidatePath("/tasks");
  revalidatePath("/review");
  return NextResponse.json({ win });
}
