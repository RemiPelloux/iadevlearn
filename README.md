# IA Dev Learn

**Learn to code with AI agents by doing it.** A beginner-friendly, gamified web app in **English and French**, in the style of [Gitverse](https://github.com/RemiPelloux/gitverse). Learners prompt **Claude Code, Codex, Gemini CLI and Antigravity** in a safe simulated terminal, write **rules** (CLAUDE.md, AGENTS.md, GEMINI.md) and **skills** (SKILL.md), and run a **team of agents in parallel with Orca** — while a live view shows what fills each agent's context window, what it had to guess, and what it changed.

**Live:** https://remipelloux.github.io/iadevlearn/ · **Install the real tools:** https://remipelloux.github.io/iadevlearn/setup/

```bash
npm ci
npm run dev        # http://localhost:3000
npm test           # engine + every lesson completable in EN and FR (Vitest)
npm run e2e        # Playwright: desktop + phone journeys (run `npx next build` first)
```

## Curriculum

31 lessons in 9 chapters, each one checked by a test that plays it to the end in English and French.

| # | Chapter | Lessons |
|---|---------|---------|
| 1 | Meet your coding agent | What is a coding agent? · Your first real prompt |
| 2 | The art of prompting | Context is everything · Plan first, then verify · Steer the conversation · Show the agent the evidence |
| 3 | Rules: teach your agent once | What are rules? · One rulebook for every agent · Writing rules that work · Rules for one folder · Cursor's project rules |
| 4 | Skills: know-how on demand | What is a skill? · **Boss:** Forge your own skill · Skills with files and scripts |
| 5 | Codex, Antigravity & co | Codex: sandbox and approvals · Antigravity: rules, skills, workflows · Gemini CLI in depth · Cursor's agent in the terminal |
| 6 | Orca: a team of agents | Parallel agents with worktrees · **Boss:** Conduct a team of agents · A coordinator with tasks and dependencies · Automations: prompts on a schedule |
| 7 | MCP, hooks & subagents | What is MCP? · What MCP servers cost · Hooks: commands that always run · Subagents: delegate and keep your context |
| 8 | Safety & trust | Keep secrets out of the context · Prompt injection · Review the agent's diff |
| 9 | Ship it: real work with agents | Let the agent write the commit · **Boss:** Ship a feature end to end |

Every lesson follows Discover → Watch → Try → Experiment → Challenge → Celebrate, with XP, stars, badges, daily quests and three-level hints. The control to press next pulses gently (a steady outline with reduced motion).

## Docs

`/docs` has three sections, in English and French:

- **Using IA Dev Learn:** start here, how a lesson works, the terminal, reading the Agent view, files and the editor, the Playground, profiles and data, settings and accessibility.
- **Guides:** coding agents, prompting, context windows, plan and verify, rules files, skills, Codex sandbox, Antigravity, Orca, MCP, safety. Each links to the lesson that practises it.
- **Cheat sheets:** every command per tool, where every file lives, a prompt checklist with templates. Printable.

Pages are written in a small Markdown subset (`src/features/guide/markdown.tsx`); `[[Run]]` draws a control name the way it looks in the app. `src/features/guide/__tests__/docs.test.ts` checks links, both languages, and punctuation.

## Profiles and your data

Everything lives in the browser's localStorage; there is no account. The profile page lets several learners share one browser (each with their own progress and Playground), download a JSON backup, restore it as a new profile on another machine, see every stored key with its size, and reset or erase. See `src/features/progress/profiles.ts`.

## Install the real tools (copy-paste)

The `/setup` page has these per OS with copy buttons. Short version:

```bash
# macOS / Linux / WSL — Claude Code (native installer)
curl -fsSL https://claude.ai/install.sh | bash
# Windows PowerShell — Claude Code
irm https://claude.ai/install.ps1 | iex

# Codex (needs Node.js LTS + npm)
npm install -g @openai/codex

# Antigravity CLI (agy): replaced Gemini CLI for personal Google accounts on June 18, 2026
curl -fsSL https://antigravity.google/cli/install.sh | bash        # macOS / Linux
irm https://antigravity.google/cli/install.ps1 | iex               # Windows PowerShell
# Gemini CLI, only for Gemini Code Assist Standard/Enterprise or paid API / Vertex AI keys:
npm install -g @google/gemini-cli

# Orca (macOS) — other systems: https://onorca.dev
brew install --cask stablyai/orca/orca
# Antigravity desktop app: https://antigravity.google/download

# Check
claude --version && codex --version && agy --version
```

## Architecture

```
src/
  engine/            Pure TypeScript simulation. No React, deterministic, JSON state.
    types.ts         World = project files (+ ~/ home files) · agent session · runs · Orca worktrees · MCP · mini Git
    shell.ts         Tokenizer (quotes, >, >>, &&) + dispatcher. While a session is open, input goes to the agent.
    tools.ts         claude / codex / gemini / antigravity CLIs: flags, sessions, slash commands, /init, mcp add
    agent.ts         One agent turn: build context (system, rules, skill index, skill, files, prompt) → plan/act/verify/report
    prompt.ts        Prompt analysis: goal, context, constraints, verify, details, done criteria (EN + FR)
    rules.ts         Where each tool reads rules (+ @imports), directives the agents follow, a rules linter
    skills.ts        SKILL.md frontmatter, validation, progressive-disclosure matching, Antigravity workflows
    projects.ts      The practice project (Tiny Shop) and the tasks agents can do — right version and "guessed" version
    orca.ts          orca worktree/terminal commands and a small Git (status, diff, commit, merge)
  features/
    curriculum/      Chapters and lessons, written once with { en, fr } text. Checks read state, never typed text.
    lab/             Workspace: Agent view (context window, loop, prompt meter, Orca lanes), terminal, files, editor, Run panel
    lesson/          Lesson player and interactive Discover scenes
    setup/           Install guide (/setup) with per-OS copy-paste commands
    guide/           Docs (/docs): content in EN/FR, Markdown renderer, sidebar search, cheat sheets
    progress/        XP, levels, badges, quests, streaks, autosave (localStorage)
    docs/            Reference (/commands) with live before/after examples; also drives the assisted terminal
  i18n/              useT() dictionaries (en.ts, fr.ts) + useL() for inline bilingual text
```

The simulator is deterministic: the same prompt always gives the same result, so learners can see *why* (what was in context, which rule applied, what was assumed). It models the real tools' concepts and file locations; it is clearly labelled as simulated and never calls an AI model.

## Deploying

`.github/workflows/ci.yml` runs typecheck, lint, unit tests, build and Playwright on every push. Every push to `main` runs `.github/workflows/pages.yml`: unit tests, then a static export (`STATIC_EXPORT=1 BASE_PATH=/<repo>`) deployed to GitHub Pages.

Everything is saved in `localStorage` (`iadevlearn-progress`, `iadevlearn-playground`, `iadevlearn-profiles`, and one `iadevlearn-profile:<id>` per parked profile); there is no backend.
