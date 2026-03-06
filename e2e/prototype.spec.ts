import { expect, test } from "@playwright/test";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

test("renders markdown and warnings after a successful conversion", async ({ page }) => {
  let convertRequestBody: Record<string, unknown> | null = null;

  await page.route("**/api/convert", async (route) => {
    convertRequestBody = route.request().postDataJSON() as Record<string, unknown>;

    await route.fulfill({
      body: JSON.stringify({
        detectedFormat: "docx",
        errorCode: null,
        inputFormat: "docx",
        markdown: "# Converted heading\n\nBody copy from the browser smoke test.",
        timings: { convertMs: 9, downloadMs: 4, totalMs: 13 },
        warnings: ["OCR skipped for this fixture."],
      }),
      contentType: "application/json",
      status: 200,
    });
  });

  await page.goto("/prototype");
  await page.getByLabel("Office file").setInputFiles({
    mimeType: DOCX_MIME,
    name: "browser-success.docx",
    buffer: Buffer.from("fixture-docx"),
  });
  await page.getByRole("button", { name: "Upload and send reference to convert API" }).click();

  await expect(page.locator(".markdown-card pre")).toContainText("Converted heading");
  await expect(page.locator(".result-meta")).toContainText("OCR skipped for this fixture.");
  await expect(page.locator(".result-block")).toContainText("browser-success.docx");

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
  expect(requestBody.fileKey).toBe("mock-browser-success.docx");
  expect(requestBody.mimeType).toBe(DOCX_MIME);
  expect(requestBody.originalFilename).toBe("browser-success.docx");
  expect(requestBody.sizeBytes).toBe(12);
  expect(typeof requestBody.idempotencyKey).toBe("string");
});

test("shows a validation error before upload for unsupported files", async ({ page }) => {
  await page.goto("/prototype");
  await page.getByLabel("Office file").setInputFiles({
    mimeType: "text/plain",
    name: "notes.txt",
    buffer: Buffer.from("plain text"),
  });
  await page.getByRole("button", { name: "Upload and send reference to convert API" }).click();

  await expect(page.locator("p[role='alert']")).toContainText("Unsupported file format");
});

test("maps typed conversion errors to user-facing copy", async ({ page }) => {
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
  await page.getByLabel("Office file").setInputFiles({
    mimeType: DOCX_MIME,
    name: "broken.docx",
    buffer: Buffer.from("bad-fixture"),
  });
  await page.getByRole("button", { name: "Upload and send reference to convert API" }).click();

  await expect(page.locator("p[role='alert']")).toContainText(
    "The converter could not extract markdown from this file.",
  );
});
