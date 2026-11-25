"use client";

import { clsx } from "clsx";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useState } from "react";
import { Check, CircleDashed, GitMerge, MessageSquareText, X } from "lucide-react";
import { lastRun, PROMPT_CHECKS, promptGrade, startupContext, TOOL_NAMES, TOOLS, type AgentRun, type ContextItem, type ContextKind, type Outcome, type PromptCheck, type SimEvent, type ToolId, type World, type Worktree } from "@/engine";
import { useL } from "@/i18n";

export const KIND_COLOR: Record<ContextKind, string> = {
  system: "var(--text-3)",
  rules: "var(--lane-0)",
  "skill-index": "var(--lane-2)",
  skill: "var(--lane-5)",
  workflow: "var(--lane-4)",
  file: "var(--lane-1)",
  mcp: "var(--lane-3)",
  prompt: "var(--accent-mark)",
};

export function useKindLabel() {
  const l = useL();
  return (k: ContextKind) =>
    ({
      system: l("System prompt", "Prompt système"),
      rules: l("Rules", "Règles"),
      "skill-index": l("Skill index", "Index des skills"),
      skill: l("Skill", "Skill"),
      workflow: l("Workflow", "Workflow"),
      file: l("File", "Fichier"),
      mcp: "MCP",
      prompt: l("Your prompt", "Ton prompt"),
    })[k];
}

export function useCheckLabel() {
  const l = useL();
  return (c: PromptCheck) =>
    ({
      goal: l("Goal", "Objectif"),
      context: l("Context", "Contexte"),
      constraints: l("Constraints", "Contraintes"),
      verify: l("Verify", "Vérification"),
      specific: l("Details", "Précision"),
      done: l("Done when", "Critère de fin"),
    })[c];
}

export function useOutcomeLabel() {
  const l = useL();
  return (o: Outcome) =>
    ({
      done: l("done", "réussi"),
      partial: l("guessed", "deviné"),
      clarify: l("needs details", "manque de détails"),
      answer: l("answered", "répondu"),
      plan: l("plan proposed", "plan proposé"),
      blocked: l("blocked", "bloqué"),
    })[o];
}

export const OUTCOME_CLS: Record<Outcome, string> = {
  done: "bg-ok-soft text-ok",
  partial: "bg-warn-soft text-warn",
  clarify: "bg-bad-soft text-bad",
  answer: "bg-info-soft text-info",
  plan: "bg-accent-soft text-accent-fg",
  blocked: "bg-bad-soft text-bad",
};

export const TOOL_COLOR: Record<ToolId, string> = { claude: "var(--lane-0)", codex: "var(--lane-2)", gemini: "var(--lane-1)", antigravity: "var(--lane-4)" };
const TOOL_SHORT: Record<ToolId, string> = { claude: "CC", codex: "CX", gemini: "GM", antigravity: "AG" };

export function ToolBadge({ tool, size = "sm" }: { tool: ToolId; size?: "sm" | "md" }) {
  return (
    <span
      className={clsx("inline-grid shrink-0 place-items-center rounded-md font-mono font-semibold text-white", size === "sm" ? "size-5 text-[9px]" : "size-7 text-[11px]")}
      style={{ background: TOOL_COLOR[tool] }}
      title={TOOL_NAMES[tool]}
      aria-hidden
    >
      {TOOL_SHORT[tool]}
    </span>
  );
}

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

/** What the view shows: the last prompt's context, or a preview of what a tool loads at startup. */
function useShown(world: World, previewTool: ToolId) {
  const run = lastRun(world);
  const sessionTool = world.session?.tool;
  if (run && (!sessionTool || sessionTool === run.tool) && run.where === "main") return { run, items: run.context, tool: run.tool, preview: false };
  const tool = sessionTool ?? previewTool;
  return { run: run && run.tool === tool ? run : null, items: startupContext(world, tool), tool, preview: true };
}

export function ContextBar({ items, compact }: { items: ContextItem[]; compact?: boolean }) {
  const total = items.reduce((n, c) => n + c.tokens, 0);
  const scale = Math.max(6000, total * 1.15);
  const kindLabel = useKindLabel();
  return (
    <div className={clsx("flex w-full overflow-hidden rounded-md border border-line bg-surface-2", compact ? "h-3" : "h-5")} role="img" aria-label={items.map((i) => `${kindLabel(i.kind)} ${i.tokens}`).join(", ")}>
      <AnimatePresence initial={false}>
        {items.map((it, i) => (
          <motion.span
            key={`${it.kind}:${it.label}:${i}`}
            initial={{ width: 0 }}
            animate={{ width: `${(it.tokens / scale) * 100}%` }}
            exit={{ width: 0 }}
            transition={{ type: "spring", stiffness: 160, damping: 24 }}
            className="h-full border-r border-[var(--surface)] last:border-r-0"
            style={{ background: KIND_COLOR[it.kind], minWidth: it.tokens ? 3 : 0 }}
            title={`${kindLabel(it.kind)} · ${it.label} · ${it.tokens}`}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

const PHASES = ["read", "plan", "act", "verify", "report"] as const;

export function AgentLoop({ run, compact }: { run: AgentRun | null; compact?: boolean }) {
  const l = useL();
  const names = { read: l("Read", "Lire"), plan: l("Plan", "Planifier"), act: l("Act", "Agir"), verify: l("Verify", "Vérifier"), report: l("Report", "Rendre compte") };
  return (
    <ol className="flex items-center" aria-label={l("Agent loop", "Boucle de l'agent")}>
      {PHASES.map((p, i) => {
        const on = !!run?.phases.includes(p);
        return (
          <li key={p} className="flex flex-1 items-center last:flex-none">
            <span className="flex flex-col items-center gap-1">
              <motion.span
                key={`${run?.id}-${p}`}
                initial={on ? { scale: 0.6 } : false}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 16, delay: i * 0.08 }}
                className={clsx("grid place-items-center rounded-full border-2", compact ? "size-4" : "size-6", on ? "border-accent-mark bg-accent-mark text-white" : "border-line-strong bg-surface text-fg-3")}
              >
                {on ? <Check className={compact ? "size-2.5" : "size-3.5"} strokeWidth={3} /> : null}
              </motion.span>
              {!compact && <span className={clsx("text-[10px] font-medium", on ? "text-fg" : "text-fg-3")}>{names[p]}</span>}
            </span>
            {i < PHASES.length - 1 && <span className={clsx("mx-1 h-0.5 flex-1 rounded-full", run?.phases.includes(PHASES[i + 1]) ? "bg-accent-mark" : "bg-line", !compact && "-mt-4")} />}
          </li>
        );
      })}
    </ol>
  );
}

export function PromptMeter({ run, compact }: { run: AgentRun; compact?: boolean }) {
  const l = useL();
  const label = useCheckLabel();
  const grade = promptGrade(run.report.score);
  const gradeText = { vague: l("vague", "flou"), okay: l("okay", "correct"), sharp: l("sharp", "précis") }[grade];
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className={clsx("rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums", grade === "sharp" ? "bg-ok-soft text-ok" : grade === "okay" ? "bg-warn-soft text-warn" : "bg-bad-soft text-bad")}>
        {run.report.score}/6 · {gradeText}
      </span>
      {PROMPT_CHECKS.map((c) => {
        const ok = run.report.checks[c];
        const guessed = run.assumed.includes(c);
        return (
          <span
            key={c}
            className={clsx(
              "inline-flex items-center gap-0.5 rounded-md border px-1.5 py-px text-[10px] font-medium",
              ok ? "border-ok/30 text-ok" : guessed ? "border-warn/50 bg-warn-soft text-warn" : "border-line text-fg-3",
              compact && "px-1",
            )}
            title={guessed ? l("The agent had to guess this", "L'agent a dû deviner ceci") : undefined}
          >
            {ok ? <Check className="size-2.5" strokeWidth={3} /> : <X className="size-2.5" />}
            {label(c)}
          </span>
        );
      })}
    </div>
  );
}

const STATUS_CLS: Record<Worktree["status"], string> = {
  todo: "bg-surface-2 text-fg-3",
  "in-progress": "bg-info-soft text-info",
  "in-review": "bg-warn-soft text-warn",
  completed: "bg-ok-soft text-ok",
};

/** One lane per Orca worktree, like branches in a graph. */
export function OrcaLanes({ world, compact }: { world: World; compact?: boolean }) {
  const l = useL();
  const outcome = useOutcomeLabel();
  const changed = (wt: Worktree) => Object.keys({ ...wt.base, ...wt.files }).filter((p) => wt.base[p] !== wt.files[p]).length;
  const mainRuns = world.runs.filter((r) => r.where === "main");
  return (
    <div className="space-y-1.5" aria-label={l("Orca worktrees", "Worktrees Orca")}>
      <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
        <span className="h-4 w-1 rounded-full" style={{ background: "var(--text-3)" }} />
        <span className="font-mono text-xs font-semibold">main</span>
        <span className="text-[11px] text-fg-3">~/project</span>
        <span className="ml-auto flex gap-0.5">
          {mainRuns.slice(-8).map((r) => (
            <span key={r.id} className={clsx("size-2 rounded-full", OUTCOME_CLS[r.outcome].split(" ")[0])} style={{ outline: "1px solid currentColor" }} title={outcome(r.outcome)} />
          ))}
        </span>
      </div>
      <AnimatePresence initial={false}>
        {world.worktrees.map((wt, i) => {
          const runs = world.runs.filter((r) => r.where === wt.name);
          const last = runs.at(-1);
          return (
            <motion.div
              key={wt.name}
              layout
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className={clsx("flex items-center gap-2 rounded-lg border px-2 py-1.5", wt.merged ? "border-ok/30 bg-ok-soft/40" : "border-line bg-surface")}
            >
              <span className="h-5 w-1 rounded-full" style={{ background: `var(--lane-${(i + 1) % 6})` }} />
              {wt.agent ? <ToolBadge tool={wt.agent} /> : <CircleDashed className="size-4 text-fg-3" />}
              <span className="min-w-0">
                <span className="block truncate font-mono text-xs font-semibold">{wt.name}</span>
                {!compact && (
                  <span className="flex items-center gap-1 truncate text-[11px] text-fg-3">
                    {wt.comment ? (
                      <>
                        <MessageSquareText className="size-3 shrink-0" /> {wt.comment}
                      </>
                    ) : last ? (
                      <>
                        {outcome(last.outcome)} · {l(`${changed(wt)} files changed`, `${changed(wt)} fichiers modifiés`)}
                      </>
                    ) : (
                      l("no prompt yet", "aucun prompt")
                    )}
                  </span>
                )}
              </span>
              <span className="ml-auto flex shrink-0 items-center gap-1.5">
                {wt.merged && <GitMerge className="size-3.5 text-ok" aria-label={l("merged", "fusionné")} />}
                <span className={clsx("rounded-full px-1.5 py-px text-[10px] font-semibold", STATUS_CLS[wt.status])}>{wt.status}</span>
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
      {!world.worktrees.length && (
        <p className="px-2 py-1 text-[11px] text-fg-3">
          {l("No worktrees yet. Try: orca worktree create --name fix-total --agent codex", "Aucun worktree. Essaie : orca worktree create --name fix-total --agent codex")}
        </p>
      )}
    </div>
  );
}

/**
 * The agent's-eye view: what's in its context window, which loop phases it
 * went through, and how good the last prompt was. With `orca`, the Orca lanes too.
 */
export function AgentView({ world, events, eventKey, compact, orca }: { world: World; events?: SimEvent[]; eventKey?: number; compact?: boolean; orca?: boolean }) {
  const l = useL();
  const kindLabel = useKindLabel();
  const outcome = useOutcomeLabel();
  const [previewTool, setPreviewTool] = useState<ToolId>("claude");
  const shown = useShown(world, previewTool);
  const total = shown.items.reduce((n, c) => n + c.tokens, 0);
  const run = shown.run;
  void events;

  if (compact)
    return (
      <div className="flex h-full flex-col justify-center gap-3 p-4">
        <div className="flex items-center gap-2 text-[11px] text-fg-3">
          <ToolBadge tool={shown.tool} />
          <span className="font-medium text-fg-2">{l("Context", "Contexte")}</span>
          <span className="ml-auto tabular-nums">≈ {fmt(total)} tokens</span>
        </div>
        <ContextBar items={shown.items} compact />
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {[...new Set(shown.items.map((i) => i.kind))].map((k) => (
            <span key={k} className="flex items-center gap-1 text-[10px] text-fg-3">
              <span className="size-2 rounded-sm" style={{ background: KIND_COLOR[k] }} />
              {kindLabel(k)}
            </span>
          ))}
        </div>
        {orca && world.worktrees.length > 0 && <OrcaLanes world={world} compact />}
        {run && !shown.preview && (
          <>
            <AgentLoop run={run} compact />
            <PromptMeter run={run} compact />
          </>
        )}
      </div>
    );

  return (
    <div className="scrollbar-thin h-full overflow-y-auto bg-dots">
      <LayoutGroup>
        <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 sm:p-5">
          {orca && (
            <section className="rounded-xl border border-line bg-elevated/90 p-3 shadow-[var(--shadow-card)]">
              <h3 className="mb-2 text-xs font-semibold text-fg-2">{l("Orca · worktrees & agents", "Orca · worktrees et agents")}</h3>
              <OrcaLanes world={world} />
            </section>
          )}

          <section className="rounded-xl border border-line bg-elevated/90 p-3 shadow-[var(--shadow-card)]" aria-live="polite">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <ToolBadge tool={shown.tool} size="md" />
              <div className="min-w-0">
                <h3 className="text-xs font-semibold text-fg-2">{l("Context window", "Fenêtre de contexte")}</h3>
                <p className="truncate text-[11px] text-fg-3">
                  {shown.preview
                    ? l(`What ${TOOL_NAMES[shown.tool]} loads before you type anything`, `Ce que ${TOOL_NAMES[shown.tool]} charge avant que tu tapes quoi que ce soit`)
                    : l(`Last prompt to ${TOOL_NAMES[shown.tool]}`, `Dernier prompt à ${TOOL_NAMES[shown.tool]}`)}
                </p>
              </div>
              <span className="ml-auto text-right">
                <span className="block font-mono text-sm font-semibold tabular-nums">≈ {fmt(total)}</span>
                <span className="block text-[10px] text-fg-3">{l("tokens · real tools hold ~200k", "tokens · les vrais outils en tiennent ~200k")}</span>
              </span>
            </div>
            {shown.preview && !world.session && (
              <div className="mb-2 flex flex-wrap gap-1" role="radiogroup" aria-label={l("Preview for", "Aperçu pour")}>
                {TOOLS.map((tool) => (
                  <button
                    key={tool}
                    role="radio"
                    aria-checked={shown.tool === tool}
                    onClick={() => setPreviewTool(tool)}
                    className={clsx("flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px]", shown.tool === tool ? "border-accent/50 bg-accent-soft text-accent-fg" : "border-line text-fg-3 hover:text-fg")}
                  >
                    <ToolBadge tool={tool} /> {TOOL_NAMES[tool]}
                  </button>
                ))}
              </div>
            )}
            <ContextBar items={shown.items} />
            <ul className="mt-2 divide-y divide-line/70">
              <AnimatePresence initial={false}>
                {shown.items.map((it, i) => (
                  <motion.li
                    key={`${eventKey}-${it.kind}:${it.label}:${i}`}
                    layout
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-2 py-1 text-xs"
                  >
                    <span className="size-2.5 shrink-0 rounded-sm" style={{ background: KIND_COLOR[it.kind] }} />
                    <span className="w-24 shrink-0 text-fg-3">{kindLabel(it.kind)}</span>
                    <span className={clsx("min-w-0 flex-1 truncate", it.kind === "prompt" ? "italic text-fg" : "font-mono text-fg-2")}>{it.label}</span>
                    <span className="shrink-0 font-mono text-[11px] text-fg-3 tabular-nums">{fmt(it.tokens)}</span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </section>

          <section className="rounded-xl border border-line bg-elevated/90 p-3 shadow-[var(--shadow-card)]">
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-xs font-semibold text-fg-2">{l("Agent loop", "Boucle de l'agent")}</h3>
              {run && <span className={clsx("ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold", OUTCOME_CLS[run.outcome])}>{outcome(run.outcome)}</span>}
            </div>
            <AgentLoop run={run} />
            {run ? (
              <div className="mt-3 border-t border-line pt-3">
                <p className="mb-2 truncate text-[11px] text-fg-3">
                  “<span className="text-fg-2">{run.prompt}</span>”
                </p>
                <PromptMeter run={run} />
              </div>
            ) : (
              <p className="mt-3 text-[11px] text-fg-3">{l("Send a prompt to an agent to see it work through the loop.", "Envoie un prompt à un agent pour le voir parcourir la boucle.")}</p>
            )}
          </section>
        </div>
      </LayoutGroup>
    </div>
  );
}
