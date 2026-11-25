"use client";

import { clsx } from "clsx";
import { BookOpenCheck, FileDiff, Sparkles, SquareTerminal, TriangleAlert, Workflow } from "lucide-react";
import { DIRECTIVES, TOOL_NAMES } from "@/engine";
import { useL, usePick } from "@/i18n";
import { KIND_COLOR, OUTCOME_CLS, PromptMeter, ToolBadge, useCheckLabel, useKindLabel, useOutcomeLabel } from "./agent-view";
import { useLab } from "./store";

/** Everything about one prompt: what the agent read, guessed, followed and changed. */
export function RunPanel({ onOpenFile }: { onOpenFile?: (path: string) => void }) {
  const l = useL();
  const pick = usePick();
  const world = useLab((s) => s.world);
  const selected = useLab((s) => s.selectedRun);
  const selectRun = useLab((s) => s.selectRun);
  const outcome = useOutcomeLabel();
  const kindLabel = useKindLabel();
  const checkLabel = useCheckLabel();
  const runs = world.runs;
  const run = runs.find((r) => r.id === selected) ?? runs.at(-1) ?? null;

  if (!run)
    return (
      <div className="grid h-full place-items-center p-6 text-center text-sm text-fg-3">
        <p>{l("No prompt yet. Start an agent (claude, codex…) and ask it something: the details show up here.", "Aucun prompt pour l'instant. Lance un agent (claude, codex…) et demande-lui quelque chose : les détails s'affichent ici.")}</p>
      </div>
    );

  const followed = DIRECTIVES.filter((d) => run.followed.includes(d.id));
  return (
    <div className="scrollbar-thin h-full overflow-y-auto p-3 text-sm">
      {runs.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-1" aria-label={l("Prompts", "Prompts")}>
          {runs.slice(-10).map((r, i, arr) => (
            <button
              key={r.id}
              onClick={() => selectRun(r.id)}
              className={clsx("flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px]", r.id === run.id ? "border-accent/50 bg-accent-soft text-accent-fg" : "border-line text-fg-3 hover:text-fg")}
              aria-pressed={r.id === run.id}
            >
              <ToolBadge tool={r.tool} /> #{runs.length - arr.length + i + 1}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2">
        <ToolBadge tool={run.tool} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-fg-3">
            {TOOL_NAMES[run.tool]} · {run.where === "main" ? "~/project" : `worktree ${run.where}`}
          </p>
          <p className="mt-0.5 text-[13px] break-words text-fg">“{run.prompt}”</p>
        </div>
        <span className={clsx("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", OUTCOME_CLS[run.outcome])}>{outcome(run.outcome)}</span>
      </div>

      <div className="mt-3">
        <PromptMeter run={run} />
      </div>

      {run.assumed.length > 0 && (
        <Section icon={<TriangleAlert className="size-3.5 text-warn" />} title={l("What the agent had to guess", "Ce que l'agent a dû deviner")}>
          <ul className="space-y-1">
            {run.assumed.map((a) => (
              <li key={a} className="rounded-md bg-warn-soft px-2 py-1 text-xs text-fg">
                <span className="font-semibold text-warn">{checkLabel(a)}</span> — {l("your prompt (and your rules) didn't say it. See the yellow line in the terminal.", "ton prompt (et tes règles) ne le disaient pas. Vois la ligne jaune dans le terminal.")}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {(run.skill || run.workflow) && (
        <Section icon={run.skill ? <Sparkles className="size-3.5 text-[var(--lane-5)]" /> : <Workflow className="size-3.5 text-[var(--lane-4)]" />} title={run.skill ? l("Skill used", "Skill utilisé") : l("Workflow run", "Workflow lancé")}>
          <p className="font-mono text-xs">{run.skill ?? `/${run.workflow}`}</p>
        </Section>
      )}

      <Section icon={<BookOpenCheck className="size-3.5 text-[var(--lane-0)]" />} title={l("Rules read", "Règles lues")}>
        {run.rules.length ? (
          <ul className="space-y-0.5 font-mono text-xs">
            {run.rules.map((r) => (
              <li key={r}>
                <button className="hover:text-accent-fg hover:underline" onClick={() => onOpenFile?.(r)}>
                  {r}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-fg-3">{l("None — the agent knew nothing about your project's conventions.", "Aucune — l'agent ne savait rien des conventions de ton projet.")}</p>
        )}
        {followed.length > 0 && (
          <p className="mt-1.5 text-xs text-fg-2">
            {l("Applied", "Appliqué")} : {followed.map((d) => pick(d.label)).join(" · ")}
          </p>
        )}
      </Section>

      {run.commands.length > 0 && (
        <Section icon={<SquareTerminal className="size-3.5 text-fg-2" />} title={l("Commands it ran", "Commandes lancées")}>
          <ul className="space-y-0.5 font-mono text-xs">
            {run.commands.map((c, i) => (
              <li key={i} className={c.startsWith("npm") && run.commands.some((x) => x.endsWith("install")) ? "text-warn" : ""}>
                $ {c}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {run.changed.length > 0 && (
        <Section icon={<FileDiff className="size-3.5 text-ok" />} title={l("Files changed", "Fichiers modifiés")}>
          <ul className="space-y-0.5 font-mono text-xs">
            {run.changed.map((p) => (
              <li key={p}>
                {run.where === "main" ? (
                  <button className="hover:text-accent-fg hover:underline" onClick={() => onOpenFile?.(p)}>
                    {p}
                  </button>
                ) : (
                  p
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section icon={<span className="size-3.5 rounded-sm bg-accent-mark" />} title={l(`Context ≈ ${run.tokens.toLocaleString()} tokens`, `Contexte ≈ ${run.tokens.toLocaleString()} tokens`)}>
        <ul className="space-y-0.5 text-xs">
          {run.context.map((c, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="size-2 shrink-0 rounded-sm" style={{ background: KIND_COLOR[c.kind] }} />
              <span className="w-20 shrink-0 text-fg-3">{kindLabel(c.kind)}</span>
              <span className="min-w-0 flex-1 truncate font-mono text-fg-2">{c.label}</span>
              <span className="font-mono text-fg-3 tabular-nums">{c.tokens}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <h4 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-fg-3">
        {icon}
        {title}
      </h4>
      {children}
    </section>
  );
}
