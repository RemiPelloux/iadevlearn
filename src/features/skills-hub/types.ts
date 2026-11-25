import type { Txt } from "@/engine";

export type SkillCategory =
  | "documents"
  | "design"
  | "frontend"
  | "testing"
  | "debugging"
  | "planning"
  | "git"
  | "devops"
  | "data"
  | "security"
  | "writing"
  | "ai-dev"
  | "productivity"
  | "business"
  | "other";

export type SkillGroup = "originals" | "pelloux" | "anthropic" | "community";

export interface HubSkill {
  name: string;
  /** "owner/repo", or "IA Dev Learn" for the course's own skills. */
  source: string;
  group: SkillGroup;
  category: SkillCategory;
  description: Txt;
  license: string;
  /** Link to the skill on GitHub. */
  url?: string;
  /** raw.githubusercontent.com URL of SKILL.md, loaded on demand. */
  raw?: string;
  /** The full SKILL.md, for skills shipped with the app. */
  content?: string;
  /** Documented install commands (plugin marketplace, skills CLI…). */
  install: string[];
  installNote?: Txt;
  /** The skill is one SKILL.md with no companion files, so copying that file is enough. */
  singleFile: boolean;
}
