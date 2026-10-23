import type { TaskKind } from "@/types/task";

/*
 * Turns one spoken ramble ("I need to pay rent, call mom and then remind me
 * to take my meds") into separate items. Plain rules, no AI: the person
 * checks every item before anything is saved.
 */

export interface SpokenItem {
  title: string;
  kind: TaskKind;
}

const SPLIT = /[.!?;\n]+|,\s*|\b(?:and then|after that|and also|also|plus|then)\b/i;
const REMINDER = /^(?:please\s+)?(?:remind me (?:to|about)|reminder(?: to)?|don'?t forget (?:to|about)|remember to)\s+/i;
const FILLER =
  /^(?:(?:um+|uh+|okay|ok|so|and|well|like|also)\s*,?(?:\s+|$))*(?:i (?:need|have|got|want|should|must) to|i gotta|i've got to|i have got to|need to|have to|gotta|i should|i must|i'll)?\s*/i;

function tidy(text: string): string {
  const t = text.trim().replace(/\s+/g, " ").replace(/[,.\s]+$/, "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function splitSpoken(transcript: string): SpokenItem[] {
  return transcript
    // Keep times whole before splitting on full stops: "10.30 p.m." stays one thing.
    .replace(/(\d)\.(\d{2})/g, "$1:$2")
    .replace(/\b([ap])\.\s?m\.(\s+[A-Z])?/g, (_, ap: string, next?: string) => (next ? `${ap}m.${next}` : `${ap}m`))
    .split(SPLIT)
    .map((part) => part?.trim() ?? "")
    .filter(Boolean)
    .map((part) => {
      const withoutFiller = part.replace(FILLER, "");
      const isReminder = REMINDER.test(withoutFiller) || REMINDER.test(part);
      const title = tidy(withoutFiller.replace(REMINDER, ""));
      return { title, kind: (isReminder ? "reminder" : "task") as TaskKind };
    })
    .filter((item) => item.title.length >= 2)
    .slice(0, 20);
}
