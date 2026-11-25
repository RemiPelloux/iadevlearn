import { listSkills, listWorkflows, TOOLS, type World } from "@/engine";
import type { Locale } from "@/i18n";

export interface Completion {
  /** Full replacement for the input line. */
  value: string;
  label: string;
  detail?: string;
}

const PROGRAMS = ["claude", "codex", "gemini", "antigravity", "agy", "cursor-agent", "orca", "git", "ls", "tree", "cat", "edit", "echo", "printf", "cp", "mv", "rm", "touch", "pnpm", "clear", "help"];

const SUB: Record<string, string[]> = {
  claude: ["-p", "--permission-mode", "--dangerously-skip-permissions", "mcp", "--help"],
  "cursor-agent": ["-p", "--force", "--help"],
  codex: ["exec", "--sandbox", "--ask-for-approval", "--full-auto", "mcp", "--help"],
  gemini: ["-p", "--yolo", "mcp", "--help"],
  orca: ["worktree", "terminal", "orchestration", "automations", "status", "--help"],
  "orca orchestration": ["run-create", "task-create", "task-list", "worker-start", "check", "task-update", "send"],
  "orca orchestration run-create": ["--objective"],
  "orca orchestration task-create": ["--spec", "--task-title", "--deps"],
  "orca orchestration worker-start": ["--task", "--agent", "--name"],
  "orca automations": ["create", "list", "show", "run", "runs", "edit", "remove"],
  "orca automations create": ["--name", "--trigger", "--time", "--prompt", "--provider", "--repo", "--disabled"],
  "--trigger": ["daily", "weekdays", "weekly", "hourly"],
  "--provider": ["claude", "codex", "gemini", "cursor"],
  "orca worktree": ["create", "list", "ps", "show", "set", "rm"],
  "orca terminal": ["list", "send", "read", "create"],
  "orca worktree create": ["--name", "--agent", "--prompt"],
  "orca worktree set": ["--worktree", "--comment", "--workspace-status"],
  "orca terminal send": ["--terminal", "--text", "--enter"],
  "orca terminal read": ["--terminal"],
  git: ["status", "diff", "restore", "commit", "log", "branch", "merge", "worktree"],
  "codex --sandbox": ["read-only", "workspace-write", "danger-full-access"],
  "codex exec --sandbox": ["read-only", "workspace-write", "danger-full-access"],
  "codex --ask-for-approval": ["untrusted", "on-request", "never"],
  "claude --permission-mode": ["plan", "default"],
  "--agent": ["claude", "codex", "gemini", "cursor"],
  "--workspace-status": ["todo", "in-progress", "in-review", "completed"],
  pnpm: ["test", "install"],
};

const SLASH: Record<string, string[]> = {
  claude: ["/init", "/memory", "/context", "/skills", "/agents", "/hooks", "/permissions", "/plan", "/mcp", "/rewind", "/clear", "/compact", "/help", "/exit"],
  codex: ["/init", "/status", "/skills", "/mcp", "/compact", "/help", "/exit"],
  gemini: ["/init", "/memory", "/memory add", "/mcp", "/clear", "/compact", "/help", "/exit"],
  antigravity: ["/plan", "/skills", "/memory", "/help", "/exit"],
  cursor: ["/clear", "/help", "/exit"],
};

/** Context-aware completions for the current input line. */
export function complete(input: string, world: World, locale: Locale = "en"): Completion[] {
  void locale;
  const endsWithSpace = /\s$/.test(input);
  const parts = input.trimStart().split(/\s+/);
  const current = endsWithSpace ? "" : (parts.pop() ?? "");
  const before = parts;
  const prefix = input.slice(0, input.length - current.length);
  const mk = (word: string, detail?: string, trailing = " "): Completion => ({ value: prefix + word + trailing, label: word, detail });
  const filter = (list: string[], detail?: string) => list.filter((c) => c.startsWith(current) && c !== current).map((c) => mk(c, detail));

  // Inside an agent session: slash commands, skills and workflows.
  if (world.session) {
    if (before.length || !current.startsWith("/") && !current.startsWith("$")) {
      const at = current.startsWith("@") ? current.slice(1) : null;
      if (at !== null) return Object.keys(world.files).filter((p) => !p.startsWith("~/") && p.startsWith(at)).map((p) => mk("@" + p, "file"));
      return [];
    }
    const tool = world.session.tool;
    const extra = [
      ...(tool === "claude" ? listSkills(world.files, tool).map((s) => "/" + s.name) : []),
      ...(tool === "codex" ? listSkills(world.files, tool).map((s) => "$" + s.name) : []),
      ...(tool === "antigravity" ? listWorkflows(world.files, tool).map((w) => "/" + w.name) : []),
    ];
    return filter([...SLASH[tool], ...extra]);
  }

  if (before.length === 0) return filter(PROGRAMS);
  if (current.startsWith("@")) return Object.keys(world.files).filter((p) => p.startsWith(current.slice(1))).map((p) => mk("@" + p, "file"));
  const key2 = before.slice(0, 3).join(" ");
  const key1 = before.slice(0, 2).join(" ");
  const last = before[before.length - 1];
  if (SUB[last] && last.startsWith("-")) return filter(SUB[last]);
  if (SUB[key2]) return filter(SUB[key2]);
  if (SUB[key1]) return filter(SUB[key1]);
  if (SUB[before[0]] && before.length === 1) return filter(SUB[before[0]]);
  if (["cat", "edit", "rm", "cp", "mv"].includes(before[0])) return Object.keys(world.files).filter((p) => p.startsWith(current)).map((p) => mk(p));
  if (before[0] === "git" && before[1] === "merge") return filter(world.worktrees.map((w) => w.branch), "branch");
  if (last === "--worktree") return filter(world.worktrees.map((w) => w.name), "worktree");
  if (last === "--terminal") return filter(world.worktrees.map((w) => `term-${w.name}`), "terminal");
  return TOOLS.includes(before[0] as never) ? [] : [];
}

/** Syntax highlight for the input line. */
export function highlight(input: string): Array<{ text: string; cls: string }> {
  const out: Array<{ text: string; cls: string }> = [];
  const re = /("[^"]*"?|'[^']*'?|\s+|[^\s"']+)/g;
  let first = true;
  for (const m of input.match(re) ?? []) {
    let cls = "text-white";
    if (/^\s+$/.test(m)) cls = "";
    else if (/^["']/.test(m)) cls = "text-[var(--t-magenta)]";
    else if (m.startsWith("/") && first) cls = "text-[var(--t-cyan)]";
    else if (m.startsWith("@")) cls = "text-[var(--t-blue)]";
    else if (m.startsWith("-")) cls = "text-[var(--t-yellow)]";
    else if (m === ">" || m === "&&") cls = "text-[var(--t-muted)]";
    else if (first) cls = "text-[var(--t-green)]";
    if (!/^\s+$/.test(m)) first = false;
    out.push({ text: m, cls });
  }
  return out;
}
