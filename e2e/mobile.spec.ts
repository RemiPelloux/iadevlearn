import { expect, test } from "@playwright/test";
import { seedLearner } from "./helpers";

test("first lesson is completable on a phone", async ({ page }) => {
  await page.goto("/learn/what-is-an-agent");
  await page.getByRole("button", { name: "Continue" }).click();
  // Guide tab is first on mobile; run the suggested commands from the guide.
  await page.getByRole("button", { name: /run it for me/i }).click();
  await expect(page.getByText(/You're in!/)).toBeVisible();
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByRole("button", { name: /run it for me/i }).click();
  await page.getByRole("button", { name: "Terminal" }).click();
  await expect(page.getByText(/This is Tiny Shop/)).toBeVisible();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "e2e/screens/mobile-terminal.png" });
  await page.getByRole("button", { name: "Guide" }).click();
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByRole("button", { name: /run it for me/i }).click();
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByRole("button", { name: /done exploring/i }).click();
  await expect(page.getByRole("heading", { name: "Lesson complete!" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

for (const path of ["/", "/welcome", "/learn", "/commands", "/setup", "/profile", "/playground", "/learn/context-window"]) {
  test(`no horizontal overflow on ${path}`, async ({ page }) => {
    if (path !== "/welcome") await seedLearner(page, { name: "Camille", completed: { "what-is-an-agent": { at: 1, xp: 50, stars: 3 } } });
    await page.goto(path);
    await page.waitForTimeout(800);
    const { inner, visual } = await page.evaluate(() => ({ inner: window.innerWidth, visual: window.visualViewport!.width }));
    expect(inner).toBeLessThanOrEqual(Math.ceil(visual));
  });
}
