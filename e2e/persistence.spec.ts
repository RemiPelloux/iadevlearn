import { expect, test, type Page } from "@playwright/test";

async function type(page: Page, cmd: string) {
  const input = page.getByRole("textbox", { name: "Command" });
  await input.fill(cmd);
  await input.press("Enter");
}

test("playground project, terminal and history survive a reload", async ({ page }) => {
  await page.goto("/playground");
  await type(page, 'echo "- Test: `pnpm test` (run it after every change)" > CLAUDE.md');
  await type(page, 'claude -p "Fix the total bug in @src/cart.ts"');
  await expect(page.getByText("Saved locally")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Restored · saved locally")).toBeVisible();
  await expect(page.getByText(/Bash\(pnpm test\)/)).toBeVisible(); // terminal transcript
  await expect(page.getByText("CLAUDE.md").first()).toBeVisible(); // file explorer
  const input = page.getByRole("textbox", { name: "Command" });
  await input.press("ArrowUp"); // command history
  await expect(input).toHaveValue(/Fix the total bug/);

  // choosing a sandbox starts fresh (and that is what gets saved)
  await page.getByLabel("Choose a starting project").selectOption("orca");
  await page.reload();
  await expect(page.getByText("fix ready, tests pass")).toBeVisible();
});

test("an unfinished lesson resumes with its terminal after a reload", async ({ page }) => {
  await page.goto("/learn/what-is-an-agent");
  await page.getByRole("button", { name: "Continue" }).click();
  await type(page, "claude");
  await expect(page.getByText("Welcome to Claude Code (simulated)")).toBeVisible();
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.getByText("Welcome to Claude Code (simulated)")).toBeVisible();
  await expect(page.getByRole("status").getByText("Nice!")).toBeVisible();
});

test("a shared playground link opened from inside the app loads the shared project", async ({ page }) => {
  await page.goto("/commands");
  await page.getByRole("button", { name: "SKILL.md", exact: true }).click();
  await page.getByRole("link", { name: /try it yourself in the playground/i }).click();
  await expect(page).toHaveURL(/playground\/?#s=/);
  await expect(page.getByText("SKILL.md").first()).toBeVisible();
});
