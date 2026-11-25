import { homeFiles, runAgent } from "./agent";
import { Ctx, fail, tx } from "./context";
import { diffLines, hunks, splitLines } from "./diff";
import { objectId } from "./hash";
import { TOOL_NAMES } from "./rules";
import { takeFlag, TOOLS } from "./tools";
import type { FileMap, ToolId, Worktree, WorktreeStatus } from "./types";

const STATUSES: WorktreeStatus[] = ["todo", "in-progress", "in-review", "completed"];
export const projectFiles = (files: FileMap): FileMap => Object.fromEntries(Object.entries(files).filter(([p]) => !p.startsWith("~/")));
export const terminalHandle = (wt: Worktree) => `term-${wt.name}`;

function changes(from: FileMap, to: FileMap) {
  return [...new Set([...Object.keys(from), ...Object.keys(to)])].filter((p) => from[p] !== to[p]).sort();
}

function counts(a = "", b = "") {
  const d = diffLines(splitLines(a), splitLines(b));
  return { add: d.filter((x) => x.op === "add").length, del: d.filter((x) => x.op === "del").length };
}

function findWorktree(ctx: Ctx, sel: string | true | undefined): Worktree {
  if (typeof sel !== "string" || !sel) fail("error: --worktree <selector> is required", tx("Name the worktree, e.g. --worktree name:fix-total (or just fix-total).", "Nomme le worktree, ex. --worktree name:fix-total (ou juste fix-total)."));
  const name = sel.replace(/^(name|branch):/, "").replace(/^id:.*::.*\//, "").replace(/^path:.*\//, "");
  const wt = ctx.world.worktrees.find((w) => w.name === name || w.branch === name);
  if (!wt) fail(`error: worktree_not_found: ${sel}`, tx("No worktree has that name. orca worktree list shows them all.", "Aucun worktree ne porte ce nom. orca worktree list les affiche tous."));
  return wt;
}

function orcaHelp(ctx: Ctx) {
  ctx.out(
    [
      "Usage: orca <command> [options]   (simulated subset)",
      "",
      "Worktrees:",
      "  worktree create --name <n> [--agent claude|codex|gemini] [--prompt \"…\"]",
      "  worktree list | ps | show --worktree <n>",
      "  worktree set --worktree <n> [--comment \"…\"] [--workspace-status todo|in-progress|in-review|completed]",
      "  worktree rm --worktree <n> [--force]",
      "Terminals:",
      "  terminal list",
      "  terminal create --worktree <n> --command <agent>",
      "  terminal send --terminal <handle> --text \"…\" --enter",
      "  terminal read --terminal <handle>",
      "Other: status · repo list",
    ],
    "muted",
  );
}

function sendPrompt(ctx: Ctx, wt: Worktree, tool: ToolId, prompt: string) {
  // The agent works in the background in its own worktree: its output goes to that terminal.
  const sub = new Ctx(ctx.world, ctx.locale);
  sub.out(`${tool} › ${prompt}`, "muted");
  const run = runAgent(sub, tool, prompt, { where: wt.name });
  const log = ctx.world.worktrees.find((w) => w.name === wt.name);
  if (log) log.log = [...(log.log ?? []), ...sub.lines].slice(-80);
  ctx.events.push(...sub.events);
  return run;
}

export function orcaCommand(ctx: Ctx, argv: string[]): string {
  const args = [...argv];
  const json = !!takeFlag(args, ["--json"], false);
  void json;
  const [group, sub] = args;
  const rest = args.slice(2);
  if (!group || group === "--help" || group === "-h" || group === "help") {
    orcaHelp(ctx);
    return "orca";
  }
  if (group === "status") {
    ctx.out(["app: running", "runtime: reachable", `worktrees: ${ctx.world.worktrees.length}`]);
    return "orca status";
  }
  if (group === "repo") {
    ctx.out("tiny-shop   ~/project   base: main");
    return "orca repo";
  }

  if (group === "worktree") {
    switch (sub) {
      case "create": {
        const name = takeFlag(rest, ["--name"]);
        const agent = takeFlag(rest, ["--agent"]);
        const prompt = takeFlag(rest, ["--prompt"]);
        takeFlag(rest, ["--no-parent", "--activate"], false);
        const base = takeFlag(rest, ["--base-branch"]);
        if (typeof name !== "string" || !name) fail("error: --name <name> is required", tx("Give the worktree a short name for its task, e.g. --name fix-total.", "Donne au worktree un nom court pour sa tâche, ex. --name fix-total."));
        if (!/^[\w./-]+$/.test(name)) fail(`error: invalid worktree name '${name}'`, tx("Use letters, digits, - and / only.", "Utilise seulement des lettres, chiffres, - et /."));
        if (ctx.world.worktrees.some((w) => w.name === name)) fail(`error: worktree '${name}' already exists`, tx("Pick another name, or remove the old one with orca worktree rm.", "Choisis un autre nom, ou supprime l'ancien avec orca worktree rm."));
        if (agent !== undefined && !TOOLS.includes(agent as ToolId)) fail(`error: unknown agent '${agent}'. Known: claude, codex, gemini`);
        if (base !== undefined && base !== "main") fail(`error: base branch '${base}' not found`, tx("In this sandbox every worktree starts from main.", "Dans ce bac à sable, chaque worktree part de main."));
        const files = projectFiles(ctx.world.files);
        const wt: Worktree = { name, branch: name, agent: (agent as ToolId) ?? null, status: "todo", comment: "", base: files, files: { ...files }, runs: [], merged: false, log: [] };
        ctx.world.worktrees = [...ctx.world.worktrees, wt];
        ctx.out(`✓ Created worktree ${name}`, "success");
        ctx.out([`  path:   ~/orca/workspaces/tiny-shop/${name}`, `  branch: ${name} (from main)`], "muted");
        if (wt.agent) ctx.out(`  terminal: ${terminalHandle(wt)} (${TOOL_NAMES[wt.agent]})`, "muted");
        ctx.emit({ type: "worktree-create", name, agent: wt.agent });
        if (typeof prompt === "string" && prompt.trim()) {
          if (!wt.agent) fail("error: --prompt needs --agent", tx("A prompt goes to an agent: add --agent codex (or claude, gemini).", "Un prompt s'adresse à un agent : ajoute --agent codex (ou claude, gemini)."));
          const run = sendPrompt(ctx, ctx.world.worktrees.find((w) => w.name === name)!, wt.agent, prompt);
          ctx.out(`  prompt sent · accepted: true · ${ctx.t(tx("agent finished", "agent terminé"))}: ${run.outcome}${run.changed.length ? ` (${run.changed.length} files)` : ""}`, "muted");
          ctx.out(tx(`  Read its output: orca terminal read --terminal ${terminalHandle(wt)}`, `  Lire sa sortie : orca terminal read --terminal ${terminalHandle(wt)}`), "hint");
        }
        return "orca worktree create";
      }
      case "list": {
        ctx.out(`main   ~/project   (${ctx.t(tx("primary checkout", "checkout principal"))})`);
        for (const w of ctx.world.worktrees) ctx.out(`${w.name}   ~/orca/workspaces/tiny-shop/${w.name}   branch ${w.branch}${w.merged ? " · merged" : ""}`);
        return "orca worktree list";
      }
      case "ps": {
        if (!ctx.world.worktrees.length) {
          ctx.out(tx("No worktrees yet. Create one with orca worktree create --name <task> --agent codex.", "Aucun worktree. Crée-en un avec orca worktree create --name <tâche> --agent codex."), "muted");
          return "orca worktree ps";
        }
        ctx.out(`${"WORKTREE".padEnd(18)}${"AGENT".padEnd(13)}${"STATUS".padEnd(13)}${"FILES".padEnd(7)}COMMENT`, "muted");
        for (const w of ctx.world.worktrees)
          ctx.out(`${w.name.padEnd(18)}${(w.agent ? TOOL_NAMES[w.agent] : "—").padEnd(13)}${w.status.padEnd(13)}${String(changes(w.base, w.files).length).padEnd(7)}${w.comment}`);
        return "orca worktree ps";
      }
      case "show": {
        const wt = findWorktree(ctx, takeFlag(rest, ["--worktree"]) ?? rest[0]);
        ctx.out([`worktree: ${wt.name}`, `branch:   ${wt.branch}`, `agent:    ${wt.agent ? TOOL_NAMES[wt.agent] : "—"}`, `status:   ${wt.status}`, `comment:  ${wt.comment || "—"}`]);
        const ch = changes(wt.base, wt.files);
        if (!ch.length) ctx.out(tx("No changes yet.", "Aucun changement pour l'instant."), "muted");
        for (const p of ch) {
          const c = counts(wt.base[p], wt.files[p]);
          ctx.out(`  ${p}  +${c.add} −${c.del}`, "added");
        }
        return "orca worktree show";
      }
      case "set": {
        const wt = findWorktree(ctx, takeFlag(rest, ["--worktree"]));
        const comment = takeFlag(rest, ["--comment"]);
        const status = takeFlag(rest, ["--workspace-status"]);
        takeFlag(rest, ["--display-name"]);
        if (status !== undefined && !STATUSES.includes(status as WorktreeStatus)) fail(`error: unknown status '${status}'. Use: ${STATUSES.join(", ")}`);
        const target = ctx.world.worktrees.find((w) => w.name === wt.name)!;
        if (typeof comment === "string") target.comment = comment;
        if (status) target.status = status as WorktreeStatus;
        ctx.out(`✓ ${wt.name}: ${target.status}${target.comment ? ` · “${target.comment}”` : ""}`, "success");
        return "orca worktree set";
      }
      case "rm": {
        const wt = findWorktree(ctx, takeFlag(rest, ["--worktree"]) ?? rest[0]);
        const force = takeFlag(rest, ["--force"], false);
        if (!wt.merged && changes(wt.base, wt.files).length && !force)
          fail(`error: worktree '${wt.name}' has unmerged changes`, tx("Merge it first (git merge <branch>) or add --force to throw the changes away.", "Fusionne-le d'abord (git merge <branche>) ou ajoute --force pour jeter les changements."));
        ctx.world.worktrees = ctx.world.worktrees.filter((w) => w.name !== wt.name);
        ctx.out(`✓ Removed worktree ${wt.name}`, "success");
        return "orca worktree rm";
      }
    }
    fail(`orca worktree: unknown command '${sub ?? ""}'`, tx("Try: create, list, ps, show, set, rm.", "Essaie : create, list, ps, show, set, rm."));
  }

  if (group === "terminal") {
    switch (sub) {
      case "list": {
        const live = ctx.world.worktrees.filter((w) => w.agent);
        if (!live.length) ctx.out(tx("No agent terminals.", "Aucun terminal d'agent."), "muted");
        for (const w of live) ctx.out(`${terminalHandle(w).padEnd(22)}${w.name.padEnd(16)}${TOOL_NAMES[w.agent!]}`);
        return "orca terminal list";
      }
      case "create": {
        const wt = findWorktree(ctx, takeFlag(rest, ["--worktree"]));
        const command = takeFlag(rest, ["--command"]);
        const tool = typeof command === "string" ? (command.split(/\s+/)[0] as ToolId) : undefined;
        if (!tool || !TOOLS.includes(tool)) fail("error: --command must start an agent (claude, codex, gemini)");
        const target = ctx.world.worktrees.find((w) => w.name === wt.name)!;
        target.agent = tool;
        ctx.out(`✓ ${terminalHandle(target)} · ${TOOL_NAMES[tool]} · tui-idle`, "success");
        return "orca terminal create";
      }
      case "send": {
        const handle = takeFlag(rest, ["--terminal"]);
        const text = takeFlag(rest, ["--text"]);
        takeFlag(rest, ["--enter"], false);
        const wt = ctx.world.worktrees.find((w) => terminalHandle(w) === handle);
        if (!wt) fail(`error: terminal_not_found: ${handle ?? ""}`, tx("orca terminal list shows the handles (they look like term-<worktree>).", "orca terminal list affiche les identifiants (de la forme term-<worktree>)."));
        if (!wt.agent) fail(tx("error: no agent runs in that terminal", "erreur : aucun agent ne tourne dans ce terminal"));
        if (typeof text !== "string" || !text.trim()) fail('error: --text "…" is required');
        const run = sendPrompt(ctx, wt, wt.agent, text);
        ctx.out(`✓ sent · accepted: true · ${run.outcome}${run.changed.length ? ` · ${run.changed.length} files changed` : ""}`, "success");
        return "orca terminal send";
      }
      case "read": {
        const handle = takeFlag(rest, ["--terminal"]);
        const wt = ctx.world.worktrees.find((w) => terminalHandle(w) === handle);
        if (!wt) fail(`error: terminal_not_found: ${handle ?? ""}`);
        if (!wt.log?.length) ctx.out(tx("(no output yet)", "(pas encore de sortie)"), "muted");
        for (const l of wt.log ?? []) ctx.lines.push(l);
        return "orca terminal read";
      }
    }
    fail(`orca terminal: unknown command '${sub ?? ""}'`, tx("Try: list, create, send, read.", "Essaie : list, create, send, read."));
  }
  fail(`orca: unknown command '${group}'. See 'orca --help'.`, tx("This simulator models Orca's worktree and terminal commands.", "Ce simulateur modélise les commandes worktree et terminal d'Orca."));
}

// ───────────────────────────────────────────── A small Git, enough to commit and merge agents' work

export function gitCommand(ctx: Ctx, argv: string[]): string {
  const [sub, ...rest] = argv;
  const w = ctx.world;
  const files = projectFiles(w.files);
  const changed = changes(w.git.head, files);
  switch (sub) {
    case "init":
      ctx.out("Reinitialized existing Git repository in ~/project/.git/");
      return "git init";
    case "status": {
      ctx.out(`On branch ${w.git.branch}`);
      if (!changed.length) ctx.out("nothing to commit, working tree clean");
      else {
        ctx.out("Changes not committed yet:");
        for (const p of changed) ctx.out(`\t${w.git.head[p] === undefined ? "new file:" : files[p] === undefined ? "deleted:" : "modified:"}   ${p}`, w.git.head[p] === undefined ? "added" : files[p] === undefined ? "removed" : "warning");
      }
      return "git status";
    }
    case "diff": {
      const only = rest.filter((a) => !a.startsWith("-"));
      for (const p of changed.filter((p) => !only.length || only.includes(p))) {
        ctx.out(`diff --git a/${p} b/${p}`, "out");
        for (const h of hunks(w.git.head[p] ?? "", files[p] ?? "")) {
          ctx.out(h.header, "hunk");
          for (const l of h.lines) ctx.out(l.op === "add" ? `+${l.line}` : l.op === "del" ? `-${l.line}` : ` ${l.line}`, l.op === "add" ? "added" : l.op === "del" ? "removed" : "out");
        }
      }
      return "git diff";
    }
    case "add":
      return "git add";
    case "commit": {
      const mi = rest.findIndex((a) => a === "-m" || a === "-am");
      const message = mi >= 0 ? rest[mi + 1] : undefined;
      if (!message) fail("error: switch `m' requires a value", tx('Add a message: git commit -am "Describe the change"', 'Ajoute un message : git commit -am "Décris le changement"'));
      if (!changed.length) fail("nothing to commit, working tree clean");
      const id = objectId(message + w.seq + JSON.stringify(files)).slice(0, 7);
      w.git = { ...w.git, head: files, log: [...w.git.log, { id, message }] };
      w.seq += 1;
      ctx.out(`[${w.git.branch} ${id}] ${message}`, "commit");
      ctx.out(` ${changed.length} file${changed.length > 1 ? "s" : ""} changed`, "muted");
      ctx.emit({ type: "commit" });
      return "git commit";
    }
    case "log": {
      for (const c of [...w.git.log].reverse()) ctx.out(`${c.id} ${c.message}`, "commit");
      return "git log";
    }
    case "branch": {
      ctx.out(`* ${w.git.branch}`, "success");
      for (const wt of w.worktrees) ctx.out(`+ ${wt.branch}`, "info");
      return "git branch";
    }
    case "worktree": {
      if (rest[0] === "list" || !rest[0]) {
        ctx.out(`~/project                          [main]`);
        for (const wt of w.worktrees) ctx.out(`~/orca/workspaces/tiny-shop/${wt.name.padEnd(12)} [${wt.branch}]`);
        return "git worktree list";
      }
      fail(tx("Here, create worktrees with Orca: orca worktree create --name <task>", "Ici, crée les worktrees avec Orca : orca worktree create --name <tâche>"), tx("Orca runs git worktree add for you and also tracks the agent, its terminal and its status.", "Orca lance git worktree add pour toi et suit aussi l'agent, son terminal et son statut."));
    }
    case "merge": {
      const branch = rest.find((a) => !a.startsWith("-"));
      const wt = w.worktrees.find((x) => x.branch === branch);
      if (!branch || !wt) fail(`merge: ${branch ?? ""} - not something we can merge`, tx("Merge the branch of a worktree: git branch lists them.", "Fusionne la branche d'un worktree : git branch les liste."));
      if (wt.merged) {
        ctx.out("Already up to date.");
        return "git merge";
      }
      const theirs = changes(wt.base, wt.files);
      const conflicts = theirs.filter((p) => files[p] !== wt.base[p] && files[p] !== wt.files[p]);
      if (conflicts.length)
        fail(
          [...conflicts.map((p) => `CONFLICT (content): Merge conflict in ${p}`), "Automatic merge failed; the merge was cancelled (simulator)."],
          tx(
            "Two agents changed the same file in different ways. Give parallel agents tasks that touch different files, or merge one, then ask the other agent to rebase on main.",
            "Deux agents ont modifié le même fichier différemment. Donne aux agents en parallèle des tâches sur des fichiers différents, ou fusionne l'un puis demande à l'autre agent de repartir de main.",
          ),
        );
      const next = { ...files };
      for (const p of theirs) {
        if (wt.files[p] === undefined) delete next[p];
        else next[p] = wt.files[p];
      }
      w.files = { ...homeFiles(w.files), ...next };
      const id = objectId("merge" + branch + w.seq).slice(0, 7);
      w.git = { ...w.git, head: { ...w.git.head, ...Object.fromEntries(theirs.map((p) => [p, next[p]])) }, log: [...w.git.log, { id, message: `Merge branch '${branch}'` }] };
      for (const p of theirs) if (next[p] === undefined) delete w.git.head[p];
      w.seq += 1;
      const target = w.worktrees.find((x) => x.name === wt.name)!;
      target.merged = true;
      target.status = "completed";
      ctx.out(`Merge made by the 'ort' strategy.`);
      for (const p of theirs) {
        const c = counts(wt.base[p], wt.files[p]);
        ctx.out(` ${p} | +${c.add} −${c.del}`, "added");
      }
      ctx.emit({ type: "merge", branch });
      ctx.emit({ type: "file-change", paths: theirs });
      return "git merge";
    }
  }
  fail(tx(`git ${sub ?? ""}: not simulated here (try status, diff, commit, log, branch, merge, worktree list).`, `git ${sub ?? ""} : pas simulé ici (essaie status, diff, commit, log, branch, merge, worktree list).`), tx("This course is about agents; Git has its own course in Gitverse.", "Ce cours parle d'agents ; Git a son propre cours dans Gitverse."));
}
