import { homeFiles } from "./agent";
import { CommandError, Ctx, fail, tx } from "./context";
import { gitCommand, orcaCommand } from "./orca";
import { getProject } from "./projects";
import { isRulesPath } from "./rules";
import { sessionInput, toolCommand, TOOLS } from "./tools";
import type { ExecResult, Locale, ToolId, World } from "./types";

export interface ParsedCommand {
  argv: string[];
  redirect?: { file: string; append: boolean };
}

/** Shell-like tokenizer: quotes, escapes, `>`/`>>` redirection, `&&` and `;` chains. */
export function parse(input: string): ParsedCommand[] {
  const commands: ParsedCommand[] = [];
  let argv: string[] = [];
  let cur = "";
  let has = false;
  let quote: '"' | "'" | null = null;
  let redirect: ParsedCommand["redirect"];
  let pendingRedirect: { append: boolean } | null = null;

  const pushWord = () => {
    if (!has) return;
    if (pendingRedirect) {
      redirect = { file: cur, append: pendingRedirect.append };
      pendingRedirect = null;
    } else argv.push(cur);
    cur = "";
    has = false;
  };
  const pushCmd = () => {
    pushWord();
    if (pendingRedirect) throw new CommandError(["bash: syntax error near unexpected token `newline'"]);
    if (argv.length) commands.push({ argv, redirect });
    argv = [];
    redirect = undefined;
  };

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quote) {
      if (ch === quote) quote = null;
      else if (ch === "\\" && quote === '"' && (input[i + 1] === '"' || input[i + 1] === "\\")) cur += input[++i];
      else cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      has = true;
    } else if (ch === "\\" && i + 1 < input.length) {
      cur += input[++i];
      has = true;
    } else if (/\s/.test(ch)) pushWord();
    else if (ch === ">") {
      pushWord();
      const append = input[i + 1] === ">";
      if (append) i++;
      pendingRedirect = { append };
    } else if (ch === "&" && input[i + 1] === "&") {
      i++;
      pushCmd();
    } else if (ch === ";") pushCmd();
    else {
      cur += ch;
      has = true;
    }
  }
  if (quote)
    throw new CommandError(
      ["bash: unexpected EOF while looking for matching quote"],
      tx(`You opened a quote (${quote}) but didn't close it. Requests go inside a pair of quotes: claude -p "Explain this project"`, `Tu as ouvert un guillemet (${quote}) sans le fermer. Une demande va entre deux guillemets : claude -p "Explique ce projet"`),
    );
  pushCmd();
  return commands;
}

type Handler = (ctx: Ctx, args: string[]) => void;

/** "~", "~/x", "./x", "x/" → the keys used in the file map. */
export function normPath(p: string): string {
  let out = p.trim();
  if (out === "~") return "~";
  if (out.startsWith("~/")) out = "~/" + out.slice(2).replace(/^\/+/, "");
  out = out.replace(/^\.\//, "").replace(/\/+$/, "");
  if (out.startsWith("/home/") || out.startsWith("/root")) fail(`ls: cannot access '${p}'`, tx("The sandbox only has ~/project (where you are) and your home folder ~.", "Le bac à sable ne contient que ~/project (où tu es) et ton dossier personnel ~."));
  return out === "." ? "" : out;
}

function children(world: World, dir: string, all: boolean): string[] {
  const prefix = dir === "" ? "" : dir === "~" ? "~/" : dir + "/";
  const entries = new Set<string>();
  for (const p of Object.keys(world.files)) {
    if (dir === "" && p.startsWith("~/")) continue;
    if (!p.startsWith(prefix)) continue;
    const [first, ...rest] = p.slice(prefix.length).split("/");
    if (!all && first.startsWith(".")) continue;
    entries.add(rest.length ? first + "/" : first);
  }
  return [...entries].sort();
}

const wordsToText = (args: string[], interpret: boolean) => {
  const text = args.join(" ");
  return interpret ? text.replace(/\\n/g, "\n").replace(/\\t/g, "\t") : text;
};

const SHELL: Record<string, Handler> = {
  ls: (ctx, args) => {
    const all = args.some((a) => /^-\w*a/.test(a));
    const target = args.find((a) => !a.startsWith("-"));
    const dir = target === undefined ? "" : normPath(target);
    if (dir && dir !== "~" && ctx.world.files[dir] !== undefined) return ctx.out(dir);
    const list = children(ctx.world, dir, all);
    if (!list.length && dir) fail(`ls: cannot access '${target}': No such file or directory`, tx("Nothing there yet. Files appear as soon as you create one inside, e.g. touch .claude/skills/demo/SKILL.md", "Rien ici pour l'instant. Les dossiers apparaissent dès que tu crées un fichier dedans, ex. touch .claude/skills/demo/SKILL.md"));
    if (list.length) ctx.out((all && dir === "" ? [".git/", ...list] : list).join("  "));
  },
  tree: (ctx, args) => {
    const home = args[0] && normPath(args[0]) === "~";
    const paths = Object.keys(ctx.world.files)
      .filter((p) => (home ? p.startsWith("~/") : !p.startsWith("~/")))
      .map((p) => (home ? p.slice(2) : p))
      .sort();
    ctx.out(home ? "~" : ".", "info");
    const shown = new Set<string>();
    for (const p of paths) {
      const parts = p.split("/");
      // Print each folder once, before its first file, so files with the same name stay distinguishable.
      for (let d = 0; d < parts.length - 1; d++) {
        const dir = parts.slice(0, d + 1).join("/");
        if (shown.has(dir)) continue;
        shown.add(dir);
        ctx.out(`${"│  ".repeat(d)}├─ ${parts[d]}/`, "info");
      }
      ctx.out(`${"│  ".repeat(parts.length - 1)}├─ ${parts.at(-1)}`, isRulesPath(p) || p.endsWith("SKILL.md") ? "hint" : "out");
    }
  },
  cat: (ctx, args) => {
    if (!args.length) fail("cat: missing file operand");
    for (const raw of args) {
      const f = normPath(raw);
      const c = ctx.world.files[f];
      if (c === undefined) {
        if (Object.keys(ctx.world.files).some((p) => p.startsWith(f + "/"))) fail(`cat: ${raw}: Is a directory`);
        fail(`cat: ${raw}: No such file or directory`, tx("Check the name with ls (add -a to see hidden files that start with a dot).", "Vérifie le nom avec ls (ajoute -a pour voir les fichiers cachés qui commencent par un point)."));
      }
      if (c) ctx.out(c.replace(/\n$/, "").split("\n"));
    }
  },
  touch: (ctx, args) => {
    if (!args.length) fail("touch: missing file operand");
    const paths = args.map(normPath);
    for (const f of paths) if (!(f in ctx.world.files)) ctx.world.files[f] = "";
    ctx.emit({ type: "file-change", paths });
  },
  echo: (ctx, args) => ctx.out(wordsToText(args.filter((a) => a !== "-e" && a !== "-n"), args.includes("-e"))),
  printf: (ctx, args) => ctx.out(wordsToText(args[0] === "--" ? args.slice(1) : args, true).replace(/\n$/, "")),
  rm: (ctx, args) => {
    const targets = args.filter((a) => !a.startsWith("-")).map(normPath);
    if (!targets.length) fail("rm: missing operand");
    for (const f of targets) {
      const matches = Object.keys(ctx.world.files).filter((p) => p === f || p.startsWith(f + "/"));
      if (!matches.length) fail(`rm: cannot remove '${f}': No such file or directory`);
      if ((matches.length > 1 || matches[0] !== f) && !args.some((a) => /^-\w*r/.test(a))) fail(`rm: cannot remove '${f}': Is a directory`, tx("Add -r to remove a folder and everything in it.", "Ajoute -r pour supprimer un dossier et tout son contenu."));
      for (const m of matches) delete ctx.world.files[m];
    }
    ctx.emit({ type: "file-change", paths: targets });
  },
  mv: (ctx, args) => {
    const [a, b] = args.map(normPath);
    if (!a || !b) fail("mv: missing destination file operand");
    if (!(a in ctx.world.files)) fail(`mv: cannot stat '${a}': No such file or directory`);
    ctx.world.files[b] = ctx.world.files[a];
    delete ctx.world.files[a];
    ctx.emit({ type: "file-change", paths: [a, b] });
  },
  cp: (ctx, args) => {
    const [a, b] = args.filter((x) => !x.startsWith("-")).map(normPath);
    if (!a || !b) fail("cp: missing destination file operand");
    if (!(a in ctx.world.files)) fail(`cp: cannot stat '${a}': No such file or directory`);
    ctx.world.files[b] = ctx.world.files[a];
    ctx.emit({ type: "file-change", paths: [b] });
  },
  mkdir: (ctx) => ctx.out(tx("(Folders appear on their own when you create a file inside, e.g. touch .claude/skills/demo/SKILL.md)", "(Les dossiers apparaissent tout seuls quand tu crées un fichier dedans, ex. touch .claude/skills/demo/SKILL.md)"), "muted"),
  cd: (ctx) => ctx.out(tx("(This sandbox stays in ~/project. Agents' worktrees are shown by orca worktree show.)", "(Ce bac à sable reste dans ~/project. Les worktrees des agents s'affichent avec orca worktree show.)"), "muted"),
  pwd: (ctx) => ctx.out("~/project"),
  whoami: (ctx) => ctx.out(ctx.world.user.name.toLowerCase()),
  clear: (ctx) => {
    ctx.clear = true;
  },
  edit: (ctx, args) => {
    const f = args[0] && normPath(args[0]);
    if (!f) fail("usage: edit <file>");
    if (!(f in ctx.world.files)) {
      ctx.world.files[f] = "";
      ctx.emit({ type: "file-change", paths: [f] });
    }
    ctx.emit({ type: "open-file", path: f });
    ctx.out(tx(`Opened ${f} in the editor.`, `${f} est ouvert dans l'éditeur.`), "muted");
  },
  help: (ctx) => {
    ctx.out(
      [
        ctx.t(tx("IA Dev Learn terminal: everything runs in a safe sandbox.", "Terminal IA Dev Learn : tout tourne dans un bac à sable sans risque.")),
        "",
        "Agents:  claude · codex · gemini · antigravity · cursor-agent   (claude -p \"…\", codex exec \"…\")",
        "Orca:    orca worktree create|list|ps|show|set|rm · orca terminal list|send|read",
        "         orca orchestration run-create|task-create|worker-start|check · orca automations create|list|run",
        "Git:     git status | diff | restore <f> | commit -am | log | branch | merge <branch> | worktree list",
        "Files:   ls [-a]  tree  cat <f>  edit <f>  touch <f>  echo \"…\" > <f>  rm  mv  cp",
        "Project: pnpm test · pnpm install",
        "Other:   clear  help  <tool> --help",
      ],
      "muted",
    );
  },
};
SHELL.code = SHELL.edit;
SHELL.nano = SHELL.edit;
SHELL.vim = SHELL.edit;
SHELL.open = SHELL.edit;

function packageScript(ctx: Ctx, pm: string, args: string[]) {
  const project = getProject(ctx.world.project);
  const sub = args[0] === "run" ? args[1] : args[0];
  if (sub === "test" || sub === "t") {
    ctx.out(`> vitest run`, "muted");
    const failing = project.failing(ctx.world.files);
    const total = project.testCount(ctx.world.files);
    if (!failing.length) {
      ctx.out(`✓ ${total} tests passed`, "success");
      return;
    }
    for (const f of failing) {
      ctx.out(` FAIL  ${f.file} > ${f.name}`, "error");
      ctx.out(`${f.message}`, "error");
      ctx.out(` ❯ ${f.file}:${f.line}`, "muted");
    }
    ctx.out(` Tests  ${failing.length} failed | ${total - failing.length} passed (${total})`, "warning");
    // A red test is information, not a mistake by the learner: the command itself worked.
    ctx.explain = ctx.t(
      tx(
        "A failing test shows what the code should do and where it breaks. Copy the error into your prompt: it's the best context you can give an agent.",
        "Un test qui échoue montre ce que le code devrait faire et où ça casse. Copie l'erreur dans ton prompt : c'est le meilleur contexte à donner à un agent.",
      ),
    );
    return;
  }
  if (sub === "install" || sub === "i" || sub === undefined) {
    const lock = { npm: "package-lock.json", pnpm: "pnpm-lock.yaml", yarn: "yarn.lock", bun: "bun.lock" }[pm]!;
    if (pm !== project.packageManager) ctx.out(`${pm} warn: this project declares "packageManager": "${project.packageManager}"`, "warning");
    if (!(lock in ctx.world.files)) {
      ctx.world.files[lock] = `# ${lock}\n`;
      ctx.emit({ type: "file-change", paths: [lock] });
    }
    ctx.out(tx("Dependencies installed.", "Dépendances installées."), "success");
    return;
  }
  fail(`${pm}: missing script: ${sub}`);
}

const PROGRAMS = ["git", "orca", ...TOOLS, "cursor-agent", "npm", "pnpm", "yarn", "bun", ...Object.keys(SHELL)];

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

export function closest(word: string, options: string[]): string | null {
  let best: string | null = null;
  let score = Infinity;
  for (const o of options) {
    const d = levenshtein(word, o);
    if (d < score) {
      score = d;
      best = o;
    }
  }
  return score <= Math.max(2, Math.floor(word.length / 3)) ? best : null;
}

function runOne(ctx: Ctx, cmd: ParsedCommand): string | null {
  const [name, ...args] = cmd.argv;
  if ((name === "echo" || name === "printf") && cmd.redirect) {
    const interpret = name === "printf" || args.includes("-e");
    const words = name === "printf" && args[0] === "--" ? args.slice(1) : args.filter((a) => a !== "-e" && a !== "-n");
    const text = wordsToText(words, interpret) + (name === "printf" ? "" : "\n");
    const file = normPath(cmd.redirect.file);
    ctx.world.files[file] = cmd.redirect.append ? (ctx.world.files[file] ?? "") + text : text;
    ctx.emit({ type: "file-change", paths: [file] });
    if (isRulesPath(file)) ctx.emit({ type: "rules-write", path: file });
    return name;
  }
  if (cmd.redirect) fail(tx(`Redirecting the output of ${name} isn't simulated. Use echo "…" > file.`, `Rediriger la sortie de ${name} n'est pas simulé. Utilise echo "…" > fichier.`));
  if (name === "git") return gitCommand(ctx, args);
  if (name === "orca") return orcaCommand(ctx, args);
  if (name === "cursor-agent") return toolCommand(ctx, "cursor", args);
  if (name === "cursor") {
    ctx.out(tx("(cursor opens the Cursor editor. Its agent for the terminal is cursor-agent.)", "(cursor ouvre l'éditeur Cursor. Son agent pour le terminal, c'est cursor-agent.)"), "muted");
    return "cursor";
  }
  if (TOOLS.includes(name as ToolId)) return toolCommand(ctx, name as ToolId, args);
  if (name === "agy") return toolCommand(ctx, "antigravity", args);
  if (["npm", "pnpm", "yarn", "bun"].includes(name)) {
    packageScript(ctx, name, args);
    return `${name} ${args[0] ?? ""}`.trim();
  }
  const shell = SHELL[name];
  if (shell) {
    shell(ctx, args);
    return name;
  }
  const guess = closest(name, PROGRAMS);
  fail(
    [`bash: ${name}: command not found`],
    guess
      ? tx(`Did you mean ${guess}? (Watch out for typos, the terminal is picky!)`, `Tu voulais dire ${guess} ? (Attention aux fautes de frappe, le terminal est pointilleux !)`)
      : tx("Type help to see what works in this sandbox. To talk to an agent, start one first: claude", "Tape help pour voir ce qui marche ici. Pour parler à un agent, lance-le d'abord : claude"),
  );
}

export interface ExecOptions {
  locale?: Locale;
}

/**
 * Execute one line of input against a world. Pure: the input world is never
 * mutated. A failing command leaves the world untouched (atomic). While an
 * agent session is open, the line goes to the agent instead of the shell.
 */
export function execute(world: World, input: string, opts: ExecOptions = {}): ExecResult {
  const trimmed = input.trim();
  const ctx = new Ctx(structuredClone(world), opts.locale ?? "en");
  if (!trimmed) return ctx.result(null);
  const report = (e: CommandError) => {
    ctx.out(e.lines, "error");
    ctx.ok = false;
    if (e.explain) ctx.explain = ctx.t(e.explain);
  };

  const shellLine = (line: string): string | null => {
    let last: string | null = null;
    try {
      for (const cmd of parse(line)) {
        const snapshot = structuredClone(ctx.world);
        try {
          last = runOne(ctx, cmd);
        } catch (e) {
          if (!(e instanceof CommandError)) throw e;
          ctx.world = snapshot;
          report(e);
          return cmd.argv[0] ?? null;
        }
        if (!ctx.ok) break;
      }
    } catch (e) {
      if (!(e instanceof CommandError)) throw e;
      report(e);
    }
    return last;
  };

  if (ctx.world.session) {
    const snapshot = structuredClone(ctx.world);
    try {
      return ctx.result(sessionInput(ctx, trimmed, shellLine));
    } catch (e) {
      if (!(e instanceof CommandError)) throw e;
      ctx.world = snapshot;
      report(e);
      return ctx.result(trimmed.split(/\s+/)[0]);
    }
  }
  return ctx.result(shellLine(trimmed));
}

/** Run several commands in order (scenario setup and demos). Throws if one fails. */
export function runScript(world: World, commands: string[], locale: Locale = "en"): World {
  let w = world;
  for (const c of commands) {
    const r = execute(w, c, { locale });
    if (!r.ok) throw new Error(`Script failed at "${c}":\n${r.lines.map((l) => l.text).join("\n")}`);
    w = r.world;
  }
  return w;
}

export { homeFiles };
