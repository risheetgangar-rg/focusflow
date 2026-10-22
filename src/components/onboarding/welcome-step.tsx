"use client";

import { ArrowRight } from "lucide-react";
import { Mascot } from "@/components/marketing/mascot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepHeading } from "./step-heading";

export function WelcomeStep({
  name,
  onNameChange,
  isGuest,
  onNext,
}: {
  name: string;
  onNameChange: (name: string) => void;
  isGuest: boolean;
  onNext: () => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onNext();
      }}
      className="space-y-9"
    >
      <div className="space-y-6">
        <Mascot stage={2} mood="happy" size={104} />
        <StepHeading
          title={
            <>
              Welcome to <em>Unstuck.</em>
            </>
          }
          subtitle="A calm place to get things out of your head and start the next small thing. This takes about a minute, and you can skip anything."
        />
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="onboarding-name" className="text-base text-foreground">
          What should we call you?
          <span className="font-normal text-muted-foreground">Optional</span>
        </Label>
        <Input
          id="onboarding-name"
          name="name"
          autoComplete="given-name"
          maxLength={80}
          placeholder="Your first name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          className="h-14 rounded-2xl px-5 text-lg"
        />
      </div>

      {isGuest ? (
        <p className="rounded-2xl bg-tint-butter px-4 py-3 text-sm leading-relaxed text-foreground">
          You&apos;re using guest mode. Add an email in Settings any time to keep your tasks safe if you switch devices.
        </p>
      ) : null}

      <Button type="submit" size="xl">
        Continue
        <ArrowRight aria-hidden />
      </Button>
    </form>
  );
}
