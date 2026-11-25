import { expect, test, type Page } from "@playwright/test";
import { seedLearner } from "./helpers";

async function type(page: Page, cmd: string) {
  const input = page.getByRole("textbox", { name: "Command" });
  await input.fill(cmd);
  await input.press("Enter");
}

test("a newcomer goes from the landing page through lesson 1 and into lesson 2", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /start learning/i }).first().click();

  // Welcome tour: language, name, experience, daily goal
  await expect(page).toHaveURL(/\/welcome/);
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByLabel(/your first name/i).fill("Alex");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: /nice to meet you, alex/i })).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("radio", { name: /casual/i }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: "You're all set, Alex!" })).toBeVisible();
  await page.getByRole("button", { name: /start my first lesson/i }).click();
  await expect(page).toHaveURL(/\/learn\/what-is-an-agent/);

  // Discover: step through the agent loop
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  // Try: start Claude Code, ask, exit
  await type(page, "claude");
  await expect(page.getByText("Welcome to Claude Code (simulated)")).toBeVisible();
  await expect(page.getByRole("status").getByText("Nice, Alex!")).toBeVisible();
  await page.getByRole("button", { name: /continue/i }).click();
  await type(page, "Explain this project");
  await expect(page.getByText(/This is Tiny Shop/)).toBeVisible();
  await page.getByRole("button", { name: /continue/i }).click();
  await type(page, "/exit");
  await expect(page.getByText("Left Claude Code. Back to the shell.")).toBeVisible();
  await page.getByRole("button", { name: /continue/i }).click();

  // Experiment → done
  await page.getByRole("button", { name: /done exploring/i }).click();
  await expect(page.getByRole("heading", { name: "Well done, Alex!" })).toBeVisible();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "e2e/screens/celebrate.png" });
  await page.getByRole("link", { name: /next: your first real prompt/i }).click();

  // Lesson 2: two discover scenes, then a vague prompt and the challenge
  await page.getByRole("button", { name: 'claude -p "add a discount"' }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Run", exact: true }).click(); // assisted: claude "add a discount"
  await expect(page.getByText(/Assumed \(context\)/)).toBeVisible();
  await page.getByRole("button", { name: /continue/i }).click();
  await type(page, "Add applyDiscount(totalCents, percent) to @src/cart.ts: 20 means 20% off, never below 0. Add tests and run them.");
  await expect(page.getByText(/tests passed/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /complete lesson/i })).toBeEnabled();
  await page.screenshot({ path: "e2e/screens/first-prompt.png" });
  await page.getByRole("button", { name: /complete lesson/i }).click();
  await expect(page.getByRole("heading", { name: "Well done, Alex!" })).toBeVisible();
});

test("French: the agent answers in French", async ({ page }) => {
  await seedLearner(page, { settings: { locale: "fr", theme: "light", motion: "reduced", terminalMode: "assisted", showStreak: true, dailyGoal: 60 } });
  await page.goto("/playground");
  await type(page, 'claude -p "ajoute une remise"');
  await expect(page.getByText(/Supposé \(contexte\)/)).toBeVisible();
});

test("the reference shows a live example", async ({ page }) => {
  await seedLearner(page);
  await page.goto("/commands");
  await page.getByRole("button", { name: "codex", exact: true }).click();
  await page.getByRole("button", { name: /run it/i }).click();
  await expect(page.getByText(/tests passed/)).toBeVisible();
});
