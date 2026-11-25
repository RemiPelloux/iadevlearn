import { execute, projectWorld, type FileMap, type World } from "@/engine";

/** A lesson's starting world: the Tiny Shop project plus extra files, optionally after some commands. */
export function shop(extra: FileMap = {}, commands: string[] = []): World {
  let w = projectWorld("shop", extra);
  for (const c of commands) {
    const r = execute(w, c);
    if (!r.ok) throw new Error(`Scenario command failed: ${c}\n${r.lines.map((l) => l.text).join("\n")}`);
    w = r.world;
  }
  return w;
}

export const P_DISCOUNT = "Add applyDiscount(totalCents, percent) to @src/cart.ts: 20 means 20% off, never below 0. Add tests and run them.";
export const P_TOTAL = "Fix the total bug in @src/cart.ts: multiply each price by its quantity. Add a test and run the tests.";
export const P_EURO = 'Format prices in euros in @src/price.ts like “12,50 €”. Keep the name formatPrice. Add a test and run it.';

export const AGENTS_MD = `# Tiny Shop

## Commands
- Install: \`pnpm install\`
- Test: \`pnpm test\` (run it after every change)

## Code style
- TypeScript, no \`any\`.
- Prices are integers in cents.
`;

export const BAD_RULES = `Write clean code and follow best practices.
IMPORTANT: ALWAYS be careful!!!
IMPORTANT: NEVER break things.
Use npm for everything.
Make sure the code is good and of high quality.
Prices are in cents.
Use pnpm to install packages.
IMPORTANT: ALWAYS think before you code.
IMPORTANT: MUST be fast.
CRITICAL: do a good job.
`;

export const CHANGELOG_SKILL = `---
name: changelog
description: Update CHANGELOG.md with the latest changes. Use when the user asks to update the changelog, write release notes or prepare a release.
---

# Changelog

1. Read CHANGELOG.md and the recent changes.
2. Add a \`## [Unreleased]\` section at the top if there isn't one.
3. Group entries under ### Added, ### Fixed or ### Changed.
4. One line per change, starting with a verb.
`;

export const SKILL_SKELETON = `---
name: docs
description: TODO
---

`;

export const README_SKILL = `---
name: docs
description: Keep README.md useful. Use when the user asks to document the project, update the README or explain how to get started.
---

1. Read package.json to find the package manager and scripts.
2. Add a \`## Getting started\` section with the install and test commands.
3. Keep it short: commands in a bash code block.
`;

export const RELEASE_WORKFLOW = `---
description: Prepare a release
---

1. Update the changelog: add a \`## [Unreleased]\` section with the latest changes.
2. Run \`pnpm test\` and make sure everything passes.
`;

export const CODEX_READ_ONLY = `# Codex settings (simulated ~/.codex/config.toml)
model_reasoning_effort = "medium"
sandbox_mode = "read-only"
approval_policy = "untrusted"
`;
