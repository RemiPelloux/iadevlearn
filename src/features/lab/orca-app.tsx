"use client";

import { clsx } from "clsx";
import { useState } from "react";
import { ArrowUp, Bot, ChevronDown, ChevronRight, Clock, FileText, FolderGit2, GitBranch, GitMerge, Laptop, ListTodo, MessageSquareText, Pencil, Plus, Search, ShieldCheck, Sparkles, X } from "lucide-react";
import { TOOL_NAMES, type AgentRun, type OutLine, type ToolId, type World, type Worktree } from "@/engine";
import { useL } from "@/i18n";
import { ToolBadge } from "./agent-view";
import { useLabApiMaybe } from "./store";

const MODEL: Partial<Record<ToolId, string>> = { claude: "claude", codex: "codex", gemini: "gemini", antigravity: "agy" };

const STATUS_DOT: Record<Worktree["status"], string> = {
  todo: "bg-[var(--t-muted)]",
  "in-progress": "bg-[var(--t-yellow)]",
  "in-review": "bg-[var(--t-blue)]",
  completed: "bg-[var(--t-green)]",
};

const taskTitle = (prompt?: string) => {
  if (!prompt) return "";
  const first = prompt.replace(/@\S+/g, (m) => m.slice(1)).split(/[.:]/)[0].trim();
  return first.length > 46 ? first.slice(0, 44) + "…" : first;
};

/** Sends a command through the workspace terminal when one exists (lessons, Playground). */
function useRunner() {
  const api = useLabApiMaybe();
  return api ? (cmd: string) => api.getState().run(cmd) : null;
}

/** A simplified, simulated replica of the Orca desktop app, driven by the simulator's worktrees. */
export function OrcaApp({ world, className }: { world: World; className?: string }) {
  const l = useL();
  const run = useRunner();
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const wts = world.worktrees;
  const current = wts.find((w) => w.name === selected) ?? wts.at(-1) ?? null;
  const second = wts.length > 1 ? (wts.filter((w) => w.name !== current?.name).at(-1) ?? null) : null;
  const showDialog = creating || !wts.length;
  const runsOf = (w: Worktree) => world.runs.filter((r) => r.where === w.name);

  return (
    <div className={clsx("terminal flex flex-col overflow-hidden rounded-xl bg-[#1b1a1d] text-[13px] text-[var(--t-text)] shadow-[0_18px_44px_-18px_rgba(0,0,0,0.55)] ring-1 ring-black/30", className ?? "h-[27rem]")} aria-label={l("Orca (simulated)", "Orca (simulé)")}>
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-white/[0.06] px-3">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="ml-2 font-semibold text-white">Orca</span>
        <span className="text-[11px] text-[var(--t-muted)]">{l("simulated", "simulé")}</span>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="scrollbar-thin hidden w-56 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-white/[0.06] bg-[#202024] p-2 sm:flex">
          <div className="flex items-center gap-2 rounded-md bg-white/[0.05] px-2 py-1.5 text-[var(--t-muted)]">
            <Search className="size-3.5" /> {l("Search", "Rechercher")} <span className="ml-auto font-mono text-[10px]">⌘J</span>
          </div>
          <SideRow icon={<ListTodo className="size-3.5" />}>{l("Tasks", "Tâches")}</SideRow>
          <SideRow icon={<Clock className="size-3.5" />}>Automations</SideRow>
          <div className="mt-3 flex items-center px-2 text-[11px] text-[var(--t-muted)]">
            {l("Projects", "Projets")}
            <button onClick={() => setCreating(true)} className="ml-auto rounded p-0.5 hover:bg-white/10 hover:text-white" aria-label={l("Create worktree", "Créer un worktree")} title={l("Create worktree", "Créer un worktree")}>
              <Plus className="size-3.5" />
            </button>
          </div>
          <div className="mt-1 flex items-center gap-2 rounded-md border border-white/[0.06] px-2 py-1 text-[12px] font-medium">
            <Laptop className="size-3.5 text-[var(--t-muted)]" /> {l("This computer", "Cet ordinateur")}
            <span className="ml-auto rounded-full bg-white/10 px-1.5 text-[10px]">{wts.length + 1}</span>
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 px-2 font-medium text-white">
            <FolderGit2 className="size-3.5 text-[var(--t-orange)]" /> tiny-shop
          </p>
          <div className="px-2 py-1">
            <p className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[var(--t-green)]" /> main <span className="rounded bg-white/10 px-1 text-[9px] text-[var(--t-muted)]">primary</span>
            </p>
            <p className="pl-3 text-[11px] text-[var(--t-muted)]">~/project</p>
          </div>
          {wts.map((w) => {
            const last = runsOf(w).at(-1);
            const active = current?.name === w.name && !showDialog;
            return (
              <button
                key={w.name}
                onClick={() => {
                  setSelected(w.name);
                  setCreating(false);
                }}
                className={clsx("rounded-md px-2 py-1.5 text-left", active ? "bg-white/[0.08] ring-1 ring-white/10" : "hover:bg-white/[0.04]")}
                aria-current={active}
              >
                <span className="flex items-center gap-1.5">
                  <span className={clsx("size-1.5 shrink-0 rounded-full", STATUS_DOT[w.status])} />
                  <span className={clsx("truncate", active ? "font-semibold text-white" : "text-[var(--t-text)]")}>{w.name}</span>
                  {w.merged && <GitMerge className="ml-auto size-3 shrink-0 text-[var(--t-green)]" />}
                </span>
                <span className="block truncate pl-3 text-[11px] text-[var(--t-muted)]">{w.branch}</span>
                {w.agent && (
                  <span className="mt-0.5 flex items-center gap-1 pl-3 text-[11px] text-[var(--t-muted)]">
                    <ToolBadge tool={w.agent} />
                    <span className="truncate">{taskTitle(last?.prompt) || l("Waiting for a prompt", "En attente d'un prompt")}</span>
                    <span className="ml-auto shrink-0">{MODEL[w.agent] ?? w.agent}</span>
                  </span>
                )}
                {w.comment && (
                  <span className="mt-0.5 flex items-center gap-1 pl-3 text-[11px] text-[var(--t-yellow)]">
                    <MessageSquareText className="size-3 shrink-0" />
                    <span className="truncate">{w.comment}</span>
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Main area */}
        <main className="flex min-w-0 flex-1 flex-col">
          {showDialog ? (
            <CreateDialog world={world} run={run} onDone={() => setCreating(false)} canClose={wts.length > 0} />
          ) : (
            <div className={clsx("grid min-h-0 flex-1", second && "md:grid-cols-2")}>
              {current && <Pane wt={current} runs={runsOf(current)} run={run} />}
              {second && (
                <div className="hidden min-h-0 border-l border-white/[0.06] md:block">
                  <Pane wt={second} runs={runsOf(second)} run={run} />
                </div>
              )}
            </div>
          )}
          <StatusBar world={world} />
        </main>
      </div>
    </div>
  );
}

function SideRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 rounded-md px-2 py-1 text-[var(--t-muted)]">
      {icon} {children}
    </p>
  );
}

/** One worktree's tab: the agent conversation, rebuilt from its terminal output. */
function Pane({ wt, runs, run }: { wt: Worktree; runs: AgentRun[]; run: ((cmd: string) => unknown) | null }) {
  const l = useL();
  const [text, setText] = useState("");
  const last = runs.at(-1);
  const blocks = toFeed(wt.log ?? []);
  const send = () => {
    if (!text.trim() || !run) return;
    run(`orca terminal send --terminal term-${wt.name} --text "${text.replace(/"/g, "'")}" --enter`);
    setText("");
  };
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-8 shrink-0 items-center border-b border-white/[0.06] px-2 text-[12px]">
        <span className="flex min-w-0 items-center gap-1.5 rounded-t-md bg-white/[0.06] px-2 py-1 text-white">
          {wt.agent ? <ToolBadge tool={wt.agent} /> : <Bot className="size-3.5" />}
          <span className="truncate">{taskTitle(last?.prompt) || wt.name}</span>
          <X className="size-3 shrink-0 text-[var(--t-muted)]" aria-hidden />
        </span>
        <Plus className="ml-2 size-3.5 text-[var(--t-muted)]" aria-hidden />
        <span className="ml-auto flex items-center gap-1 text-[11px] text-[var(--t-muted)]">
          <GitBranch className="size-3" /> {wt.branch}
        </span>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-2">
        {wt.comment && (
          <p className="flex items-center gap-1.5 rounded-md bg-white/[0.04] px-2 py-1 text-[11px] text-[var(--t-yellow)]">
            <MessageSquareText className="size-3" /> {wt.comment} <span className="ml-auto text-[var(--t-muted)]">{wt.status}</span>
          </p>
        )}
        {!blocks.length && <p className="text-[var(--t-muted)]">{l("No conversation yet. Send the agent a task below.", "Pas encore de conversation. Envoie une tâche à l'agent ci-dessous.")}</p>}
        {blocks.map((b, i) =>
          b.kind === "you" ? (
            <p key={i} className="ml-auto max-w-[85%] rounded-lg bg-white/[0.07] px-2.5 py-1.5 text-white">
              {b.text}
            </p>
          ) : b.kind === "worked" ? (
            <p key={i} className="flex items-center gap-1 text-[11px] text-[var(--t-muted)]">
              {l(`Worked for ${b.text}s`, `A travaillé ${b.text} s`)} <ChevronRight className="size-3" />
            </p>
          ) : b.kind === "tool" ? (
            <p key={i} className="flex items-center gap-1.5 font-mono text-[12px] text-[var(--t-muted)]">
              {/edit|update|write|added|created/i.test(b.text) ? <Pencil className="size-3" /> : b.text.includes("Skill") ? <Sparkles className="size-3" /> : <FileText className="size-3" />}
              <span className="truncate">{b.text.replace(/^[●•✦▸]\s*/, "")}</span>
              {b.extra && <span className="ml-auto text-[var(--t-green)]">{b.extra}</span>}
            </p>
          ) : (
            <p key={i} className={clsx("leading-relaxed", b.kind === "warn" ? "text-[12px] text-[var(--t-yellow)]" : b.kind === "ok" ? "text-[12px] text-[var(--t-green)]" : "text-[var(--t-text)]")}>
              {b.text}
            </p>
          ),
        )}
      </div>
      <form
        className="m-2 shrink-0 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!run || !wt.agent}
          placeholder={l("Ask anything, @ to mention files, / for commands", "Demande ce que tu veux, @ pour citer un fichier, / pour les commandes")}
          aria-label={l(`Message to the agent in ${wt.name}`, `Message à l'agent de ${wt.name}`)}
          className="w-full bg-transparent py-0.5 text-[12.5px] text-white outline-none placeholder:text-[var(--t-muted)] disabled:opacity-50"
        />
        <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--t-muted)]">
          <Plus className="size-3.5" aria-hidden />
          <span className="flex items-center gap-1 text-[var(--t-yellow)]">
            <ShieldCheck className="size-3" /> {l("Workspace access", "Accès à l'espace de travail")}
          </span>
          <span className="ml-auto flex items-center gap-1">
            {wt.agent ? TOOL_NAMES[wt.agent] : ""} <ChevronDown className="size-3" />
          </span>
          <button type="submit" disabled={!text.trim() || !run} className="grid size-5 place-items-center rounded-full bg-white/80 text-black disabled:opacity-30" aria-label={l("Send", "Envoyer")}>
            <ArrowUp className="size-3" />
          </button>
        </div>
        {text.trim() && <p className="mt-1 truncate font-mono text-[10.5px] text-[var(--t-muted)]">= orca terminal send --terminal term-{wt.name} --text &quot;{text}&quot; --enter</p>}
      </form>
    </div>
  );
}

interface Block {
  kind: "you" | "worked" | "tool" | "agent" | "warn" | "ok";
  text: string;
  extra?: string;
}

/** Turn an agent's terminal lines into chat blocks, the way Orca's Chat UI shows them. */
function toFeed(lines: OutLine[]): Block[] {
  const out: Block[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.text.trim();
    if (!t) continue;
    const you = t.match(/^\w+ › ([\s\S]+)$/);
    if (you && line.kind === "muted") {
      out.push({ kind: "you", text: you[1] });
      const tokens = Number(lines.slice(i).find((x) => /≈ [\d.]+k tokens/.test(x.text))?.text.match(/≈ ([\d.]+)k/)?.[1] ?? 2);
      out.push({ kind: "worked", text: String(Math.max(4, Math.round((tokens * 1000) / 90))) });
      continue;
    }
    if (line.kind === "muted") continue;
    if (line.kind === "tool" || line.kind === "info") {
      const next = lines[i + 1];
      if (next && next.kind === "added" && /^\s*[└⎿↳]/.test(next.text)) {
        out.push({ kind: "tool", text: t, extra: next.text.replace(/^\s*[└⎿↳]\s*/, "") });
        i++;
      } else out.push({ kind: "tool", text: t });
      continue;
    }
    if (line.kind === "success") out.push({ kind: "ok", text: t.replace(/^[└⎿↳]\s*/, "") });
    else if (line.kind === "warning" || line.kind === "error") out.push({ kind: "warn", text: t.replace(/^[└⎿↳]\s*/, "") });
    else if (line.kind === "agent" || line.kind === "out" || line.kind === "commit") out.push({ kind: "agent", text: t });
  }
  return out;
}

const PRESET_PROMPTS: Array<{ name: string; prompt: string }> = [
  { name: "fix-total", prompt: "Fix the total bug in @src/cart.ts: multiply each price by its quantity. Add a test and run the tests." },
  { name: "euro", prompt: "Format prices in euros in @src/price.ts like “12,50 €”. Keep the name formatPrice. Add a test and run it." },
  { name: "readme", prompt: "Update the README with a Getting started section: install and test commands." },
];

/** Orca's "Create worktree" dialog, wired to `orca worktree create`. */
function CreateDialog({ world, run, onDone, canClose }: { world: World; run: ((cmd: string) => unknown) | null; onDone: () => void; canClose: boolean }) {
  const l = useL();
  const taken = new Set(world.worktrees.map((w) => w.name));
  const preset = PRESET_PROMPTS.find((p) => !taken.has(p.name)) ?? { name: `task-${world.worktrees.length + 1}`, prompt: "" };
  const [name, setName] = useState(preset.name);
  const [agent, setAgent] = useState<ToolId>(world.worktrees.some((w) => w.agent === "codex") ? "claude" : "codex");
  const [prompt, setPrompt] = useState(preset.prompt);
  const cmd = `orca worktree create --name ${name || "<name>"} --agent ${agent}${prompt.trim() ? ` --prompt "${prompt.replace(/"/g, "'")}"` : ""}`;
  const valid = /^[\w./-]+$/.test(name) && !taken.has(name);
  return (
    <div className="scrollbar-thin flex min-h-0 flex-1 items-start justify-center overflow-y-auto p-3">
      <form
        className="w-full max-w-md rounded-xl border border-white/10 bg-[#232327] p-4 shadow-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid || !run) return;
          run(cmd);
          onDone();
        }}
      >
        <div className="flex items-center">
          <p className="text-base font-semibold text-white">{l("Create worktree", "Créer un worktree")}</p>
          {canClose && (
            <button type="button" onClick={onDone} className="ml-auto rounded p-1 text-[var(--t-muted)] hover:bg-white/10 hover:text-white" aria-label={l("Close", "Fermer")}>
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
          <Field label={l("Project", "Projet")}>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[var(--t-orange)]" /> tiny-shop
            </span>
          </Field>
          <Field label={l("Run on", "Exécuter sur")}>
            <span className="flex items-center gap-1.5">
              <Laptop className="size-3.5" /> {l("This computer", "Cet ordinateur")}
            </span>
          </Field>
        </div>
        <label className="mt-3 block text-[12px] text-[var(--t-muted)]">
          {l("Name", "Nom")}
          <input value={name} onChange={(e) => setName(e.target.value.replace(/\s/g, "-"))} className="mt-1 block w-full rounded-md border border-white/15 bg-black/20 px-2.5 py-1.5 font-mono text-[12.5px] text-white outline-none focus:border-white/40" />
        </label>
        <p className="mt-3 text-[12px] text-[var(--t-muted)]">{l("Agent", "Agent")}</p>
        <div className="mt-1 flex flex-wrap gap-1" role="radiogroup" aria-label={l("Agent", "Agent")}>
          {(["claude", "codex", "gemini"] as ToolId[]).map((a) => (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={agent === a}
              onClick={() => setAgent(a)}
              className={clsx("flex items-center gap-1.5 rounded-md border px-2 py-1 text-[12px]", agent === a ? "border-white/40 bg-white/10 text-white" : "border-white/10 text-[var(--t-muted)] hover:text-white")}
            >
              <ToolBadge tool={a} /> {TOOL_NAMES[a]}
            </button>
          ))}
        </div>
        <label className="mt-3 block text-[12px] text-[var(--t-muted)]">
          {l("First prompt (optional)", "Premier prompt (optionnel)")}
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} className="mt-1 block w-full resize-none rounded-md border border-white/15 bg-black/20 px-2.5 py-1.5 text-[12.5px] text-white outline-none focus:border-white/40" />
        </label>
        <p className="mt-2 font-mono text-[10.5px] break-all text-[var(--t-muted)]">= {cmd}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-[11px] text-[var(--t-muted)]">{taken.has(name) ? l("That name is taken.", "Ce nom est déjà pris.") : !run ? l("Open a lesson or the Playground to create one.", "Ouvre une leçon ou le bac à sable pour en créer un.") : ""}</span>
          <button type="submit" disabled={!valid || !run} className="rounded-md bg-white/90 px-3 py-1.5 text-[12.5px] font-medium text-black hover:bg-white disabled:opacity-40" data-nudge={!world.worktrees.length && valid && !!run}>
            {l("Create worktree", "Créer le worktree")}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[var(--t-muted)]">{label}</p>
      <div className="mt-1 rounded-md border border-white/10 bg-black/20 px-2.5 py-1.5 text-white">{children}</div>
    </div>
  );
}

/** Bottom bar: one meter per agent, like Orca's usage readout. */
function StatusBar({ world }: { world: World }) {
  const agents = [...new Set(world.worktrees.map((w) => w.agent).filter((a): a is ToolId => !!a))];
  const used = (a: ToolId) => world.runs.filter((r) => r.tool === a && r.where !== "main").reduce((n, r) => n + r.tokens, 0);
  return (
    <div className="flex h-7 shrink-0 items-center gap-4 border-t border-white/[0.06] px-3 text-[10.5px] text-[var(--t-muted)]">
      {agents.map((a) => (
        <span key={a} className="flex items-center gap-1.5">
          <ToolBadge tool={a} />
          <span className="h-1 w-12 overflow-hidden rounded-full bg-white/10">
            <span className="block h-full bg-[var(--t-green)]" style={{ width: `${Math.min(100, used(a) / 80)}%` }} />
          </span>
          {(used(a) / 1000).toFixed(1)}k
        </span>
      ))}
      <span className="ml-auto">{world.worktrees.length} worktrees</span>
    </div>
  );
}
