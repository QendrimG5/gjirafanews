/**
 * ============================================================================
 * Playwright Configuration
 * ============================================================================
 *
 * This file tells Playwright HOW to run the E2E tests:
 *   - Which browser to use (Chromium)
 *   - What base URL to test against (localhost:3000)
 *   - How to start the dev server automatically before tests run
 *   - Timeouts, retries, screenshot/video settings
 */

// defineConfig is Playwright's typed config helper.
// It provides autocomplete and type checking for all config options.
import { defineConfig } from "@playwright/test";

export default defineConfig({

  // ─── testDir ────────────────────────────────────────────────────────────
  // Where Playwright looks for test files.
  // All files matching *.spec.ts inside this directory will be discovered.
  testDir: "./e2e",

  // ─── timeout ────────────────────────────────────────────────────────────
  // Maximum time (ms) each individual test can run before Playwright kills it.
  // 60 seconds is generous — most tests finish in 5-15 seconds.
  // Long timeout accounts for slow CI machines or first-load compilation.
  timeout: 60_000,

  // ─── expect.timeout ─────────────────────────────────────────────────────
  // Maximum time (ms) for each expect() assertion to resolve.
  // Playwright assertions auto-retry until this timeout.
  // Example: expect(locator).toBeVisible() retries for up to 10 seconds.
  expect: {
    timeout: 10_000,
  },

  // ─── fullyParallel ──────────────────────────────────────────────────────
  // false = tests within a file run sequentially (in order).
  // We need this because our tests are a FLOW: login → create → verify.
  // Each step depends on the previous step's state.
  fullyParallel: false,

  // ─── retries ────────────────────────────────────────────────────────────
  // Number of times to retry a failed test. 0 = no retries.
  // For E2E tests, retries can mask real bugs — keep at 0 during development.
  retries: 0,

  // ─── reporter ───────────────────────────────────────────────────────────
  // "list" prints each test name with pass/fail status as they run.
  // Other options: "html" (generates an HTML report), "dot" (minimal).
  reporter: "list",

  // ─── use ────────────────────────────────────────────────────────────────
  // Shared settings applied to ALL tests in every project.
  use: {
    // baseURL lets you write page.goto("/login") instead of the full URL.
    // Playwright prepends this to all relative URLs.
    baseURL: "http://localhost:3000",

    // Capture a screenshot ONLY when a test fails.
    // Screenshots are saved next to the test file for debugging.
    screenshot: "on",

    // Record a video ONLY when a test fails (retains the last attempt).
    // Videos show exactly what the browser did — invaluable for debugging.
    video: "retain-on-failure",

    // trace: "retain-on-failure" saves a Playwright Trace on failure.
    // Traces include DOM snapshots, network requests, console logs, and
    // a step-by-step timeline. Open with: npx playwright show-trace trace.zip
    trace: "retain-on-failure",
  },

  // ─── projects ───────────────────────────────────────────────────────────
  // Each project defines a browser to test with.
  // We only use Chromium (Chrome) — add Firefox/WebKit here for cross-browser.
  projects: [
    {
      name: "chromium",
      use: {
        // browserName tells Playwright which browser engine to launch.
        // "chromium" = Chrome/Edge engine. Fastest and most common.
        browserName: "chromium",
      },
    },
  ],

  // ─── webServer ──────────────────────────────────────────────────────────
  // Playwright can automatically start your dev server before running tests
  // and shut it down after. This means you don't need to manually run
  // `npm run dev` in another terminal.
  webServer: {
    // The command to start the development server.
    command: "npm run dev",

    // The URL Playwright waits for before starting tests.
    // It polls this URL until it responds with 200 OK.
    url: "http://localhost:3000",

    // Maximum time (ms) to wait for the server to start.
    // Next.js compiles on first request, so 30 seconds is safe.
    timeout: 30_000,

    // reuseExistingServer: true means if localhost:3000 is already running
    // (e.g., you have `npm run dev` open), Playwright uses that instead
    // of starting a new one. Saves startup time during development.
    reuseExistingServer: true,
  },
});
