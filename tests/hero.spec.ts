import { expect, test } from "@playwright/test";

test("transformation plays once, holds, compares, pauses and resumes without moving the CTA", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Before", exact: true }),
  ).toBeEnabled();
  const cta = page.getByRole("button", { name: "Discover your possibilities" });
  const originalPosition = await cta.boundingBox();
  await expect(page.locator(".hero-intro")).toHaveCSS("opacity", "1");
  await expect(page.locator(".hero-reimagined")).toHaveCSS("opacity", "0");
  await expect(page.locator(".hero-description")).toHaveCSS("opacity", "0");
  await expect(
    page.getByRole("button", { name: "Replay kitchen transformation" }),
  ).toBeEnabled({ timeout: 15_000 });
  await expect(
    page.getByRole("button", { name: "Reimagined", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const completed = await page
    .locator("canvas")
    .evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL());
  await page.waitForTimeout(1000);
  expect(
    await page
      .locator("canvas")
      .evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL()),
  ).toBe(completed);
  expect(await cta.boundingBox()).toEqual(originalPosition);
  await expect(page.locator(".hero-reimagined")).toHaveCSS("opacity", "1");
  await expect(page.locator(".hero-description")).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: "output/previews/desktop-after.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Before", exact: true }).click();
  // Comparing the original kitchen must not hide copy that was already read.
  await expect(page.locator(".hero-reimagined")).toHaveCSS("opacity", "1");
  await expect(page.locator(".hero-description")).toHaveCSS("opacity", "1");
  await expect(page.locator(".scene-caption")).toContainText(
    "An everyday kitchen",
  );
  expect(
    await page
      .locator("canvas")
      .evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL()),
  ).not.toBe(completed);
  await page.screenshot({ path: "output/previews/desktop-before.png" });
  await page
    .getByRole("button", { name: "Resume kitchen transformation" })
    .click();
  await page.waitForTimeout(3300);
  await page
    .getByRole("button", { name: "Pause kitchen transformation" })
    .click();
  const paused = await page
    .locator("canvas")
    .evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL());
  await page.waitForTimeout(300);
  expect(
    await page
      .locator("canvas")
      .evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL()),
  ).toBe(paused);
  await page.screenshot({ path: "output/previews/desktop-transforming.png" });
  await page
    .getByRole("button", { name: "Resume kitchen transformation" })
    .click();
  await expect(
    page.getByRole("button", { name: "Replay kitchen transformation" }),
  ).toBeEnabled({ timeout: 10_000 });
  expect(errors).toEqual([]);
});

test("reduced motion shows the final kitchen without downloading the before image", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Before", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Replay kitchen transformation" }),
  ).toBeDisabled();
  await expect(page.locator(".playback-button")).toHaveText("Still view");
  await expect(page.locator("canvas")).toBeHidden();
  await expect(page.locator(".kitchen-poster")).toBeVisible();
  for (const copy of await page.locator(".hero-copy-reveal").all()) {
    await expect(copy).toHaveCSS("opacity", "1");
    await expect(copy).toHaveCSS("transform", "none");
  }
  expect(requests.some((url) => url.includes("kitchen-before"))).toBe(false);
});

test("headline reveal pauses with the kitchen and supporting copy follows the final reveal", async ({ page }) => {
  await page.goto("/");
  const cta = page.getByRole("button", { name: "Discover your possibilities" });
  await expect(page.getByRole("button", { name: "Before", exact: true })).toBeEnabled();
  const position = await cta.boundingBox();
  await expect(page.locator(".scene-caption")).toContainText("The finishing touches", { timeout: 9000 });
  await page.getByRole("button", { name: "Pause kitchen transformation" }).click();
  const revealOpacity = await page.locator(".hero-reimagined").evaluate(element => getComputedStyle(element).opacity);
  expect(Number(revealOpacity)).toBeLessThan(1);
  await page.waitForTimeout(600);
  await expect(page.locator(".hero-reimagined")).toHaveCSS("opacity", revealOpacity);
  await expect(page.locator(".hero-description")).toHaveCSS("opacity", "0");
  expect(await cta.boundingBox()).toEqual(position);
  await page.getByRole("button", { name: "Resume kitchen transformation" }).click();
  await expect(page.locator(".hero-description")).toHaveCSS("opacity", "1");
  await expect(page.locator(".hero-reimagined")).toHaveCSS("opacity", "1");
  expect(await cta.boundingBox()).toEqual(position);
});

test("all hero copy remains readable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3100/");
  for (const copy of await page.locator(".hero-copy-reveal").all()) {
    await expect(copy).toHaveCSS("opacity", "1");
    await expect(copy).toHaveCSS("transform", "none");
  }
  await context.close();
});

test("mobile keeps its layout inside the viewport and navigation works", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Before", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Reimagined", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "output/previews/mobile-after.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "The process" })
    .click();
  await expect(page).toHaveURL(/#process$/);
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("the CTA opens an accessible brief dialog and downloads the entered details", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Discover your possibilities" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("Your name").fill("Alex Test");
  await page.getByLabel("Email address").fill("alex@example.com");
  await page
    .getByLabel("What would you love to change?")
    .fill("More useful storage and warm lighting.");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save my design brief" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("my-divora-design-brief.txt");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  expect(text).toContain("Alex Test");
  expect(text).toContain("More useful storage and warm lighting.");
  await expect(page.getByRole("status")).toContainText(
    "Your design brief has been downloaded",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("an unavailable before asset leaves the finished kitchen and CTA usable", async ({
  page,
}) => {
  await page.route("**/images/kitchen-before-v3.webp", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator(".playback-button")).toHaveText("Still view");
  await expect(page.locator(".kitchen-poster")).toBeVisible();
  await page
    .getByRole("button", { name: "Discover your possibilities" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
