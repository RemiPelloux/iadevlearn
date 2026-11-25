import type { FileMap, PromptCheck, PromptReport } from "./types";

export const PROMPT_CHECKS: PromptCheck[] = ["goal", "context", "constraints", "verify", "specific", "done"];

const GOAL =
  /\b(add|create|fix|write|refactor|rename|remove|delete|update|implement|document|test|migrate|build|make|change|move|review|improve|convert|replace|support|generate|format|ajoute[rz]?|cr[ée]e[rz]?|corrige[rz]?|[ée]cri[st]|[ée]crire|refactorise[rz]?|renomme[rz]?|supprime[rz]?|mets|mettre|impl[ée]mente[rz]?|documente[rz]?|teste[rz]?|construi[st]|fais|faire|change[rz]?|d[ée]place[rz]?|relis|am[ée]liore[rz]?|convertis|remplace[rz]?|g[ée]n[èe]re[rz]?|formate[rz]?)\b/i;
const QUESTION = /^(explain|what|why|how|where|which|who|can you explain|tell me|summari[sz]e|describe|explique|qu['e]|pourquoi|comment|o[uù]|quel|quelle|r[ée]sume|d[ée]cri[st])\b|\?\s*$/i;
const CONSTRAINTS =
  /\b(don'?t|do not|never|without|only|must not|keep|avoid|no new|unchanged|same api|ne (?:pas|touche|modifie|change)|n'(?:ajoute|utilise|touche|modifie)|jamais|sans|uniquement|seulement|garde|[ée]vite|aucune?|pas de)\b/i;
const VERIFY =
  /\b(tests?|run|lint|typecheck|type-check|verify|check that|make sure|ensure|v[ée]rifie[rz]?|lance[rz]?|ex[ée]cute[rz]?|assure-toi|npm|pnpm|yarn|vitest|jest)\b/i;
const DONE =
  /\b(should|must|so that|returns?|expected|done when|until|result|output|format|doit|doivent|pour que|afin que|renvoie|retourne|attendu|jusqu'?[àa]|r[ée]sultat|affiche)\b/i;

/** Project files a prompt refers to: `@src/cart.ts`, `src/cart.ts` or just `cart.ts`. */
export function referencedFiles(prompt: string, files: FileMap): string[] {
  const out = new Set<string>();
  const paths = Object.keys(files).filter((p) => !p.startsWith("~/"));
  for (const m of prompt.matchAll(/@([\w./-]+)/g)) {
    const p = m[1].replace(/[.,;:!?)]+$/, "");
    if (p in files) out.add(p);
  }
  const lower = prompt.toLowerCase();
  for (const p of paths) {
    const base = p.split("/").pop()!.toLowerCase();
    if (lower.includes(p.toLowerCase()) || (base.includes(".") && new RegExp(`(^|[^\\w/])${base.replace(/\./g, "\\.")}\\b`).test(lower))) out.add(p);
  }
  return [...out];
}

export const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export function isQuestion(prompt: string) {
  return QUESTION.test(prompt.trim()) && !GOAL.test(prompt.split(/[.?!]/)[0].replace(QUESTION, ""));
}

/**
 * A deterministic, explainable read of a prompt: does it say what to do,
 * where, within which limits, how to check it, precisely, and when it's done?
 */
export function analyzePrompt(prompt: string, files: FileMap): PromptReport {
  const words = wordCount(prompt);
  const refs = referencedFiles(prompt, files);
  const checks: Record<PromptCheck, boolean> = {
    goal: GOAL.test(prompt) || isQuestion(prompt),
    context: refs.length > 0,
    constraints: CONSTRAINTS.test(prompt),
    verify: VERIFY.test(prompt),
    specific: /\d/.test(prompt) || /["'`«“][^"'`»”]{2,}["'`»”]/.test(prompt) || words >= 18,
    done: DONE.test(prompt),
  };
  return { score: PROMPT_CHECKS.filter((c) => checks[c]).length, checks, words, files: refs };
}

export function promptGrade(score: number): "vague" | "okay" | "sharp" {
  return score <= 2 ? "vague" : score <= 4 ? "okay" : "sharp";
}

/** Rough token estimate (≈ 4 characters per token), good enough to compare sizes. */
export const tokens = (text: string) => Math.max(1, Math.round(text.length / 4));
