import Link from "next/link";
import { ArrowRight, CalendarClock, Clock, ListChecks, Plus, Target, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { DueDescription } from "@/lib/dates/format";
import type { Task } from "@/types/task";

export interface PickerItem {
  task: Task;
  /** Plain-language due date, or null when there isn't one. */
  due: DueDescription | null;
  stepCount: number;
}

function stepsLabel(count: number) {
  return `${count} ${count === 1 ? "step" : "steps"}`;
}

/** The one task to start with, big and unmissable. */
export function PickerHero({ item, reason, tricky }: { item: PickerItem; reason: string; tricky: boolean }) {
  const { task, due, stepCount } = item;

  return (
    <section
      aria-labelledby="focus-hero"
      className="animate-rise bg-grain relative overflow-hidden rounded-[2rem] bg-tint-lavender p-6 shadow-lift sm:p-10"
    >
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-72 animate-float-slow rounded-full bg-tint-peach blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-10 size-64 animate-float rounded-full bg-tint-sky blur-3xl" />

      <div className="relative space-y-6">
        <p className="text-eyebrow text-foreground/60">Start here</p>
        <h2 id="focus-hero" className="font-display text-4xl leading-[1.05] text-balance [overflow-wrap:anywhere] sm:text-6xl">
          {task.title}
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="brand">{reason}</Badge>
          {due && (
            <Badge variant="secondary" className="bg-card/70">
              <CalendarClock /> {due.label}
            </Badge>
          )}
          {task.estimatedMinutes ? (
            <Badge variant="secondary" className="bg-card/70">
              <Clock /> {task.estimatedMinutes} min
            </Badge>
          ) : null}
          {stepCount > 0 && (
            <Badge variant="secondary" className="bg-card/70">
              <ListChecks /> {stepsLabel(stepCount)}
            </Badge>
          )}
        </div>

        {tricky && (
          <p className="flex items-start gap-2 text-sm text-foreground/70">
            <Zap size={16} className="mt-0.5 shrink-0 text-brand" />
            This one&apos;s tricky to start. Focus mode will help you find a small first step.
          </p>
        )}

        <Link href={`/focus/${task.id}`} className={buttonVariants({ variant: "brand", size: "xl" })}>
          Start <ArrowRight />
        </Link>
      </div>
    </section>
  );
}

/** A smaller option: the title, how long it takes, when it's due, and a Start. */
export function PickerOption({ item, index }: { item: PickerItem; index: number }) {
  const { task, due, stepCount } = item;
  const meta = [
    task.estimatedMinutes ? (
      <span key="minutes" className="inline-flex items-center gap-1.5">
        <Clock size={14} /> {task.estimatedMinutes} min
      </span>
    ) : null,
    due ? (
      <span key="due" className="inline-flex items-center gap-1.5">
        <CalendarClock size={14} /> {due.label}
      </span>
    ) : null,
    stepCount > 0 ? (
      <span key="steps" className="inline-flex items-center gap-1.5">
        <ListChecks size={14} /> {stepsLabel(stepCount)}
      </span>
    ) : null,
  ].filter(Boolean);

  return (
    <li className="animate-rise" style={{ animationDelay: `${0.1 + index * 0.07}s` }}>
      <div className="flex items-center gap-4 rounded-3xl border border-border/80 bg-card p-4 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift sm:p-5">
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="line-clamp-2 font-medium [overflow-wrap:anywhere]">{task.title}</p>
          {meta.length > 0 && <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">{meta}</p>}
        </div>
        <Link
          href={`/focus/${task.id}`}
          aria-label={`Start ${task.title}`}
          className={buttonVariants({ variant: "outline" })}
        >
          Start
        </Link>
      </div>
    </li>
  );
}

/** Nothing to pick from. Say what to do next, never leave the page blank. */
export function PickerEmpty() {
  return (
    <section className="animate-rise bg-grain relative overflow-hidden rounded-[2rem] bg-tint-mint p-8 text-center sm:p-14">
      <div aria-hidden className="pointer-events-none absolute -top-20 -left-12 size-64 animate-float-slow rounded-full bg-tint-sky blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-10 -bottom-24 size-64 animate-float rounded-full bg-tint-butter blur-3xl" />

      <div className="relative mx-auto flex max-w-md flex-col items-center gap-5">
        <span className="grid size-14 place-items-center rounded-full bg-card/80 shadow-soft">
          <Target size={24} />
        </span>
        <h2 className="font-display text-4xl text-balance sm:text-5xl">Pick one task to start.</h2>
        <p className="text-foreground/70">Nothing is waiting on you right now. Add one small thing and we&apos;ll begin there.</p>
        <Link href="/tasks" className={buttonVariants({ variant: "brand", size: "lg" })}>
          <Plus /> Add a task
        </Link>
      </div>
    </section>
  );
}
