import { tx, type Txt } from "./context";
import type { FileMap, ToolId } from "./types";

/** Where each agent discovers skills: one folder per skill, each with a SKILL.md. */
export const SKILL_DIRS: Partial<Record<ToolId, string[]>> = {
  claude: [".claude/skills", "~/.claude/skills"],
  codex: [".agents/skills", "~/.agents/skills"],
  antigravity: [".agents/skills", "~/.gemini/antigravity/skills"],
};

export const WORKFLOW_DIRS: Partial<Record<ToolId, string[]>> = {
  antigravity: [".agents/workflows", ".agent/workflows"],
};

export interface Frontmatter {
  data: Record<string, string>;
  body: string;
  ok: boolean;
}

/** Minimal YAML frontmatter: `---\nkey: value\n---\nbody`. */
export function parseFrontmatter(text: string): Frontmatter {
  const m = text.match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)([\s\S]*)$/);
  if (!m) return { data: {}, body: text, ok: false };
  const data: Record<string, string> = {};
  let lastKey: string | null = null;
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (kv) {
      lastKey = kv[1];
      data[lastKey] = kv[2].replace(/^["']|["']$/g, "").replace(/^[>|]-?$/, "").trim();
    } else if (lastKey && /^\s+\S/.test(line)) data[lastKey] = (data[lastKey] + " " + line.trim()).trim();
  }
  return { data, body: m[2], ok: true };
}

export interface Skill {
  name: string;
  folder: string;
  path: string;
  description: string;
  body: string;
  problems: SkillProblem[];
}

export type SkillProblemId = "no-frontmatter" | "no-name" | "bad-name" | "name-mismatch" | "no-description" | "no-trigger" | "no-steps";

export interface SkillProblem {
  id: SkillProblemId;
  message: Txt;
}

export function checkSkill(folder: string, text: string): SkillProblem[] {
  const fm = parseFrontmatter(text);
  const p: SkillProblem[] = [];
  if (!fm.ok) return [{ id: "no-frontmatter", message: tx("SKILL.md must start with a --- frontmatter block (name, description).", "SKILL.md doit commencer par un bloc --- (name, description).") }];
  const name = fm.data.name ?? "";
  if (!name) p.push({ id: "no-name", message: tx("Missing `name:` in the frontmatter.", "Il manque `name:` dans l'en-tête.") });
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) p.push({ id: "bad-name", message: tx("Use lowercase letters, digits and hyphens for the name (e.g. release-notes).", "Le nom s'écrit en minuscules, chiffres et tirets (ex. release-notes).") });
  else if (name !== folder) p.push({ id: "name-mismatch", message: tx(`The name (${name}) should match the folder (${folder}).`, `Le nom (${name}) doit correspondre au dossier (${folder}).`) });
  const desc = fm.data.description ?? "";
  if (!desc) p.push({ id: "no-description", message: tx("Missing `description:`. It is the only thing the agent reads before deciding to use the skill.", "Il manque `description:`. C'est la seule chose que l'agent lit avant de choisir le skill.") });
  else if (!/\b(use when|use it when|use for|when|whenever|utilise[- ]le quand|quand|lorsque|pour)\b/i.test(desc))
    p.push({ id: "no-trigger", message: tx("The description should say when to use the skill (“Use when…”).", "La description doit dire quand utiliser le skill (« Use when… »).") });
  if (!/^\s*(\d+\.|[-*])\s+\S/m.test(fm.body)) p.push({ id: "no-steps", message: tx("Add steps (a numbered or bulleted list) so the agent knows what to do.", "Ajoute des étapes (liste numérotée ou à puces) pour que l'agent sache quoi faire.") });
  return p;
}

/** Skills a tool can see right now. */
export function listSkills(files: FileMap, tool: ToolId): Skill[] {
  const out: Skill[] = [];
  const seen = new Set<string>();
  for (const dir of SKILL_DIRS[tool] ?? []) {
    for (const path of Object.keys(files).sort()) {
      const m = path.startsWith(dir + "/") ? path.slice(dir.length + 1).match(/^([^/]+)\/SKILL\.md$/) : null;
      if (!m) continue;
      const fm = parseFrontmatter(files[path]);
      const name = fm.data.name || m[1];
      if (seen.has(name)) continue;
      seen.add(name);
      out.push({ name, folder: m[1], path, description: fm.data.description ?? "", body: fm.body, problems: checkSkill(m[1], files[path]) });
    }
  }
  return out;
}

export interface Workflow {
  name: string;
  path: string;
  description: string;
  body: string;
}

export function listWorkflows(files: FileMap, tool: ToolId): Workflow[] {
  const out: Workflow[] = [];
  for (const dir of WORKFLOW_DIRS[tool] ?? [])
    for (const path of Object.keys(files).sort()) {
      const m = path.startsWith(dir + "/") ? path.slice(dir.length + 1).match(/^([^/]+)\.md$/) : null;
      if (!m || out.some((w) => w.name === m[1])) continue;
      const fm = parseFrontmatter(files[path]);
      out.push({ name: m[1], path, description: fm.data.description ?? "", body: fm.body });
    }
  return out;
}

const STOP = new Set(
  "the and for with that this when use your you from into about using have will what want need make also they them then than only each user users code file files project une des les pour avec dans quand sur est que qui par pas plus utilise utiliser fichier fichiers projet tout tous cette ces son ses leur".split(" "),
);

const words = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4 && !STOP.has(w)),
  );

/**
 * Progressive disclosure: the agent only knows each skill's name and
 * description. It loads the full SKILL.md when the request matches, or when
 * the skill is invoked by name ($name, /name or "use the name skill").
 */
export function matchSkill(prompt: string, skills: Skill[]): Skill | null {
  const lower = prompt.toLowerCase();
  for (const s of skills) if (new RegExp(`(^|\\s)[$/]${s.name}\\b|\\b${s.name}\\s+skill\\b|\\bskill\\s+${s.name}\\b`).test(lower)) return s;
  const pw = words(prompt);
  let best: Skill | null = null;
  let bestScore = 0;
  for (const s of skills) {
    if (!s.description) continue;
    const dw = words(s.description);
    const nw = words(s.name.replace(/-/g, " "));
    const near = (w: string, set: Set<string>) => set.has(w) || [...set].some((d) => d.length >= 5 && w.length >= 5 && (d.startsWith(w.slice(0, 5)) || w.startsWith(d.slice(0, 5))));
    let score = 0;
    // A word of the skill's name counts double: "changelog" alone is enough for a skill named changelog.
    for (const w of pw) score += near(w, nw) ? 2 : near(w, dw) ? 1 : 0;
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return bestScore >= 2 ? best : null;
}

/** The numbered/bulleted steps of a skill or workflow body. */
export function stepsOf(body: string): string[] {
  return body
    .split("\n")
    .map((l) => l.match(/^\s*(?:\d+\.|[-*])\s+(.*)$/)?.[1]?.trim())
    .filter((l): l is string => !!l);
}
