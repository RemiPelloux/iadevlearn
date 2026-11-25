"use client";

import { clsx } from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, GitCompare, TriangleAlert } from "lucide-react";
import { checkSkill, hunks, lintRules, loadRules, listSkills, TOOL_NAMES, TOOLS, type World } from "@/engine";
import { useL, usePick } from "@/i18n";
import { fileKind, fileState, KindIcon, StateBadge } from "./files-panel";
import { useLab } from "./store";

/** Simple Markdown/TOML-aware line tint so frontmatter and headings stand out. */
function lineClass(line: string, inFront: boolean): string {
  if (line === "---") return "text-fg-3";
  if (inFront) return /^[\w-]+:/.test(line) ? "text-info" : "text-fg";
  if (/^#{1,6} /.test(line)) return "font-semibold text-accent-fg";
  if (/^\s*(\d+\.|[-*]) /.test(line)) return "text-fg";
  if (/^\s*[\w.]+\s*=/.test(line)) return "text-info";
  if (/^\s*(\/\/|#)/.test(line)) return "text-fg-3";
  return "text-fg";
}

/** Line classes, knowing which lines are inside a leading --- frontmatter block. */
function frontmatterClasses(text: string): string[] {
  const lines = text.split("\n");
  const end = lines[0] === "---" ? lines.indexOf("---", 1) : -1;
  return lines.map((line, i) => lineClass(line, end > 0 && i > 0 && i < end));
}

/** Which tools would load a rules file or see a skill: the point of where you put a file. */
function loadedBy(world: World, path: string) {
  const kind = fileKind(path);
  if (kind === "rules") return TOOLS.filter((tool) => loadRules(world.files, tool).some((r) => r.path === path));
  if (kind === "skill") return TOOLS.filter((tool) => listSkills(world.files, tool).some((s) => s.path === path));
  return [];
}

export function Editor({ path, onBack }: { path: string; onBack?: () => void }) {
  const world = useLab((s) => s.world);
  const writeFile = useLab((s) => s.writeFile);
  const l = useL();
  const pick = usePick();
  const content = world.files[path] ?? "";
  const [draft, setDraft] = useState(content);
  const [pending, setPending] = useState(false);
  const [view, setView] = useState<"edit" | "diff">("edit");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Sync when the file changes underneath (agents, shell, explorer) unless the learner is mid-edit.
  const [seen, setSeen] = useState(content);
  if (content !== seen) {
    setSeen(content);
    if (!pending) setDraft(content);
  }

  const flush = (value: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setPending(false);
    writeFile(path, value);
  };
  const onChange = (value: string) => {
    setDraft(value);
    setPending(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => flush(value), 400);
  };
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const lines = draft.split("\n");
  const classes = useMemo(() => frontmatterClasses(draft), [draft]);
  const kind = fileKind(path);
  const state = fileState(world, path);
  const issues = kind === "rules" ? lintRules(draft).map((i) => pick(i.message)) : kind === "skill" ? checkSkill(path.split("/").at(-2) ?? "", draft).map((p) => pick(p.message)) : [];
  const tools = loadedBy(world, path);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        {onBack && (
          <button onClick={onBack} className="rounded-md p-1 text-fg-3 hover:bg-surface-2 hover:text-fg" aria-label={l("Back to files", "Retour aux fichiers")}>
            <ArrowLeft className="size-4" />
          </button>
        )}
        <KindIcon path={path} />
        <span className="min-w-0 truncate font-mono text-[13px]">{path}</span>
        <StateBadge state={state} />
        {!path.startsWith("~/") && (
          <div className="ml-auto flex rounded-lg bg-surface-2 p-0.5 text-[11px]">
            {(["edit", "diff"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={clsx("rounded-md px-2 py-0.5", view === v ? "bg-elevated text-fg shadow-sm" : "text-fg-3 hover:text-fg")} aria-pressed={view === v}>
                {v === "edit" ? l("Edit", "Modifier") : l("Changes", "Changements")}
              </button>
            ))}
          </div>
        )}
      </div>

      {(kind === "rules" || kind === "skill") && (
        <div className={clsx("border-b border-line px-3 py-2 text-xs", issues.length ? "bg-warn-soft/50" : "bg-ok-soft/50")}>
          <p className="text-fg-2">
            {tools.length
              ? l(`${kind === "rules" ? "Loaded" : "Visible"} by: ${tools.map((t) => TOOL_NAMES[t]).join(", ")}`, `${kind === "rules" ? "Chargé" : "Visible"} par : ${tools.map((t) => TOOL_NAMES[t]).join(", ")}`)
              : l("No agent reads this file where it is.", "Aucun agent ne lit ce fichier à cet endroit.")}
          </p>
          {issues.length ? (
            <ul className="mt-1 space-y-0.5">
              {issues.map((m) => (
                <li key={m} className="flex gap-1.5 text-warn">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" /> <span className="text-fg">{m}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 flex items-center gap-1.5 text-ok">
              <CheckCircle2 className="size-3.5" /> {kind === "rules" ? l("Clear, specific rules.", "Des règles claires et précises.") : l("A valid skill.", "Un skill valide.")}
            </p>
          )}
        </div>
      )}

      {view === "edit" ? (
        <div className="scrollbar-thin relative min-h-0 flex-1 overflow-auto bg-surface">
          <div className="relative flex min-h-full font-mono text-[13px] leading-6">
            <div className="sticky left-0 z-[1] shrink-0 select-none border-r border-line bg-surface py-2 pr-2 pl-3 text-right text-fg-3" aria-hidden>
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <div className="relative w-max min-w-0 flex-1">
              <pre aria-hidden className="pointer-events-none m-0 py-2 whitespace-pre">
                {lines.map((line, i) => (
                  <div key={i} className={clsx("px-3", classes[i])}>
                    {line || " "}
                  </div>
                ))}
              </pre>
              <textarea
                value={draft}
                onChange={(e) => onChange(e.target.value)}
                onBlur={() => pending && flush(draft)}
                spellCheck={false}
                aria-label={l(`Edit ${path}`, `Modifier ${path}`)}
                className="absolute inset-0 h-full w-full resize-none overflow-hidden bg-transparent px-3 py-2 leading-6 whitespace-pre text-transparent caret-accent outline-none"
                wrap="off"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="scrollbar-thin min-h-0 flex-1 overflow-auto p-3">
          <DiffBlock title={l("Since the last commit", "Depuis le dernier commit")} from={world.git.head[path]} to={world.files[path]} empty={l("No changes.", "Aucun changement.")} />
        </div>
      )}
    </div>
  );
}

export function DiffBlock({ title, from, to, empty }: { title: string; from?: string; to?: string; empty: string }) {
  const hs = from === to ? [] : hunks(from ?? "", to ?? "");
  return (
    <section>
      {title && (
        <h4 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-fg-3">
          <GitCompare className="size-3.5" /> {title}
        </h4>
      )}
      {!hs.length ? (
        <p className="text-xs text-fg-3">{empty}</p>
      ) : (
        <div className="overflow-hidden rounded-md border border-line font-mono text-[12px] leading-5">
          {hs.map((h, i) => (
            <div key={i}>
              <div className="bg-surface-2 px-3 text-info">{h.header}</div>
              {h.lines.map((ln, j) => (
                <div key={j} className={clsx("px-3 whitespace-pre-wrap", ln.op === "add" ? "bg-ok-soft text-ok" : ln.op === "del" ? "bg-bad-soft text-bad" : "text-fg-2")}>
                  <span className="select-none">{ln.op === "add" ? "+ " : ln.op === "del" ? "− " : "  "}</span>
                  {ln.line}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
