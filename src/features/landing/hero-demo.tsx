"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { execute, type World } from "@/engine";
import { AGENTS_MD, P_EURO, P_TOTAL, shop } from "@/features/curriculum/scenario";
import { AgentView } from "@/features/lab/agent-view";
import { useL, useT } from "@/i18n";

const initialWorld = () => shop();

/** The core interaction, right on the landing page: send a prompt, see what the agent saw and did. */
export function HeroDemo() {
  const t = useT();
  const l = useL();
  const script: Array<{ cmd: string; label?: string; run?: (w: World) => World; note: string }> = [
    { cmd: 'claude -p "fix the bug"', note: l("Vague prompt: the agent searched every file and guessed.", "Prompt flou : l'agent a fouillé chaque fichier et deviné.") },
    { cmd: `claude -p "${P_TOTAL}"`, label: 'claude -p "Fix the total bug in @src/cart.ts…"', note: l("Precise prompt: one file read, fixed, tested.", "Prompt précis : un fichier lu, corrigé, testé.") },
    { cmd: "AGENTS.md", label: "AGENTS.md ← rules", run: (w) => ({ ...w, files: { ...w.files, "AGENTS.md": AGENTS_MD, "CLAUDE.md": "@AGENTS.md\n" } }), note: l("Rules: now every agent knows pnpm and runs the tests.", "Des règles : chaque agent connaît pnpm et lance les tests.") },
    { cmd: `orca worktree create --name euro --agent codex --prompt "${P_EURO}"`, label: "orca worktree create --name euro --agent codex …", note: l("A second agent, working in parallel in its own worktree.", "Un second agent, qui travaille en parallèle dans son worktree.") },
  ];
  const [world, setWorld] = useState<World>(initialWorld);
  const [i, setI] = useState(0);
  const [log, setLog] = useState<Array<{ cmd: string; out: string[] }>>([]);
  const step = () => {
    const s = script[i];
    if (s.run) {
      setWorld(s.run(world));
      setLog((x) => [...x.slice(-1), { cmd: `edit ${s.cmd}`, out: [] }]);
    } else {
      const r = execute(world, s.cmd, { locale: t.locale });
      setWorld(r.world);
      setLog((x) => [...x.slice(-1), { cmd: s.label ?? s.cmd, out: r.lines.filter((y) => y.kind !== "muted").map((y) => y.text).slice(0, 3) }]);
    }
    setI(i + 1);
  };
  const reset = () => {
    setWorld(initialWorld());
    setI(0);
    setLog([]);
  };
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="h-60 border-b border-line bg-surface-2/30 sm:h-64">
        <AgentView world={world} eventKey={i} compact orca={world.worktrees.length > 0} />
      </div>
      <div className="terminal bg-term p-4 font-mono text-[12.5px] leading-relaxed sm:text-[13px]">
        <div className="min-h-[96px]">
          {log.map((x, k) => (
            <div key={k + x.cmd} className={clsx(k < log.length - 1 && "opacity-50")}>
              <p className="truncate">
                <span className="text-[var(--t-green)]">$</span> <span className="text-white">{x.cmd}</span>
              </p>
              {x.out.map((o, j) => (
                <p key={j} className="truncate text-[var(--t-muted)]">
                  {o}
                </p>
              ))}
            </div>
          ))}
          {!log.length && <p className="text-[var(--t-muted)]">{t("lab.hero.idle")}</p>}
        </div>
        <div className="mt-3 flex items-center gap-3 border-t border-white/5 pt-3 font-sans">
          {i < script.length ? (
            <button onClick={step} data-nudge={i === 0} className="flex min-w-0 items-center gap-2 rounded-md bg-[var(--accent)] px-3 py-2 text-left text-xs font-medium text-white hover:brightness-110">
              <Play className="size-3.5 shrink-0 fill-current" />
              <code className="truncate font-mono">{script[i].label ?? script[i].cmd}</code>
            </button>
          ) : (
            <button onClick={reset} className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/15">
              <RotateCcw className="size-3.5" /> {t("lab.hero.playAgain")}
            </button>
          )}
          <AnimatePresence mode="wait">
            <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 text-xs text-[var(--t-muted)]">
              {i > 0 ? script[i - 1].note : t("lab.hero.tagline")}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
