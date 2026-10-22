import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { nextUp } from "@/services/win-service";

export const dynamic = "force-dynamic";

/** The one thing to show in the notification bar right now. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ next: null }, { status: 401 });
  return NextResponse.json({ next: await nextUp(session) });
}
