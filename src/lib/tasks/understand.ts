/*
 * Reads one spoken item and pulls out the when: a time, a day, "every day",
 * an end ("until Friday", "for 5 days") and how long it takes. Whatever it
 * finds fills in the form; the words it used come out of the title. Plain
 * rules, no AI, and the person sees and can change everything before saving.
 */

export type Repeat = "daily" | "twice_weekly" | "thrice_weekly" | "weekly";

export interface Understood {
  title: string;
  /** Said "remind me", "don't forget", or it's about medicine. */
  reminder: boolean;
  repeat: Repeat | null;
  /** YYYY-MM-DD in the person's own calendar. */
  date: string | null;
  /** HH:MM, 24-hour. */
  time: string | null;
  /** Last day it repeats, YYYY-MM-DD. */
  until: string | null;
  minutes: number | null;
}

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const NUMBERS: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, fourteen: 14, thirty: 30 };

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const num = (s: string) => (/^\d+$/.test(s) ? Number(s) : (NUMBERS[s.toLowerCase()] ?? NaN));

/** The next given weekday after today (or next week's, for "next Monday"). */
function nextWeekday(now: Date, day: number, skipWeek = false): Date {
  let diff = (day - now.getDay() + 7) % 7 || 7;
  if (skipWeek && diff < 7) diff += 7;
  return addDays(now, diff);
}

const DAY_WORD = `(?:${DAYS.join("|")})`;
const MONTH_WORD = `(?:${MONTHS.join("|")}|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)`;

/** "tomorrow", "on friday", "next monday", "in 3 days", "25th october", "october 25". */
const DATE_PATTERN = new RegExp(
  `\\b(?:(?:on|this|by)\\s+)?(?:` +
    `(day after tomorrow)|(today|tonight)|(tomorrow)|(next week)|` +
    `in\\s+(\\d+|a|one|two|three|four|five|six|seven)\\s+(days?|weeks?)|` +
    `(next\\s+)?(${DAY_WORD})|` +
    `(?:the\\s+)?(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+of)?\\s+(${MONTH_WORD})|` +
    `(${MONTH_WORD})\\s+(\\d{1,2})(?:st|nd|rd|th)?|` +
    `the\\s+(\\d{1,2})(?:st|nd|rd|th)` +
    `)\\b`,
  "i",
);

function monthIndex(word: string): number {
  const w = word.toLowerCase();
  return MONTHS.findIndex((m) => m.startsWith(w.slice(0, 3)));
}

function dateFrom(m: RegExpMatchArray, now: Date): Date | null {
  if (m[1]) return addDays(now, 2);
  if (m[2]) return now;
  if (m[3]) return addDays(now, 1);
  if (m[4]) return addDays(now, 7);
  if (m[5]) return addDays(now, num(m[5]) * (m[6].startsWith("week") ? 7 : 1));
  if (m[8]) return nextWeekday(now, DAYS.indexOf(m[8].toLowerCase()), Boolean(m[7]));
  const dayMonth = (day: number, month: number) => {
    const d = new Date(now.getFullYear(), month, day);
    return d < addDays(now, -1) ? new Date(now.getFullYear() + 1, month, day) : d;
  };
  if (m[9]) return dayMonth(Number(m[9]), monthIndex(m[10]));
  if (m[11]) return dayMonth(Number(m[12]), monthIndex(m[11]));
  if (m[13]) {
    const day = Number(m[13]);
    const d = new Date(now.getFullYear(), now.getMonth(), day);
    return d < addDays(now, -1) ? new Date(now.getFullYear(), now.getMonth() + 1, day) : d;
  }
  return null;
}

export function understand(input: string, now: Date = new Date()): Understood {
  let text = ` ${input} `
    .replace(/(\d)\s*\.\s*(\d{2})/g, "$1:$2")
    .replace(/\b([ap])\.?\s?m\.?(?=\W)/gi, "$1m")
    .replace(/\s+/g, " ");
  const cut = (re: RegExp) => {
    text = text.replace(re, " ");
  };

  const reminder = /\bremind(?:er)?\b|\bdon'?t forget\b|\bremember to\b|\b(?:meds?|medicine|medication|pills?|tablets?|vitamins?)\b/i.test(text);

  // How long it takes: "for 20 minutes", "for an hour", "for half an hour".
  let minutes: number | null = null;
  const dur = text.match(/\bfor\s+(half an hour|(\d+|an?|one|two|three)\s*(minutes?|mins?|hours?|hrs?))\b/i);
  if (dur) {
    minutes = dur[1].toLowerCase() === "half an hour" ? 30 : num(dur[2]) * (/^h/i.test(dur[3]) ? 60 : 1);
    cut(dur[0] ? new RegExp(dur[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : /$^/);
  }

  // How often.
  let repeat: Repeat | null = null;
  let date: Date | null = null;
  let defaultTime: string | null = null;
  const everyWeekday = text.match(new RegExp(`\\bevery\\s+(${DAY_WORD})s?\\b`, "i"));
  if (everyWeekday) {
    repeat = "weekly";
    date = nextWeekday(addDays(now, -1), DAYS.indexOf(everyWeekday[1].toLowerCase()));
    cut(new RegExp(everyWeekday[0], "i"));
  } else if (/\b(?:twice|two times)\s+a\s+week\b/i.test(text)) {
    repeat = "twice_weekly";
    cut(/\b(?:twice|two times)\s+a\s+week\b/i);
  } else if (/\b(?:thrice|three times)\s+a\s+week\b/i.test(text)) {
    repeat = "thrice_weekly";
    cut(/\b(?:thrice|three times)\s+a\s+week\b/i);
  } else if (/\b(?:every\s+week|weekly|once\s+a\s+week)\b/i.test(text)) {
    repeat = "weekly";
    cut(/\b(?:every\s+week|weekly|once\s+a\s+week)\b/i);
  } else {
    const daily = text.match(/\b(?:every\s+(?:single\s+)?(day|morning|night|evening)|each\s+(?:day|morning|night)|daily|nightly)\b/i);
    if (daily) {
      repeat = "daily";
      const part = (daily[1] ?? daily[0]).toLowerCase();
      defaultTime = part === "morning" ? "09:00" : part === "evening" ? "19:00" : part === "night" || part === "nightly" ? "21:00" : null;
      cut(new RegExp(daily[0], "i"));
    }
  }

  // Until when: "until friday", "till the 30th", "for 5 days", "for a week".
  let until: Date | null = null;
  const untilMatch = text.match(new RegExp(`\\b(?:until|till|til)\\s+(${DATE_PATTERN.source.slice(2, -2)})`, "i"));
  if (untilMatch) {
    const m = untilMatch[1].match(DATE_PATTERN);
    if (m) until = dateFrom(m, now);
    cut(new RegExp(untilMatch[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
  const forDays = text.match(/\bfor\s+(?:the\s+next\s+)?(\d+|a|one|two|three|four|five|six|seven|ten|fourteen|thirty)\s+(days?|weeks?)\b/i);
  if (forDays) {
    if (!repeat) repeat = "daily";
    until = addDays(now, num(forDays[1]) * (forDays[2].toLowerCase().startsWith("week") ? 7 : 1) - 1);
    cut(new RegExp(forDays[0], "i"));
  }

  // What time.
  let time: string | null = null;
  const clock = text.match(/\b(?:at\s+|by\s+|around\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  const bare = text.match(/\b(?:at|by|around)\s+(\d{1,2})(?::(\d{2}))?\b(?!\s*(?:days?|weeks?|minutes?|hours?))/i);
  const word = text.match(/\b(?:at\s+)?(noon|midday|midnight)\b/i);
  if (clock) {
    let h = Number(clock[1]) % 12;
    if (clock[3].toLowerCase() === "pm") h += 12;
    time = `${pad(h)}:${clock[2] ?? "00"}`;
    cut(new RegExp(clock[0], "i"));
  } else if (bare) {
    let h = Number(bare[1]);
    // "at 7" with no am/pm: 1 to 7 usually means the evening; 8 to 12 the morning or noon.
    if (h >= 1 && h <= 7) h += 12;
    time = `${pad(h % 24)}:${bare[2] ?? "00"}`;
    cut(new RegExp(bare[0], "i"));
  } else if (word) {
    time = word[1].toLowerCase() === "midnight" ? "00:00" : "12:00";
    cut(new RegExp(word[0], "i"));
  }

  // Which day.
  const dm = text.match(DATE_PATTERN);
  if (dm && !date) {
    date = dateFrom(dm, now);
    if (/tonight/i.test(dm[0]) && !time) defaultTime = "21:00";
    cut(new RegExp(dm[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
  const part = text.match(/\b(?:in the |this )?(morning|afternoon|evening|night)\b/i);
  if (part) {
    const p = part[1].toLowerCase();
    if (!time) defaultTime = p === "morning" ? "09:00" : p === "afternoon" ? "15:00" : p === "evening" ? "19:00" : "21:00";
    cut(new RegExp(part[0], "i"));
  }
  time = time ?? defaultTime;

  const title = text
    .replace(/\b(?:at|on|by|every|each|and|around|in|the)\s*$/i, "")
    .replace(/\s+(?:at|on|by|every|each|and|around)\s+(?=[.,]|$)/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(?:to|and)\s+/i, "")
    .replace(/[\s,.;:]+$/, "");

  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    reminder,
    repeat,
    date: date ? ymd(date) : null,
    time,
    until: until ? ymd(until) : null,
    minutes,
  };
}
