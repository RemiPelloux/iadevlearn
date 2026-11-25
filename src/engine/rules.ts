import { tx, type Txt } from "./context";
import type { FileMap, ToolId } from "./types";

/**
 * Where each agent looks for its rules ("memory", "instructions"), from the
 * most general to the most specific. Later files win when they disagree.
 */
export const RULE_FILES: Record<ToolId, string[]> = {
  claude: ["~/.claude/CLAUDE.md", "CLAUDE.md", ".claude/CLAUDE.md", "CLAUDE.local.md"],
  codex: ["~/.codex/AGENTS.md", "AGENTS.md"],
  gemini: ["~/.gemini/GEMINI.md", "GEMINI.md"],
  antigravity: ["~/.gemini/GEMINI.md", "GEMINI.md", "AGENTS.md"],
};

/** Folders of individual rule files (one level deep). */
export const RULE_DIRS: Partial<Record<ToolId, string[]>> = {
  antigravity: [".agents/rules", ".agent/rules"],
};

export const TOOL_NAMES: Record<ToolId, string> = {
  claude: "Claude Code",
  codex: "Codex",
  gemini: "Gemini CLI",
  antigravity: "Antigravity",
};

/** The rules file `/init` creates for each tool. */
export const INIT_FILE: Record<ToolId, string> = {
  claude: "CLAUDE.md",
  codex: "AGENTS.md",
  gemini: "GEMINI.md",
  antigravity: ".agents/rules/project.md",
};

export const isRulesPath = (p: string) =>
  /(^|\/)(CLAUDE|AGENTS|GEMINI)(\.local)?\.md$/.test(p) || /^\.agents?\/rules\/[^/]+\.md$/.test(p) || /^\.cursor\/rules\/[^/]+\.mdc$/.test(p);

export interface LoadedRule {
  path: string;
  content: string;
  /** Pulled in by an `@path` import line in another rules file. */
  importedBy?: string;
}

/** The rule files a tool would read right now, imports included (`@path` lines in CLAUDE.md and GEMINI.md). */
export function loadRules(files: FileMap, tool: ToolId): LoadedRule[] {
  const out: LoadedRule[] = [];
  const seen = new Set<string>();
  const add = (path: string, importedBy?: string, depth = 0) => {
    if (seen.has(path) || files[path] === undefined) return;
    seen.add(path);
    out.push({ path, content: files[path], importedBy });
    if ((tool !== "claude" && tool !== "gemini") || depth > 3) return;
    for (const m of files[path].matchAll(/(?:^|\s)@((?:~\/)?[\w./-]+\.md)\b/gm)) add(m[1], path, depth + 1);
  };
  for (const p of RULE_FILES[tool]) add(p);
  for (const dir of RULE_DIRS[tool] ?? [])
    for (const p of Object.keys(files).sort())
      if (p.startsWith(dir + "/") && !p.slice(dir.length + 1).includes("/") && p.endsWith(".md")) add(p);
  return out;
}

export interface DirectiveDef {
  id: string;
  label: Txt;
  test: (text: string) => boolean;
}

/** The instructions the simulated agents understand inside rules and skills. */
export const DIRECTIVES: DirectiveDef[] = [
  { id: "pm:pnpm", label: tx("Use pnpm", "Utiliser pnpm"), test: (s) => /\bpnpm\b/i.test(s) && !/\b(never|don'?t|not|jamais|pas)\b[^.\n]{0,20}\bpnpm\b/i.test(s) },
  { id: "pm:yarn", label: tx("Use yarn", "Utiliser yarn"), test: (s) => /\b(use|utilise[rz]?)\s+`?yarn\b/i.test(s) },
  { id: "pm:bun", label: tx("Use bun", "Utiliser bun"), test: (s) => /\b(use|utilise[rz]?)\s+`?bun\b/i.test(s) },
  {
    id: "tests",
    label: tx("Run the tests after every change", "Lancer les tests après chaque changement"),
    test: (s) => /\b(run|lance[rz]?|ex[ée]cute[rz]?)\b[^.\n]{0,40}\btests?\b/i.test(s) || /\btests?\b[^.\n]{0,40}\b(after|before|pass|passer|apr[èe]s|avant)\b/i.test(s),
  },
  { id: "lang:fr", label: tx("Write comments in French", "Commentaires en français"), test: (s) => /\b(french|fran[çc]ais)\b/i.test(s) },
  { id: "conventional", label: tx("Conventional Commits messages", "Messages Conventional Commits"), test: (s) => /conventional commits|\bfeat:|\bfix:/i.test(s) },
  { id: "no-any", label: tx("No `any` in TypeScript", "Pas de `any` en TypeScript"), test: (s) => /\b(no|never|avoid|pas de|jamais|[ée]vite[rz]?)\b[^.\n]{0,25}`?\bany\b`?/i.test(s) },
  { id: "small", label: tx("Keep changes small and focused", "Garder des changements petits et ciblés"), test: (s) => /\b(small|minimal|focused|petits?|minimal(e|es)?|cibl[ée]s?)\b[^.\n]{0,30}\b(changes?|diffs?|changements?|modifications?)\b/i.test(s) },
];

export function directivesIn(text: string): string[] {
  const out = DIRECTIVES.filter((d) => d.test(text)).map((d) => d.id);
  // If several package managers are mentioned, the last instruction wins, like an agent reading top to bottom.
  const pms = out.filter((d) => d.startsWith("pm:"));
  if (pms.length > 1) return [...out.filter((d) => !d.startsWith("pm:")), pms[pms.length - 1]];
  return out;
}

/** Paths the rules say never to edit, e.g. "Never edit `src/generated/`". */
export function protectedPaths(text: string): string[] {
  const out: string[] = [];
  for (const line of text.split("\n"))
    if (/\b(never|don'?t|do not|jamais|ne (?:jamais|pas))\b[^`\n]*\b(edit|modify|touch|change|modifie[rz]?|touche[rz]?|change[rz]?)\b/i.test(line))
      for (const m of line.matchAll(/`([\w./-]+)`/g)) out.push(m[1].replace(/\/$/, ""));
  return out;
}

export const packageManager = (directives: string[]) => (directives.find((d) => d.startsWith("pm:"))?.slice(3) ?? "npm") as "npm" | "pnpm" | "yarn" | "bun";

export type RuleIssueId = "empty" | "vague" | "no-commands" | "too-long" | "contradiction" | "no-structure" | "shouting";

export interface RuleIssue {
  id: RuleIssueId;
  message: Txt;
}

const VAGUE = /\b(clean code|best practices|good code|be careful|high quality|write good|code propre|bonnes pratiques|bon code|fais attention|sois prudent|de qualit[ée])\b/i;

/** A friendly linter for rules files: what makes rules hard for an agent to follow. */
export function lintRules(text: string): RuleIssue[] {
  const issues: RuleIssue[] = [];
  const body = text.trim();
  if (!body) return [{ id: "empty", message: tx("The file is empty.", "Le fichier est vide.") }];
  if (VAGUE.test(body))
    issues.push({
      id: "vague",
      message: tx(
        "Vague wishes like “write clean code” or “best practices” don't change what an agent does. Say exactly what you want.",
        "Les vœux vagues comme « code propre » ou « bonnes pratiques » ne changent rien pour un agent. Dis exactement ce que tu veux.",
      ),
    });
  if (!/`[^`]+`/.test(body) && !/\b(npm|pnpm|yarn|bun|make|cargo|pytest|go test)\b/.test(body))
    issues.push({
      id: "no-commands",
      message: tx("No commands. Tell the agent how to install, test and run the project (e.g. `pnpm test`).", "Aucune commande. Dis à l'agent comment installer, tester et lancer le projet (ex. `pnpm test`)."),
    });
  if (body.split("\n").length > 120 || body.length > 6000)
    issues.push({
      id: "too-long",
      message: tx("Too long: every line is loaded into every conversation. Keep rules short and move details into skills.", "Trop long : chaque ligne est chargée dans chaque conversation. Garde des règles courtes et mets les détails dans des skills."),
    });
  const pms = ["npm", "pnpm", "yarn", "bun"].filter((pm) => new RegExp(`\\b(use|utilise[rz]?|always|toujours)\\s+\`?${pm}\\b`, "i").test(body));
  if (pms.length > 1)
    issues.push({
      id: "contradiction",
      message: tx(`Contradiction: the rules ask for both ${pms.join(" and ")}. The agent will pick one, maybe the wrong one.`, `Contradiction : les règles demandent à la fois ${pms.join(" et ")}. L'agent en choisira un, peut-être le mauvais.`),
    });
  if (!/^#{1,3} /m.test(body) && body.split("\n").length > 6)
    issues.push({ id: "no-structure", message: tx("No headings. Short sections (## Commands, ## Style…) help agents and humans scan.", "Aucun titre. De courtes sections (## Commandes, ## Style…) aident les agents et les humains.") });
  if ((body.match(/\b(IMPORTANT|MUST|NEVER|ALWAYS|CRITICAL|OBLIGATOIRE|JAMAIS|TOUJOURS)\b/g) ?? []).length > 5)
    issues.push({ id: "shouting", message: tx("Lots of SHOUTING. When everything is “IMPORTANT”, nothing is.", "Beaucoup de MAJUSCULES. Quand tout est « IMPORTANT », plus rien ne l'est.") });
  return issues;
}
