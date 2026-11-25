import { expect, test } from "@playwright/test";
import { seedLearner } from "./helpers";

test("skills hub: search, open a skill, read its SKILL.md", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await seedLearner(page);
  await page.goto("/skills");
  await expect(page.getByRole("heading", { name: "Skills hub", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: /pelloux-guidelines/ }).click();
  await expect(page.getByText("Pick the simplest fix", { exact: false }).first()).toBeVisible();
  await expect(page.getByText(/mkdir -p \.claude\/skills\/pelloux-guidelines/)).toBeVisible();
  await page.getByRole("radio", { name: "Codex · Antigravity" }).click();
  await expect(page.getByText(/mkdir -p \.agents\/skills\/pelloux-guidelines/)).toBeVisible();
  await page.getByLabel("Search skills").fill("pdf");
  await expect(page.getByRole("button", { name: /^pdf/ }).first()).toBeVisible();
  expect(errors.filter((e) => e.includes("Hydration"))).toEqual([]);
});

test("landing hero: switching to the Orca tab plays its commands", async ({ page }) => {
  await seedLearner(page, { settings: { locale: "en", theme: "light", motion: "reduced", terminalMode: "assisted", showStreak: true, dailyGoal: 60 } });
  await page.goto("/");
  await page.getByRole("tab", { name: /Orca/ }).click();
  await expect(page.getByText(/Two agents, two worktrees/)).toBeVisible();
});

test("Orca replica: create a worktree from the dialog, then message its agent", async ({ page }) => {
  await seedLearner(page);
  await page.goto("/playground");
  await page.getByRole("button", { name: "Create worktree" }).first().click(); // sidebar "+"
  await page.getByRole("button", { name: "Create worktree" }).last().click(); // dialog submit
  await expect(page.getByText("✓ Created worktree fix-total")).toBeVisible();
  await page.getByLabel("Message to the agent in fix-total").fill("Explain this project");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(/orca terminal send --terminal term-fix-total/).first()).toBeVisible();
});
