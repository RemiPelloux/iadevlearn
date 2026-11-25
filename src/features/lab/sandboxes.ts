import type { World } from "@/engine";
import { AGENTS_MD, CHANGELOG_SKILL, CODEX_READ_ONLY, P_EURO, P_TOTAL, RELEASE_WORKFLOW, shop } from "@/features/curriculum/scenario";
import type { MessageKey } from "@/i18n";

export type SandboxId = "shop" | "rules" | "skills" | "orca" | "codex";

/** Message keys for a sandbox's title and description (translate at render time). */
export const sandboxText = (id: SandboxId) => ({
  title: `lab.sandboxes.${id}.title` as const satisfies MessageKey,
  description: `lab.sandboxes.${id}.description` as const satisfies MessageKey,
});

const SHARED = { "AGENTS.md": AGENTS_MD, "CLAUDE.md": "@AGENTS.md\n", "GEMINI.md": "@AGENTS.md\n" };

export const SANDBOXES: Array<{ id: SandboxId; build: () => World }> = [
  { id: "shop", build: () => shop() },
  { id: "rules", build: () => shop(SHARED) },
  {
    id: "skills",
    build: () =>
      shop({
        ...SHARED,
        ".claude/skills/changelog/SKILL.md": CHANGELOG_SKILL,
        ".agents/skills/changelog/SKILL.md": CHANGELOG_SKILL,
        ".agents/workflows/release.md": RELEASE_WORKFLOW,
      }),
  },
  {
    id: "orca",
    build: () =>
      shop(SHARED, [
        `orca worktree create --name fix-total --agent codex --prompt "${P_TOTAL}"`,
        `orca worktree create --name euro --agent claude --prompt "${P_EURO}"`,
        'orca worktree set --worktree fix-total --workspace-status in-review --comment "fix ready, tests pass"',
      ]),
  },
  { id: "codex", build: () => shop({ "AGENTS.md": AGENTS_MD, "~/.codex/config.toml": CODEX_READ_ONLY }) },
];

export const buildSandbox = (id: string) => (SANDBOXES.find((s) => s.id === id) ?? SANDBOXES[0]).build();
