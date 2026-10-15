"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { Check, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Companion } from "@/components/gamification/companion";
import {
  COMPANION_STAGE_NAMES,
  THEMES,
  companionStage,
  levelTitle,
} from "@/lib/gamification/rules";
import { canOfferOneMore } from "@/lib/tasks/one-more";
import type { CompletionOutcome, OneMoreSuggestion } from "@/types/gamification";
import type { GamificationMode } from "@/types/user";

interface ToastItem {
  id: number;
  kind: "reward" | "achievement" | "info";
  title: string;
  detail?: string;
  action?: { label: string; onClick: () => void };
}

type DialogItem =
  | { type: "levelUp"; level: number }
  | { type: "boss"; title: string }
  | { type: "oneMore"; suggestion: OneMoreSuggestion };

interface CelebrationApi {
  /** Show whatever a completion earned — only as much as the person's game mode allows. */
  celebrate: (outcome: CompletionOutcome, options?: { undo?: () => void }) => void;
  /** A plain, friendly message (optionally with an action such as Undo). */
  notify: (toast: { title: string; detail?: string; action?: { label: string; onClick: () => void } }) => void;
}

const noop: CelebrationApi = { celebrate: () => {}, notify: () => {} };
const CelebrationContext = createContext<CelebrationApi>(noop);

export function useCelebration(): CelebrationApi {
  return useContext(CelebrationContext);
}

const PRAISE = ["Nice work.", "That's one.", "Done.", "Keep going.", "Look at you.", "Smooth."];
const ONE_MORE_KEY = "ff-one-more";

async function burst(size: "small" | "big") {
  const confetti = (await import("canvas-confetti")).default;
  const css = getComputedStyle(document.documentElement);
  const brand = css.getPropertyValue("--brand").trim() || "#5b4bf0";
  const colors = [brand, "#ffcf5c", "#ff9fb4", "#7ddba6", "#8ec5ff"];
  const base = { colors, disableForReducedMotion: true, ticks: 160, zIndex: 80 };

  if (size === "small") {
    confetti({ ...base, particleCount: 38, spread: 70, startVelocity: 34, scalar: 0.85, origin: { x: 0.5, y: 0.9 } });
    return;
  }
  const fire = (originX: number, angle: number) =>
    confetti({ ...base, particleCount: 70, spread: 75, startVelocity: 48, angle, origin: { x: originX, y: 0.75 } });
  fire(0.15, 60);
  fire(0.85, 120);
  setTimeout(() => confetti({ ...base, particleCount: 90, spread: 110, startVelocity: 38, origin: { x: 0.5, y: 0.6 } }), 260);
}

function readOneMoreHistory(): { count: number; lastOfferedAt: number | null } {
  try {
    const raw = JSON.parse(localStorage.getItem(ONE_MORE_KEY) ?? "null");
    const today = new Date().toDateString();
    if (raw && raw.day === today) return { count: raw.count ?? 0, lastOfferedAt: raw.lastOfferedAt ?? null };
  } catch {
    // Storage blocked or unreadable: behave as if nothing was offered yet.
  }
  return { count: 0, lastOfferedAt: null };
}

function writeOneMoreHistory(history: { count: number; lastOfferedAt: number }) {
  try {
    localStorage.setItem(ONE_MORE_KEY, JSON.stringify({ day: new Date().toDateString(), ...history }));
  } catch {
    // Storage blocked: the offer just isn't rate-limited this session.
  }
}

export function CelebrationProvider({
  mode,
  children,
}: {
  mode: GamificationMode;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dialogs, setDialogs] = useState<DialogItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const pushToast = useCallback(
    (toast: Omit<ToastItem, "id">, ms = 4200) => {
      const id = nextId.current++;
      setToasts((t) => [...t.slice(-2), { ...toast, id }]);
      setTimeout(() => dismiss(id), ms);
    },
    [dismiss],
  );

  const pushDialog = useCallback((item: DialogItem, delay = 0) => {
    setTimeout(() => setDialogs((d) => [...d, item]), delay);
  }, []);

  const celebrate = useCallback(
    (outcome: CompletionOutcome, options?: { undo?: () => void }) => {
      const { reward, oneMore, bossDefeated, questCompleted } = outcome;
      if (!reward && !bossDefeated) return;

      if (reward) {
        const bits = [`+${reward.xpAwarded} XP`];
        if (reward.momentum > 1) bits.push(`🔥 Momentum ${reward.momentum}`);
        if (reward.isComeback) bits.push("Welcome back");
        pushToast({
          kind: "reward",
          title: PRAISE[(reward.totalXp + reward.momentum) % PRAISE.length],
          detail: bits.join("  ·  "),
          action: options?.undo ? { label: "Undo", onClick: options.undo } : undefined,
        }, options?.undo ? 6500 : 4200);
        reward.unlockedAchievements.forEach((name, i) =>
          setTimeout(() => pushToast({ kind: "achievement", title: "Achievement unlocked", detail: name }, 5200), 900 + i * 700),
        );
      }

      if (questCompleted) {
        setTimeout(() => pushToast({ kind: "achievement", title: "Quest complete", detail: questCompleted }, 5200), 700);
      }

      void burst(bossDefeated || reward?.leveledUp ? "big" : "small");

      if (bossDefeated) pushDialog({ type: "boss", title: bossDefeated }, 600);
      if (reward?.leveledUp) pushDialog({ type: "levelUp", level: reward.newLevel }, bossDefeated ? 900 : 700);

      if (oneMore && mode !== "off" && !bossDefeated && !reward?.leveledUp) {
        if (canOfferOneMore(readOneMoreHistory())) {
          const history = readOneMoreHistory();
          writeOneMoreHistory({ count: history.count + 1, lastOfferedAt: Date.now() });
          pushDialog({ type: "oneMore", suggestion: oneMore }, 1500);
        }
      }
    },
    [mode, pushDialog, pushToast],
  );

  const notify = useCallback<CelebrationApi["notify"]>(
    (toast) => pushToast({ kind: "info", ...toast }, toast.action ? 6500 : 3600),
    [pushToast],
  );

  const api = useMemo(() => ({ celebrate, notify }), [celebrate, notify]);
  const current = dialogs[0];
  const closeDialog = () => setDialogs((d) => d.slice(1));

  return (
    <CelebrationContext.Provider value={api}>
      {children}

      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-8"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <m.div
              key={toast.id}
              layout={false}
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="pointer-events-auto flex max-w-md items-center gap-3 rounded-full bg-primary py-2.5 pr-3 pl-2.5 text-primary-foreground shadow-lift"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground">
                {toast.kind === "achievement" ? <Trophy size={16} /> : toast.kind === "reward" ? <Sparkles size={16} /> : <Check size={16} />}
              </span>
              <span className="min-w-0 pr-1 text-left">
                <span className="block text-sm leading-tight font-medium">{toast.title}</span>
                {toast.detail && <span className="block text-xs leading-tight opacity-70">{toast.detail}</span>}
              </span>
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    dismiss(toast.id);
                  }}
                  className="rounded-full bg-primary-foreground/15 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-primary-foreground/25"
                >
                  {toast.action.label}
                </button>
              )}
            </m.div>
          ))}
        </AnimatePresence>
      </div>

      <Dialog open={Boolean(current)} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent showCloseButton={false} className="items-center text-center sm:max-w-md">
          {current?.type === "levelUp" && <LevelUpBody level={current.level} onClose={closeDialog} />}
          {current?.type === "boss" && <BossBody title={current.title} onClose={closeDialog} />}
          {current?.type === "oneMore" && (
            <OneMoreBody
              suggestion={current.suggestion}
              onClose={closeDialog}
              onGo={() => {
                closeDialog();
                router.push(`/focus/${current.suggestion.taskId}`);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </CelebrationContext.Provider>
  );
}

function LevelUpBody({ level, onClose }: { level: number; onClose: () => void }) {
  const stage = companionStage(level);
  const evolved = stage > companionStage(level - 1);
  const unlockedTheme = THEMES.find((t) => t.unlockLevel === level);

  return (
    <>
      <Companion stage={stage} mood="cheer" size={150} className="mx-auto" />
      <p className="text-eyebrow">Level up</p>
      <DialogTitle className="text-5xl">Level {level}</DialogTitle>
      <DialogDescription className="text-base">{levelTitle(level)}</DialogDescription>
      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        {evolved && <p>Pip evolved into the {COMPANION_STAGE_NAMES[stage]} form.</p>}
        {unlockedTheme && <p>New theme unlocked: {unlockedTheme.name}.</p>}
        {!evolved && !unlockedTheme && <p>You&apos;re building real momentum.</p>}
      </div>
      <Button size="lg" variant="brand" onClick={onClose} className="w-full">
        Keep going
      </Button>
    </>
  );
}

function BossBody({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <>
      <p className="text-eyebrow">Boss defeated</p>
      <DialogTitle className="text-5xl">{title}</DialogTitle>
      <DialogDescription className="text-base">
        You took it down one step at a time. That&apos;s +100 XP and a very good day.
      </DialogDescription>
      <Button size="lg" variant="brand" onClick={onClose} className="w-full">
        Victory lap
      </Button>
    </>
  );
}

function OneMoreBody({
  suggestion,
  onClose,
  onGo,
}: {
  suggestion: OneMoreSuggestion;
  onClose: () => void;
  onGo: () => void;
}) {
  return (
    <>
      <p className="text-eyebrow">One more?</p>
      <DialogTitle className="text-4xl">{suggestion.title}</DialogTitle>
      <DialogDescription className="text-base">
        A {suggestion.minutes}-minute task. Totally optional. Stopping here is a win too.
      </DialogDescription>
      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <Button size="lg" variant="brand" onClick={onGo} className="flex-1">
          Do it
        </Button>
        <Button size="lg" variant="outline" onClick={onClose} className="flex-1">
          I&apos;m done
        </Button>
      </div>
    </>
  );
}
