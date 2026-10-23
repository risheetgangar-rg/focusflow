/*
 * What notifications say. Warm, short, a bit cheeky, and personal: they use
 * the person's name and the task, and change every time so they never feel
 * like a robot nagging. Never guilt: no "overdue", "missed", "late" or "failed".
 */

export interface Message {
  title: string;
  body: string;
}

/** Same inputs, same line, so a retry doesn't change the wording; a new hour picks a new one. */
function pick<T>(lines: T[], seed: string): T {
  let n = 0;
  for (const ch of seed) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  return lines[n % lines.length];
}

const hey = (name: string | null) => (name ? `${name}, ` : "");
const Hey = (name: string | null) => (name ? `${name}! ` : "");

/** For a Critical or High task: every 30 minutes, until it's done. */
export function criticalNudge(task: string, name: string | null, seed: string): Message {
  return pick(
    [
      { title: `🔥 ${hey(name)}this one matters`, body: `“${task}” · 10 minutes and it’s off your plate. Tap ✓ when it’s done.` },
      { title: `⚡ Quick one, ${name ?? "boss"}`, body: `“${task}” is still waiting for you. Just open it. That’s the whole first step.` },
      { title: `🎯 ${hey(name)}you vs. “${task}”`, body: `You’ve beaten harder. Lock in for 10 minutes and watch it disappear.` },
      { title: `💪 Future you is asking`, body: `${Hey(name)}“${task}” done today = a lighter tomorrow. Start tiny.` },
      { title: `🚀 ${hey(name)}let’s knock this out`, body: `“${task}”, 10 focused minutes. You’ll feel amazing after.` },
    ],
    seed,
  );
}

/** A reminder at its time. */
export function reminderDue(task: string, name: string | null, seed: string): Message {
  return pick(
    [
      { title: `⏰ ${task}`, body: `${Hey(name)}It’s time. Tap ✓ once it’s done.` },
      { title: `🔔 ${hey(name)}friendly nudge`, body: `“${task}”, right about now. You’ve got this.` },
      { title: `✨ ${task}`, body: `${Hey(name)}This is your sign. Do it now, tick it, forget it.` },
    ],
    seed,
  );
}

/** Coming up soon (in the next hour). */
export function comingUp(task: string, minutes: number, name: string | null, seed: string): Message {
  return pick(
    [
      { title: `⏳ ${task} in ${minutes} min`, body: `${Hey(name)}A heads-up so it doesn’t sneak up on you.` },
      { title: `👀 ${hey(name)}${minutes} minutes to go`, body: `“${task}” is coming up. Wrap up what you’re on.` },
    ],
    seed,
  );
}

/** Its time passed and it's still open: gentle, never guilt. */
export function stillOpen(task: string, name: string | null, seed: string): Message {
  return pick(
    [
      { title: `🌱 ${task}`, body: `${Hey(name)}Still on your list, no stress. 2 minutes now, or move it to later?` },
      { title: `💙 ${hey(name)}still here when you are`, body: `“${task}” is parked, not lost. Tap to pick it up or move it.` },
    ],
    seed,
  );
}

/** The "next up" card's second line. */
export function nextUpLine(when: string | null, seed: string): string {
  const tail = pick(
    ["10 minutes. That’s all it takes.", "Tiny first step: just open it.", "Future you is already grateful.", "You + this = done.", "Start small. Start now."],
    seed,
  );
  return `Next up${when ? ` · ${when}` : ""} · ${tail}`;
}
