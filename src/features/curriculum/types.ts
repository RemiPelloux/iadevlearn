import type { Txt, World } from "@/engine";

export type Tier = "beginner" | "intermediate" | "advanced" | "expert";

/**
 * A check over the canonical simulation state — never over what was typed.
 * `ran` lists the commands recognized since the step started (e.g. "claude",
 * "/init", "prompt") and is only used for read-only "look around" steps.
 */
export type Check = (world: World, start: World, ran: string[]) => boolean;

export interface Objective {
  id: string;
  label: string;
  check: Check;
  /** Three-level adaptive hints: concept → command → full walkthrough. */
  hints: [string, string, string];
}

/** Visual scenes for "Discover" steps (see lesson/scenes.tsx). */
export type SceneId =
  | "agent-loop"
  | "vague-vs-precise"
  | "prompt-anatomy"
  | "context-window"
  | "plan-act"
  | "rules-memory"
  | "rules-layers"
  | "one-rulebook"
  | "rules-lint"
  | "progressive-disclosure"
  | "skill-anatomy"
  | "sandbox"
  | "antigravity"
  | "worktrees";

export interface DiscoverStep {
  kind: "discover";
  title: string;
  body: string[];
  scene: SceneId;
}

export interface WatchStep {
  kind: "watch";
  title: string;
  body: string;
  setup: () => World;
  frames: Array<{ command: string; caption: string }>;
}

export interface TryStep {
  kind: "try";
  title: string;
  body: string;
  /** Suggested command (Assisted mode shows it with a Run button). */
  command?: string;
  /** Alternative to a command: a UI action (e.g. creating a file). */
  action?: { label: string; kind: "create-file" | "edit-file"; path: string; content: string };
  check: Check;
  success: string;
  hint?: string;
}

export interface ExperimentStep {
  kind: "experiment";
  title: string;
  body: string;
  ideas: string[];
}

export interface ChallengeStep {
  kind: "challenge";
  title: string;
  body: string;
  objectives: Objective[];
  /** Contextual feedback derived from state (e.g. "the agent had to guess the file"). */
  feedback?: (world: World, start: World) => string | null;
}

export interface CelebrateStep {
  kind: "celebrate";
}

export type Step = DiscoverStep | WatchStep | TryStep | ExperimentStep | ChallengeStep | CelebrateStep;

/** Which tools the lesson workspace shows: the interface grows with the learner. */
export interface LessonUi {
  files: boolean;
  editor: boolean;
  /** The "Run" inspector: last prompt, context, assumptions, diff. */
  run: boolean;
  /** The Orca lanes (one per worktree). */
  orca: boolean;
}

export interface Lesson {
  id: string;
  chapterId: string;
  title: string;
  tagline: string;
  xp: number;
  boss?: boolean;
  concepts: string[];
  commands: string[];
  setup: () => World;
  steps: Step[];
  ui: LessonUi;
  /** Plain-language recap shown on completion. */
  recap: string[];
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  tier: Tier;
  description: string;
  lessons: Lesson[];
  /** Lesson titles planned but not yet playable. */
  upcoming: string[];
}

// ───────────────────────────────────────────── Authoring types
// Lessons are written once, with every learner-facing string in both
// languages ({ en, fr }). `localize.ts` picks the learner's language.

type Plain<T> = T extends string ? (string extends T ? Txt : T) : T;
type DefOf<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => R extends string | null ? Plain<R> | null : R
  : T extends string
    ? Plain<T>
    : T extends readonly unknown[]
      ? { [K in keyof T]: DefOf<T[K]> }
      : T extends object
        ? { [K in keyof T]: DefOf<T[K]> }
        : T;

/** Text fields that are code, not language: they stay plain strings. */
type Code = "id" | "chapterId" | "command" | "path" | "content" | "scene" | "kind";
type Def<T> = { [K in keyof T]: K extends Code ? T[K] : K extends "ideas" | "commands" ? string[] : DefOf<T[K]> };

export type ObjectiveDef = Def<Objective>;
export type StepDef =
  | Def<DiscoverStep>
  | (Omit<Def<WatchStep>, "frames"> & { frames: Array<{ command: string; caption: Txt }> })
  | (Omit<Def<TryStep>, "action"> & { action?: { label: Txt; kind: "create-file" | "edit-file"; path: string; content: string } })
  | Def<ExperimentStep>
  | (Omit<Def<ChallengeStep>, "objectives"> & { objectives: ObjectiveDef[] })
  | CelebrateStep;

export interface LessonDef extends Omit<Def<Lesson>, "steps" | "concepts" | "recap" | "setup" | "ui"> {
  concepts: Txt[];
  recap: Txt[];
  setup: () => World;
  ui: LessonUi;
  steps: StepDef[];
}

export interface ChapterDef {
  id: string;
  number: number;
  title: Txt;
  tier: Tier;
  description: Txt;
  lessons: LessonDef[];
  upcoming: Txt[];
}
