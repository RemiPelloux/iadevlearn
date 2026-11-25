import { tx, type Ctx, type Txt } from "./context";
import { diffLines, splitLines } from "./diff";
import { objectId } from "./hash";
import { getProject } from "./projects";
import { analyzePrompt, isQuestion, promptGrade, referencedFiles, tokens, wordCount } from "./prompt";
import { directivesIn, DIRECTIVES, loadRules, packageManager, TOOL_NAMES } from "./rules";
import { findInjection, gitIgnored, isSecretPath } from "./security";
import { claudeSettings, deniedBy, hooksFor } from "./settings";
import { listSkills, listWorkflows, matchSkill, stepsOf, type Skill } from "./skills";
import { listSubagents, matchSubagent } from "./subagents";
import type { AgentRun, ContextItem, FileMap, PromptCheck, ToolId, World } from "./types";

/** Approximate size of each tool's own instructions (system prompt + built-in tools). */
export const SYSTEM_TOKENS: Record<ToolId, number> = { claude: 3200, codex: 2600, gemini: 2800, antigravity: 3000, cursor: 2900 };
export const MCP_TOKENS = 900;

/** What one MCP server's tool definitions cost, by what it is (big servers expose dozens of tools). */
export function mcpTokens(m: { name: string; command: string }): number {
  const s = `${m.name} ${m.command}`.toLowerCase();
  if (/github|gitlab|jira|atlassian|linear/.test(s)) return 8200;
  if (/playwright|browser|puppeteer|chrome/.test(s)) return 5400;
  if (/notion|slack|google|drive|gmail/.test(s)) return 4600;
  if (/postgres|sqlite|mysql|db|supabase/.test(s)) return 1800;
  if (/docs|context7|documentation/.test(s)) return 1200;
  return MCP_TOKENS;
}

export const isDocsServer = (m: { name: string; command: string }) => /docs|context7|documentation/i.test(`${m.name} ${m.command}`);
export const isGithubServer = (m: { name: string; command: string }) => /github|\bgh\b/i.test(`${m.name} ${m.command}`);

const isHome = (p: string) => p.startsWith("~/");
const isImage = (p: string) => /\.(png|jpe?g|gif|webp)$/i.test(p);
export const IMAGE_TOKENS = 1600;

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
  const agents = listSubagents(view, tool);
  if (agents.length) items.push({ kind: "skill-index", label: `agents: ${agents.map((a) => a.name).join(", ")}`, tokens: agents.reduce((n, a) => n + tokens(a.name + a.description) + 12, 0) });
  for (const m of world.mcp.filter((m) => m.tool === tool)) items.push({ kind: "mcp", label: `MCP ${m.name}`, tokens: mcpTokens(m) });
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
  cursor: { bullet: "⬢", sub: "  └ ", read: (p) => `Read ${p}`, edit: (p) => `Edited ${p}`, create: (p) => `Created ${p}`, bash: (c) => `Ran ${c}`, skill: (n) => `Skill ${n}`, search: (n) => `Searched codebase · ${n} files` },
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
  /** No approval prompts at all (claude --dangerously-skip-permissions, gemini --yolo, cursor-agent --force). */
  yolo?: boolean;
}

/** Short messages that continue the conversation ("now add tests", "actually use 15%"). */
const FOLLOW_UP = /^(now|then|also|and|but|actually|instead|no\b|nope|wait|ok(ay)?\b|great|thanks|please also|maintenant|puis|aussi|et\b|mais|en fait|plut[ôo]t|non\b|attends|super|merci)/i;

/** What a short Conventional Commits summary for a task looks like. */
const COMMIT_SUMMARY: Record<string, { type: string; text: string }> = {
  "fix-total": { type: "fix", text: "count item quantities in total()" },
  "make-tests-pass": { type: "fix", text: "count item quantities in total()" },
  discount: { type: "feat", text: "add applyDiscount()" },
  euro: { type: "feat", text: "format prices in euros" },
  readme: { type: "docs", text: "add a getting started section" },
  changelog: { type: "docs", text: "update the changelog" },
  tests: { type: "test", text: "add price tests" },
  checkout: { type: "feat", text: "add checkout()" },
};

/** Skill files next to SKILL.md that its body points at: reference docs load on demand, scripts run without being read. */
function skillResources(skill: Skill, files: FileMap) {
  const dir = skill.path.slice(0, -"SKILL.md".length);
  const docs: string[] = [];
  const scripts: string[] = [];
  for (const p of Object.keys(files).sort()) {
    if (!p.startsWith(dir) || p === skill.path) continue;
    const rel = p.slice(dir.length);
    if (!skill.body.includes(rel)) continue;
    if (/\.(sh|py|mjs|js|ts)$/.test(rel)) scripts.push(p);
    else docs.push(p);
  }
  return { docs, scripts };
}

/** What a script prints: the strings it echoes (enough to simulate small helper scripts). */
function scriptOutput(text: string): string[] {
  const out = [...text.matchAll(/^\s*(?:echo|printf)\s+(?:-e\s+)?["']([^"']*)["']/gm)].map((m) => m[1].replace(/\\n$/, ""));
  return out.length ? out : ["(done)"];
}

const runner = (p: string) => (p.endsWith(".py") ? "python3" : /\.(mjs|js)$/.test(p) ? "node" : p.endsWith(".ts") ? "npx tsx" : "bash");

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
  const session = where === "main" ? world.session : null;
  const settings = tool === "claude" ? claudeSettings(view) : null;
  const codex = tool === "codex" ? codexSettings(view, { sandbox: opts.sandbox ?? world.session?.sandbox, approval: opts.approval ?? world.session?.approval }) : null;
  const yolo = !!opts.yolo || !!session?.yolo || (codex?.sandbox === "danger-full-access" && codex.approval === "never");

  let prompt = rawPrompt.trim();
  const workflow = (() => {
    const m = tool === "antigravity" ? prompt.match(/^\/([\w-]+)\s*([\s\S]*)$/) : null;
    const wf = m ? listWorkflows(view, tool).find((w) => w.name === m[1]) : undefined;
    if (wf && m) prompt = `${wf.body}\n${m[2]}`.trim();
    return wf ?? null;
  })();

  // ── Conversation: in a session, a short follow-up builds on what you said before.
  const history = session?.history ?? [];
  const ownTask = pickTask(project.tasks, prompt);
  const prevText = history.slice(-2).join("\n");
  const prevTask = prevText ? pickTask(project.tasks, prevText) : null;
  const sameTask = !ownTask || ownTask.id === prevTask?.id;
  const commitAsk = /\b(commit|commite[rz]?)\b/i.test(prompt) && !ownTask;
  const followUp = !commitAsk && !!history.length && !workflow && !!prevTask && (sameTask ? FOLLOW_UP.test(prompt) || wordCount(prompt) <= 12 : FOLLOW_UP.test(prompt) && wordCount(prompt) <= 12);
  if (followUp) prompt = `${prevText}\n${prompt}`;

  const report = analyzePrompt(rawPrompt, view);
  const effective = workflow || followUp ? analyzePrompt(prompt, view) : report;

  // ── MCP: some requests need the outside world (docs, issues).
  const servers = world.mcp.filter((m) => m.tool === tool);
  const mcpUsed: string[] = [];
  const issueNo = prompt.match(/\bissue\s*#?(\d+)\b/i)?.[1];
  let issueText: string | null = null;
  if (issueNo) {
    const gh = servers.find(isGithubServer);
    if (gh) {
      issueText = view[`issues/${issueNo}.md`] ?? `# Issue #${issueNo}: the cart total ignores quantity\n\nWith 3 mugs at 12.00, the total shows 12.00 instead of 36.00.`;
      mcpUsed.push(gh.name);
    }
  }

  // ── What the agent reads: files you pointed at, images, or a search when it has to find the code itself.
  const images = effective.files.filter(isImage);
  const imageText = images.map((p) => view[p] ?? "").join("\n");
  // An issue says what the work is: read it before the rest of the prompt ("Fix issue #42. Add a test…").
  const taskText = `${issueText ?? ""}\n${prompt}\n${imageText}`;
  const task = pickTask(project.tasks, taskText);
  const codeFiles = Object.keys(view).filter((p) => !isHome(p) && /^(src|tests)\//.test(p));
  let read = [...new Set(effective.files)].filter((p) => !isHome(p) && !isImage(p));
  let searched = false;
  if (task && !read.length && task.id !== "checkout") {
    read = codeFiles;
    searched = true;
  }
  if (task?.id === "checkout" && !read.includes("src/cart.ts") && view["src/cart.ts"] !== undefined) read.push("src/cart.ts");

  const rules = loadRules(view, tool, { touched: read, prompt });
  const rulesText = rules.map((r) => r.content).join("\n");
  const skills = listSkills(view, tool).filter((s) => !s.problems.some((p) => p.id === "no-frontmatter" || p.id === "no-description"));
  const skill = workflow ? null : matchSkill(prompt, skills);
  const resources = skill ? skillResources(skill, view) : { docs: [], scripts: [] };
  const guide = workflow?.body ?? (skill ? [skill.body, ...resources.docs.map((p) => view[p] ?? "")].join("\n") : null);
  const directives = directivesIn(`${rulesText}\n${guide ?? ""}`);
  const pm = packageManager(directives);
  const subagent = tool === "claude" ? matchSubagent(rawPrompt, listSubagents(view, tool)) : null;

  // What's been said: by the prompt, the conversation, the rules or the skill.
  const said: Record<PromptCheck, boolean> = { ...effective.checks };
  if (images.length) said.context = said.specific = true;
  if (issueText) said.context = said.specific = said.goal = true;
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
  const context = startupContext(world, tool, where).filter((c) => c.kind !== "rules");
  for (const r of rules) context.splice(1, 0, { kind: "rules", label: r.importedBy ? `${r.path} (@ ${r.importedBy})` : r.scope ? `${r.path} (${r.scope})` : r.path, tokens: tokens(r.content), source: r.path });
  if (followUp) context.push({ kind: "conversation", label: "earlier messages", tokens: tokens(prevText) + 40 });
  if (workflow) context.push({ kind: "workflow", label: workflow.path, tokens: tokens(workflow.body), source: workflow.path });
  if (skill) context.push({ kind: "skill", label: skill.path, tokens: tokens(skill.body), source: skill.path });
  for (const p of resources.docs) context.push({ kind: "skill", label: `${p} (on demand)`, tokens: tokens(view[p] ?? ""), source: p });
  for (const p of images) context.push({ kind: "image", label: p, tokens: IMAGE_TOKENS, source: p });
  if (issueText) context.push({ kind: "mcp", label: `issue #${issueNo} (via MCP)`, tokens: tokens(issueText) });

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
    hooks: [],
    subagent: null,
    mcpUsed,
    secrets: [],
    injection: null,
    followUp,
  };

  if (followUp) say(tx("  ↳ continuing from your earlier message", "  ↳ dans la suite de ton message précédent"), "muted");
  if (workflow) say(`${S.bullet} Workflow /${workflow.name}`, "info");
  if (skill) say(`${S.bullet} ${S.skill(skill.name)}`, "info");
  for (const p of resources.docs) {
    say(`${S.bullet} ${S.read(p)}`, "tool");
    say(`${S.sub}${ctx.t(tx("loaded only now, because the skill needs it", "chargé seulement maintenant, parce que le skill en a besoin"))}`, "muted");
  }
  for (const p of rules.filter((r) => r.scope)) say(`${S.sub}${ctx.t(tx(`rules: ${p.path} (${p.scope === "folder" ? "applies to this folder" : p.scope === "globs" ? "matches the files" : p.scope === "requested" ? "relevant to the request" : "mentioned with @"})`, `règles : ${p.path} (${p.scope === "folder" ? "s'applique à ce dossier" : p.scope === "globs" ? "correspond aux fichiers" : p.scope === "requested" ? "utile pour la demande" : "cité avec @"})`))}`, "muted");
  for (const p of images) say(`${S.bullet} ${S.read(p)}  ${ctx.t(tx("(image)", "(image)"))}`, "tool");
  if (issueText) {
    say(`${S.bullet} ${mcpUsed[0]} · get_issue (MCP)(#${issueNo})`, "tool");
    say(`${S.sub}${issueText.split("\n")[0].replace(/^#\s*/, "")}`, "muted");
  }

  // Subagent: the files are read in its own context window; only its summary comes back.
  let subTokens = 0;
  if (subagent) {
    subTokens = 1200 + tokens(subagent.body) + read.reduce((n, p) => n + tokens(view[p] ?? ""), 0);
    say(`${S.bullet} Task(${subagent.name})`, "tool");
    say(`${S.sub}${ctx.t(tx(`${read.length || codeFiles.length} files read in its own context · ${(subTokens / 1000).toFixed(1)}k tokens`, `${read.length || codeFiles.length} fichiers lus dans son propre contexte · ${(subTokens / 1000).toFixed(1)}k tokens`))}`, "muted");
    run.subagent = { name: subagent.name, tokens: subTokens };
  } else if (searched) say(`${S.bullet} ${S.search(read.length)}`, "tool");
  else for (const p of read) say(`${S.bullet} ${S.read(p)}`, "tool");

  if (!subagent) for (const p of read) context.push({ kind: "file", label: searched ? `${p} (search)` : p, tokens: tokens(view[p] ?? ""), source: p });

  // ── Secrets: a request about keys or payments makes the agent look at .env, unless a rule forbids it.
  const envPath = Object.keys(view).find((p) => !isHome(p) && isSecretPath(p) && !p.includes("/"));
  let envSecret: string | null = null;
  if (envPath && (task?.id === "checkout" || /\.env\b|\b(api[ -]?key|secret|cl[ée] d'api|credentials?)\b/i.test(prompt) || effective.files.includes(envPath))) {
    const rule = settings ? deniedBy(settings, "Read", envPath) : null;
    say(`${S.bullet} ${S.read(envPath)}`, "tool");
    if (rule) {
      say(`${S.sub}${ctx.t(tx(`✗ blocked by your permission rule ${rule}`, `✗ bloqué par ta règle de permission ${rule}`))}`, "error");
      if (view[".env.example"] !== undefined) {
        say(`${S.bullet} ${S.read(".env.example")}`, "tool");
        context.push({ kind: "file", label: ".env.example", tokens: tokens(view[".env.example"]), source: ".env.example" });
      }
    } else {
      envSecret = view[envPath];
      context.push({ kind: "file", label: `${envPath} ⚠`, tokens: tokens(envSecret), source: envPath });
      run.secrets = [envPath];
      say(`${S.sub}${ctx.t(tx("⚠ secrets are now in the context: they were sent to the model provider", "⚠ des secrets sont maintenant dans le contexte : ils ont été envoyés au fournisseur du modèle"))}`, "warning");
    }
  }

  // ── Prompt injection: text in a file (or an issue) that tries to give the agent orders.
  for (const [path, text] of [...read.map((p) => [p, view[p] ?? ""] as const), ...(issueText ? [[`issue #${issueNo}`, issueText] as const] : [])]) {
    const inj = findInjection(text);
    if (!inj) continue;
    const rule = settings ? deniedBy(settings, "Bash", inj.command) : null;
    const sandboxed = codex && codex.sandbox !== "danger-full-access";
    say(`${S.sub}${ctx.t(tx(`⚠ ${path} contains instructions aimed at AI agents: “${inj.line.slice(0, 80)}”`, `⚠ ${path} contient des instructions destinées aux agents IA : « ${inj.line.slice(0, 80)} »`))}`, "warning");
    if (rule) {
      say(`${S.bullet} ${S.bash(inj.command)}`, "tool");
      say(`${S.sub}${ctx.t(tx(`✗ blocked by your permission rule ${rule}`, `✗ bloqué par ta règle de permission ${rule}`))}`, "error");
      run.injection = { path, command: inj.command, outcome: "blocked" };
    } else if (yolo && !sandboxed) {
      say(`${S.bullet} ${S.bash(inj.command)}`, "tool");
      say(`${S.sub}${ctx.t(tx("ran without asking: nothing was set up to stop it", "lancé sans rien demander : rien n'était prévu pour l'en empêcher"))}`, "error");
      say(`${S.sub}${ctx.t(tx("(simulated) the script read ~/.ssh and your .env, then sent them to evil.example", "(simulé) le script a lu ~/.ssh et ton .env, puis les a envoyés à evil.example"))}`, "error");
      run.injection = { path, command: inj.command, outcome: "ran" };
      run.commands.push(inj.command);
    } else {
      say(
        sandboxed
          ? tx(`I won't run \`${inj.command}\`: it comes from a file, not from you, and my sandbox has no network anyway.`, `Je ne lance pas \`${inj.command}\` : ça vient d'un fichier, pas de toi, et ma sandbox n'a pas de réseau de toute façon.`)
          : tx(`I won't run \`${inj.command}\`: it comes from a file, not from you. Tell me if you really want it.`, `Je ne lance pas \`${inj.command}\` : ça vient d'un fichier, pas de toi. Dis-le-moi si tu le veux vraiment.`),
        "agent",
      );
      run.injection = { path, command: inj.command, outcome: "refused" };
    }
    break;
  }

  const finish = () => {
    // Subagent: the main conversation only gets its summary.
    if (subagent) context.push({ kind: "subagent", label: `${subagent.name} summary`, tokens: 180 });
    context.push({ kind: "prompt", label: rawPrompt.length > 48 ? rawPrompt.slice(0, 46) + "…" : rawPrompt, tokens: tokens(rawPrompt) });
    run.tokens = context.reduce((n, c) => n + c.tokens, 0);
  };

  // ── Asking the agent to commit: it reads the diff and writes the message.
  const wantsCommit = /\b(commit|commite[rz]?)\b/i.test(rawPrompt) && !/\b(don'?t|do not|never|ne pas|sans)\b[^.\n]{0,15}\bcommit/i.test(rawPrompt) && where === "main" && !task;
  if (wantsCommit) {
    const files = Object.fromEntries(Object.entries(world.files).filter(([p]) => !isHome(p)));
    const changed = [...new Set([...Object.keys(world.git.head), ...Object.keys(files)])].filter((p) => world.git.head[p] !== files[p] && !(world.git.head[p] === undefined && gitIgnored(files, p))).sort();
    say(`${S.bullet} ${S.bash("git status && git diff")}`, "tool");
    if (!changed.length) {
      say(tx("Nothing to commit: the working tree is clean.", "Rien à commiter : tout est déjà commité."), "agent");
      run.phases.push("report");
    } else {
      // Describe the work that is still uncommitted, not something already in git.
      const last = [...world.runs].reverse().find((r) => r.where === "main" && r.task && COMMIT_SUMMARY[r.task] && r.changed.some((p) => changed.includes(p)));
      const docsOnly = changed.every((p) => p.endsWith(".md"));
      const sum = last ? COMMIT_SUMMARY[last.task!] : docsOnly ? { type: "docs", text: `update ${changed.map((p) => p.split("/").pop()).join(", ")}` } : { type: "chore", text: "update files" };
      const conventional = directives.includes("conventional") || /conventional/i.test(rawPrompt);
      const describe = conventional || said.specific || /\b(message|describ|d[ée]cri)/i.test(rawPrompt);
      const message = conventional ? `${sum.type}: ${sum.text}` : describe ? sum.text[0].toUpperCase() + sum.text.slice(1) : "Update files";
      if (world.session?.plan && !opts.approved) {
        // Plan mode is read-only: propose the commit, run it after the learner's OK.
        run.outcome = "plan";
        run.phases.push("plan");
        say(tx("Here's my plan (nothing changed yet):", "Voici mon plan (rien n'a encore changé) :"), "agent");
        say(`  1. git add ${changed.join(" ")}`, "agent");
        say(`  2. git commit -m "${message}"`, "agent");
        say(tx("Approve? Type yes to let me do it, or tell me what to change.", "On y va ? Tape oui pour me laisser faire, ou dis-moi quoi changer."), "hint");
        world.session.pending = { prompt: rawPrompt };
        ctx.emit({ type: "plan" });
        finish();
        return record(ctx, world, run, where, report.score, rules.map((r) => r.path), say);
      }
      const next = { ...world.git.head };
      for (const p of changed) {
        if (files[p] === undefined) delete next[p];
        else next[p] = files[p];
      }
      const id = objectId(message + world.seq + changed.join()).slice(0, 7);
      world.git = { ...world.git, head: next, log: [...world.git.log, { id, message }] };
      run.commands.push(`git commit -m "${message}"`);
      run.phases.push("act", "report");
      say(`${S.bullet} ${S.bash(`git commit -m "${message}"`)}`, "tool");
      say(`${S.sub}[${world.git.branch} ${id}] ${changed.length} file${changed.length > 1 ? "s" : ""}`, "commit");
      const secret = changed.find((p) => isSecretPath(p));
      if (secret) say(`${S.sub}${ctx.t(tx(`⚠ ${secret} was committed: the secret is now in your git history`, `⚠ ${secret} a été commité : le secret est maintenant dans ton historique git`))}`, "warning");
      if (!describe) {
        run.assumed = ["specific"];
        say(tx("Assumed (details): you didn't say how to write the message, so it's a generic one.", "Supposé (précision) : tu n'as pas dit comment écrire le message, alors il est générique."), "warning");
      }
      run.outcome = describe ? "done" : "partial";
      ctx.emit({ type: "commit" });
    }
    finish();
    return record(ctx, world, run, where, report.score, rules.map((r) => r.path), say);
  }

  if (!task) {
    const external = /\b(latest|newest|current|most recent|derni[èe]re?|actuelle?|r[ée]cente?)\b[^.\n]{0,25}\b(version|release|docs?|documentation|api)\b|\bwhat'?s new in\b|\bnouveaut[ée]s de\b/i.test(prompt);
    if (issueNo && !issueText) {
      run.outcome = "clarify";
      say(
        tx(
          `I can't open GitHub issue #${issueNo}: no GitHub MCP server is connected. Paste the issue here, or connect one (e.g. ${tool} mcp add github -- npx github-mcp).`,
          `Je ne peux pas ouvrir l'issue GitHub #${issueNo} : aucun serveur MCP GitHub n'est connecté. Colle l'issue ici, ou connectes-en un (ex. ${tool} mcp add github -- npx github-mcp).`,
        ),
        "agent",
      );
    } else if (external) {
      const lib = prompt.match(/\b(vitest|react|next(?:\.js)?|typescript|pnpm|node|zod|vite|tailwind)\b/i)?.[1] ?? "vitest";
      const docs = servers.find(isDocsServer);
      run.outcome = "answer";
      if (docs) {
        mcpUsed.push(docs.name);
        say(`${S.bullet} ${docs.name} · get_library_docs (MCP)(${lib.toLowerCase()})`, "tool");
        say(`${S.sub}${ctx.t(tx("fetched the current docs and changelog", "documentation et changelog à jour récupérés"))}`, "muted");
        context.push({ kind: "mcp", label: `${lib} docs (via MCP)`, tokens: 2400 });
        say(tx(`I read the up-to-date ${lib} docs through the ${docs.name} MCP server, so this answer comes from today's documentation, not from my memory.`, `J'ai lu la doc à jour de ${lib} via le serveur MCP ${docs.name} : cette réponse vient de la documentation du jour, pas de ma mémoire.`), "agent");
      } else
        say(
          tx(
            `I can't check that from here: I have no tool to read the web, and what I learned about ${lib} may be out of date. Connect a docs MCP server (e.g. ${tool} mcp add docs -- npx docs-mcp) and ask again.`,
            `Je ne peux pas le vérifier d'ici : je n'ai aucun outil pour lire le web, et ce que je sais de ${lib} est peut-être dépassé. Connecte un serveur MCP de docs (ex. ${tool} mcp add docs -- npx docs-mcp) et redemande.`,
          ),
          "agent",
        );
    } else if (/\b(rules?|r[èe]gles?|instructions?|memory|m[ée]moire|skills?)\b/i.test(prompt) && isQuestion(prompt)) {
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
          "In this practice project I can work on: discounts, the cart total, euro prices, tests, the README, the changelog, a checkout, reviews and commits. Try asking for one of those!",
          "Dans ce projet d'entraînement, je sais travailler sur : les remises, le total du panier, les prix en euros, les tests, le README, le changelog, un paiement, des relectures et des commits. Demande-moi l'un d'eux !",
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
    world.session.pending = { prompt: followUp ? prompt : rawPrompt };
    ctx.emit({ type: "plan" });
  } else if (codex && codex.sandbox === "read-only" && task.id !== "review") {
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
    const merged = new Set(world.worktrees.filter((w) => w.merged).map((w) => w.name));
    const recent = world.runs.filter((r) => (r.where === where || merged.has(r.where)) && r.changed.length && r.task !== "changelog").map((r) => r.prompt);
    const before = viewFiles(world, where);
    const result = task.run(before, { directives, locale: ctx.locale, guide, missing, verify: said.verify, history: recent, envSecret });
    run.outcome = missing.length ? "partial" : "done";
    run.assumed = missing;
    run.phases.push("act");
    const after = result.files;
    const paths = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((p) => !isHome(p) && before[p] !== after[p]).sort();
    run.changed = paths;
    run.undo = Object.fromEntries(paths.map((p) => [p, before[p] ?? null]));
    for (const p of paths) {
      const d = diffLines(splitLines(before[p] ?? ""), splitLines(after[p] ?? ""));
      const add = d.filter((x) => x.op === "add").length;
      const del = d.filter((x) => x.op === "del").length;
      say(`${S.bullet} ${before[p] === undefined ? S.create(p) : S.edit(p)}`, "tool");
      say(`${S.sub}+${add} −${del}`, "added");
    }
    let files = after;
    const testLine = (cmd: string) => {
      const failing = project.failing(files);
      run.failing = failing.length;
      if (!failing.length) say(`${S.sub}✓ ${project.testCount(files)} tests passed`, "success");
      else {
        say(`${S.sub}✗ ${failing.length} failed · ${project.testCount(files) - failing.length} passed`, "error");
        for (const f of failing) say(`${S.sub}  ${f.file} > ${f.name}: ${f.message}`, "error");
      }
      if (!run.commands.includes(cmd)) run.commands.push(cmd);
    };
    if (said.verify) {
      run.phases.push("verify");
      const lock = { npm: "package-lock.json", pnpm: "pnpm-lock.yaml", yarn: "yarn.lock", bun: "bun.lock" }[pm];
      if (codex?.approval === "untrusted") say(`${S.sub}${ctx.t(tx(`approval needed to run ${pm} test → approved`, `approbation demandée pour lancer ${pm} test → approuvé`))}`, "warning");
      if (pm !== project.packageManager && !(lock in files)) {
        run.commands.push(`${pm} install`);
        say(`${S.bullet} ${S.bash(`${pm} install`)}`, "tool");
        say(`${S.sub}${pm} warn: package.json says "packageManager": "${project.packageManager}", but created ${lock} anyway`, "warning");
        files = { ...files, [lock]: `# ${lock} created by ${pm} install\n` };
        run.changed.push(lock);
        run.undo[lock] = null;
      }
      say(`${S.bullet} ${S.bash(`${pm} test`)}`, "tool");
      testLine(`${pm} test`);
    }
    // Hooks: commands Claude Code runs on its own after every edit, whatever the prompt said.
    if (settings && paths.length)
      for (const h of hooksFor(settings, "PostToolUse", before[paths[0]] === undefined ? "Write" : "Edit")) {
        say(`${S.sub}PostToolUse hook · ${h.command}`, "info");
        run.hooks!.push(h.command);
        if (/\btest\b/.test(h.command)) {
          if (!run.phases.includes("verify")) run.phases.push("verify");
          testLine(h.command);
        } else {
          if (!run.commands.includes(h.command)) run.commands.push(h.command);
          say(`${S.sub}  ✓ ${/prettier|format|biome|eslint --fix/.test(h.command) ? ctx.t(tx(`formatted ${paths.length} file${paths.length > 1 ? "s" : ""}`, `${paths.length} fichier${paths.length > 1 ? "s" : ""} formaté${paths.length > 1 ? "s" : ""}`)) : "exit 0"}`, "success");
        }
      }
    writeProject(world, where, files);
    run.phases.push("report");
    say(result.summary, "agent");
    for (const m of missing) say(`${ctx.t(tx("Assumed", "Supposé"))} (${ctx.t(CHECK_NAMES[m])}): ${ctx.t(task.assume[m] ?? tx("(nothing said)", "(rien de dit)"))}`, "warning");

    run.followed = directives.filter((d) => {
      if (d.startsWith("pm:")) return said.verify;
      if (d === "tests") return fromRules.includes("verify") || said.verify;
      if (d === "lang:fr") return run.changed.some((p) => p.endsWith(".ts"));
      return d === "conventional" || d === "small";
    });
    if (directives.includes("conventional")) {
      const type = task.id === "fix-total" ? "fix" : task.id === "changelog" || task.id === "readme" ? "docs" : task.id === "tests" ? "test" : "feat";
      say(`${ctx.t(tx("Suggested commit", "Commit suggéré"))}: ${type}: ${prompt.split("\n").at(-1)!.replace(/^[$/][\w-]+\s*/, "").toLowerCase().slice(0, 48)}`, "commit");
    }
    if (paths.length) ctx.emit({ type: "file-change", paths: run.changed });
  }

  // Scripts bundled with a skill run without their code entering the context: only their output does.
  for (const p of resources.scripts) {
    const cmd = `${runner(p)} ${p}`;
    say(`${S.bullet} ${S.bash(cmd)}`, "tool");
    const out = scriptOutput(view[p] ?? "");
    for (const line of out) say(`${S.sub}${line}`, "success");
    run.commands.push(cmd);
    context.push({ kind: "skill", label: `${p} (output only)`, tokens: tokens(out.join("\n")) + 10, source: p });
  }
  if (settings) for (const h of hooksFor(settings, "Stop")) {
    say(`${S.sub}Stop hook · ${h.command}`, "info");
    run.hooks!.push(h.command);
  }

  finish();
  return record(ctx, world, run, where, report.score, rules.map((r) => r.path), say);
}

/** Store the run, print the footer and tell the UI. */
function record(ctx: Ctx, world: World, run: AgentRun, where: string, score: number, rulePaths: string[], say: (t: string | Txt, k?: Parameters<Ctx["out"]>[1]) => void): AgentRun {
  if (run.skill) ctx.emit({ type: "skill-used", name: run.skill });
  const followedLabels = DIRECTIVES.filter((d) => run.followed.includes(d.id)).map((d) => ctx.t(d.label));
  if (followedLabels.length) say(`${ctx.t(tx("Rules followed", "Règles suivies"))}: ${followedLabels.join(" · ")}`, "muted");
  const grade = promptGrade(score);
  const gradeTxt = { vague: tx("vague", "vague"), okay: tx("okay", "correct"), sharp: tx("sharp", "précis") }[grade];
  say(
    `── ${ctx.t(tx("context", "contexte"))} ≈ ${(run.tokens / 1000).toFixed(1)}k tokens · prompt ${score}/6 (${ctx.t(gradeTxt)})${rulePaths.length ? ` · ${ctx.t(tx("rules", "règles"))}: ${rulePaths.join(", ")}` : ""}`,
    "muted",
  );

  world.seq += 1;
  world.runs = [...world.runs, run].slice(-40);
  if (where === "main" && world.session && world.session.tool === run.tool) world.session.history = [...(world.session.history ?? []), run.prompt].slice(-6);
  if (where !== "main") {
    const wt = world.worktrees.find((w) => w.name === where);
    if (wt) {
      wt.runs.push(run.id);
      if (run.changed.length && wt.status === "todo") wt.status = "in-progress";
    }
  }
  ctx.emit({ type: "prompt", tool: run.tool, run: run.id, score, outcome: run.outcome });
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
