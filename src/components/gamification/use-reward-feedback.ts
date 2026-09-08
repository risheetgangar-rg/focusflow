"use client";

import { useRef, useState } from "react";
import type { RewardResult } from "@/services/gamification-service";

export function useRewardFeedback() {
  const [reward, setReward] = useState<RewardResult | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show(result: RewardResult | null | undefined) {
    if (!result) return;
    setReward(result);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setReward(null), 3500);
  }

  return { reward, show };
}
