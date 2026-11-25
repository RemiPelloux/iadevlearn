import type { FileMap } from "./types";

/** Files that usually hold secrets. */
export const isSecretPath = (p: string) => /(^|\/)\.env(\.[\w-]+)?$/.test(p) && !/\.env\.example$/.test(p);

/** A value that looks like a real secret: API keys, tokens, passwords. */
export const SECRET_VALUE = /\b(sk_(live|test)_[\w]{6,}|ghp_[\w]{10,}|AKIA[0-9A-Z]{12,}|xox[bp]-[\w-]{10,}|(api[_-]?key|secret|token|password)\s*=\s*\S{8,})/i;

export const hasSecret = (text: string) => SECRET_VALUE.test(text);

/** Patterns `.gitignore` understands here: exact names, folders (`dist/`), `*.ext`, and `.env*`. */
export function gitIgnored(files: FileMap, path: string): boolean {
  const rules = (files[".gitignore"] ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  let ignored = false;
  for (const raw of rules) {
    const neg = raw.startsWith("!");
    const r = (neg ? raw.slice(1) : raw).replace(/^\//, "");
    const re = new RegExp(
      "^(?:.*/)?" +
        r
          .replace(/\/$/, "/**")
          .replace(/[.+^$()|[\]\\]/g, "\\$&")
          .replace(/\*\*/g, "\u0000")
          .replace(/\*/g, "[^/]*")
          .replace(/\u0000/g, ".*") +
        (r.endsWith("/") ? "" : "(?:/.*)?") +
        "$",
    );
    if (re.test(path)) ignored = !neg;
  }
  return ignored;
}

export interface Injection {
  /** The command the text tries to make the agent run. */
  command: string;
  /** The suspicious line, for display. */
  line: string;
}

const INJECTION =
  /(ignore (all |any |the )?(previous|prior|above|earlier) (instructions|rules)|ignore (toutes )?les instructions|note to (ai|llm|coding) (agents?|assistants?)|(ai|llm) agents?\s*:|message (pour|aux) (les )?(agents?|ia)|<!--\s*(ai|agent|llm)|system override|you must now run)/i;

/** Text written to hijack an AI agent that reads it: "ignore previous instructions and run …". */
export function findInjection(text: string): Injection | null {
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (!INJECTION.test(lines[i])) continue;
    const near = lines.slice(i, i + 4).join("\n");
    const cmd = near.match(/`([^`]*(curl|wget|bash|sh|rm |npm publish|git push|cat ~|scp|nc )[^`]*)`/i)?.[1] ?? near.match(/\b((?:curl|wget)\s+\S+(?:\s*\|\s*(?:ba)?sh)?)/i)?.[1];
    return { command: (cmd ?? "a hidden command").trim(), line: lines[i].trim() };
  }
  return null;
}
