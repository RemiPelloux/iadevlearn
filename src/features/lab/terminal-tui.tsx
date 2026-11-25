"use client";

import { clsx } from "clsx";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Square, SquareCheck, SquareMinus } from "lucide-react";
import { lastRun, startupContext, TOOL_NAMES, type AgentRun, type OutLine, type ToolId, type World } from "@/engine";
import { useL } from "@/i18n";

/**
 * Terminal UI pieces that make an agent session read like the real CLIs
 * (Claude Code's welcome box, ● tool calls, ⎿ results, a task checklist and a
 * status line), while staying plain enough for a beginner to follow.
 */

export const TOOL_TINT: Record<ToolId, string> = {
  claude: "#e8825a",
  codex: "#86b6dd",
  gemini: "#a9d07b",
  antigravity: "#d397c8",
};

export const LINE_CLS: Record<OutLine["kind"], string> = {
  out: "text-[var(--t-text)]",
  muted: "text-[var(--t-muted)]",
  error: "text-[var(--t-red)]",
  success: "text-[var(--t-green)]",
  hint: "text-[var(--t-orange)]",
  added: "text-[var(--t-green)]",
  removed: "text-[var(--t-red)]",
  hunk: "text-[var(--t-blue)]",
  commit: "text-[var(--t-yellow)]",
  warning: "text-[var(--t-yellow)]",
  agent: "text-[var(--t-text)]",
  tool: "text-[var(--t-cyan)]",
  info: "text-[var(--t-magenta)]",
};

const BULLETS = /^([●•✦▸])\s+(.*)$/;
const SUB = /^(\s+(?:⎿|└|↳)\s+)(.*)$/;

/** One output line, with tool calls split into bullet · Name · (arguments). */
export function RichLine({ line, tool, first }: { line: OutLine; tool: ToolId | null; first: boolean }) {
  const text = line.text;
  const b = text.match(BULLETS);
  if (b && (line.kind === "tool" || line.kind === "info")) {
    const call = b[2].match(/^([A-Z][\w]*)\((.*)\)(.*)$/);
    const plain = !call && b[2].match(/^(\S+)\s(.*)$/);
    return (
      <div className="flex gap-2 whitespace-pre-wrap break-words">
        <span className="shrink-0 text-[var(--t-green)]" aria-hidden>
          {b[1]}
        </span>
        <span className="min-w-0">
          {call ? (
            <>
              <span className="font-semibold text-[var(--t-text)]">{call[1]}</span>
              <span className="text-[var(--t-muted)]">(</span>
              <span className={LINE_CLS[line.kind]}>{call[2]}</span>
              <span className="text-[var(--t-muted)]">)</span>
              <span className="text-[var(--t-muted)]">{call[3]}</span>
            </>
          ) : plain ? (
            <>
              <span className="font-semibold text-[var(--t-text)]">{plain[1]}</span> <span className={LINE_CLS[line.kind]}>{plain[2]}</span>
            </>
          ) : (
            <span className={LINE_CLS[line.kind]}>{b[2]}</span>
          )}
        </span>
      </div>
    );
  }
  const sub = text.match(SUB);
  if (sub) {
    return (
      <div className="flex whitespace-pre-wrap break-words">
        <span className="shrink-0 text-[var(--t-muted)]" aria-hidden>
          {sub[1]}
        </span>
        <span className={clsx("min-w-0", LINE_CLS[line.kind])}>{sub[2]}</span>
      </div>
    );
  }
  if (line.kind === "agent" && tool) {
    // The agent's own words: a white bullet on the first line of a paragraph, like Claude Code.
    return (
      <div className="flex gap-2 font-sans text-[1.02em] leading-relaxed">
        <span className={clsx("shrink-0 font-mono", first ? "text-[var(--t-text)]" : "invisible")} aria-hidden>
          ●
        </span>
        <span className="min-w-0 whitespace-pre-wrap break-words text-[var(--t-text)]">{text.replace(/^\s+/, "") || " "}</span>
      </div>
    );
  }
  if (line.kind === "muted" && text.startsWith("──")) {
    return <div className="mt-1 border-t border-dashed border-white/10 pt-1 text-[0.85em] text-[var(--t-muted)]">{text.replace(/^──\s*/, "")}</div>;
  }
  return <div className={clsx("whitespace-pre-wrap break-words", LINE_CLS[line.kind], line.kind === "agent" && "font-sans")}>{text || " "}</div>;
}

/** Split an entry that opened a session into its welcome lines and the rest. */
export function splitBanner(lines: OutLine[]): [OutLine[], OutLine[]] {
  let i = 1;
  while (i < lines.length && lines[i].text.startsWith("  ") && ["muted", "warning", "hint"].includes(lines[i].kind)) i++;
  return [lines.slice(0, i), lines.slice(i)];
}

export function SessionBanner({ tool, lines }: { tool: ToolId; lines: OutLine[] }) {
  const [title, ...rest] = lines;
  const tint = TOOL_TINT[tool];
  const glyph = title?.text.match(/^(\S+)\s/)?.[1] ?? "✻";
  return (
    <div className="my-1.5 max-w-2xl rounded-lg border px-4 py-3" style={{ borderColor: `${tint}80` }}>
      <div className="flex items-center gap-2 font-semibold">
        <span style={{ color: tint }} aria-hidden>
          {glyph}
        </span>
        <span className="text-[var(--t-text)]">{title?.text.replace(/^\S+\s/, "")}</span>
      </div>
      {rest.length > 0 && (
        <div className="mt-2 space-y-0.5 text-[0.93em]">
          {rest.map((l, i) => (
            <div key={i} className={clsx("whitespace-pre-wrap break-words", LINE_CLS[l.kind])}>
              {l.text.replace(/^\s{2}/, "")}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** What you typed to an agent: a highlighted block, so the conversation is easy to scan. */
export function UserTurn({ tool, input, prompt }: { tool: ToolId; input: string; prompt: ReactNode }) {
  return (
    <div className="-mx-1 mb-1.5 flex gap-2 rounded-md bg-white/[0.05] px-2 py-1.5" style={{ boxShadow: `inset 2px 0 0 ${TOOL_TINT[tool]}` }}>
      {prompt}
      <span className="min-w-0 whitespace-pre-wrap break-words text-white">{input}</span>
    </div>
  );
}

type Step = { id: AgentRun["phases"][number]; label: string; detail?: string; state: "done" | "todo" | "skip" };

/** The agent's work as a checklist, like Claude Code's todo list: what it did, in order. */
export function TaskList({ run }: { run: AgentRun }) {
  const l = useL();
  const files = run.context.filter((c) => c.kind === "file").length;
  const did = (p: Step["id"]) => run.phases.includes(p);
  const waiting = run.outcome === "plan";
  const steps: Step[] = [
    { id: "read", label: l("Read the project", "Lire le projet"), detail: [files ? l(`${files} file${files > 1 ? "s" : ""}`, `${files} fichier${files > 1 ? "s" : ""}`) : "", run.rules.length ? l(`rules: ${run.rules.join(", ")}`, `règles : ${run.rules.join(", ")}`) : ""].filter(Boolean).join(" · ") || undefined, state: "done" },
  ];
  if (did("plan") || waiting) steps.push({ id: "plan", label: l("Propose a plan", "Proposer un plan"), state: "done" });
  if (run.task) {
    steps.push({
      id: "act",
      label: run.outcome === "blocked" ? l("Edit files (blocked)", "Modifier les fichiers (bloqué)") : l("Edit the code", "Modifier le code"),
      detail: run.changed.length ? run.changed.join(", ") : undefined,
      state: did("act") ? "done" : waiting ? "todo" : "skip",
    });
    steps.push({
      id: "verify",
      label: l("Run the tests", "Lancer les tests"),
      detail: run.commands.length ? run.commands.join(" · ") : undefined,
      state: did("verify") ? "done" : waiting ? "todo" : "skip",
    });
  }
  steps.push({ id: "report", label: l("Report back", "Faire le point"), state: did("report") ? "done" : "todo" });

  const outcome: Record<AgentRun["outcome"], { text: string; cls: string }> = {
    done: { text: l("done", "terminé"), cls: "text-[var(--t-green)] bg-[var(--t-green)]/10" },
    partial: { text: l("done, with guesses", "terminé, avec suppositions"), cls: "text-[var(--t-yellow)] bg-[var(--t-yellow)]/10" },
    clarify: { text: l("needs more details", "manque de détails"), cls: "text-[var(--t-red)] bg-[var(--t-red)]/10" },
    answer: { text: l("answered", "répondu"), cls: "text-[var(--t-blue)] bg-[var(--t-blue)]/10" },
    plan: { text: l("waiting for your OK", "attend ton accord"), cls: "text-[var(--t-magenta)] bg-[var(--t-magenta)]/10" },
    blocked: { text: l("blocked", "bloqué"), cls: "text-[var(--t-red)] bg-[var(--t-red)]/10" },
  };
  const o = outcome[run.outcome];
  return (
    <div className="mt-1.5 mb-1 max-w-2xl rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2 font-sans text-[0.92em]">
      <div className="mb-1 flex items-center gap-2">
        <span className="font-semibold text-[var(--t-text)]">{l("Tasks", "Tâches")}</span>
        <span className="text-[var(--t-muted)]">·</span>
        <span className={clsx("rounded px-1.5 py-px text-[0.9em] font-medium", o.cls)}>{o.text}</span>
      </div>
      <ul className="space-y-0.5">
        {steps.map((s) => (
          <li key={s.id} className={clsx("flex gap-2", s.state === "skip" && "opacity-50")}>
            <span className="mt-[0.2em] shrink-0" role="img" aria-label={s.state === "done" ? l("done", "fait") : s.state === "todo" ? l("to do", "à faire") : l("skipped", "sauté")}>
              {s.state === "done" ? (
                <SquareCheck className="size-[1.05em] text-[var(--t-green)]" />
              ) : s.state === "todo" ? (
                <Square className="size-[1.05em] text-[var(--t-muted)]" />
              ) : (
                <SquareMinus className="size-[1.05em] text-[var(--t-muted)]" />
              )}
            </span>
            <span className={clsx(s.state === "done" ? "text-[var(--t-text)]" : "text-[var(--t-muted)]", s.state === "skip" && "line-through")}>{s.label}</span>
            {s.detail && <span className="min-w-0 truncate font-mono text-[0.9em] text-[var(--t-muted)]">{s.detail}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function findRun(world: World, id?: number) {
  return id === undefined ? null : (world.runs.find((r) => r.id === id) ?? null);
}

/** Bottom line of an agent session: mode, shortcuts, and how full the context window is. */
export function StatusLine({ world, tool }: { world: World; tool: ToolId }) {
  const l = useL();
  const run = lastRun(world, "main");
  const tokens = run && run.tool === tool ? run.tokens : startupContext(world, tool).reduce((n, c) => n + c.tokens, 0);
  const pct = Math.min(100, (tokens / 200_000) * 100);
  const plan = world.session?.plan;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-1 pt-1.5 font-sans text-[11px] text-[var(--t-muted)]">
      {plan ? (
        <span className="text-[var(--t-cyan)]">⏸ {l("plan mode on · it proposes before it edits", "mode plan · il propose avant de modifier")}</span>
      ) : (
        <span>
          <kbd className="font-mono text-[var(--t-text)]">/help</kbd> {l("commands", "commandes")} · <kbd className="font-mono text-[var(--t-text)]">/exit</kbd> {l("leave", "quitter")}
          {(tool === "claude" || tool === "gemini") && (
            <>
              {" "}
              · <kbd className="font-mono text-[var(--t-text)]">!cmd</kbd> {l("run a shell command", "lancer une commande shell")}
            </>
          )}
        </span>
      )}
      <span className="ml-auto flex items-center gap-2" title={l("How much of the context window is used", "Part de la fenêtre de contexte utilisée")}>
        <span style={{ color: TOOL_TINT[tool] }}>{TOOL_NAMES[tool]}</span>
        <span className="hidden sm:inline">· {l("context", "contexte")}</span>
        <span className="relative h-1.5 w-16 overflow-hidden rounded-full bg-white/10" aria-hidden>
          <span className="absolute inset-y-0 left-0 rounded-full bg-[var(--t-green)]" style={{ width: `${Math.max(2, pct)}%` }} />
        </span>
        <span className="font-mono">{(tokens / 1000).toFixed(1)}k / 200k</span>
      </span>
    </div>
  );
}

/** Reveal a fresh reply line by line, so you can follow what the agent does. */
export function Reveal({ i, fresh, children }: { i: number; fresh: boolean; children: ReactNode }) {
  if (!fresh) return <>{children}</>;
  return (
    <motion.div initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.045, 0.9), duration: 0.18 }}>
      {children}
    </motion.div>
  );
}
