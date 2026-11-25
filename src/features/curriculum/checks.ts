import { codexSettings, directivesIn, lintRules, listSkills, listWorkflows, loadRules, type AgentRun, type ToolId, type World } from "@/engine";

/** Agent runs made since the lesson step's starting world. */
export const newRuns = (w: World, start: World): AgentRun[] => {
  const last = Math.max(0, ...start.runs.map((x) => x.id));
  return w.runs.filter((r) => r.id > last);
};

export const someRun = (w: World, start: World, pred: (r: AgentRun) => boolean) => newRuns(w, start).some(pred);
export const lastRunOf = (w: World, start: World) => newRuns(w, start).at(-1) ?? null;

export const inSession = (w: World, tool?: ToolId) => !!w.session && (!tool || w.session.tool === tool);
export const fileExists = (w: World, path: string) => w.files[path] !== undefined;
export const fileHas = (w: World, path: string, re: RegExp) => re.test(w.files[path] ?? "");
export const ranTests = (r: AgentRun, pm?: string) => r.commands.some((c) => (pm ? c === `${pm} test` : c.endsWith(" test")));

export const rulesLoaded = (w: World, tool: ToolId) => loadRules(w.files, tool);
export const directivesFor = (w: World, tool: ToolId) => directivesIn(rulesLoaded(w, tool).map((r) => r.content).join("\n"));
export const lint = (w: World, path: string) => lintRules(w.files[path] ?? "");

export const validSkills = (w: World, tool: ToolId) => listSkills(w.files, tool).filter((s) => !s.problems.length);
export const workflows = (w: World) => listWorkflows(w.files, "antigravity");
export const codex = (w: World) => codexSettings(w.files);

export const worktree = (w: World, name: string) => w.worktrees.find((x) => x.name === name);
