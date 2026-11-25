import { tx, type Ctx, type Txt } from "./context";
import { diffLines, splitLines } from "./diff";
import { getProject } from "./projects";
import { analyzePrompt, isQuestion, promptGrade, referencedFiles, tokens } from "./prompt";
import { directivesIn, DIRECTIVES, loadRules, packageManager, TOOL_NAMES } from "./rules";
import { listSkills, listWorkflows, matchSkill, stepsOf } from "./skills";
import type { AgentRun, ContextItem, FileMap, PromptCheck, ToolId, World } from "./types";

/** Approximate size of each tool's own instructions (system prompt + built-in tools). */
export const SYSTEM_TOKENS: Record<ToolId, number> = { claude: 3200, codex: 2600, gemini: 2800, antigravity: 3000 };
export const MCP_TOKENS = 900;

const isHome = (p: string) => p.startsWith("~/");

export function homeFiles(files: FileMap): FileMap {
  return Object.fromEntries(Object.entries(files).filter(([p]) => isHome(p)));
}

/** The files an agent sees when it works in `where` ("main" or a worktree): that checkout plus your home folder. */
export function viewFiles(world: World, where = "main"): FileMap {
  if (where === "main") return world.files;
  const wt = world.worktrees.find((w) => w.name === where);
  return wt ? { ...homeFiles(world.files), ...wt.files } : world.files;
}

function writeProject(world: World, where: string, files: FileMap) {
  const project = Object.fromEntries(Object.entries(files).filter(([p]) => !isHome(p)));
  if (where === "main") world.files = { ...homeFiles(world.files), ...project };
  else {
    const wt = world.worktrees.find((w) => w.name === where);
    if (wt) wt.files = project;
  }
}

/** Codex settings: ~/.codex/config.toml, then the project's .codex/config.toml, then command-line flags. */
export function codexSettings(files: FileMap, flags: { sandbox?: string; approval?: string } = {}) {
  let sandbox = "workspace-write";
  let approval = "on-request";
  for (const p of ["~/.codex/config.toml", ".codex/config.toml"]) {
    const toml = files[p];
    if (!toml) continue;
    const s = toml.match(/^\s*sandbox_mode\s*=\s*["']([\w-]+)["']/m);
    const a = toml.match(/^\s*approval_policy\s*=\s*["']([\w-]+)["']/m);
    if (s) sandbox = s[1];
    if (a) approval = a[1];
  }
  return { sandbox: flags.sandbox ?? sandbox, approval: flags.approval ?? approval };
}

/** What a tool loads before you type anything: its system prompt, your rules, the skill index and MCP tools. */
export function startupContext(world: World, tool: ToolId, where = "main"): ContextItem[] {
  const view = viewFiles(world, where);
  const items: ContextItem[] = [{ kind: "system", label: `${TOOL_NAMES[tool]} system prompt`, tokens: SYSTEM_TOKENS[tool] }];
  for (const r of loadRules(view, tool)) items.push({ kind: "rules", label: r.importedBy ? `${r.path} (@ ${r.importedBy})` : r.path, tokens: tokens(r.content), source: r.path });
  const skills = listSkills(view, tool);
  if (skills.length)
    items.push({
      kind: "skill-index",
      label: skills.map((s) => s.name).join(", "),
      tokens: skills.reduce((n, s) => n + tokens(s.name + s.description) + 12, 0),
    });
  for (const m of world.mcp.filter((m) => m.tool === tool)) items.push({ kind: "mcp", label: `MCP ${m.name}`, tokens: MCP_TOKENS });
  return items;
}

interface Style {
  bullet: string;
  sub: string;
  read: (p: string) => string;
  edit: (p: string) => string;
  create: (p: string) => string;
  bash: (c: string) => string;
  skill: (n: string) => string;
  search: (n: number) => string;
}

const STYLE: Record<ToolId, Style> = {
  claude: { bullet: "●", sub: "  ⎿  ", read: (p) => `Read(${p})`, edit: (p) => `Update(${p})`, create: (p) => `Write(${p})`, bash: (c) => `Bash(${c})`, skill: (n) => `Skill(${n})`, search: (n) => `Search(…) → ${n} files` },
  codex: { bullet: "•", sub: "  └ ", read: (p) => `Explored ${p}`, edit: (p) => `Edited ${p}`, create: (p) => `Added ${p}`, bash: (c) => `Ran ${c}`, skill: (n) => `Using skill $${n}`, search: (n) => `Explored · searched ${n} files` },
  gemini: { bullet: "✦", sub: "  ↳ ", read: (p) => `ReadFile ${p}`, edit: (p) => `Edit ${p}`, create: (p) => `WriteFile ${p}`, bash: (c) => `Shell ${c}`, skill: (n) => `Skill ${n}`, search: (n) => `SearchText → ${n} files` },
  antigravity: { bullet: "▸", sub: "  └ ", read: (p) => `Analyzed ${p}`, edit: (p) => `Edited ${p}`, create: (p) => `Created ${p}`, bash: (c) => `Ran command ${c}`, skill: (n) => `Skill ${n}`, search: (n) => `Searched ${n} files` },
};

const APPROVE = /^(y|yes|ok|okay|go|go ahead|approve|approved|do it|sure|oui|ouais|vas-y|go !|valide|d'accord|lance|c'est bon)\b/i;
export const isApproval = (s: string) => APPROVE.test(s.trim());

const CHECK_NAMES: Record<PromptCheck, Txt> = {
  goal: tx("goal", "objectif"),
  context: tx("context", "contexte"),
  constraints: tx("constraints", "contraintes"),
  verify: tx("verification", "vérification"),
  specific: tx("details", "précision"),
  done: tx("done criteria", "critère de fin"),
};

export interface RunOpts {
  where?: string;
  /** codex flags for this run */
  sandbox?: string;
  approval?: string;
  /** The learner approved a plan: act even in plan mode. */
  approved?: boolean;
  /** Quiet: no terminal output (used by Orca for background agents). */
  quiet?: boolean;
}

/**
 * One turn of a coding agent: build its context (system prompt, rules,
 * skills, files, your prompt), decide what it can do, act, verify, report.
 * Deterministic, so lessons can check the result.
 */
export function runAgent(ctx: Ctx, tool: ToolId, rawPrompt: string, opts: RunOpts = {}): AgentRun {
  const where = opts.where ?? "main";
  const world = ctx.world;
  const project = getProject(world.project);
  const view = viewFiles(world, where);
  const S = STYLE[tool];
  const say = (text: string | Txt, kind: Parameters<Ctx["out"]>[1] = "out") => {
    if (!opts.quiet) ctx.out(text, kind);
  };

  let prompt = rawPrompt.trim();
  const workflow = (() => {
    const m = tool === "antigravity" ? prompt.match(/^\/([\w-]+)\s*([\s\S]*)$/) : null;
    const wf = m ? listWorkflows(view, tool).find((w) => w.name === m[1]) : undefined;
    if (wf && m) prompt = `${wf.body}\n${m[2]}`.trim();
    return wf ?? null;
  })();
  const report = analyzePrompt(rawPrompt, view);
  const effective = workflow ? analyzePrompt(prompt, view) : report;
  const rules = loadRules(view, tool);
  const rulesText = rules.map((r) => r.content).join("\n");
  const skills = listSkills(view, tool).filter((s) => !s.problems.some((p) => p.id === "no-frontmatter" || p.id === "no-description"));
  const skill = workflow ? null : matchSkill(prompt, skills);
  const guide = workflow?.body ?? skill?.body ?? null;
  const directives = directivesIn(`${rulesText}\n${guide ?? ""}`);
  const pm = packageManager(directives);
  const task = pickTask(project.tasks, prompt);

  // What's been said — by the prompt, the rules or the skill.
  const said: Record<PromptCheck, boolean> = { ...effective.checks };
  const fromRules: PromptCheck[] = [];
  if (directives.includes("tests") && !said.verify) {
    said.verify = true;
    fromRules.push("verify");
  }
  if (guide) {
    if (/\btests?\b/i.test(guide)) said.verify = true;
    if (stepsOf(guide).length >= 2 || /`[^`]+`|^#+ /m.test(guide)) said.specific = true;
    if (/\b(format|template|section|heading|must|should|always|doit|toujours|titre)\b/i.test(guide)) said.done = true;
    if (referencedFiles(guide, view).length) said.context = true;
    if (/\b(never|don'?t|only|jamais|uniquement|ne pas)\b/i.test(guide)) said.constraints = true;
  }

  // ── Context window
  const context = startupContext(world, tool, where);
  if (workflow) context.push({ kind: "workflow", label: workflow.path, tokens: tokens(workflow.body), source: workflow.path });
  if (skill) context.push({ kind: "skill", label: skill.path, tokens: tokens(skill.body), source: skill.path });
  const codeFiles = Object.keys(view).filter((p) => !isHome(p) && /^(src|tests)\//.test(p));
  let read = [...new Set([...effective.files])].filter((p) => !isHome(p));
  let searched = false;
  if (task && !read.length) {
    read = codeFiles;
    searched = true;
  }
  for (const p of read) context.push({ kind: "file", label: searched ? `${p} (search)` : p, tokens: tokens(view[p] ?? ""), source: p });
  context.push({ kind: "prompt", label: rawPrompt.length > 48 ? rawPrompt.slice(0, 46) + "…" : rawPrompt, tokens: tokens(rawPrompt) });

  const run: AgentRun = {
    id: world.seq + 1,
    tool,
    where,
    prompt: rawPrompt,
    report,
    context,
    task: task?.id ?? null,
    outcome: "answer",
    skill: skill?.name ?? null,
    workflow: workflow?.name ?? null,
    rules: rules.map((r) => r.path),
    followed: [],
    assumed: [],
    changed: [],
    commands: [],
    phases: ["read"],
    tokens: 0,
  };

  if (workflow) say(`${S.bullet} Workflow /${workflow.name}`, "info");
  if (skill) say(`${S.bullet} ${S.skill(skill.name)}`, "info");
  if (searched) say(`${S.bullet} ${S.search(read.length)}`, "tool");
  else for (const p of read) say(`${S.bullet} ${S.read(p)}`, "tool");

  const codex = tool === "codex" ? codexSettings(view, { sandbox: opts.sandbox ?? world.session?.sandbox, approval: opts.approval ?? world.session?.approval }) : null;

  if (!task) {
    if (/\b(rules?|r[èe]gles?|instructions?|memory|m[ée]moire|skills?)\b/i.test(prompt) && isQuestion(prompt)) {
      run.outcome = "answer";
      say(
        rules.length
          ? tx(`I read ${rules.map((r) => r.path).join(", ")}.`, `J'ai lu ${rules.map((r) => r.path).join(", ")}.`)
          : tx("I didn't find any rules file for me in this project.", "Je n'ai trouvé aucun fichier de règles pour moi dans ce projet."),
        "agent",
      );
      const dl = DIRECTIVES.filter((d) => directives.includes(d.id));
      if (dl.length) say(ctx.t(tx("What I'll do: ", "Ce que je vais faire : ")) + dl.map((d) => ctx.t(d.label)).join(" · "), "agent");
      if (skills.length) say(ctx.t(tx("Skills available: ", "Skills disponibles : ")) + skills.map((s) => s.name).join(", "), "agent");
    } else if (isQuestion(prompt) || /\b(explain|explique|summari[sz]e|r[ée]sume|overview|aper[çc]u)\b/i.test(prompt)) {
      run.outcome = "answer";
      say(project.summary, "agent");
    } else if (report.score <= 2) {
      run.outcome = "clarify";
      say(
        tx(
          "I'm not sure what you want me to change. Which file? What should happen exactly? How will we know it works?",
          "Je ne sais pas trop quoi changer. Quel fichier ? Que doit-il se passer exactement ? Comment saura-t-on que ça marche ?",
        ),
        "agent",
      );
    } else {
      run.outcome = "answer";
      say(
        tx(
          "In this practice project I can work on: discounts, the cart total, euro prices, tests, the README and the changelog. Try asking for one of those!",
          "Dans ce projet d'entraînement, je sais travailler sur : les remises, le total du panier, les prix en euros, les tests, le README et le changelog. Demande-moi l'un d'eux !",
        ),
        "agent",
      );
    }
    run.phases.push("report");
  } else if (world.session?.plan && !opts.approved && where === "main") {
    run.outcome = "plan";
    run.phases.push("plan");
    say(tx("Here's my plan (nothing changed yet):", "Voici mon plan (rien n'a encore changé) :"), "agent");
    task.plan.forEach((p, i) => say(`  ${i + 1}. ${ctx.t(p)}`, "agent"));
    say(tx("Approve? Type yes to let me do it, or tell me what to change.", "On y va ? Tape oui pour me laisser faire, ou dis-moi quoi changer."), "hint");
    world.session.pending = { prompt: rawPrompt };
    ctx.emit({ type: "plan" });
  } else if (codex && codex.sandbox === "read-only") {
    run.outcome = "blocked";
    run.phases.push("plan");
    say(`${S.bullet} ${S.edit(read[0] ?? "src")}`, "tool");
    say(`${S.sub}${ctx.t(tx("✗ blocked: the sandbox is read-only", "✗ bloqué : la sandbox est en lecture seule"))}`, "error");
    say(tx("I can read and explain code, but I can't write files with sandbox_mode = \"read-only\".", "Je peux lire et expliquer le code, mais je ne peux pas écrire de fichiers avec sandbox_mode = \"read-only\"."), "agent");
    ctx.explain = ctx.t(
      tx(
        "Codex runs inside a sandbox. read-only means it can only look. To let it edit your project, start it with --sandbox workspace-write or set sandbox_mode = \"workspace-write\" in ~/.codex/config.toml.",
        "Codex tourne dans une sandbox. read-only veut dire qu'il peut seulement regarder. Pour qu'il modifie ton projet, lance-le avec --sandbox workspace-write ou mets sandbox_mode = \"workspace-write\" dans ~/.codex/config.toml.",
      ),
    );
  } else {
    const missing = task.needs.filter((n) => !said[n]);
    const history = world.runs.filter((r) => r.where === where && r.changed.length && r.task !== "changelog").map((r) => r.prompt);
    const before = viewFiles(world, where);
    const result = task.run(before, { directives, locale: ctx.locale, guide, missing, verify: said.verify, history });
    run.outcome = missing.length ? "partial" : "done";
    run.assumed = missing;
    run.phases.push("act");
    const after = result.files;
    const paths = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((p) => !isHome(p) && before[p] !== after[p]).sort();
    run.changed = paths;
    for (const p of paths) {
      const d = diffLines(splitLines(before[p] ?? ""), splitLines(after[p] ?? ""));
      const add = d.filter((x) => x.op === "add").length;
      const del = d.filter((x) => x.op === "del").length;
      say(`${S.bullet} ${before[p] === undefined ? S.create(p) : S.edit(p)}`, "tool");
      say(`${S.sub}+${add} −${del}`, "added");
    }
    let files = after;
    if (said.verify) {
      run.phases.push("verify");
      const lock = { npm: "package-lock.json", pnpm: "pnpm-lock.yaml", yarn: "yarn.lock", bun: "bun.lock" }[pm];
      if (codex?.approval === "untrusted") say(`${S.sub}${ctx.t(tx(`approval needed to run ${pm} test → approved`, `approbation demandée pour lancer ${pm} test → approuvé`))}`, "warning");
      if (pm !== project.packageManager && !(lock in files)) {
        run.commands.push(`${pm} install`);
        say(`${S.bullet} ${S.bash(`${pm} install`)}`, "tool");
        say(`${S.sub}${pm} warn: package.json says "packageManager": "${project.packageManager}" — created ${lock} anyway`, "warning");
        files = { ...files, [lock]: `# ${lock} created by ${pm} install\n` };
        run.changed.push(lock);
      }
      run.commands.push(`${pm} test`);
      say(`${S.bullet} ${S.bash(`${pm} test`)}`, "tool");
      say(`${S.sub}✓ ${project.testCount(files)} tests passed`, "success");
    }
    writeProject(world, where, files);
    run.phases.push("report");
    say(result.summary, "agent");
    for (const m of missing) say(`${ctx.t(tx("Assumed", "Supposé"))} (${ctx.t(CHECK_NAMES[m])}): ${ctx.t(task.assume[m] ?? tx("—", "—"))}`, "warning");

    run.followed = directives.filter((d) => {
      if (d.startsWith("pm:")) return said.verify;
      if (d === "tests") return fromRules.includes("verify") || said.verify;
      if (d === "lang:fr") return run.changed.some((p) => p.endsWith(".ts"));
      return d === "conventional" || d === "small";
    });
    if (directives.includes("conventional")) {
      const type = task.id === "fix-total" ? "fix" : task.id === "changelog" || task.id === "readme" ? "docs" : task.id === "tests" ? "test" : "feat";
      say(`${ctx.t(tx("Suggested commit", "Commit suggéré"))}: ${type}: ${prompt.split("\n")[0].replace(/^[$/][\w-]+\s*/, "").toLowerCase().slice(0, 48)}`, "commit");
    }
    if (paths.length) ctx.emit({ type: "file-change", paths: run.changed });
  }

  run.tokens = context.reduce((n, c) => n + c.tokens, 0);
  if (skill) ctx.emit({ type: "skill-used", name: skill.name });
  const followedLabels = DIRECTIVES.filter((d) => run.followed.includes(d.id)).map((d) => ctx.t(d.label));
  if (followedLabels.length) say(`${ctx.t(tx("Rules followed", "Règles suivies"))}: ${followedLabels.join(" · ")}`, "muted");
  const grade = promptGrade(report.score);
  const gradeTxt = { vague: tx("vague", "vague"), okay: tx("okay", "correct"), sharp: tx("sharp", "précis") }[grade];
  say(
    `── ${ctx.t(tx("context", "contexte"))} ≈ ${(run.tokens / 1000).toFixed(1)}k tokens · prompt ${report.score}/6 (${ctx.t(gradeTxt)})${rules.length ? ` · ${ctx.t(tx("rules", "règles"))}: ${rules.map((r) => r.path).join(", ")}` : ""}`,
    "muted",
  );

  world.seq += 1;
  world.runs = [...world.runs, run].slice(-40);
  if (where !== "main") {
    const wt = world.worktrees.find((w) => w.name === where);
    if (wt) {
      wt.runs.push(run.id);
      if (run.changed.length && wt.status === "todo") wt.status = "in-progress";
    }
  }
  ctx.emit({ type: "prompt", tool, run: run.id, score: report.score, outcome: run.outcome });
  return run;
}

/** The task the prompt is mostly about: the one mentioned first. */
export function pickTask<T extends { match: RegExp }>(tasks: T[], prompt: string): T | null {
  let best: T | null = null;
  let at = Infinity;
  for (const t of tasks) {
    const i = prompt.search(t.match);
    if (i >= 0 && i < at) {
      at = i;
      best = t;
    }
  }
  return best;
}

export const lastRun = (world: World, where?: string) => [...world.runs].reverse().find((r) => !where || r.where === where) ?? null;
