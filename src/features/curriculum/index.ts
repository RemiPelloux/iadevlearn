import { tx as L } from "@/engine";
import { contextWindow, firstPrompt, planVerify, whatIsAgent } from "./lessons/basics";
import { goodRules, oneRulebook, whatAreRules } from "./lessons/rules";
import { whatIsSkill, writeSkill } from "./lessons/skills";
import { agentTeam, antigravityWorkflows, codexSandbox, parallelWorktrees } from "./lessons/tools";
import type { ChapterDef, LessonDef, Tier } from "./types";

export const CHAPTER_DEFS: ChapterDef[] = [
  {
    id: "foundations",
    number: 1,
    title: L("Meet your coding agent", "Rencontre ton agent de code"),
    tier: "beginner",
    description: L("What a coding agent is, and how to talk to one.", "Ce qu'est un agent de code, et comment lui parler."),
    lessons: [whatIsAgent, firstPrompt],
    upcoming: [],
  },
  {
    id: "prompting",
    number: 2,
    title: L("The art of prompting", "L'art du prompt"),
    tier: "beginner",
    description: L("Context, precision, plans and verification.", "Contexte, précision, plans et vérification."),
    lessons: [contextWindow, planVerify],
    upcoming: [L("Iterating: correcting an agent mid-task", "Itérer : corriger un agent en cours de route"), L("Prompting with screenshots and errors", "Prompter avec des captures et des erreurs")],
  },
  {
    id: "rules",
    number: 3,
    title: L("Rules: teach your agent once", "Les règles : apprends une fois à ton agent"),
    tier: "intermediate",
    description: L("CLAUDE.md, AGENTS.md, GEMINI.md, and how to write rules that work.", "CLAUDE.md, AGENTS.md, GEMINI.md, et comment écrire des règles qui marchent."),
    lessons: [whatAreRules, oneRulebook, goodRules],
    upcoming: [L("Rules for one folder only", "Des règles pour un seul dossier"), L("Cursor rules (.mdc) and globs", "Les règles Cursor (.mdc) et les globs")],
  },
  {
    id: "skills",
    number: 4,
    title: L("Skills: know-how on demand", "Les skills : du savoir-faire à la demande"),
    tier: "intermediate",
    description: L("SKILL.md, progressive disclosure, and skills that work in every agent.", "SKILL.md, divulgation progressive, et des skills qui marchent dans tous les agents."),
    lessons: [whatIsSkill, writeSkill],
    upcoming: [L("Skills with scripts and reference files", "Des skills avec scripts et fichiers de référence")],
  },
  {
    id: "tools",
    number: 5,
    title: L("Codex, Antigravity & co", "Codex, Antigravity et cie"),
    tier: "advanced",
    description: L("Sandboxes, approvals, workflows: each tool's superpowers.", "Sandboxes, approbations, workflows : les super-pouvoirs de chaque outil."),
    lessons: [codexSandbox, antigravityWorkflows],
    upcoming: [L("Gemini CLI in depth", "Gemini CLI en détail"), L("Cursor's agent", "L'agent de Cursor")],
  },
  {
    id: "orca",
    number: 6,
    title: L("Orca: a team of agents", "Orca : une équipe d'agents"),
    tier: "advanced",
    description: L("Worktrees, parallel agents, review and merge.", "Worktrees, agents en parallèle, relecture et fusion."),
    lessons: [parallelWorktrees, agentTeam],
    upcoming: [L("Orchestration runs: a coordinator and workers", "Les runs d'orchestration : un coordinateur et des workers"), L("Automations on a schedule", "Les automatisations planifiées")],
  },
  {
    id: "mcp",
    number: 7,
    title: L("MCP, hooks & subagents", "MCP, hooks et sous-agents"),
    tier: "expert",
    description: L("Give agents new tools, guardrails and helpers.", "Donne aux agents de nouveaux outils, des garde-fous et des assistants."),
    lessons: [],
    upcoming: [L("What is MCP?", "C'est quoi, MCP ?"), L("The context cost of tools", "Le coût en contexte des outils"), L("Hooks: run code on every edit", "Les hooks : du code à chaque modification"), L("Subagents", "Les sous-agents")],
  },
  {
    id: "safety",
    number: 8,
    title: L("Safety & trust", "Sécurité et confiance"),
    tier: "expert",
    description: L("Secrets, prompt injection and reviewing agent code.", "Secrets, injection de prompt et relecture du code des agents."),
    lessons: [],
    upcoming: [L("Keep secrets out of the context", "Garder les secrets hors du contexte"), L("Prompt injection", "L'injection de prompt"), L("Reviewing an agent's diff", "Relire le diff d'un agent")],
  },
];

export const ALL_LESSON_DEFS: LessonDef[] = CHAPTER_DEFS.flatMap((c) => c.lessons);

export const getLessonDef = (id: string) => ALL_LESSON_DEFS.find((l) => l.id === id) ?? null;

export function nextLessonDef(id: string): LessonDef | null {
  const i = ALL_LESSON_DEFS.findIndex((l) => l.id === id);
  return i >= 0 ? (ALL_LESSON_DEFS[i + 1] ?? null) : null;
}

/**
 * A lesson unlocks when the previous playable lesson is complete. Completed
 * lessons are always replayable. Learners who already use agents can skip ahead.
 */
export function isUnlocked(id: string, completed: Record<string, unknown>, experience: "new" | "some" | "comfortable" | null = null): boolean {
  const i = ALL_LESSON_DEFS.findIndex((l) => l.id === id);
  if (i <= 0 || completed[id]) return true;
  if (experience === "comfortable") return true;
  if (experience === "some" && i <= ALL_LESSON_DEFS.findIndex((l) => l.chapterId === "rules")) return true;
  return !!completed[ALL_LESSON_DEFS[i - 1].id];
}

export const TIER_LABEL: Record<Tier, { en: string; fr: string }> = {
  beginner: L("Beginner", "Débutant"),
  intermediate: L("Intermediate", "Intermédiaire"),
  advanced: L("Advanced", "Avancé"),
  expert: L("Expert", "Expert"),
};

export type { Chapter, Lesson, Step, Tier, Objective } from "./types";
