"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowRight, Bot, BookOpenCheck, Check, FileText, Folder, Hand, MessageSquare, RotateCcw, ShieldCheck, Sparkles, User, Workflow, X } from "lucide-react";
import { analyzePrompt, directivesIn, DIRECTIVES, execute, lintRules, matchSkill, parseFrontmatter, PROMPT_CHECKS, promptGrade, tokens, type OutLine, type World } from "@/engine";
import type { Skill } from "@/engine/skills";
import type { SceneId } from "@/features/curriculum/types";
import { AGENTS_MD, CHANGELOG_SKILL, P_DISCOUNT, P_EURO, P_TOTAL, shop } from "@/features/curriculum/scenario";
import { AgentView, ToolBadge, useCheckLabel } from "@/features/lab/agent-view";
import { Button } from "@/components/ui/button";
import { useL, useLocale, usePick } from "@/i18n";

export function Scene({ id }: { id: SceneId }) {
  const l = useL();
  switch (id) {
    case "agent-loop":
      return <AgentLoopScene />;
    case "vague-vs-precise":
      return (
        <EngineScene
          setup={() => shop()}
          intro={l("The same agent, the same project. Only the prompt changes.", "Le même agent, le même projet. Seul le prompt change.")}
          actions={[
            { label: 'claude -p "add a discount"', command: 'claude -p "add a discount"', caption: l("Vague: the agent searched everything, created a JavaScript file and guessed the rules. Yellow lines = guesses.", "Flou : l'agent a tout fouillé, créé un fichier JavaScript et deviné les règles. Lignes jaunes = suppositions.") },
            { label: l("Send the precise prompt", "Envoyer le prompt précis"), command: `claude -p "${P_DISCOUNT}"`, caption: l("Precise: right file, right rule, tests added and run. Same agent, better instructions.", "Précis : bon fichier, bonne règle, tests ajoutés et lancés. Même agent, meilleures instructions.") },
          ]}
        />
      );
    case "prompt-anatomy":
      return <PromptAnatomyScene />;
    case "context-window":
      return <ContextDeskScene />;
    case "plan-act":
      return (
        <EngineScene
          setup={() => shop({}, ["claude --permission-mode plan"])}
          intro={l("Claude Code is open in plan mode (⏸).", "Claude Code est ouvert en mode plan (⏸).")}
          actions={[
            { label: l("Ask for the euro format", "Demander le format euro"), command: P_EURO, caption: l("A plan, and no file changed. Read it: is it what you want?", "Un plan, et aucun fichier modifié. Lis-le : est-ce ce que tu veux ?") },
            { label: l("Approve: “yes”", "Valider : « oui »"), command: "yes", caption: l("Now it acts, then verifies with the tests. All five phases lit up.", "Maintenant il agit, puis vérifie avec les tests. Les cinq phases sont allumées.") },
          ]}
        />
      );
    case "rules-memory":
      return (
        <EngineScene
          setup={() => shop()}
          intro={l("A fresh project, no rules file.", "Un projet tout neuf, sans fichier de règles.")}
          actions={[
            { label: l("Session 1: fix + tests", "Session 1 : correction + tests"), command: `claude -p "${P_TOTAL}"`, caption: l("It used npm: it couldn't know this team uses pnpm.", "Il a utilisé npm : il ne pouvait pas savoir que l'équipe utilise pnpm.") },
            { label: l("Write CLAUDE.md", "Écrire CLAUDE.md"), run: (w) => ({ ...w, files: { ...w.files, "CLAUDE.md": AGENTS_MD } }), caption: l("A rules file appears in the context of every future session.", "Un fichier de règles apparaît dans le contexte de chaque future session.") },
            { label: l("Session 2: a short request", "Session 2 : une demande courte"), command: 'claude -p "Fix the total bug in @src/cart.ts"', caption: l("pnpm, and tests run without being asked: the rules did the remembering.", "pnpm, et les tests lancés sans qu'on le demande : les règles ont fait le travail de mémoire.") },
          ]}
        />
      );
    case "rules-layers":
      return <RulesLayersScene />;
    case "one-rulebook":
      return <OneRulebookScene />;
    case "rules-lint":
      return <RulesLintScene />;
    case "progressive-disclosure":
      return <ProgressiveDisclosureScene />;
    case "skill-anatomy":
      return <SkillAnatomyScene />;
    case "sandbox":
      return <SandboxScene />;
    case "antigravity":
      return <AntigravityScene />;
    case "worktrees":
      return (
        <EngineScene
          orca
          setup={() => shop({ "AGENTS.md": AGENTS_MD, "CLAUDE.md": "@AGENTS.md\n" })}
          intro={l("One project, one main checkout.", "Un projet, un checkout principal.")}
          actions={[
            { label: l("Codex fixes total()", "Codex corrige total()"), command: `orca worktree create --name fix-total --agent codex --prompt "${P_TOTAL}"`, caption: l("A lane appears: Codex works in its own copy, on branch fix-total.", "Un couloir apparaît : Codex travaille dans sa propre copie, sur la branche fix-total.") },
            { label: l("Claude does the euros", "Claude s'occupe des euros"), command: `orca worktree create --name euro --agent claude --prompt "${P_EURO}"`, caption: l("A second agent, in parallel. Different files, no collision.", "Un second agent, en parallèle. Fichiers différents, aucune collision.") },
            { label: l("Merge both", "Fusionner les deux"), command: "git merge fix-total && git merge euro", caption: l("Both branches merged into main. You reviewed, they typed.", "Les deux branches fusionnées dans main. Tu as relu, ils ont tapé.") },
          ]}
        />
      );
    default:
      return null;
  }
}

// ───────────────────────────────────────────── Generic: a tiny real simulation driven by buttons

interface SceneAction {
  label: string;
  command?: string;
  run?: (w: World) => World;
  caption: string;
}

function EngineScene({ setup, actions, intro, orca }: { setup: () => World; actions: SceneAction[]; intro: string; orca?: boolean }) {
  const l = useL();
  const locale = useLocale();
  const [initial] = useState(setup);
  const [world, setWorld] = useState(initial);
  const [lines, setLines] = useState<OutLine[]>([]);
  const [step, setStep] = useState(0);
  const doAction = (a: SceneAction) => {
    if (a.run) {
      setWorld(a.run(world));
      setLines([]);
    } else {
      const r = execute(world, a.command!, { locale });
      setWorld(r.world);
      setLines(r.lines);
    }
    setStep((s) => s + 1);
  };
  const caption = step === 0 ? intro : actions[step - 1].caption;
  const shown = lines.filter((x) => x.text.trim() && x.kind !== "muted").slice(0, 9);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid overflow-hidden rounded-lg border border-line sm:grid-cols-[1fr_1.1fr]">
        <div className="min-h-56 bg-surface-2/40">
          <AgentView world={world} compact orca={orca} />
        </div>
        <div className="terminal min-h-40 bg-term px-3 py-2.5 font-mono text-[12px] leading-relaxed">
          {step > 0 && actions[step - 1].command && (
            <p className="mb-1 truncate">
              <span className="text-[var(--t-green)]">$</span> <span className="text-white">{actions[step - 1].command}</span>
            </p>
          )}
          {shown.map((x, i) => (
            <p key={i} className={clsx("whitespace-pre-wrap", x.kind === "warning" ? "text-[var(--t-yellow)]" : x.kind === "success" ? "text-[var(--t-green)]" : x.kind === "tool" ? "text-[var(--t-cyan)]" : x.kind === "error" ? "text-[var(--t-red)]" : x.kind === "added" ? "text-[var(--t-green)]" : "text-[var(--t-text)]")}>
              {x.text}
            </p>
          ))}
          {step === 0 && <p className="text-[var(--t-muted)]">{l("Press the button to run the first step.", "Appuie sur le bouton pour lancer la première étape.")}</p>}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.p key={step} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="min-h-10 text-sm text-fg-2" aria-live="polite">
          {caption}
        </motion.p>
      </AnimatePresence>
      <SceneButtons
        done={step >= actions.length}
        label={actions[step]?.label}
        onNext={() => doAction(actions[step])}
        onReplay={() => {
          setWorld(initial);
          setLines([]);
          setStep(0);
        }}
      />
    </div>
  );
}

function SceneButtons({ done, label, onNext, onReplay }: { done: boolean; label?: string; onNext: () => void; onReplay: () => void }) {
  const l = useL();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {!done ? (
        <Button onClick={onNext} size="md" data-nudge={true}>
          {label}
        </Button>
      ) : (
        <span className="text-sm font-medium text-ok">{l("✓ That's the idea!", "✓ C'est l'idée !")}</span>
      )}
      <Button variant="ghost" size="sm" onClick={onReplay}>
        <RotateCcw className="size-3.5" /> {l("Replay", "Rejouer")}
      </Button>
    </div>
  );
}

// ───────────────────────────────────────────── 1. The agent loop

function AgentLoopScene() {
  const l = useL();
  const [phase, setPhase] = useState(-1);
  const phases = [
    { name: l("Read", "Lire"), line: "● Read(src/cart.ts)", note: l("It opens the files it needs, like you would.", "Il ouvre les fichiers dont il a besoin, comme tu le ferais.") },
    { name: l("Plan", "Planifier"), line: "● total() ignores quantity → multiply, add a test", note: l("It decides what to change and how to check it.", "Il décide quoi changer et comment le vérifier.") },
    { name: l("Act", "Agir"), line: "● Update(src/cart.ts)  ⎿ +1 −1", note: l("It edits files and runs commands. A chatbot can't do this part.", "Il modifie des fichiers et lance des commandes. Un chatbot ne peut pas faire ça.") },
    { name: l("Verify", "Vérifier"), line: "● Bash(pnpm test)  ⎿ ✓ 3 tests passed", note: l("It checks its own work. If a test fails, it loops back to Plan.", "Il vérifie son propre travail. Si un test échoue, il repart à Planifier.") },
    { name: l("Report", "Rendre compte"), line: "total() ignored quantities. Fixed, with a test.", note: l("It tells you what it did, so you can review.", "Il te dit ce qu'il a fait, pour que tu relises.") },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-line bg-surface-2/40 p-4">
        <div className="mb-4 flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2 text-sm">
          <User className="size-4 text-fg-3" />
          <span className="italic">“{l("Fix the total bug in src/cart.ts and run the tests", "Corrige le bug de total dans src/cart.ts et lance les tests")}”</span>
        </div>
        <ol className="grid grid-cols-5 gap-1.5">
          {phases.map((p, i) => (
            <li key={i} className="flex flex-col items-center gap-1.5 text-center">
              <motion.span
                animate={{ scale: i === phase ? 1.12 : 1 }}
                className={clsx("grid size-10 place-items-center rounded-full border-2 text-sm font-semibold", i <= phase ? "border-accent-mark bg-accent-mark text-white" : "border-line-strong bg-surface text-fg-3")}
              >
                {i < phase ? <Check className="size-4" strokeWidth={3} /> : i + 1}
              </motion.span>
              <span className={clsx("text-[11px] font-medium", i <= phase ? "text-fg" : "text-fg-3")}>{p.name}</span>
            </li>
          ))}
        </ol>
        <div className="terminal mt-4 min-h-24 rounded-md bg-term px-3 py-2 font-mono text-[12px]">
          {phases.slice(0, phase + 1).map((p, i) => (
            <motion.p key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className={i === 4 ? "font-sans text-[var(--t-text)]" : i === 3 ? "text-[var(--t-green)]" : "text-[var(--t-cyan)]"}>
              {p.line}
            </motion.p>
          ))}
          {phase < 0 && <p className="text-[var(--t-muted)]">{l("Press the button to start the loop.", "Appuie sur le bouton pour lancer la boucle.")}</p>}
        </div>
      </div>
      <p className="min-h-10 text-sm text-fg-2" aria-live="polite">
        {phase < 0 ? l("You give a goal. The agent works through a loop until it's done.", "Tu donnes un objectif. L'agent parcourt une boucle jusqu'à ce que ce soit fait.") : phases[phase].note}
      </p>
      <SceneButtons done={phase >= 4} label={phase < 0 ? l("Start", "Démarrer") : l(`Next: ${phases[phase + 1]?.name}`, `Suivant : ${phases[phase + 1]?.name}`)} onNext={() => setPhase((p) => p + 1)} onReplay={() => setPhase(-1)} />
    </div>
  );
}

// ───────────────────────────────────────────── 2. Prompt anatomy

function PromptAnatomyScene() {
  const l = useL();
  const checkLabel = useCheckLabel();
  const parts = [
    { id: "goal", text: l("Add a discount function", "Ajoute une fonction de remise") },
    { id: "context", text: l("in @src/cart.ts:", "dans @src/cart.ts :") },
    { id: "specific", text: l("applyDiscount(totalCents, percent), 20 means 20% off.", "applyDiscount(totalCents, percent), 20 veut dire 20 % de remise.") },
    { id: "constraints", text: l("Never below 0, don't change total().", "Jamais sous 0, ne change pas total().") },
    { id: "verify", text: l("Add tests and run them.", "Ajoute des tests et lance-les.") },
    { id: "done", text: l("It should return whole cents.", "Elle doit renvoyer des centimes entiers.") },
  ] as const;
  const [on, setOn] = useState<string[]>(["goal"]);
  const prompt = parts.filter((p) => on.includes(p.id)).map((p) => p.text).join(" ");
  const report = analyzePrompt(prompt, shop().files);
  const grade = promptGrade(report.score);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {parts.map((p) => (
          <button
            key={p.id}
            onClick={() => setOn((x) => (x.includes(p.id) ? x.filter((y) => y !== p.id) : [...x, p.id]))}
            aria-pressed={on.includes(p.id)}
            className={clsx("rounded-full border px-3 py-1 text-xs font-medium transition-colors", on.includes(p.id) ? "border-accent/50 bg-accent-soft text-accent-fg" : "border-line text-fg-2 hover:border-line-strong")}
          >
            {on.includes(p.id) ? "✓ " : "+ "}
            {checkLabel(p.id)}
          </button>
        ))}
      </div>
      <div className="rounded-lg border border-line bg-surface p-3">
        <p className="min-h-12 font-mono text-[13px] text-fg">{prompt || "…"}</p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
          <span className={clsx("rounded-full px-2 py-0.5 text-[11px] font-bold", grade === "sharp" ? "bg-ok-soft text-ok" : grade === "okay" ? "bg-warn-soft text-warn" : "bg-bad-soft text-bad")}>{report.score}/6</span>
          {PROMPT_CHECKS.map((c) => (
            <span key={c} className={clsx("inline-flex items-center gap-0.5 rounded-md border px-1.5 py-px text-[10px]", report.checks[c] ? "border-ok/30 text-ok" : "border-line text-fg-3")}>
              {report.checks[c] ? <Check className="size-2.5" /> : <X className="size-2.5" />} {checkLabel(c)}
            </span>
          ))}
        </div>
      </div>
      <p className="text-sm text-fg-2">
        {report.score >= 5
          ? l("Sharp! The agent has nothing left to guess.", "Précis ! L'agent n'a plus rien à deviner.")
          : l("Each missing ingredient is something the agent will guess.", "Chaque ingrédient manquant, c'est quelque chose que l'agent va deviner.")}
      </p>
    </div>
  );
}

// ───────────────────────────────────────────── 3. The context desk

function ContextDeskScene() {
  const l = useL();
  const items = [
    { id: "system", label: l("Agent's instructions", "Instructions de l'agent"), size: 3, color: "var(--text-3)" },
    { id: "rules", label: "CLAUDE.md", size: 1, color: "var(--lane-0)" },
    { id: "skills", label: l("Skill descriptions", "Descriptions des skills"), size: 1, color: "var(--lane-2)" },
    { id: "file", label: "src/cart.ts", size: 1, color: "var(--lane-1)" },
    { id: "all", label: l("The whole src/ folder", "Tout le dossier src/"), size: 6, color: "var(--lane-1)" },
    { id: "chat", label: l("A long conversation", "Une longue conversation"), size: 5, color: "var(--lane-3)" },
    { id: "prompt", label: l("Your prompt", "Ton prompt"), size: 1, color: "var(--accent-mark)" },
  ];
  const CAP = 16;
  const [on, setOn] = useState<string[]>(["system"]);
  const [compacted, setCompacted] = useState(false);
  const size = (id: string) => (id === "chat" && compacted ? 1 : items.find((i) => i.id === id)!.size);
  const used = on.reduce((n, id) => n + size(id), 0);
  const full = used > CAP;
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-line bg-surface-2/40 p-4">
        <div className="mb-1 flex justify-between text-[11px] text-fg-3">
          <span>{l("Context window", "Fenêtre de contexte")}</span>
          <span className={full ? "font-semibold text-bad" : ""}>
            {used}/{CAP}
          </span>
        </div>
        <div className={clsx("flex h-8 overflow-hidden rounded-md border bg-surface", full ? "border-bad" : "border-line")}>
          <AnimatePresence initial={false}>
            {on.map((id) => {
              const it = items.find((i) => i.id === id)!;
              return (
                <motion.span
                  key={id}
                  initial={{ width: 0 }}
                  animate={{ width: `${(size(id) / Math.max(CAP, used)) * 100}%` }}
                  exit={{ width: 0 }}
                  className="grid h-full place-items-center overflow-hidden border-r border-[var(--surface)] text-[10px] whitespace-nowrap text-white"
                  style={{ background: it.color }}
                  title={it.label}
                >
                  {size(id) > 1 ? it.label : ""}
                </motion.span>
              );
            })}
          </AnimatePresence>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => setOn((x) => (x.includes(it.id) ? x.filter((y) => y !== it.id) : [...x, it.id]))}
              aria-pressed={on.includes(it.id)}
              className={clsx("flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs", on.includes(it.id) ? "border-accent/50 bg-accent-soft" : "border-line hover:border-line-strong")}
            >
              <span className="size-2.5 rounded-sm" style={{ background: it.color }} /> {it.label}
              <span className="text-fg-3">{size(it.id)}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="min-h-10 text-sm text-fg-2" aria-live="polite">
        {full
          ? l("Overflow! Real agents would now summarize older messages (/compact) and lose details. Remove the noise instead.", "Débordement ! Les vrais agents résumeraient maintenant les anciens messages (/compact) et perdraient des détails. Retire plutôt le bruit.")
          : on.includes("all")
            ? l("Loading the whole folder “just in case” fills the desk fast. One precise @file is usually enough.", "Charger tout le dossier « au cas où » remplit vite le bureau. Un @fichier précis suffit généralement.")
            : l("Add things to the desk. Everything the agent knows must fit here.", "Ajoute des choses sur le bureau. Tout ce que l'agent sait doit tenir ici.")}
      </p>
      {on.includes("chat") && (
        <Button variant="secondary" size="sm" className="self-start" onClick={() => setCompacted((c) => !c)}>
          {compacted ? l("Undo /compact", "Annuler /compact") : "/compact"}
        </Button>
      )}
    </div>
  );
}

// ───────────────────────────────────────────── 4. Where rules live

const LAYERS = {
  claude: [
    ["~/.claude/CLAUDE.md", { en: "You, in every project", fr: "Toi, dans tous les projets" }],
    ["CLAUDE.md", { en: "The team, committed with the code", fr: "L'équipe, commité avec le code" }],
    ["CLAUDE.local.md", { en: "You, this project only (not committed)", fr: "Toi, ce projet seulement (non commité)" }],
    ["@path imports", { en: "Pull in other files, e.g. @AGENTS.md", fr: "Importer d'autres fichiers, ex. @AGENTS.md" }],
  ],
  codex: [
    ["~/.codex/AGENTS.md", { en: "You, in every project", fr: "Toi, dans tous les projets" }],
    ["AGENTS.md", { en: "The team, at the repo root", fr: "L'équipe, à la racine du dépôt" }],
    ["sub/folder/AGENTS.md", { en: "Extra rules for one folder", fr: "Règles en plus pour un dossier" }],
  ],
  gemini: [
    ["~/.gemini/GEMINI.md", { en: "You, in every project", fr: "Toi, dans tous les projets" }],
    ["GEMINI.md", { en: "The team; can @import other files", fr: "L'équipe ; peut @importer d'autres fichiers" }],
  ],
  antigravity: [
    ["~/.gemini/GEMINI.md", { en: "Global rules", fr: "Règles globales" }],
    ["AGENTS.md · GEMINI.md", { en: "Workspace rules, up to the repo root", fr: "Règles de l'espace de travail, jusqu'à la racine" }],
    [".agents/rules/*.md", { en: "One file per rule topic", fr: "Un fichier par sujet de règle" }],
  ],
  cursor: [
    [".cursor/rules/*.mdc", { en: "Rules with globs: apply to matching files", fr: "Règles avec globs : s'appliquent aux fichiers ciblés" }],
    ["AGENTS.md", { en: "Also read by Cursor", fr: "Lu aussi par Cursor" }],
  ],
} as const;

function RulesLayersScene() {
  const pick = usePick();
  const [tool, setTool] = useState<keyof typeof LAYERS>("claude");
  const names = { claude: "Claude Code", codex: "Codex", gemini: "Gemini CLI", antigravity: "Antigravity", cursor: "Cursor" };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5" role="radiogroup">
        {(Object.keys(LAYERS) as Array<keyof typeof LAYERS>).map((k) => (
          <button key={k} role="radio" aria-checked={tool === k} onClick={() => setTool(k)} className={clsx("flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium", tool === k ? "border-accent/50 bg-accent-soft text-accent-fg" : "border-line text-fg-2")}>
            {k !== "cursor" && <ToolBadge tool={k} />} {names[k]}
          </button>
        ))}
      </div>
      <ol className="space-y-1.5">
        <AnimatePresence mode="popLayout">
          {LAYERS[tool].map(([path, desc], i) => (
            <motion.li key={tool + path} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-2 text-[11px] font-semibold text-fg-3">{i + 1}</span>
              <BookOpenCheck className="size-4 shrink-0 text-[var(--lane-0)]" />
              <code className="font-mono text-[13px]">{path}</code>
              <span className="ml-auto text-right text-xs text-fg-3">{pick(desc)}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </div>
  );
}

// ───────────────────────────────────────────── 5. One rulebook

function OneRulebookScene() {
  const l = useL();
  const [linked, setLinked] = useState(false);
  const readers = [
    { name: "Codex", native: true },
    { name: "Antigravity", native: true },
    { name: "Cursor", native: true },
    { name: "Claude Code", native: false, via: "CLAUDE.md" },
    { name: "Gemini CLI", native: false, via: "GEMINI.md" },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 rounded-lg border border-line bg-surface-2/40 p-4 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex items-center gap-2 rounded-lg border-2 border-[var(--lane-0)] bg-surface px-3 py-3">
          <BookOpenCheck className="size-5 text-[var(--lane-0)]" />
          <div>
            <p className="font-mono text-sm font-semibold">AGENTS.md</p>
            <p className="text-[11px] text-fg-3">{l("one source of truth", "une seule source de vérité")}</p>
          </div>
        </div>
        <ul className="space-y-1.5">
          {readers.map((r) => {
            const ok = r.native || linked;
            return (
              <li key={r.name} className="flex items-center gap-2 text-sm">
                <ArrowRight className={clsx("size-4 shrink-0", ok ? "text-ok" : "text-fg-3 opacity-40")} />
                {!r.native && (
                  <motion.code animate={{ opacity: linked ? 1 : 0.5 }} className="rounded bg-surface px-1.5 py-0.5 font-mono text-[11px]">
                    {r.via}
                    {linked && <span className="text-accent-fg"> ← @AGENTS.md</span>}
                  </motion.code>
                )}
                <span className={ok ? "text-fg" : "text-fg-3 line-through"}>{r.name}</span>
                {ok ? <Check className="size-4 text-ok" /> : <X className="size-4 text-bad" />}
              </li>
            );
          })}
        </ul>
      </div>
      <p className="min-h-10 text-sm text-fg-2">
        {linked
          ? l("One line in CLAUDE.md and GEMINI.md, and every agent follows the same rules.", "Une ligne dans CLAUDE.md et GEMINI.md, et tous les agents suivent les mêmes règles.")
          : l("Codex, Antigravity and Cursor read AGENTS.md. Claude Code and Gemini CLI look for their own file.", "Codex, Antigravity et Cursor lisent AGENTS.md. Claude Code et Gemini CLI cherchent leur propre fichier.")}
      </p>
      <SceneButtons done={linked} label={l("Add @AGENTS.md imports", "Ajouter les imports @AGENTS.md")} onNext={() => setLinked(true)} onReplay={() => setLinked(false)} />
    </div>
  );
}

// ───────────────────────────────────────────── 6. Good and bad rules

function RulesLintScene() {
  const l = useL();
  const pick = usePick();
  const lines = [
    { text: "Write clean code and follow best practices.", good: false },
    { text: "IMPORTANT: ALWAYS be careful!!!", good: false },
    { text: "Use npm for everything.", good: false },
    { text: "## Commands", good: true },
    { text: "- Install: `pnpm install`", good: true },
    { text: "- Test: `pnpm test` (run it after every change)", good: true },
    { text: "- Write code comments in French.", good: true },
    { text: "- Never edit `src/generated/`.", good: true },
  ];
  const [on, setOn] = useState<number[]>([0, 1, 2, 4]);
  const text = lines.filter((_, i) => on.includes(i)).map((x) => x.text).join("\n");
  const issues = useMemo(() => lintRules(text), [text]);
  const directives = DIRECTIVES.filter((d) => directivesIn(text).includes(d.id));
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <ul className="space-y-1 rounded-lg border border-line bg-surface p-2">
          {lines.map((x, i) => (
            <li key={i}>
              <label className={clsx("flex cursor-pointer items-start gap-2 rounded-md px-2 py-1 font-mono text-[12px]", on.includes(i) ? "bg-surface-2" : "opacity-50")}>
                <input type="checkbox" checked={on.includes(i)} onChange={() => setOn((s) => (s.includes(i) ? s.filter((y) => y !== i) : [...s, i]))} className="mt-0.5 accent-[var(--accent)]" />
                {x.text}
              </label>
            </li>
          ))}
        </ul>
        <div className="space-y-2 text-xs">
          <div className="rounded-lg border border-line bg-surface p-3">
            <p className="mb-1 font-semibold text-fg-2">{l("What the agent will actually do", "Ce que l'agent va vraiment faire")}</p>
            {directives.length ? (
              <ul className="space-y-0.5">
                {directives.map((d) => (
                  <li key={d.id} className="flex items-center gap-1.5 text-ok">
                    <Check className="size-3.5" /> <span className="text-fg">{pick(d.label)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-fg-3">{l("Nothing concrete…", "Rien de concret…")}</p>
            )}
          </div>
          <div className={clsx("rounded-lg border p-3", issues.length ? "border-warn/40 bg-warn-soft" : "border-ok/30 bg-ok-soft")}>
            <p className="mb-1 font-semibold text-fg-2">{issues.length ? l("Problems", "Problèmes") : l("No problems", "Aucun problème")}</p>
            <ul className="space-y-1">
              {issues.map((i) => (
                <li key={i.id} className="text-fg">
                  {pick(i.message)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────── 7. Progressive disclosure

const DEMO_SKILLS = [
  CHANGELOG_SKILL,
  "---\nname: db-migration\ndescription: Create and check database migrations. Use when the user changes the database schema.\n---\n1. Create a migration file\n2. Run it on a copy\n",
  "---\nname: docs\ndescription: Keep README.md useful. Use when the user asks to document the project or update the README.\n---\n1. Read package.json\n2. Add a Getting started section\n",
  "---\nname: pdf-forms\ndescription: Fill and read PDF forms. Use when the user mentions a PDF form.\n---\n1. Extract the fields\n2. Fill them\n3. Save a copy\n",
];

function ProgressiveDisclosureScene() {
  const l = useL();
  const skills: Skill[] = DEMO_SKILLS.map((text) => {
    const fm = parseFrontmatter(text);
    return { name: fm.data.name, folder: fm.data.name, path: `.claude/skills/${fm.data.name}/SKILL.md`, description: fm.data.description, body: fm.body, problems: [] };
  });
  const requests = [l("Update the changelog", "Update the changelog"), "Fix the total bug in @src/cart.ts", l("Update the README", "Update the README")];
  const [req, setReq] = useState<string | null>(null);
  const match = req ? matchSkill(req, skills) : null;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        {requests.map((r) => (
          <button key={r} onClick={() => setReq(r)} aria-pressed={req === r} className={clsx("flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs", req === r ? "border-accent/50 bg-accent-soft text-accent-fg" : "border-line text-fg-2 hover:border-line-strong")}>
            <MessageSquare className="size-3.5" /> “{r}”
          </button>
        ))}
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {skills.map((s) => {
          const open = match?.name === s.name;
          return (
            <motion.li key={s.name} layout className={clsx("rounded-lg border p-3", open ? "border-[var(--lane-5)] bg-surface shadow-[var(--shadow-card)]" : "border-line bg-surface-2/50")}>
              <p className="flex items-center gap-1.5 font-mono text-xs font-semibold">
                <Sparkles className="size-3.5 text-[var(--lane-5)]" /> {s.name}
                <span className="ml-auto font-sans text-[10px] font-normal text-fg-3">{open ? tokens(s.description + s.body) : tokens(s.description)} tok</span>
              </p>
              <p className="mt-1 text-[11px] text-fg-3">{s.description}</p>
              <AnimatePresence>
                {open && (
                  <motion.pre initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-2 overflow-hidden rounded bg-surface-2 p-2 font-mono text-[11px] whitespace-pre-wrap text-fg-2">
                    {s.body.trim()}
                  </motion.pre>
                )}
              </AnimatePresence>
            </motion.li>
          );
        })}
      </ul>
      <p className="min-h-10 text-sm text-fg-2" aria-live="polite">
        {!req
          ? l("Four skills installed. The agent only holds their names and descriptions: tiny. Pick a request.", "Quatre skills installés. L'agent ne garde que leurs noms et descriptions : minuscule. Choisis une demande.")
          : match
            ? l(`The request matches “${match.name}”: its full instructions are loaded now, and only these.`, `La demande correspond à « ${match.name} » : ses instructions complètes sont chargées maintenant, et seulement elles.`)
            : l("No skill matches: none is loaded. Zero cost.", "Aucun skill ne correspond : aucun n'est chargé. Coût zéro.")}
      </p>
    </div>
  );
}

// ───────────────────────────────────────────── 8. Anatomy of a skill

function SkillAnatomyScene() {
  const l = useL();
  const parts = [
    { id: "folder", title: l("The folder", "Le dossier"), body: l("One folder per skill, named like the skill. Claude Code: .claude/skills/. Codex and Antigravity: .agents/skills/.", "Un dossier par skill, au nom du skill. Claude Code : .claude/skills/. Codex et Antigravity : .agents/skills/.") },
    { id: "name", title: "name", body: l("lowercase-with-hyphens, same as the folder.", "en-minuscules-avec-tirets, comme le dossier.") },
    { id: "description", title: "description", body: l("The trigger. What it does AND when to use it. It's the only part the agent reads before choosing.", "Le déclencheur. Ce qu'il fait ET quand l'utiliser. C'est la seule partie que l'agent lit avant de choisir.") },
    { id: "body", title: l("The instructions", "Les instructions"), body: l("Clear steps, like a checklist for a new colleague. Loaded only when the skill is used.", "Des étapes claires, comme une checklist pour un nouveau collègue. Chargées seulement quand le skill est utilisé.") },
    { id: "extras", title: l("Extras", "Les extras"), body: l("Optional scripts/ and reference files the agent can open or run when the instructions say so.", "Des scripts/ et fichiers de référence optionnels que l'agent ouvre ou lance quand les instructions le disent.") },
  ];
  const [sel, setSel] = useState("description");
  const hl = (id: string) => clsx("rounded px-0.5 transition-colors", sel === id ? "bg-accent-soft ring-1 ring-accent/40" : "");
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
      <div className="rounded-lg border border-line bg-surface p-3 font-mono text-[12px] leading-6">
        <p className={hl("folder")}>
          <Folder className="mr-1 inline size-3.5 text-fg-3" />
          .claude/skills/changelog/
        </p>
        <div className="ml-4 border-l border-line pl-3">
          <p className="flex items-center gap-1">
            <FileText className="size-3.5 text-[var(--lane-5)]" /> SKILL.md
          </p>
          <div className="my-1 rounded bg-surface-2 p-2">
            <p className="text-fg-3">---</p>
            <p className={hl("name")}>
              <span className="text-info">name:</span> changelog
            </p>
            <p className={hl("description")}>
              <span className="text-info">description:</span> Update CHANGELOG.md… Use when the user asks to update the changelog…
            </p>
            <p className="text-fg-3">---</p>
            <div className={hl("body")}>
              <p>1. Read CHANGELOG.md…</p>
              <p>2. Add a ## [Unreleased] section…</p>
              <p>3. Group entries…</p>
            </div>
          </div>
          <p className={hl("extras")}>
            <Folder className="mr-1 inline size-3.5 text-fg-3" />
            scripts/ · template.md
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {parts.map((p) => (
          <button key={p.id} onClick={() => setSel(p.id)} aria-pressed={sel === p.id} className={clsx("rounded-lg border p-2.5 text-left", sel === p.id ? "border-accent/50 bg-accent-soft" : "border-line hover:border-line-strong")}>
            <p className="text-xs font-semibold">{p.title}</p>
            {sel === p.id && <p className="mt-1 text-xs text-fg-2">{p.body}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────── 9. Sandbox × approvals

function SandboxScene() {
  const l = useL();
  const [sandbox, setSandbox] = useState<"read-only" | "workspace-write" | "danger-full-access">("read-only");
  const [approval, setApproval] = useState<"untrusted" | "on-request" | "never">("untrusted");
  type V = "yes" | "ask" | "no";
  const actions: Array<{ label: string; v: () => V }> = [
    { label: l("Read your files", "Lire tes fichiers"), v: () => "yes" },
    { label: l("Edit files in the project", "Modifier les fichiers du projet"), v: () => (sandbox === "read-only" ? (approval === "never" ? "no" : "ask") : approval === "untrusted" ? "ask" : "yes") },
    { label: l("Run the tests", "Lancer les tests"), v: () => (approval === "untrusted" ? "ask" : sandbox === "read-only" && approval === "never" ? "no" : "yes") },
    { label: l("Download packages (network)", "Télécharger des paquets (réseau)"), v: () => (sandbox === "danger-full-access" ? (approval === "untrusted" ? "ask" : "yes") : approval === "never" ? "no" : "ask") },
    { label: l("Delete files outside the project", "Supprimer des fichiers hors du projet"), v: () => (sandbox === "danger-full-access" ? (approval === "never" ? "yes" : "ask") : approval === "never" ? "no" : "ask") },
  ];
  const icon = (v: V) => (v === "yes" ? <Check className="size-4 text-ok" /> : v === "ask" ? <Hand className="size-4 text-warn" /> : <X className="size-4 text-bad" />);
  const word = (v: V) => (v === "yes" ? l("on its own", "tout seul") : v === "ask" ? l("asks you", "te demande") : l("never", "jamais"));
  const danger = sandbox === "danger-full-access" && approval === "never";
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <fieldset>
          <legend className="mb-1 text-xs font-semibold text-fg-3">sandbox_mode</legend>
          <div className="flex flex-wrap gap-1">
            {(["read-only", "workspace-write", "danger-full-access"] as const).map((s) => (
              <button key={s} onClick={() => setSandbox(s)} aria-pressed={sandbox === s} className={clsx("rounded-md border px-2 py-1 font-mono text-[11px]", sandbox === s ? "border-accent/50 bg-accent-soft text-accent-fg" : "border-line text-fg-2")}>
                {s}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-1 text-xs font-semibold text-fg-3">approval_policy</legend>
          <div className="flex flex-wrap gap-1">
            {(["untrusted", "on-request", "never"] as const).map((s) => (
              <button key={s} onClick={() => setApproval(s)} aria-pressed={approval === s} className={clsx("rounded-md border px-2 py-1 font-mono text-[11px]", approval === s ? "border-accent/50 bg-accent-soft text-accent-fg" : "border-line text-fg-2")}>
                {s}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      <ul className={clsx("divide-y divide-line rounded-lg border bg-surface", danger ? "border-bad" : "border-line")}>
        {actions.map((a) => {
          const v = a.v();
          return (
            <li key={a.label} className="flex items-center gap-2 px-3 py-1.5 text-sm">
              {icon(v)} <span className="flex-1">{a.label}</span> <span className="text-xs text-fg-3">{word(v)}</span>
            </li>
          );
        })}
      </ul>
      <p className={clsx("min-h-10 text-sm", danger ? "font-medium text-bad" : "text-fg-2")}>
        {danger
          ? l("No sandbox, no questions: the agent can do anything on your machine. Only for throwaway containers.", "Ni sandbox ni question : l'agent peut tout faire sur ta machine. Seulement pour des conteneurs jetables.")
          : sandbox === "workspace-write" && approval === "on-request"
            ? l("The usual daily setting: free inside the project, asks before going beyond.", "Le réglage habituel : libre dans le projet, il demande avant d'en sortir.")
            : l("Try workspace-write + on-request: the everyday balance.", "Essaie workspace-write + on-request : l'équilibre du quotidien.")}
      </p>
      <p className="flex items-center gap-1.5 text-[11px] text-fg-3">
        <ShieldCheck className="size-3.5" /> {l("Simplified view of Codex's real behavior.", "Vue simplifiée du vrai comportement de Codex.")}
      </p>
    </div>
  );
}

// ───────────────────────────────────────────── 10. Antigravity's three kinds of instructions

function AntigravityScene() {
  const l = useL();
  const kinds = [
    { id: "rules", icon: BookOpenCheck, color: "var(--lane-0)", path: ".agents/rules/style.md", who: l("Always on", "Toujours actives"), when: l("Loaded in every conversation.", "Chargées dans chaque conversation."), example: l("“Write code comments in French.”", "« Écris les commentaires en français. »") },
    { id: "skills", icon: Sparkles, color: "var(--lane-5)", path: ".agents/skills/changelog/SKILL.md", who: l("The agent decides", "L'agent décide"), when: l("Loaded when your request matches its description.", "Chargé quand ta demande correspond à sa description.") , example: l("“Update the changelog” → changelog skill", "« Update the changelog » → skill changelog") },
    { id: "workflows", icon: Workflow, color: "var(--lane-4)", path: ".agents/workflows/release.md", who: l("You decide", "Tu décides"), when: l("Runs when you type /release.", "S'exécute quand tu tapes /release."), example: l("/release → changelog, then tests", "/release → changelog, puis tests") },
  ];
  const [sel, setSel] = useState(0);
  const k = kinds[sel];
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        {kinds.map((x, i) => (
          <button key={x.id} onClick={() => setSel(i)} aria-pressed={sel === i} className={clsx("flex flex-col items-center gap-1.5 rounded-lg border p-3", sel === i ? "border-accent/50 bg-accent-soft" : "border-line bg-surface hover:border-line-strong")}>
            <x.icon className="size-5" style={{ color: x.color }} />
            <span className="font-mono text-xs font-semibold">{x.id}/</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={k.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-lg border border-line bg-surface p-3 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            {k.id === "workflows" ? <User className="size-4 text-fg-3" /> : <Bot className="size-4 text-fg-3" />}
            {k.who}
          </p>
          <p className="mt-1 text-fg-2">{k.when}</p>
          <p className="mt-2 font-mono text-xs text-fg-3">{k.path}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-fg-2">
            <ArrowDown className="size-3.5" /> {k.example}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
