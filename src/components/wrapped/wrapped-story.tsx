"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WrappedStats } from "@/lib/wrapped/wrapped";
import { cn } from "@/lib/utils";

interface Slide {
  key: string;
  tint: string;
  eyebrow: string;
  big: string;
  small?: string;
}

function slidesFor(stats: WrappedStats, range: string): Slide[] {
  const slides: Slide[] = [
    { key: "intro", tint: "bg-tint-lavender", eyebrow: range, big: "Your week, wrapped.", small: "Tap to see it." },
    stats.done > 0
      ? { key: "done", tint: "bg-tint-butter", eyebrow: "You finished", big: `${stats.done} ${stats.done === 1 ? "thing" : "things"}`, small: stats.highlight ? `Including “${stats.highlight}”.` : undefined }
      : { key: "done", tint: "bg-tint-butter", eyebrow: "This week", big: "A quiet one.", small: "Resting counts too." },
  ];
  if (stats.topType) slides.push({ key: "type", tint: "bg-tint-mint", eyebrow: "You were best at", big: stats.topType });
  if (stats.bestTime)
    slides.push({
      key: "time",
      tint: "bg-tint-sky",
      eyebrow: "You get things done in the",
      big: stats.bestTime,
      small: stats.bestDay ? `Your best day was ${stats.bestDay}.` : undefined,
    });
  if (stats.focusMinutes > 0)
    slides.push({
      key: "focus",
      tint: "bg-tint-peach",
      eyebrow: "You locked in for",
      big: `${stats.focusMinutes} min`,
      small: `Your longest stretch: ${stats.longestFocus} min.`,
    });
  if (stats.comebacks > 0)
    slides.push({
      key: "comeback",
      tint: "bg-tint-rose",
      eyebrow: "You came back",
      big: `${stats.comebacks} ${stats.comebacks === 1 ? "time" : "times"}`,
      small: "That's the whole trick.",
    });
  slides.push({ key: "word", tint: "bg-primary text-primary-foreground", eyebrow: "Your week in one word", big: stats.word });
  return slides;
}

/** Draws the shareable card with the app's own theme colours, so it matches whatever theme is on. */
async function makeShareImage(stats: WrappedStats, range: string): Promise<Blob | null> {
  const css = getComputedStyle(document.documentElement);
  const color = (name: string) => css.getPropertyValue(name).trim();
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  await document.fonts.ready;
  const display = css.getPropertyValue("--font-display-serif").trim() || "serif";
  const sans = css.getPropertyValue("--font-geist-sans").trim() || "sans-serif";

  ctx.fillStyle = color("--primary");
  ctx.fillRect(0, 0, 1080, 1350);
  ctx.fillStyle = color("--brand");
  ctx.beginPath();
  ctx.arc(980, 120, 260, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color("--primary-foreground");
  ctx.font = `600 34px ${sans}`;
  ctx.fillText(`UNSTUCK · ${range.toUpperCase()}`, 80, 140);
  ctx.font = `400 120px ${display}`;
  ctx.fillText("My week,", 80, 330);
  ctx.fillText("wrapped.", 80, 450);

  const rows: [string, string][] = [
    ["Things done", String(stats.done)],
    ...(stats.topType ? ([["Best at", stats.topType]] as [string, string][]) : []),
    ...(stats.bestTime ? ([["Best time", stats.bestTime]] as [string, string][]) : []),
    ...(stats.focusMinutes > 0 ? ([["Locked in", `${stats.focusMinutes} min`]] as [string, string][]) : []),
    ...(stats.comebacks > 0 ? ([["Came back", `${stats.comebacks}×`]] as [string, string][]) : []),
  ];
  let y = 620;
  for (const [label, value] of rows) {
    ctx.globalAlpha = 0.6;
    ctx.font = `500 34px ${sans}`;
    ctx.fillText(label, 80, y);
    ctx.globalAlpha = 1;
    ctx.font = `400 64px ${display}`;
    ctx.fillText(value, 80, y + 72);
    y += 150;
  }
  ctx.font = `400 92px ${display}`;
  ctx.fillStyle = color("--brand");
  ctx.fillText(stats.word, 80, 1250);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/** Tap-through story cards, then a card you can share. Arrow keys work too. */
export function WrappedStory({ stats, range }: { stats: WrappedStats; range: string }) {
  const slides = slidesFor(stats, range);
  const [index, setIndex] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const last = index === slides.length - 1;
  const slide = slides[index];

  const count = slides.length;
  const go = (delta: number) => setIndex((i) => Math.min(count - 1, Math.max(0, i + delta)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (delta) setIndex((i) => Math.min(count - 1, Math.max(0, i + delta)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count]);

  async function share() {
    setSharing(true);
    setNote(null);
    try {
      const blob = await makeShareImage(stats, range);
      if (!blob) throw new Error("no image");
      const file = new File([blob], "my-unstuck-wrapped.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My week, wrapped" });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        setNote("Saved as a picture. Share it anywhere you like.");
      }
    } catch {
      setNote("Couldn't make the picture this time.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5" aria-hidden>
        {slides.map((s, i) => (
          <span key={s.key} className={cn("h-1 flex-1 rounded-full transition-colors", i <= index ? "bg-foreground" : "bg-foreground/15")} />
        ))}
      </div>

      <div className={cn("relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-lift sm:aspect-[5/4]", slide.tint)}>
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={slide.key}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex h-full flex-col justify-end p-7 sm:p-12"
            aria-live="polite"
          >
            <p className="text-eyebrow opacity-70">{slide.eyebrow}</p>
            <p className="mt-3 font-display text-6xl leading-[0.95] text-balance sm:text-8xl">{slide.big}</p>
            {slide.small && <p className="mt-4 max-w-md text-lg opacity-75">{slide.small}</p>}
          </m.div>
        </AnimatePresence>

        {/* Tap the left or right side to move, like a story. */}
        <button type="button" aria-label="Previous" onClick={() => go(-1)} className="absolute inset-y-0 left-0 w-1/3 cursor-w-resize" />
        <button type="button" aria-label="Next" onClick={() => go(1)} className="absolute inset-y-0 right-0 w-2/3 cursor-e-resize" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button variant="outline" size="icon" aria-label="Previous" onClick={() => go(-1)} disabled={index === 0}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon" aria-label="Next" onClick={() => go(1)} disabled={last}>
            <ChevronRight />
          </Button>
        </div>
        <Button variant="brand" size="lg" onClick={share} disabled={sharing}>
          <Share2 /> {sharing ? "Making your card…" : "Share my Wrapped"}
        </Button>
      </div>
      {note && <p className="text-sm text-muted-foreground">{note}</p>}
    </div>
  );
}
