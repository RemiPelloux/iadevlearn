import { expect, test } from "@playwright/test";
import { seedLearner } from "./helpers";

test("docs: browse, search, and jump to the lesson that practises a guide", async ({ page }) => {
  await seedLearner(page);
  await page.goto("/docs");
  await expect(page.getByRole("heading", { name: "Documentation", level: 1 })).toBeVisible();
  await page.getByRole("link", { name: /Rules files/ }).first().click();
  await expect(page.getByRole("heading", { name: "Rules files", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Where each tool looks" })).toBeVisible(); // on this page
  await page.getByPlaceholder("Search the docs").fill("sandbox");
  await expect(page.getByRole("link", { name: /Codex: sandbox and approvals/ }).first()).toBeVisible();
  await page.getByRole("link", { name: /Codex: sandbox and approvals/ }).first().click();
  await page.getByRole("link", { name: /Practise it/ }).click();
  await expect(page).toHaveURL(/\/learn\/codex-sandbox/);
});

test("docs: a cheat sheet copies its commands", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await seedLearner(page);
  await page.goto("/docs/cheat-files");
  await expect(page.getByRole("button", { name: "Print" })).toBeVisible();
  await page.getByRole("button", { name: "Copy" }).last().click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("@AGENTS.md");
});

test("profiles: add a second learner, switch back, and back up / restore", async ({ page }) => {
  await seedLearner(page, { name: "Camille", xp: 120 });
  await page.goto("/profile");
  await page.getByRole("button", { name: "Add a profile" }).click();
  await page.getByPlaceholder("First name or nickname").fill("Sam");
  await page.getByRole("button", { name: "Create and start" }).click();
  await expect(page).toHaveURL(/\/welcome/);

  // Sam's fresh profile, then back to Camille from the profile page
  await page.goto("/profile");
  await expect(page.getByLabel("Display name")).toHaveValue("Sam");
  await page.getByRole("button", { name: "Switch to Camille" }).click();
  await expect(page).toHaveURL(/\/learn/);
  await page.goto("/profile");
  await expect(page.getByLabel("Display name")).toHaveValue("Camille");

  // Backup → restore adds a copy as a new profile
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download backup" }).click();
  const file = await (await download).path();
  await page.locator('input[type="file"]').setInputFiles(file!);
  // Restoring reloads the page with a third profile: two others to switch to.
  await expect(page.getByRole("button", { name: /^Switch to (Camille|Sam)$/ })).toHaveCount(2);
  await expect(page.getByLabel("Display name")).toHaveValue("Camille");
});

test("the next control is highlighted during a lesson", async ({ page }) => {
  await seedLearner(page);
  await page.goto("/learn/what-is-an-agent");
  await expect(page.getByRole("button", { name: "Start", exact: true })).toHaveAttribute("data-nudge", "true");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("button", { name: /Run it for me/ })).toHaveAttribute("data-nudge", "true");
  await page.getByRole("button", { name: /Run it for me/ }).click();
  await expect(page.getByRole("button", { name: /Continue/ })).toHaveAttribute("data-nudge", "true");
});
