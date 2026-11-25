import type { FileMap } from "./types";

/**
 * Claude Code settings: `.claude/settings.json` (shared with the team),
 * `.claude/settings.local.json` (yours only) and `~/.claude/settings.json`.
 * The simulator understands the two parts lessons need: permission rules and hooks.
 */
export const SETTINGS_FILES = ["~/.claude/settings.json", ".claude/settings.json", ".claude/settings.local.json"];

export interface HookDef {
  event: "PreToolUse" | "PostToolUse" | "Stop" | "UserPromptSubmit" | "SessionStart";
  matcher: string;
  command: string;
  source: string;
}

export interface ClaudeSettings {
  deny: string[];
  allow: string[];
  hooks: HookDef[];
  /** Files that failed to parse, with the JSON error. */
  errors: Array<{ path: string; error: string }>;
}

const EVENTS = new Set(["PreToolUse", "PostToolUse", "Stop", "UserPromptSubmit", "SessionStart"]);

export function claudeSettings(files: FileMap): ClaudeSettings {
  const out: ClaudeSettings = { deny: [], allow: [], hooks: [], errors: [] };
  for (const path of SETTINGS_FILES) {
    const text = files[path];
    if (text === undefined || !text.trim()) continue;
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch (e) {
      out.errors.push({ path, error: e instanceof Error ? e.message : String(e) });
      continue;
    }
    if (!json || typeof json !== "object") continue;
    const j = json as { permissions?: { deny?: unknown; allow?: unknown }; hooks?: Record<string, unknown> };
    if (Array.isArray(j.permissions?.deny)) out.deny.push(...j.permissions.deny.filter((x): x is string => typeof x === "string"));
    if (Array.isArray(j.permissions?.allow)) out.allow.push(...j.permissions.allow.filter((x): x is string => typeof x === "string"));
    for (const [event, groups] of Object.entries(j.hooks ?? {})) {
      if (!EVENTS.has(event) || !Array.isArray(groups)) continue;
      for (const g of groups as Array<{ matcher?: unknown; hooks?: unknown }>) {
        const matcher = typeof g?.matcher === "string" ? g.matcher : "";
        for (const h of Array.isArray(g?.hooks) ? (g.hooks as Array<{ type?: unknown; command?: unknown }>) : [])
          if (typeof h?.command === "string") out.hooks.push({ event: event as HookDef["event"], matcher, command: h.command, source: path });
      }
    }
  }
  return out;
}

/** A permission rule like `Read(./.env)`, `Bash(curl:*)` or `Edit(src/**)`. */
function ruleMatches(rule: string, tool: string, target: string): boolean {
  const m = rule.match(/^(\w+)(?:\((.*)\))?$/);
  if (!m) return false;
  const [, ruleTool, spec] = m;
  const same = ruleTool === tool || (ruleTool === "Edit" && tool === "Write") || (ruleTool === "Read" && tool === "Grep");
  if (!same) return false;
  if (spec === undefined || spec === "" || spec === "*") return true;
  if (tool === "Bash") {
    const prefix = spec.replace(/:\*$/, "").replace(/\*$/, "").trim();
    return target === prefix || target.startsWith(prefix + " ") || target.startsWith(prefix);
  }
  const norm = (p: string) => p.replace(/^\.\//, "").replace(/^\/\//, "/");
  const s = norm(spec);
  const t = norm(target);
  if (s.endsWith("/**")) return t.startsWith(s.slice(0, -3));
  if (s.includes("*")) return new RegExp("^" + s.replace(/[.+^$()|[\]\\]/g, "\\$&").replace(/\*\*/g, "\u0000").replace(/\*/g, "[^/]*").replace(/\u0000/g, ".*") + "$").test(t);
  return t === s;
}

/** The deny rule that blocks this action, if any. */
export function deniedBy(settings: ClaudeSettings, tool: "Read" | "Edit" | "Write" | "Bash", target: string): string | null {
  return settings.deny.find((r) => ruleMatches(r, tool, target)) ?? null;
}

/** Hooks that fire for an event and a tool name (matcher is a regex over tool names, empty = all). */
export function hooksFor(settings: ClaudeSettings, event: HookDef["event"], toolName = ""): HookDef[] {
  return settings.hooks.filter((h) => {
    if (h.event !== event) return false;
    if (!h.matcher || h.matcher === "*") return true;
    try {
      return new RegExp(`^(?:${h.matcher})$`).test(toolName);
    } catch {
      return h.matcher === toolName;
    }
  });
}
