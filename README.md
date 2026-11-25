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

| # | Chapter | Lessons |
|---|---------|---------|
| 1 | Meet your coding agent | What is a coding agent? · Your first real prompt |
| 2 | The art of prompting | Context is everything · Plan first, then verify |
| 3 | Rules: teach your agent once | What are rules? · One rulebook for every agent · Writing rules that work |
| 4 | Skills: know-how on demand | What is a skill? · **Boss:** Forge your own skill |
| 5 | Codex, Antigravity & co | Codex: sandbox and approvals · Antigravity: rules, skills, workflows |
| 6 | Orca: a team of agents | Parallel agents with worktrees · **Boss:** Conduct a team of agents |
| 7–8 | MCP, hooks & subagents · Safety & trust | coming soon |

Every lesson follows Discover → Watch → Try → Experiment → Challenge → Celebrate, with XP, stars, badges, daily quests and three-level hints.

## Install the real tools (copy-paste)

The `/setup` page has these per OS with copy buttons. Short version:

```bash
# macOS / Linux / WSL — Claude Code (native installer)
curl -fsSL https://claude.ai/install.sh | bash
# Windows PowerShell — Claude Code
irm https://claude.ai/install.ps1 | iex

# Codex and Gemini CLI (need Node.js LTS + npm)
npm install -g @openai/codex
npm install -g @google/gemini-cli

# Orca (macOS) — other systems: https://onorca.dev
brew install --cask stablyai/orca/orca
# Antigravity: https://antigravity.google/download

# Check
claude --version && codex --version && gemini --version
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
    progress/        XP, levels, badges, quests, streaks, autosave (localStorage)
    docs/            Reference (/commands) with live before/after examples; also drives the assisted terminal
  i18n/              useT() dictionaries (en.ts, fr.ts) + useL() for inline bilingual text
```

The simulator is deterministic: the same prompt always gives the same result, so learners can see *why* (what was in context, which rule applied, what was assumed). It models the real tools' concepts and file locations; it is clearly labelled as simulated and never calls an AI model.

## Deploying

`.github/workflows/ci.yml` runs typecheck, lint, unit tests, build and Playwright on every push. Every push to `main` runs `.github/workflows/pages.yml`: unit tests, then a static export (`STATIC_EXPORT=1 BASE_PATH=/<repo>`) deployed to GitHub Pages.

Everything is saved in `localStorage` (`iadevlearn-progress`, `iadevlearn-playground`); there is no backend.
