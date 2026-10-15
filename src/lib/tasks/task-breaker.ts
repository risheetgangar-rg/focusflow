/**
 * Suggests a short list of concrete first steps for a task. Isolated behind
 * an interface so a real AI-backed breaker can replace it later; the app
 * never depends on that. Suggestions are always previewed and editable
 * before anything is saved, and never invent facts, names, or deadlines.
 */
export interface TaskBreaker {
  suggest(task: { title: string; estimatedMinutes?: number | null }): string[];
}

export const MAX_STEPS = 7;

interface Template {
  match: RegExp;
  steps: (subject: string) => string[];
}

const TEMPLATES: Template[] = [
  {
    match: /^(call|phone|ring)\b/,
    steps: (s) => [
      s ? `Find the number for ${s}` : "Find the number",
      "Decide the one thing you want to say or ask",
      "Make the call (leaving a voicemail counts)",
    ],
  },
  {
    match: /^(email|e-mail|message|text|reply|respond|dm)\b/,
    steps: (s) => [
      s ? `Open a blank message for ${s}` : "Open a blank message",
      "Write the one-sentence version",
      "Add any details you need, then send",
    ],
  },
  {
    match: /^(pay|renew|book|schedule|register|submit|apply|file|sign up|sign)\b/,
    steps: (s) => [
      s ? `Open the site or app for ${s}` : "Open the site or app you need",
      "Gather what it asks for (account, amount, ID)",
      "Complete the form or payment",
      "Save the confirmation",
    ],
  },
  {
    match: /^(study|read|review|research|learn|revise|practice)\b/,
    steps: (s) => [
      s ? `Open the material for ${s}` : "Open the material",
      "Set a 10-minute timer and skim the headings or key points",
      "Write down 3 things you want to remember",
      "Pick what to do next",
    ],
  },
  {
    match: /^(write|draft|prepare|finish|build|create|design|plan|complete|make|work on)\b|presentation|report|essay|project|assignment|proposal/,
    steps: (s) => [
      s ? `Open the document or tool for ${s}` : "Open the document or tool",
      "Jot a rough outline (3-5 bullets)",
      "Work on just the first section, rough is fine",
      "Do the next section",
      "Read through once and fix the obvious",
    ],
  },
  {
    match: /^(clean|tidy|organi[sz]e|declutter|wash|sort|put away|laundry|dishes)\b/,
    steps: () => [
      "Set a 10-minute timer",
      "Clear one small area",
      "Put things where they belong and bin the rest",
      "Stop when the timer ends, or keep going if you're rolling",
    ],
  },
  {
    match: /^(buy|shop|order|pick up|get|grab)\b/,
    steps: (s) => [
      s ? `Write down what you need for ${s}` : "Write down what you need",
      "Choose where you'll get it",
      "Go, or place the order",
    ],
  },
  {
    match: /^(exercise|workout|run|jog|gym|walk|stretch|swim)\b/,
    steps: () => ["Put on what you need", "Do the first 5 minutes, that's the win", "Keep going if it feels okay"],
  },
];

const FALLBACK = [
  "Open what you need for this",
  "Do the smallest first piece (about 5 minutes)",
  "Do the next chunk",
  "Check it off, or note what's left",
];

function subjectOf(title: string): string {
  return title.trim().replace(/^\S+\s+/, "").replace(/[.!?]+$/, "").trim();
}

export class TemplateTaskBreaker implements TaskBreaker {
  suggest(task: { title: string }): string[] {
    const title = task.title.trim();
    if (!title) return [];

    const lower = title.toLowerCase();
    const template = TEMPLATES.find((t) => t.match.test(lower));
    const subject = subjectOf(title);
    const steps = template ? template.steps(subject) : FALLBACK;
    return steps.filter(Boolean).slice(0, MAX_STEPS);
  }
}

export function getTaskBreaker(): TaskBreaker {
  return new TemplateTaskBreaker();
}

/** Whether to proactively nudge "break this down" — hard or long tasks with no steps yet. */
export function shouldSuggestBreakdown(task: {
  friction: number;
  estimatedMinutes: number | null;
  subtaskCount: number;
}): boolean {
  if (task.subtaskCount > 0) return false;
  return task.friction >= 4 || (task.estimatedMinutes ?? 0) >= 45;
}
