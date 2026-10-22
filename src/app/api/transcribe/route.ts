import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";

/*
 * Voice to text with Deepgram. The browser records a short clip and posts it
 * here; the key stays on the server. Only signed-in people (guests included)
 * can use it, and clips are capped so nobody can run up the bill.
 */

const MAX_BYTES = 8 * 1024 * 1024;
const DEEPGRAM_URL = "https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&punctuate=true";

export async function POST(request: NextRequest) {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) return NextResponse.json({ error: "Voice isn't set up yet. You can type instead." }, { status: 503 });

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const audio = await request.arrayBuffer();
  if (audio.byteLength === 0) return NextResponse.json({ error: "Didn't catch anything. Try again?" }, { status: 400 });
  if (audio.byteLength > MAX_BYTES) return NextResponse.json({ error: "That was a long one. Try a shorter clip." }, { status: 413 });

  const response = await fetch(DEEPGRAM_URL, {
    method: "POST",
    headers: {
      Authorization: `Token ${key}`,
      "Content-Type": request.headers.get("content-type") || "audio/webm",
    },
    body: audio,
  });
  if (!response.ok) return NextResponse.json({ error: "Couldn't hear that clearly. Try again or type it." }, { status: 502 });

  const data = (await response.json()) as {
    results?: { channels?: { alternatives?: { transcript?: string }[] }[] };
  };
  const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ?? "";
  return NextResponse.json({ transcript });
}
