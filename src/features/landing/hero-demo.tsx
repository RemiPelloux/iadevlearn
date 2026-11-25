"use client";

import { clsx } from "clsx";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { ArrowUpRight, Pause, Play, RotateCcw } from "lucide-react";
import { execute, lastRun, type OutLine, type ToolId, type World } from "@/engine";
import { AGENTS_MD, CODEX_READ_ONLY, P_DISCOUNT, P_EURO, P_TOTAL, RELEASE_WORKFLOW, shop } from "@/features/curriculum/scenario";
import { KIND_COLOR, ToolBadge } from "@/features/lab/agent-view";
import { useL, useLocale } from "@/i18n";

interface Scene {
  id: "claude" | "codex" | "agy" | "orca";
  label: string;
  tool: ToolId | null;
  setup: () => World;
  commands: string[];
  /** One line under the console saying what the scene shows. */
  caption: { en: string; fr: string };
}

const SHARED = { "AGENTS.md": AGENTS_MD, "CLAUDE.md": "@AGENTS.md\n" };

const SCENES: Scene[] = [
  {
    id: "claude",
    label: "Claude Code",
    tool: "claude",
    setup: () => shop(),
    commands: ['claude -p "add a discount"', `claude -p "${P_DISCOUNT}"`],
    caption: { en: "Same agent, two prompts: the vague one guesses, the precise one adds tests and runs them.", fr: "Même agent, deux prompts : le flou devine, le précis ajoute des tests et les lance." },
  },
  {
    id: "codex",
    label: "Codex",
    tool: "codex",
    setup: () => shop({ "AGENTS.md": AGENTS_MD, "~/.codex/config.toml": CODEX_READ_ONLY }),
    commands: ['codex exec "Fix the total bug in @src/cart.ts"', 'codex exec --full-auto "Fix the total bug in @src/cart.ts"'],
    caption: { en: "A read-only sandbox blocks the edit. --full-auto lets Codex write inside the project, and AGENTS.md makes it test with pnpm.", fr: "Une sandbox en lecture seule bloque la modification. --full-auto laisse Codex écrire dans le projet, et AGENTS.md le fait tester avec pnpm." },
  },
  {
    id: "agy",
    label: "Antigravity",
    tool: "antigravity",
    setup: () => shop({ ...SHARED, ".agents/workflows/release.md": RELEASE_WORKFLOW }),
    commands: ["agy", "/release"],
    caption: { en: "A workflow in .agents/workflows/ becomes a slash command: one word, the same release steps every time.", fr: "Un workflow dans .agents/workflows/ devient une commande slash : un mot, les mêmes étapes de release à chaque fois." },
  },
  {
    id: "orca",
    label: "Orca",
    tool: null,
    setup: () => shop(SHARED),
    commands: [`orca worktree create --name fix-total --agent codex --prompt "${P_TOTAL}"`, `orca worktree create --name euro --agent claude --prompt "${P_EURO}"`, "orca worktree ps"],
    caption: { en: "Two agents, two worktrees, working in parallel on different files. You review and merge.", fr: "Deux agents, deux worktrees, en parallèle sur des fichiers différents. Toi, tu relis et tu fusionnes." },
  },
];

interface Played {
  input: string;
  lines: OutLine[];
  session: boolean;
}

/** Run a scene through the real simulator once, so the console replays genuine output. */
function playScene(scene: Scene, locale: "en" | "fr") {
  let world = scene.setup();
  const out: Played[] = [];
  for (const cmd of scene.commands) {
    const session = !!world.session;
    const r = execute(world, cmd, { locale });
    world = r.world;
    out.push({ input: cmd, lines: r.lines.filter((l) => l.text.trim()), session });
  }
  return { played: out, world };
}

const LINE_CLS: Partial<Record<OutLine["kind"], string>> = {
  muted: "text-[var(--t-muted)]",
  error: "text-[var(--t-red)]",
  success: "text-[var(--t-green)]",
  hint: "text-[var(--t-orange)]",
  added: "text-[var(--t-green)]",
  warning: "text-[var(--t-yellow)]",
  commit: "text-[var(--t-yellow)]",
  agent: "font-sans text-[var(--t-text)]",
  tool: "text-[var(--t-cyan)]",
  info: "text-[var(--t-magenta)]",
};

const TYPE_MS = 16;
const LINE_MS = 85;
const HOLD_MS = 4200;

/** The landing console: real prompts typed into the simulator, output played back line by line. */
export function HeroDemo() {
  const l = useL();
  const locale = useLocale();
  const reduced = useReducedMotion();
  const [sceneIdx, setSceneIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [touched, setTouched] = useState(false);
  const scene = SCENES[sceneIdx];
  const { played, world } = useMemo(() => playScene(scene, locale), [scene, locale]);

  // Flatten into a timeline: type each command, then reveal its lines.
  const total = useMemo(() => played.reduce((n, p) => n + p.input.length + p.lines.length, 0), [played]);
  const [t, setT] = useState(0);
  const [prevKey, setPrevKey] = useState(`${sceneIdx}:${locale}`);
  if (prevKey !== `${sceneIdx}:${locale}`) {
    setPrevKey(`${sceneIdx}:${locale}`);
    setT(0);
  }
  const shownT = reduced ? total : t;

  useEffect(() => {
    if (reduced || paused) return;
    if (t < total) {
      // Typing is fast; a revealed line takes a beat.
      let acc = 0;
      let typing = false;
      for (const p of played) {
        if (t < acc + p.input.length) {
          typing = true;
          break;
        }
        acc += p.input.length;
        if (t < acc + p.lines.length) break;
        acc += p.lines.length;
      }
      const id = setTimeout(() => setT((x) => x + (typing ? 2 : 1)), typing ? TYPE_MS : LINE_MS);
      return () => clearTimeout(id);
    }
    if (touched) return;
    const id = setTimeout(() => setSceneIdx((i) => (i + 1) % SCENES.length), HOLD_MS);
    return () => clearTimeout(id);
  }, [t, total, played, paused, reduced, touched]);

  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shownT]);

  // What's visible at time t.
  const view: Array<{ input: string; done: boolean; lines: OutLine[]; session: boolean }> = [];
  let budget = shownT;
  for (const p of played) {
    if (budget <= 0) break;
    const typed = Math.min(p.input.length, budget);
    budget -= typed;
    const lines = p.lines.slice(0, Math.max(0, budget));
    budget -= lines.length;
    view.push({ input: p.input.slice(0, typed), done: typed === p.input.length, lines, session: p.session });
  }
  const finished = shownT >= total;
  const run = lastRun(world);
  const items = run?.context ?? [];
  const tokens = items.reduce((n, c) => n + c.tokens, 0);

  return (
    <div className="relative">
      <div className="terminal overflow-hidden rounded-xl bg-term shadow-[0_24px_60px_-20px_rgba(20,16,40,0.55)] ring-1 ring-black/20">
        <div className="flex items-center gap-2 border-b border-white/5 px-3 pt-2.5">
          <span className="flex gap-1.5 pb-2.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </span>
          <div className="ml-2 flex min-w-0 gap-0.5 overflow-x-auto" role="tablist" aria-label={l("Agents in the demo", "Agents de la démo")}>
            {SCENES.map((s, i) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={i === sceneIdx}
                onClick={() => {
                  setTouched(true);
                  setSceneIdx(i);
                  setT(0);
                }}
                className={clsx(
                  "flex shrink-0 items-center gap-1.5 rounded-t-md px-2.5 pt-1.5 pb-2 font-sans text-xs transition-colors",
                  i === sceneIdx ? "bg-white/[0.07] text-white" : "text-[var(--t-muted)] hover:text-white",
                )}
              >
                {s.tool ? <ToolBadge tool={s.tool} /> : <span className="grid size-5 place-items-center rounded-md bg-white/10 text-[9px] font-semibold">OR</span>}
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div ref={scroller} className="scrollbar-thin h-[19rem] overflow-y-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed sm:h-[21rem]" aria-hidden>
          {view.map((v, i) => (
            <div key={i} className="mb-2">
              <p className="break-words">
                {v.session ? <span className="text-[var(--t-orange)]">{scene.id === "agy" ? "antigravity ▸" : ">"} </span> : <span className="text-[var(--t-green)]">~/tiny-shop $ </span>}
                <span className="text-white">{v.input}</span>
                {!v.done && <span className="caret ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 bg-[var(--t-text)]" />}
              </p>
              {v.lines.map((line, k) => (
                <p key={k} className={clsx("whitespace-pre-wrap break-words", LINE_CLS[line.kind] ?? "text-[var(--t-text)]")}>
                  {line.text}
                </p>
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-white/5 px-4 py-2.5 font-sans">
          <div className="flex min-w-40 flex-1 items-center gap-2">
            <span className="text-[11px] text-[var(--t-muted)]">{l("Context", "Contexte")}</span>
            <span className="flex h-2 flex-1 overflow-hidden rounded-full bg-white/10" aria-hidden>
              {finished &&
                items.map((c, i) => <span key={i} className="h-full transition-[width] duration-700" style={{ width: `${(c.tokens / Math.max(6000, tokens * 1.15)) * 100}%`, background: KIND_COLOR[c.kind] }} />)}
            </span>
            <span className="font-mono text-[11px] text-[var(--t-muted)] tabular-nums">{finished && tokens ? `${(tokens / 1000).toFixed(1)}k` : "…"}</span>
          </div>
          <div className="flex items-center gap-1">
            {!reduced && (
              <button
                onClick={() => {
                  setTouched(true);
                  setPaused((p) => !p);
                }}
                className="grid size-7 place-items-center rounded-md text-[var(--t-muted)] hover:bg-white/10 hover:text-white"
                aria-label={paused ? l("Play the demo", "Lancer la démo") : l("Pause the demo", "Mettre la démo en pause")}
              >
                {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
              </button>
            )}
            <button
              onClick={() => {
                setTouched(true);
                setPaused(false);
                setT(0);
              }}
              className="grid size-7 place-items-center rounded-md text-[var(--t-muted)] hover:bg-white/10 hover:text-white"
              aria-label={l("Replay", "Rejouer")}
            >
              <RotateCcw className="size-3.5" />
            </button>
            <Link href="/playground" className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-white hover:bg-white/10">
              {l("Try it yourself", "Essaie toi-même")} <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
      <p className="mt-3 min-h-10 text-sm text-fg-2" aria-live="polite">
        {scene.caption[locale]}
      </p>
    </div>
  );
}
