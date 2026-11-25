import { fail, tx, type Ctx } from "./context";
import { addWorktree, sendPrompt, terminalHandle } from "./orca";
import { TOOL_NAMES } from "./rules";
import { takeFlag, TOOLS } from "./tools";
import type { Automation, Orchestration, OrchTask, TaskStatus, ToolId } from "./types";

const STATUSES: TaskStatus[] = ["pending", "ready", "dispatched", "completed", "failed", "blocked"];

const orch = (ctx: Ctx): Orchestration => (ctx.world.orchestration ??= { run: null, tasks: [], inbox: [] });

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24) || "task";

function requireAgent(agent: string | true | undefined): ToolId {
  if (typeof agent !== "string" || !agent) fail("error: --agent <agent> is required", tx("Pick who does the work: --agent claude (or codex, gemini, cursor).", "Choisis qui fait le travail : --agent claude (ou codex, gemini, cursor)."));
  if (!TOOLS.includes(agent as ToolId)) fail(`error: unknown agent '${agent}'. Known: ${TOOLS.join(", ")}`);
  return agent as ToolId;
}

/** A task becomes ready when everything it depends on is completed. */
function refreshReady(o: Orchestration) {
  for (const t of o.tasks) if (t.status === "pending" && t.deps.every((d) => o.tasks.find((x) => x.id === d)?.status === "completed")) t.status = "ready";
}

function taskLine(t: OrchTask) {
  return `${t.id.padEnd(8)}${t.status.padEnd(12)}${t.title.slice(0, 34).padEnd(36)}${t.deps.length ? `deps: ${t.deps.join(", ")}` : ""}${t.worktree ? `  → ${t.worktree}` : ""}`;
}

/** `orca orchestration …`: a coordinator splits the work into tasks, starts a worker per task and reads their reports. */
export function orchestrationCommand(ctx: Ctx, sub: string | undefined, args: string[]): string {
  takeFlag(args, ["--json"], false);
  takeFlag(args, ["--from", "--run", "--retry-request"]);
  const o = orch(ctx);
  const needRun = () => {
    if (!o.run)
      fail(
        "error: no orchestration Run is bound to this terminal",
        tx('Start one first: orca orchestration run-create --objective "What the whole team should achieve"', 'Crées-en un d\'abord : orca orchestration run-create --objective "Ce que toute l\'équipe doit accomplir"'),
      );
    return o.run;
  };

  switch (sub) {
    case "run-create": {
      const objective = takeFlag(args, ["--objective"]);
      if (typeof objective !== "string" || !objective.trim()) fail("error: --objective <text> is required", tx('Say what the run should achieve, e.g. --objective "Euro prices and the total fix"', 'Dis ce que le run doit accomplir, ex. --objective "Prix en euros et correction du total"'));
      if (o.run) fail(tx(`A Run is already bound: ${o.run.id} (${o.run.objective}).`, `Un Run est déjà lié : ${o.run.id} (${o.run.objective}).`));
      o.run = { id: "run_1", objective: objective.trim() };
      ctx.out(`✓ Created Run ${o.run.id} and bound it to this terminal (coordinator)`, "success");
      ctx.out(`  objective: ${o.run.objective}`, "muted");
      ctx.out(tx('  Next: split the work with orca orchestration task-create --spec "…"', '  Ensuite : découpe le travail avec orca orchestration task-create --spec "…"'), "hint");
      return "orca orchestration run-create";
    }
    case "run-show":
    case "run-current": {
      const run = needRun();
      ctx.out([`run:       ${run.id}`, `objective: ${run.objective}`, `tasks:     ${o.tasks.length} (${o.tasks.filter((t) => t.status === "completed").length} completed)`, `inbox:     ${o.inbox.filter((m) => !m.read).length} unread`]);
      return `orca orchestration ${sub}`;
    }
    case "run-list": {
      if (!o.run) ctx.out(tx("No Runs yet.", "Aucun Run pour l'instant."), "muted");
      else ctx.out(`${o.run.id}  ${o.run.objective}`);
      return "orca orchestration run-list";
    }
    case "task-create": {
      needRun();
      const spec = takeFlag(args, ["--spec"]);
      const title = takeFlag(args, ["--task-title", "--display-name"]);
      const depsRaw = takeFlag(args, ["--deps"]);
      if (typeof spec !== "string" || !spec.trim()) fail("error: --spec <text> is required", tx("The spec is the worker's whole brief: write it like a good prompt (file, rule, tests).", "La spec est tout le brief du worker : écris-la comme un bon prompt (fichier, règle, tests)."));
      let deps: string[] = [];
      if (typeof depsRaw === "string") {
        try {
          const parsed = JSON.parse(depsRaw);
          if (!Array.isArray(parsed) || !parsed.every((d) => typeof d === "string")) throw new Error();
          deps = parsed;
        } catch {
          fail(`error: --deps must be a JSON array, e.g. '["task_1"]'`, tx(`Write the ids as a JSON list in single quotes: --deps '["task_1","task_2"]'`, `Écris les ids comme une liste JSON entre apostrophes : --deps '["task_1","task_2"]'`));
        }
        for (const d of deps) if (!o.tasks.some((t) => t.id === d)) fail(`error: unknown dependency '${d}'`, tx("Dependencies must be tasks you already created: orca orchestration task-list.", "Les dépendances doivent être des tâches déjà créées : orca orchestration task-list."));
      }
      const id = `task_${o.tasks.length + 1}`;
      const t: OrchTask = { id, title: typeof title === "string" && title ? title : spec.split(/[.:\n]/)[0].slice(0, 50), spec: spec.trim(), deps, status: "pending" };
      o.tasks.push(t);
      refreshReady(o);
      ctx.out(`✓ ${id} created · ${t.status}${deps.length ? ` (waits for ${deps.join(", ")})` : ""}`, "success");
      return "orca orchestration task-create";
    }
    case "task-list": {
      const ready = !!takeFlag(args, ["--ready"], false);
      const status = takeFlag(args, ["--status"]);
      takeFlag(args, ["--brief"], false);
      const list = o.tasks.filter((t) => (!ready || t.status === "ready") && (typeof status !== "string" || t.status === status));
      if (!list.length) ctx.out(tx("No tasks.", "Aucune tâche."), "muted");
      else ctx.out(`${"ID".padEnd(8)}${"STATUS".padEnd(12)}${"TITLE".padEnd(36)}`, "muted");
      for (const t of list) ctx.out(taskLine(t), t.status === "completed" ? "success" : t.status === "failed" ? "error" : t.status === "ready" ? "info" : "out");
      return "orca orchestration task-list";
    }
    case "task-update": {
      const id = takeFlag(args, ["--id"]);
      const status = takeFlag(args, ["--status"]);
      takeFlag(args, ["--result"]);
      const t = o.tasks.find((x) => x.id === id);
      if (!t) fail(`error: task_not_found: ${id ?? ""}`);
      if (!STATUSES.includes(status as TaskStatus)) fail(`error: --status must be one of ${STATUSES.join(", ")}`);
      t.status = status as TaskStatus;
      refreshReady(o);
      ctx.out(`✓ ${t.id} → ${t.status}`, "success");
      return "orca orchestration task-update";
    }
    case "worker-start":
    case "dispatch": {
      const run = needRun();
      let taskId = takeFlag(args, ["--task"]);
      const spec = takeFlag(args, ["--spec"]);
      const agent = requireAgent(takeFlag(args, ["--agent", "--to"]));
      const name = takeFlag(args, ["--name"]);
      takeFlag(args, ["--worktree", "--model", "--effort", "--repo", "--base-branch", "--comment", "--setup", "--timeout-ms", "--display-name", "--task-title"]);
      void run;
      if (typeof spec === "string" && spec.trim() && typeof taskId !== "string") {
        const id = `task_${o.tasks.length + 1}`;
        o.tasks.push({ id, title: spec.split(/[.:\n]/)[0].slice(0, 50), spec: spec.trim(), deps: [], status: "ready" });
        taskId = id;
      }
      const t = o.tasks.find((x) => x.id === taskId);
      if (!t) fail(`error: task_not_found: ${typeof taskId === "string" ? taskId : ""}`, tx("Give a task id from orca orchestration task-list, or --spec \"…\" for a one-off task.", "Donne un id de tâche de orca orchestration task-list, ou --spec \"…\" pour une tâche ponctuelle."));
      if (t.status === "pending") {
        const waiting = t.deps.filter((d) => o.tasks.find((x) => x.id === d)?.status !== "completed");
        fail(`error: ${t.id} is not ready: waiting for ${waiting.join(", ")}`, tx("A task starts only when the tasks it depends on are completed. Finish (and merge) those first.", "Une tâche ne démarre que quand celles dont elle dépend sont terminées. Termine (et fusionne) celles-là d'abord."));
      }
      if (t.status === "dispatched" || t.status === "completed") fail(tx(`${t.id} is already ${t.status}.`, `${t.id} est déjà ${t.status}.`));
      const wtName = typeof name === "string" && name ? name : slug(t.title);
      if (ctx.world.worktrees.some((w) => w.name === wtName)) fail(`error: worktree '${wtName}' already exists`, tx("Pass --name <another-name>.", "Passe --name <autre-nom>."));
      const wt = addWorktree(ctx, wtName, agent);
      t.status = "dispatched";
      t.worktree = wtName;
      t.agent = agent;
      ctx.out(`✓ ${t.id} dispatched to ${TOOL_NAMES[agent]} in worktree ${wtName} (${terminalHandle(wt)})`, "success");
      const result = sendPrompt(ctx, wt, agent, t.spec);
      const ok = result.outcome === "done" || result.outcome === "partial";
      t.status = ok ? "completed" : "failed";
      t.result = `${result.outcome}${result.changed.length ? `, ${result.changed.length} files: ${result.changed.join(", ")}` : ""}`;
      o.inbox.push({
        id: `msg_${o.inbox.length + 1}`,
        from: `worker:${wtName}`,
        subject: `${t.id} ${t.status}`,
        body: ok
          ? `${result.outcome === "partial" ? "Done, with guesses: " + result.assumed.join(", ") + ". " : "Done. "}${result.changed.length ? `Changed ${result.changed.join(", ")}.` : "No files changed."}${result.failing ? ` ${result.failing} tests failing.` : ""}`
          : `Could not finish (${result.outcome}). The spec probably needs more detail.`,
        read: false,
      });
      refreshReady(o);
      ctx.out(tx(`  The worker reports to your inbox when it's done: orca orchestration check`, `  Le worker écrit dans ta boîte quand il a fini : orca orchestration check`), "hint");
      return "orca orchestration worker-start";
    }
    case "check":
    case "inbox": {
      const all = !!takeFlag(args, ["--all"], false);
      const peek = !!takeFlag(args, ["--peek", "--unread"], false);
      takeFlag(args, ["--wait", "--format"], false);
      takeFlag(args, ["--timeout-ms", "--terminal", "--types", "--ack"]);
      const list = o.inbox.filter((m) => all || !m.read);
      if (!list.length) ctx.out(tx("No new messages.", "Aucun nouveau message."), "muted");
      for (const m of list) {
        ctx.out(`✉ ${m.from} · ${m.subject}`, m.subject.endsWith("failed") ? "error" : "info");
        ctx.out(`  ${m.body}`);
        if (!peek && sub === "check") m.read = true;
      }
      const ready = o.tasks.filter((t) => t.status === "ready");
      if (ready.length) ctx.out(tx(`Ready to start: ${ready.map((t) => t.id).join(", ")}`, `Prêtes à démarrer : ${ready.map((t) => t.id).join(", ")}`), "hint");
      return "orca orchestration check";
    }
    case "send": {
      const subject = takeFlag(args, ["--subject"]);
      const body = takeFlag(args, ["--body"]);
      takeFlag(args, ["--to", "--type", "--priority", "--thread-id", "--payload", "--task-id", "--dispatch-id", "--outcome", "--files-modified", "--report-path", "--phase"]);
      if (typeof subject !== "string" || !subject) fail("error: --subject <text> is required");
      o.inbox.push({ id: `msg_${o.inbox.length + 1}`, from: "you", subject, body: typeof body === "string" ? body : "", read: true });
      ctx.out(`✓ sent · ${subject}`, "success");
      return "orca orchestration send";
    }
  }
  fail(tx(`orca orchestration ${sub ?? ""}: not simulated here.`, `orca orchestration ${sub ?? ""} : pas simulé ici.`), tx("Try: run-create, task-create, task-list, worker-start, check, task-update, send.", "Essaie : run-create, task-create, task-list, worker-start, check, task-update, send."));
}

const TRIGGERS = ["hourly", "daily", "weekdays", "weekly"];
const isCron = (s: string) => /^(\S+\s+){4}\S+$/.test(s.trim()) || /^RRULE:/i.test(s);

function describeSchedule(a: Pick<Automation, "trigger" | "time" | "day">) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  if (a.trigger === "hourly") return "every hour";
  if (a.trigger === "daily") return `every day at ${a.time}`;
  if (a.trigger === "weekdays") return `Monday to Friday at ${a.time}`;
  if (a.trigger === "weekly") return `every ${days[a.day ?? 1]} at ${a.time}`;
  return `cron "${a.trigger}"`;
}

/** `orca automations …`: a prompt that an agent runs on a schedule, in a fresh worktree each time. */
export function automationsCommand(ctx: Ctx, sub: string | undefined, args: string[]): string {
  takeFlag(args, ["--json"], false);
  const list = (ctx.world.automations ??= []);
  const find = () => {
    const id = takeFlag(args, ["--id"]) ?? args.find((a) => !a.startsWith("-"));
    const a = list.find((x) => x.id === id || x.name === id);
    if (!a) fail(`error: automation_not_found: ${typeof id === "string" ? id : ""}`, tx("orca automations list shows the ids.", "orca automations list affiche les ids."));
    return a;
  };
  const schedule = (trigger: string | true | undefined, time: string | true | undefined, day: string | true | undefined, current?: Automation) => {
    const tr = typeof trigger === "string" ? trigger : current?.trigger;
    if (!tr) fail("error: --trigger is required", tx("When should it run? --trigger daily --time 09:00, weekdays, weekly, hourly, or a cron like \"0 9 * * 1-5\".", "Quand doit-elle tourner ? --trigger daily --time 09:00, weekdays, weekly, hourly, ou un cron comme \"0 9 * * 1-5\"."));
    if (!TRIGGERS.includes(tr) && !isCron(tr)) fail(`error: invalid --trigger '${tr}'`, tx("Use hourly, daily, weekdays, weekly, a 5-field cron (\"0 9 * * 1-5\") or an RRULE.", "Utilise hourly, daily, weekdays, weekly, un cron à 5 champs (\"0 9 * * 1-5\") ou une RRULE."));
    const tm = typeof time === "string" ? time : current?.time;
    const needsTime = ["daily", "weekdays", "weekly"].includes(tr);
    if (needsTime && !tm) fail(`error: --time <HH:MM> is required with --trigger ${tr}`, tx("Add the hour, e.g. --time 09:00.", "Ajoute l'heure, ex. --time 09:00."));
    if (tm && !/^([01]\d|2[0-3]):[0-5]\d$/.test(tm)) fail(`error: invalid --time '${tm}' (use HH:MM, 24h)`);
    if (typeof day === "string" && tr !== "weekly") fail("error: --day is only valid with --trigger weekly");
    const d = typeof day === "string" ? Number(day) : current?.day;
    if (d !== undefined && !(Number.isInteger(d) && d >= 0 && d <= 6)) fail("error: --day must be 0-6 (Sunday is 0)");
    return { trigger: tr, time: needsTime ? tm : undefined, day: tr === "weekly" ? (d ?? 1) : undefined };
  };

  switch (sub) {
    case "create": {
      const name = takeFlag(args, ["--name"]);
      const prompt = takeFlag(args, ["--prompt"]);
      const provider = takeFlag(args, ["--provider"]);
      const repo = takeFlag(args, ["--repo"]);
      const workspace = takeFlag(args, ["--workspace"]);
      const disabled = !!takeFlag(args, ["--disabled"], false);
      takeFlag(args, ["--reuse-session", "--fresh-session"], false);
      takeFlag(args, ["--workspace-mode"]);
      const sch = schedule(takeFlag(args, ["--trigger"]), takeFlag(args, ["--time"]), takeFlag(args, ["--day"]));
      if (typeof name !== "string" || !name) fail("error: --name <name> is required");
      if (typeof prompt !== "string" || !prompt.trim()) fail("error: --prompt <text> is required", tx("The prompt runs with nobody watching: make it complete (file, rule, tests, when it's done).", "Le prompt tourne sans personne pour répondre : rends-le complet (fichier, règle, tests, critère de fin)."));
      const agent = requireAgent(provider);
      if (repo !== undefined && workspace !== undefined) fail("error: --repo and --workspace are mutually exclusive");
      if (repo === undefined && workspace === undefined) fail("error: --repo <selector> or --workspace <selector> is required", tx("Say where it runs: --repo path:~/project (a fresh worktree each run).", "Dis où elle tourne : --repo path:~/project (un worktree neuf à chaque exécution)."));
      if (list.some((a) => a.name === name)) fail(`error: an automation named '${name}' already exists`);
      const a: Automation = { id: `auto_${list.length + 1}`, name, ...sch, prompt: prompt.trim(), provider: agent, enabled: !disabled, runs: [] };
      list.push(a);
      ctx.out(`✓ Created automation ${a.id} · ${a.name}`, "success");
      ctx.out(`  ${describeSchedule(a)} · ${TOOL_NAMES[agent]} · ${a.enabled ? "enabled" : "disabled (test it with orca automations run " + a.id + ")"}`, "muted");
      return "orca automations create";
    }
    case "list": {
      if (!list.length) ctx.out(tx("No automations yet.", "Aucune automatisation pour l'instant."), "muted");
      for (const a of list) ctx.out(`${a.id.padEnd(8)}${(a.enabled ? "on " : "off").padEnd(5)}${a.name.padEnd(22)}${describeSchedule(a).padEnd(30)}${TOOL_NAMES[a.provider]}`, a.enabled ? "out" : "muted");
      return "orca automations list";
    }
    case "show": {
      const a = find();
      ctx.out([`id:       ${a.id}`, `name:     ${a.name}`, `schedule: ${describeSchedule(a)}`, `agent:    ${TOOL_NAMES[a.provider]}`, `status:   ${a.enabled ? "enabled" : "disabled"}`, `prompt:   ${a.prompt}`, `runs:     ${a.runs.length}`]);
      return "orca automations show";
    }
    case "edit": {
      const a = find();
      const trigger = takeFlag(args, ["--trigger"]);
      const time = takeFlag(args, ["--time"]);
      const day = takeFlag(args, ["--day"]);
      const prompt = takeFlag(args, ["--prompt"]);
      const enable = takeFlag(args, ["--enabled", "--enable"], false);
      const disable = takeFlag(args, ["--disabled", "--disable"], false);
      takeFlag(args, ["--reuse-session", "--fresh-session"], false);
      if (trigger !== undefined || time !== undefined || day !== undefined) Object.assign(a, schedule(trigger, time, day, a));
      if (typeof prompt === "string" && prompt.trim()) a.prompt = prompt.trim();
      if (enable) a.enabled = true;
      if (disable) a.enabled = false;
      ctx.out(`✓ ${a.id} · ${describeSchedule(a)} · ${a.enabled ? "enabled" : "disabled"}`, "success");
      return "orca automations edit";
    }
    case "run": {
      const a = find();
      const n = a.runs.length + 1;
      const wtName = `${slug(a.name)}-${n}`;
      const wt = addWorktree(ctx, wtName, a.provider);
      ctx.out(tx(`▶ Running ${a.id} now (as if it were ${describeSchedule(a)}), in worktree ${wtName}`, `▶ Exécution de ${a.id} maintenant (comme si c'était ${describeSchedule(a)}), dans le worktree ${wtName}`), "info");
      const result = sendPrompt(ctx, wt, a.provider, a.prompt);
      a.runs.push({ id: n, worktree: wtName, outcome: result.outcome, run: result.id });
      ctx.out(`  ${TOOL_NAMES[a.provider]}: ${result.outcome}${result.changed.length ? ` · ${result.changed.join(", ")}` : ""}`, result.outcome === "done" ? "success" : "warning");
      if (result.outcome !== "done")
        ctx.out(
          tx("  Nobody was there to answer its questions, so it guessed or stopped. Unattended prompts must say everything: file, rule, tests, done criteria.", "  Personne n'était là pour répondre à ses questions, alors il a deviné ou s'est arrêté. Un prompt sans surveillance doit tout dire : fichier, règle, tests, critère de fin."),
          "hint",
        );
      ctx.out(tx(`  Read its output: orca terminal read --terminal ${terminalHandle(wt)}`, `  Lire sa sortie : orca terminal read --terminal ${terminalHandle(wt)}`), "muted");
      return "orca automations run";
    }
    case "runs": {
      const a = find();
      if (!a.runs.length) ctx.out(tx("No runs yet. Try one now: orca automations run " + a.id, "Aucune exécution. Essaie maintenant : orca automations run " + a.id), "muted");
      for (const r of a.runs) ctx.out(`#${r.id}  ${r.worktree.padEnd(24)}${r.outcome}`, r.outcome === "done" ? "success" : "warning");
      return "orca automations runs";
    }
    case "remove":
    case "rm": {
      const a = find();
      ctx.world.automations = list.filter((x) => x.id !== a.id);
      ctx.out(`✓ Removed ${a.id}`, "success");
      return "orca automations remove";
    }
  }
  fail(tx(`orca automations ${sub ?? ""}: not simulated here.`, `orca automations ${sub ?? ""} : pas simulé ici.`), tx("Try: create, list, show, run, runs, edit, remove.", "Essaie : create, list, show, run, runs, edit, remove."));
}
