import path from "node:path";

import { expect, test } from "@playwright/test";
import expectedMarkdown from "../tests/fixtures/smoke/expected-markdown.json";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const smokeFixturesDir = path.join(process.cwd(), "tests", "fixtures", "smoke");

const fixtureCases = [
  {
    expectedFormat: "docx",
    filename: "sample.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  {
    expectedFormat: "pptx",
    filename: "sample.pptx",
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  },
  {
    expectedFormat: "xlsx",
    filename: "sample.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  {
    expectedFormat: "pdf",
    filename: "sample.pdf",
    mimeType: "application/pdf",
  },
] as const;

for (const fixtureCase of fixtureCases) {
  test(`smoke converts ${fixtureCase.filename}`, async ({ page }) => {
    let convertRequestBody: Record<string, unknown> | null = null;

    await page.route("**/api/convert", async (route) => {
      convertRequestBody = route.request().postDataJSON() as Record<string, unknown>;

      await route.fulfill({
        body: JSON.stringify({
          detectedFormat: fixtureCase.expectedFormat,
          errorCode: null,
          inputFormat: fixtureCase.expectedFormat,
          markdown: expectedMarkdown[fixtureCase.filename],
          timings: { convertMs: 9, downloadMs: 4, totalMs: 13 },
          warnings: [],
        }),
        contentType: "application/json",
        status: 200,
      });
    });

    await page.goto("/prototype");
    await page.getByLabel("Office file").setInputFiles(path.join(smokeFixturesDir, fixtureCase.filename));
    await page.getByRole("button", { name: "Upload and send reference to convert API" }).click();

    await expect(page.locator(".markdown-card pre")).toContainText(expectedMarkdown[fixtureCase.filename]);
    await expect(page.locator(".result-block")).toContainText(fixtureCase.filename);
    await expect(page.locator(".result-meta")).toContainText(`detectedFormat: ${fixtureCase.expectedFormat}`);
    await expect(page.locator(".result-meta")).toContainText(`inputFormat: ${fixtureCase.expectedFormat}`);

    expect(convertRequestBody).not.toBeNull();
    if (!convertRequestBody) {
      throw new Error("Expected convert request body to be captured.");
    }

    const requestBody = convertRequestBody as {
      fileKey: string;
      idempotencyKey: string;
      mimeType: string;
      originalFilename: string;
      sizeBytes: number;
    };
    expect(requestBody.fileKey).toBe(`mock-${fixtureCase.filename}`);
    expect(requestBody.mimeType).toBe(fixtureCase.mimeType);
    expect(requestBody.originalFilename).toBe(fixtureCase.filename);
    expect(requestBody.sizeBytes).toBeGreaterThan(0);
    expect(typeof requestBody.idempotencyKey).toBe("string");
  });
}

test("smoke returns typed conversion errors for the negative fixture", async ({ page }) => {
  await page.route("**/api/convert", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        errorCode: "conversion_failed",
        message: "MarkItDown conversion failed: fixture exploded",
      }),
      contentType: "application/json",
      status: 422,
    });
  });

  await page.goto("/prototype");
  await page.getByLabel("Office file").setInputFiles(path.join(smokeFixturesDir, "broken.docx"));
  await page.getByRole("button", { name: "Upload and send reference to convert API" }).click();

  await expect(page.locator("p[role='alert']")).toContainText(
    "The converter could not extract markdown from this file.",
  );
});
