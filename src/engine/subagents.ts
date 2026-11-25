import { parseFrontmatter } from "./skills";
import type { FileMap, ToolId } from "./types";

/**
 * Claude Code subagents: `.claude/agents/<name>.md` (project) or
 * `~/.claude/agents/<name>.md` (yours). Each one works in its own context
 * window and only hands a short summary back to the main conversation.
 */
export const SUBAGENT_DIRS: Partial<Record<ToolId, string[]>> = {
  claude: [".claude/agents", "~/.claude/agents"],
};

export interface Subagent {
  name: string;
  path: string;
  description: string;
  /** Tools it may use (empty = all of the main agent's tools). */
  tools: string[];
  body: string;
  problems: string[];
}

export function listSubagents(files: FileMap, tool: ToolId): Subagent[] {
  const out: Subagent[] = [];
  for (const dir of SUBAGENT_DIRS[tool] ?? [])
    for (const path of Object.keys(files).sort()) {
      const m = path.startsWith(dir + "/") ? path.slice(dir.length + 1).match(/^([^/]+)\.md$/) : null;
      if (!m) continue;
      const fm = parseFrontmatter(files[path]);
      const name = fm.data.name || m[1];
      if (out.some((s) => s.name === name)) continue;
      const problems: string[] = [];
      if (!fm.ok) problems.push("no-frontmatter");
      if (!fm.data.description) problems.push("no-description");
      out.push({
        name,
        path,
        description: fm.data.description ?? "",
        tools: (fm.data.tools ?? "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        body: fm.body,
        problems,
      });
    }
  return out;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/**
 * The subagent a request delegates to: named explicitly ("use the reviewer
 * subagent", "@agent-reviewer"), or picked by its description, like Claude does.
 */
export function matchSubagent(prompt: string, agents: Subagent[]): Subagent | null {
  const p = norm(prompt);
  const valid = agents.filter((a) => !a.problems.length);
  for (const a of valid) {
    const n = norm(a.name);
    if (p.includes(`@agent-${n}`) || new RegExp(`\\b${n.replace(/[-]/g, "[- ]")}\\b[^.]{0,20}\\b(sub-?agent|agent)\\b|\\b(sub-?agent|agent)\\b[^.]{0,20}\\b${n}\\b`).test(p)) return a;
  }
  // Proactive delegation: the description says when to use it ("Use after code changes", "review").
  for (const a of valid) {
    const d = norm(a.description);
    if (/\b(review|relis|relecture|audit)\w*/.test(p) && /\b(review|relis|relecture|audit)/.test(d)) return a;
    if (/\b(tests?)\b/.test(p) && /\b(write tests|test writer|ecri\w* (des )?tests)/.test(d) && /\b(write|add|ecri|ajoute)/.test(p)) return a;
  }
  return null;
}
