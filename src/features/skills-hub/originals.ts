/**
 * Skills written for IA Dev Learn. Free to copy into any project: each one is
 * a complete SKILL.md, tested against the course's rules for good skills
 * (kebab-case name matching the folder, a "Use when" description, numbered steps).
 */
export const ORIGINAL_SKILLS: Record<string, string> = {
  "commit-message": `---
name: commit-message
description: Write a Conventional Commits message for the staged changes. Use when the user asks to commit, write a commit message, or describe what changed before committing.
---

# Commit message

1. Read the staged diff with \`git diff --staged\`. If nothing is staged, say so and stop.
2. Pick one type: feat, fix, docs, test, refactor, perf, build, chore.
3. Add a scope when one folder or module is affected, e.g. \`fix(cart):\`.
4. Write the subject in the imperative, 72 characters at most, no final period: \`fix(cart): multiply price by quantity in total\`.
5. If the why isn't obvious from the subject, add a body after a blank line: what was wrong, and why this change fixes it. Wrap at 72 characters.
6. Mention breaking changes with a \`BREAKING CHANGE:\` footer.
7. Show the message and ask before running \`git commit\`. Never commit files the user didn't stage.
`,
  "code-review": `---
name: code-review
description: Review a diff for bugs, missing tests and broken conventions, and report findings by severity. Use when the user asks for a review, asks "is this ready", or before opening a pull request.
---

# Code review

1. Get the diff: \`git diff\` for unstaged work, \`git diff --staged\`, or \`git diff main...HEAD\` for a branch.
2. Read the project's rules (AGENTS.md, CLAUDE.md) first: conventions there override general taste.
3. For each changed file, check in this order:
   - correctness: wrong conditions, off-by-one, null or empty input, error paths, concurrency;
   - security: secrets, injection, unchecked user input, permissions;
   - tests: is the new behaviour tested, and would the test fail without the fix?
   - conventions: naming, structure, the project's own patterns.
4. Report each finding as: severity (blocker, should fix, nit), file and line, what's wrong, a concrete fix.
5. Don't report style a formatter would fix. Don't rewrite working code to your taste.
6. End with a one-line verdict: ready, ready after fixes, or not ready.
`,
  "write-tests": `---
name: write-tests
description: Add focused unit tests for a function or module and run them. Use when the user asks to add tests, improve coverage, or prove a bug is fixed.
---

# Write tests

1. Find the test framework and command from package.json, pyproject.toml or the project rules. Don't add a new framework.
2. Put tests next to the existing ones and copy their style (file naming, describe/it, fixtures).
3. Cover, in this order: the normal case, edge cases (empty, zero, maximum, unicode), and the error case.
4. For a bug fix, write the test that reproduces the bug first, run it, and confirm it fails.
5. One behaviour per test, with a name that says what should happen: \`returns 0 for an empty cart\`.
6. Don't mock what you can construct. Mock only network, time and randomness.
7. Run the tests you touched, then the whole suite if it's fast. Report the command and the result.
`,
  "pr-description": `---
name: pr-description
description: Write a pull request title and description from the branch's commits and diff. Use when the user asks to open a PR, write a PR description, or summarise a branch for review.
---

# Pull request description

1. Collect the changes: \`git log --oneline main..HEAD\` and \`git diff --stat main...HEAD\`.
2. Title: imperative, under 70 characters, same convention as the commits.
3. Description, in this order:
   - Why: the problem or the user story, in one or two sentences, with the issue link if there is one.
   - What: the main changes as a short list. Group by area, not by file.
   - How to test: exact commands or clicks a reviewer can follow.
   - Risks: migrations, breaking changes, anything to watch after merging.
4. Mention screenshots for UI changes and leave a placeholder if you can't take them.
5. Keep it short. Reviewers read the diff; the description tells them where to look.
`,
  "bug-repro": `---
name: bug-repro
description: Reproduce a reported bug with a failing test or command before fixing it, then fix it and prove the fix. Use when the user reports a bug, an error message, a crash, or "it doesn't work".
---

# Reproduce, then fix

1. Restate the bug in one sentence: what happens, and what should happen instead.
2. Find the smallest input that shows it. Read the code path; don't guess.
3. Write a failing test (preferred) or a command that shows the bug. Run it and paste the failure.
4. Fix at the point of failure. Prefer a small change to a new abstraction.
5. Run the reproduction again and show it passing, then run the related test suite.
6. If you can't reproduce it, stop and say what you tried. Ask for the exact steps, versions and data.
`,
  changelog: `---
name: changelog
description: Update CHANGELOG.md with the latest changes. Use when the user asks to update the changelog, write release notes or prepare a release.
---

# Changelog

1. Read CHANGELOG.md and the recent changes (\`git log\` since the last release tag).
2. Add a \`## [Unreleased]\` section at the top if there isn't one.
3. Group entries under ### Added, ### Fixed or ### Changed.
4. One line per change, starting with a verb, written for users rather than developers.
5. Don't list internal refactors unless they change behaviour.
`,
  docs: `---
name: docs
description: Keep README.md useful. Use when the user asks to document the project, update the README or explain how to get started.
---

1. Read package.json (or the build file) to find the package manager and scripts.
2. Make sure the README has a \`## Getting started\` section with the install, run and test commands, in a bash code block.
3. Check every command in the README still works. Fix the ones that don't.
4. Keep it short: what the project is in one sentence, how to run it, where things are.
`,
};
