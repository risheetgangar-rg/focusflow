import "server-only";
import { z } from "zod";
import type { ParsedTaskItem } from "@/types/brain-dump";

/*
 * Optional AI reader for brain dumps. Only used when ANTHROPIC_API_KEY is set;
 * otherwise (or if it fails twice) the built-in reader takes over, so the app
 * never depends on it. Output is checked strictly before anyone sees it.
 */

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
const BANNED = /\b(overdue|fail(ed|ure|ing)?|behind|lazy|should have)\b/i;

const itemSchema = z.object({
  title: z.string().trim().min(1).max(200),
  kind: z.enum(["task", "note"]).default("task"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  dueTime: z.string().regex(/^\d{2}:\d{2}$/).nullish(),
  estimatedMinutes: z.number().int().positive().max(600).nullish(),
  firstStep: z.string().trim().max(120).nullish(),
});
const responseSchema = z.object({ items: z.array(itemSchema).min(1).max(50) });

/** Emails and phone numbers never leave the app. */
export function scrub(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
    .replace(/(\+?\d[\d\s-]{7,}\d)/g, "[phone]");
}

/** A first step must be tiny, concrete and kind: 12 words or fewer, no blaming words. */
export function acceptableFirstStep(step: string | null | undefined): string | undefined {
  if (!step) return undefined;
  const words = step.trim().split(/\s+/).length;
  return words > 0 && words <= 12 && !BANNED.test(step) ? step.trim() : undefined;
}

function prompt(today: string, weekday: string): string {
  return [
    "You turn a messy brain dump into a JSON list of items for a calm to-do app for people with ADHD.",
    `Today is ${weekday} ${today}. Resolve words like "tomorrow" or "thurs" to YYYY-MM-DD dates.`,
    'Each item: {"title": short and clear, "kind": "task" or "note" (a note is a thought or idea, not something to do),',
    '"dueDate": only if the text clearly says when, otherwise omit (never invent a date), "dueTime": HH:MM if stated,',
    '"estimatedMinutes": a rough guess, "firstStep": one tiny physical action under 2 minutes, 12 words or fewer}.',
    "Never use the words overdue, fail, behind or lazy. Keep the person's own words where you can.",
    'Reply with JSON only, exactly {"items": [...]}, no other text.',
  ].join(" ");
}

export async function parseWithClaude(text: string, today: string, weekday: string): Promise<ParsedTaskItem[] | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 2000,
          system: prompt(today, weekday),
          messages: [{ role: "user", content: scrub(text) }],
        }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) continue;
      const body = (await response.json()) as { content?: { type: string; text?: string }[] };
      const raw = body.content?.find((c) => c.type === "text")?.text ?? "";
      const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
      const parsed = responseSchema.safeParse(JSON.parse(json));
      if (!parsed.success) continue;
      return parsed.data.items.map((item) => ({
        title: item.title,
        kind: item.kind,
        dueDate: item.dueDate ?? undefined,
        dueTime: item.dueDate ? (item.dueTime ?? undefined) : undefined,
        estimatedMinutes: item.estimatedMinutes ?? undefined,
        firstStep: acceptableFirstStep(item.firstStep),
      }));
    } catch {
      // Network error or bad JSON: try once more, then fall back to the built-in reader.
    }
  }
  return null;
}

/** Phrases that mean someone may be in crisis. Checked before any AI call, by a plain list. */
const CRISIS = [
  /\bkill (myself|me)\b/i,
  /\bsuicid/i,
  /\bend (my|it all|my life)\b/i,
  /\bwant to die\b/i,
  /\bself[- ]?harm/i,
  /\bhurt myself\b/i,
  /\bno reason to live\b/i,
];

export function needsSupport(text: string): boolean {
  return CRISIS.some((pattern) => pattern.test(text));
}
