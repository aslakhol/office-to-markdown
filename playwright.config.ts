import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "NEXT_PUBLIC_PROTOTYPE_UPLOAD_DRIVER=mock pnpm exec next dev -p 3100",
    port: 3100,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
