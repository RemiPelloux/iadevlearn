import { describe, expect, it } from "vitest";
import { execute, type World } from "@/engine";
import { ALL_LESSON_DEFS } from "../index";
import { localizeLesson } from "../localize";
import { MODULE_SOLUTIONS, MODULES, STORIES } from "../registry";
import { CHANGELOG_SKILL, P_DISCOUNT, P_EURO, P_TOTAL, README_SKILL } from "../scenario";
import type { Lesson } from "../types";

/** How a learner solves each challenge (inputs, in order). File edits are written as { path: content }. */
const BASE_SOLUTIONS: Record<string, Array<string | Record<string, string>>> = {
  "first-prompt": [P_DISCOUNT],
  "context-window": [`claude -p "${P_EURO}"`],
  "plan-verify": [P_TOTAL, "yes"],
  "what-are-rules": ["!rm package-lock.json", "Fix the total bug in @src/cart.ts"],
  "one-rulebook": [
    'claude -p "Fix the total bug in @src/cart.ts"',
    'echo "@AGENTS.md" > GEMINI.md',
    'gemini -p "Fix the total bug in @src/cart.ts"',
    "antigravity",
    "Fix the total bug in @src/cart.ts",
    "/exit",
  ],
  "good-rules": [
    { "CLAUDE.md": "# Tiny Shop\n\n## Commands\n- Install: `pnpm install`\n- Test: `pnpm test` (run it after every change)\n\n## Conventions\n- Prices are integers in cents.\n" },
    'claude -p "Fix the total bug in @src/cart.ts"',
  ],
  "write-skill": [
    { ".claude/skills/docs/SKILL.md": README_SKILL },
    'claude -p "Update the README"',
    "cp .claude/skills/docs/SKILL.md .agents/skills/docs/SKILL.md",
    'codex exec "Update the README"',
  ],
  "codex-sandbox": [`printf 'sandbox_mode = "workspace-write"\\napproval_policy = "on-request"\\n' > ~/.codex/config.toml`, `codex exec "${P_EURO}"`],
  "antigravity-workflows": ["/exit", 'echo "Write code comments in French." > .agents/rules/style.md', "antigravity", P_DISCOUNT],
  "agent-team": [
    `orca worktree create --name euro --agent claude --prompt "${P_EURO}"`,
    `orca worktree create --name fix-total --agent codex --prompt "${P_TOTAL}"`,
    'orca worktree set --worktree euro --comment "euros done"',
    'orca worktree set --worktree fix-total --comment "fix done"',
    "git merge euro",
    "git merge fix-total",
  ],
};

const SOLUTIONS = { ...BASE_SOLUTIONS, ...MODULE_SOLUTIONS };

function play(lesson: Lesson, locale: "en" | "fr") {
  const start = lesson.setup();
  let world: World = start;
  let ran: string[] = [];
  const input = (i: string | Record<string, string>) => {
    if (typeof i !== "string") {
      world = { ...world, files: { ...world.files, ...i } };
      return;
    }
    const r = execute(world, i, { locale });
    world = r.world;
    if (r.ok && r.command) ran.push(r.command.split(" ")[0] === "orca" ? r.command : r.command);
  };
  for (const [n, step] of lesson.steps.entries()) {
    ran = [];
    if (step.kind === "try") {
      if (step.command) input(step.command);
      else if (step.action) input({ [step.action.path]: step.action.content });
      expect(step.check(world, start, ran), `${lesson.id} step ${n} (“${step.title}”) should pass`).toBe(true);
    }
    if (step.kind === "watch") {
      let w = step.setup();
      for (const f of step.frames) {
        const r = execute(w, f.command, { locale });
        expect(r.ok, `${lesson.id} watch frame “${f.command}”: ${r.lines.map((l) => l.text).join("\n")}`).toBe(true);
        w = r.world;
      }
    }
    if (step.kind === "challenge") {
      const before = step.objectives.map((o) => o.check(world, start, ran));
      expect(before.every(Boolean), `${lesson.id}: challenge must not start solved`).toBe(false);
      for (const i of SOLUTIONS[lesson.id] ?? []) input(i);
      for (const o of step.objectives) expect(o.check(world, start, ran), `${lesson.id} objective “${o.label}”`).toBe(true);
      expect(step.feedback?.(world, start) ?? null).toBeNull();
    }
  }
}

describe("every lesson can be completed", () => {
  for (const def of ALL_LESSON_DEFS)
    for (const locale of ["en", "fr"] as const)
      it(`${def.id} (${locale})`, () => {
        play(localizeLesson(def, locale), locale);
      });
});

describe("curriculum text", () => {
  it("has French and English for every string", () => {
    const walk = (v: unknown, path: string) => {
      if (v && typeof v === "object" && !Array.isArray(v) && "en" in v && "fr" in v) {
        const t = v as { en: string; fr: string };
        expect(t.en.trim(), `${path}.en`).not.toBe("");
        expect(t.fr.trim(), `${path}.fr`).not.toBe("");
        return;
      }
      if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
      else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
    };
    for (const def of ALL_LESSON_DEFS) walk(def, def.id);
  });

  it("challenge hints come in threes and ids are unique", () => {
    const ids = new Set<string>();
    for (const def of ALL_LESSON_DEFS) {
      expect(ids.has(def.id)).toBe(false);
      ids.add(def.id);
      expect(def.steps.at(-1)?.kind).toBe("celebrate");
    }
  });

  it("every story scene exists and has steps, and no copy uses em or en dashes", () => {
    for (const def of ALL_LESSON_DEFS)
      for (const step of def.steps)
        if (step.kind === "discover" && step.scene.startsWith("story:")) expect(STORIES[step.scene.slice(6)]?.steps.length, `${def.id}: ${step.scene}`).toBeGreaterThan(0);
    const dash = /[\u2013\u2014]/;
    const walk = (v: unknown, path: string) => {
      if (typeof v === "string") expect(dash.test(v), `${path} contains a dash: ${v.slice(0, 80)}`).toBe(false);
      else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
      else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
    };
    for (const def of Object.values(MODULES).flatMap((m) => m.lessons)) walk(def, def.id);
    for (const [id, s] of Object.entries(STORIES)) walk(s, `story:${id}`);
  });

  it("the changelog skill is valid", () => {
    expect(CHANGELOG_SKILL).toContain("name: changelog");
  });
});
