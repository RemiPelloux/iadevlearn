"use client";

import { clsx } from "clsx";
import { motion } from "motion/react";
import { useState } from "react";
import { Check, RotateCcw, User } from "lucide-react";
import { STORIES } from "@/features/curriculum/registry";
import type { StoryDef } from "@/features/curriculum/types";
import { Button } from "@/components/ui/button";
import { useL, usePick } from "@/i18n";

const TONE: Record<NonNullable<StoryDef["steps"][number]["tone"]>, string> = {
  tool: "text-[var(--t-cyan)]",
  ok: "text-[var(--t-green)]",
  bad: "text-[var(--t-red)]",
  warn: "text-[var(--t-yellow)]",
  agent: "font-sans text-[var(--t-text)]",
  muted: "text-[var(--t-muted)]",
};

/** A Discover walkthrough written as data in a lesson file: press Next to reveal each step. */
export function StoryScene({ id }: { id: string }) {
  const story = STORIES[id];
  const l = useL();
  const pick = usePick();
  const [phase, setPhase] = useState(-1);
  if (!story) return null;
  const steps = story.steps;
  const done = phase >= steps.length - 1;
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-line bg-surface-2/40 p-4">
        {story.prompt && (
          <div className="mb-4 flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2 text-sm">
            <User className="size-4 shrink-0 text-fg-3" />
            <span className="italic">“{pick(story.prompt)}”</span>
          </div>
        )}
        <ol className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(steps.length, 6)}, minmax(0, 1fr))` }}>
          {steps.map((s, i) => (
            <li key={i} className="flex flex-col items-center gap-1.5 text-center">
              <motion.button
                type="button"
                onClick={() => setPhase(i)}
                animate={{ scale: i === phase ? 1.12 : 1 }}
                aria-label={pick(s.name)}
                aria-current={i === phase ? "step" : undefined}
                className={clsx("grid size-9 place-items-center rounded-full border-2 text-sm font-semibold", i <= phase ? "border-accent-mark bg-accent-mark text-white" : "border-line-strong bg-surface text-fg-3")}
              >
                {i < phase ? <Check className="size-4" strokeWidth={3} /> : i + 1}
              </motion.button>
              <span className={clsx("text-[11px] leading-tight font-medium", i <= phase ? "text-fg" : "text-fg-3")}>{pick(s.name)}</span>
            </li>
          ))}
        </ol>
        <div className="terminal mt-4 min-h-24 rounded-md bg-term px-3 py-2 font-mono text-[12px] leading-relaxed">
          {steps.slice(0, phase + 1).map((s, i) => (
            <motion.p key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className={clsx("whitespace-pre-wrap break-words", TONE[s.tone ?? "tool"])}>
              {s.line}
            </motion.p>
          ))}
          {phase < 0 && <p className="text-[var(--t-muted)]">{l("Press the button to start.", "Appuie sur le bouton pour commencer.")}</p>}
        </div>
      </div>
      <p className="min-h-10 text-sm text-fg-2" aria-live="polite">
        {phase < 0 ? pick(story.intro) : pick(steps[phase].note)}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {!done ? (
          <Button onClick={() => setPhase((p) => p + 1)} size="md" data-nudge={true}>
            {phase < 0 ? l("Start", "Démarrer") : l(`Next: ${pick(steps[phase + 1].name)}`, `Suivant : ${pick(steps[phase + 1].name)}`)}
          </Button>
        ) : (
          <span className="text-sm font-medium text-ok">{l("✓ That's the idea!", "✓ C'est l'idée !")}</span>
        )}
        <Button variant="ghost" size="sm" onClick={() => setPhase(-1)}>
          <RotateCcw className="size-3.5" /> {l("Replay", "Rejouer")}
        </Button>
      </div>
    </div>
  );
}
