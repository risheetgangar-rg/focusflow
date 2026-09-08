import type { ParsedTaskItem } from "@/types/brain-dump";

/**
 * Turns free-form text into structured task items. Isolated behind this
 * interface (per the AI-abstraction rule: AI augments the system, it's
 * never required) so a real LLM-backed parser can be swapped in later
 * without touching brain-dump-service or any caller.
 */
export interface TaskParser {
  parse(rawText: string, now: Date): ParsedTaskItem[];
}

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function resolveWeekday(now: Date, targetDay: number): Date {
  const d = new Date(now);
  const diff = (targetDay - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function extractDate(text: string, now: Date): { date?: string; matched?: string } {
  const lower = text.toLowerCase();
  if (/\btomorrow\b/.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return { date: toDateString(d), matched: "tomorrow" };
  }
  if (/\btoday\b/.test(lower)) {
    return { date: toDateString(now), matched: "today" };
  }
  for (let i = 0; i < WEEKDAYS.length; i++) {
    if (new RegExp(`\\b${WEEKDAYS[i]}\\b`, "i").test(lower)) {
      return { date: toDateString(resolveWeekday(now, i)), matched: WEEKDAYS[i] };
    }
  }
  return {};
}

function extractTime(text: string): { time?: string; matched?: string } {
  const match = text.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (!match) return {};

  let hour = parseInt(match[1], 10);
  const minute = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3]?.toLowerCase();
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  // Colloquial default: "call at 6" with no am/pm usually means evening.
  if (!meridiem && hour >= 1 && hour <= 7) hour += 12;

  return { time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`, matched: match[0] };
}

const URGENT_WORDS = /\b(urgent|asap|critical|emergency)\b/i;
const IMPORTANT_WORDS = /\b(important|priority)\b/i;

function extractPriority(text: string): ParsedTaskItem["priority"] {
  if (URGENT_WORDS.test(text)) return "critical";
  if (IMPORTANT_WORDS.test(text)) return "high";
  return undefined;
}

function cleanTitle(raw: string, dateMatched?: string, timeMatched?: string): string {
  let title = raw;
  if (timeMatched) title = title.replace(timeMatched, "");
  if (dateMatched) title = title.replace(new RegExp(`\\b${dateMatched}\\b`, "i"), "");
  title = title.replace(URGENT_WORDS, "").replace(IMPORTANT_WORDS, "");
  title = title.replace(/\s+/g, " ").replace(/^[\s,.\-]+|[\s,.\-]+$/g, "").trim();
  if (title.length === 0) title = raw.trim();
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function splitItems(text: string): string[] {
  return text
    .split(/,?\s+and\s+|\n+|;/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Deterministic, no-external-calls parser: date/time/priority keyword
 * extraction with a date carried forward across items until a new one
 * is mentioned ("tomorrow call X and finish Y" -> both land tomorrow).
 * Never invents a deadline that wasn't in the text.
 */
export class DeterministicTaskParser implements TaskParser {
  parse(rawText: string, now: Date): ParsedTaskItem[] {
    let carriedDate: string | undefined;

    return splitItems(rawText).map((raw) => {
      const { date, matched: dateMatched } = extractDate(raw, now);
      const { time, matched: timeMatched } = extractTime(raw);
      if (date) carriedDate = date;

      const item: ParsedTaskItem = {
        title: cleanTitle(raw, dateMatched, timeMatched),
        ...((date ?? carriedDate) && { dueDate: date ?? carriedDate }),
        ...(time && { dueTime: time }),
        ...(extractPriority(raw) && { priority: extractPriority(raw) }),
      };
      return item;
    });
  }
}

export function getTaskParser(): TaskParser {
  return new DeterministicTaskParser();
}
