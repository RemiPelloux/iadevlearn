/**
 * Canonical simulation state. Everything the UI shows (context window,
 * agent loop, Orca lanes, files, lesson validation) derives from a `World`.
 *
 * The state is plain JSON so it can be cloned, saved, shared and
 * time-travelled. All operations are pure: (World, input) -> (World, result).
 */

/**
 * path -> file content. Project files use relative paths ("src/cart.ts").
 * Files in the learner's home folder start with "~/" ("~/.codex/config.toml").
 */
export type FileMap = Record<string, string>;

/** The coding agents the simulator models. */
export type ToolId = "claude" | "codex" | "gemini" | "antigravity";

export type Locale = "en" | "fr";

/** The six things a good prompt says. */
export type PromptCheck = "goal" | "context" | "constraints" | "verify" | "specific" | "done";

export interface PromptReport {
  score: number;
  checks: Record<PromptCheck, boolean>;
  words: number;
  /** Project files the prompt points at (by @path or by name). */
  files: string[];
}

export type ContextKind = "system" | "rules" | "skill-index" | "skill" | "workflow" | "file" | "prompt" | "mcp";

export interface ContextItem {
  kind: ContextKind;
  label: string;
  tokens: number;
  /** File the item was loaded from, if any. */
  source?: string;
}

export type Outcome = "done" | "partial" | "clarify" | "answer" | "plan" | "blocked";

/** One prompt sent to one agent, and what it did. */
export interface AgentRun {
  id: number;
  tool: ToolId;
  /** "main" or the name of an Orca worktree. */
  where: string;
  prompt: string;
  report: PromptReport;
  context: ContextItem[];
  task: string | null;
  outcome: Outcome;
  skill: string | null;
  workflow: string | null;
  /** Rule files the agent read. */
  rules: string[];
  /** Directives from rules/skills it actually applied (ids, see rules.ts). */
  followed: string[];
  /** What the agent had to guess because the prompt didn't say. */
  assumed: PromptCheck[];
  changed: string[];
  /** Shell commands the agent ran (e.g. "pnpm test"). */
  commands: string[];
  /** Loop phases the agent went through. */
  phases: Array<"read" | "plan" | "act" | "verify" | "report">;
  tokens: number;
}

export interface Session {
  tool: ToolId;
  /** Plan mode: the agent proposes, you approve, then it acts. */
  plan: boolean;
  /** A plan waiting for approval. */
  pending: { prompt: string } | null;
  /** Flags the session was started with (e.g. codex --sandbox read-only). */
  sandbox?: string;
  approval?: string;
}

export type WorktreeStatus = "todo" | "in-progress" | "in-review" | "completed";

/** An Orca-managed worktree: a separate checkout where an agent works in parallel. */
export interface Worktree {
  name: string;
  branch: string;
  agent: ToolId | null;
  status: WorktreeStatus;
  comment: string;
  /** Project files as they were when the worktree was created. */
  base: FileMap;
  /** The worktree's current files. */
  files: FileMap;
  runs: number[];
  merged: boolean;
  /** Output of the agent's terminal (read with orca terminal read). */
  log?: OutLine[];
}

export interface GitState {
  branch: string;
  /** Files in the last commit. */
  head: FileMap;
  log: Array<{ id: string; message: string }>;
}

export interface World {
  version: 1;
  /** Which project (in projects.ts) these files belong to: it decides what the agents know how to do. */
  project: string;
  files: FileMap;
  session: Session | null;
  runs: AgentRun[];
  worktrees: Worktree[];
  /** MCP servers registered per tool. */
  mcp: Array<{ tool: ToolId; name: string; command: string }>;
  git: GitState;
  user: { name: string };
  seq: number;
}

export type LineKind =
  | "out"
  | "muted"
  | "error"
  | "success"
  | "hint"
  | "added"
  | "removed"
  | "hunk"
  | "commit"
  | "warning"
  | "agent"
  | "tool"
  | "info";

export interface OutLine {
  text: string;
  kind: LineKind;
}

/** Semantic events that drive animations, badges and lesson feedback. */
export type SimEvent =
  | { type: "session-start"; tool: ToolId }
  | { type: "session-end"; tool: ToolId }
  | { type: "prompt"; tool: ToolId; run: number; score: number; outcome: Outcome }
  | { type: "skill-used"; name: string }
  | { type: "rules-write"; path: string }
  | { type: "file-change"; paths: string[] }
  | { type: "worktree-create"; name: string; agent: ToolId | null }
  | { type: "merge"; branch: string }
  | { type: "plan" }
  | { type: "mcp-add"; name: string }
  | { type: "commit" }
  | { type: "open-file"; path: string };

export interface ExecResult {
  world: World;
  lines: OutLine[];
  events: SimEvent[];
  ok: boolean;
  /** Command recognized (e.g. "claude", "orca worktree", "/init"), for XP and lesson checks. */
  command: string | null;
  /** Plain-language explanation of an error, for beginners (already in the learner's language). */
  explain?: string;
  clear?: boolean;
}
