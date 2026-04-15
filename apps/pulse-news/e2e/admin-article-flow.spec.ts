/**
 * ============================================================================
 * E2E TEST: Full admin article flow — Playwright
 * ============================================================================
 *
 * This is a REAL browser test. Playwright launches an actual Chromium browser,
 * navigates to pages, types into inputs, clicks buttons, and verifies what
 * appears on screen — exactly like a human user would.
 *
 * THE FLOW BEING TESTED:
 *   1. Open the homepage → verify it loads
 *   2. Navigate to the login page
 *   3. Login with admin@gjirafanews.com / admin123
 *   4. Verify we land on the admin dashboard
 *   5. Navigate to "New Article" form
 *   6. Fill in all fields with test article data
 *   7. Submit the form
 *   8. Verify the article appears in the admin dashboard table
 *   9. Navigate to the public homepage
 *  10. Verify the newly created article is visible to public users
 *
 * WHY E2E tests matter:
 *   Unit tests verify individual pieces work. E2E tests verify the FULL FLOW
 *   works from the user's perspective — real browser, real network requests,
 *   real DOM. This catches integration bugs that unit tests miss.
 */

// ─── Imports ────────────────────────────────────────────────────────────────

// test: defines a test case (like Jest's `test()` but for Playwright)
// expect: assertion library (like Jest's `expect()` but with auto-retry)
// Page: TypeScript type for the browser page object
import { test, expect, Page } from "@playwright/test";

// ─── Test Data ──────────────────────────────────────────────────────────────
// The article we'll create during the test. Using a unique title with a
// timestamp ensures no collision with existing seed data articles.

const TEST_ARTICLE = {
  title: `E2E Test Artikull ${Date.now()}`,
  summary: "Ky eshte nje artikull testues i krijuar nga Playwright E2E testi per te verifikuar procesin e plote.",
  content:
    "Permbajtja e plote e artikullit testues. Ky artikull u krijua automatikisht nga suite-i i testeve Playwright per te verifikuar qe procesi i krijimit te artikujve funksionon sakte nga fillimi deri ne fund.",
  imageUrl: "https://picsum.photos/seed/e2etest/800/400",
  category: "Teknologji",   // visible dropdown label
  source: "Telegrafi",       // visible dropdown label
  readTime: "4",
};

// ─── Credentials ────────────────────────────────────────────────────────────
const ADMIN_EMAIL = "admin@gjirafanews.com";
const ADMIN_PASSWORD = "admin123";

// ═══════════════════════════════════════════════════════════════════════════════
// test.describe groups related tests into a suite.
// All tests inside share the same describe label in the output.
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("Admin article creation flow", () => {

  // ─── test.describe.configure ──────────────────────────────────────────────
  // mode: "serial" forces tests in this block to run one after another,
  // in the exact order they're written. This is critical because each test
  // depends on the state left by the previous test:
  //   login → depends on being on /login
  //   create article → depends on being logged in
  //   verify on homepage → depends on article being created
  //
  // If one test fails, all subsequent tests are SKIPPED (not run with stale state).
  test.describe.configure({ mode: "serial" });

  // ─── Shared page variable ────────────────────────────────────────────────
  // We declare `page` outside the tests so all tests in this describe block
  // share the SAME browser page (same tab, same cookies, same session).
  // This is how we maintain login state across tests.
  let page: Page;

  // ─── test.beforeAll ───────────────────────────────────────────────────────
  // Runs ONCE before all tests in this block. We create a new browser page here.
  //
  // { browser } is destructured from the test fixtures Playwright provides.
  // browser is the launched Chromium instance.
  test.beforeAll(async ({ browser }) => {
    // browser.newPage() opens a new tab in the browser.
    // This is the tab we'll use for all tests in this suite.
    // All cookies, localStorage, and session state persist across tests.
    page = await browser.newPage();
  });

  // ─── test.afterAll ────────────────────────────────────────────────────────
  // Runs ONCE after all tests finish. Closes the browser page to free resources.
  test.afterAll(async () => {
    // page.close() closes the tab and cleans up memory.
    await page.close();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 1: Homepage loads
  // ═══════════════════════════════════════════════════════════════════════════

  test("Step 1: Homepage should load and display the GjirafaNews brand", async () => {
    // ── page.goto(url) ──────────────────────────────────────────────────────
    // Navigates the browser to the given URL. "/" is relative to baseURL
    // configured in playwright.config.ts (http://localhost:3000).
    // Playwright waits until the page fires the "load" event by default.
    await page.goto("/");

    // ── page.locator(selector) ──────────────────────────────────────────────
    // Creates a Locator — a pointer to an element(s) on the page.
    // Locators are LAZY: they don't query the DOM until you call an action
    // or assertion on them. This means they auto-retry if the element
    // isn't there yet (e.g., still loading).
    //
    // 'header' is a CSS selector that finds the <header> element.
    const header = page.locator("header");

    // ── expect(locator).toBeVisible() ───────────────────────────────────────
    // Asserts the element is visible in the viewport (not hidden, not display:none).
    // This is an AUTO-RETRYING assertion: Playwright retries every 100ms
    // until the element becomes visible OR the timeout (10s) expires.
    // This is fundamentally different from Jest — no manual waitFor() needed.
    await expect(header).toBeVisible();

    // ── locator.getByText(text) ─────────────────────────────────────────────
    // Finds a child element that contains the given text.
    // "Gjirafa" appears in the navbar brand logo.
    await expect(header.getByText("Gjirafa")).toBeVisible();

    // ── page.title() ────────────────────────────────────────────────────────
    // Returns the <title> tag content of the current page.
    // toContain checks if the string includes the expected substring.
    const title = await page.title();
    expect(title).toContain("GjirafaNews");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 2: Navigate to login page
  // ═══════════════════════════════════════════════════════════════════════════

  test("Step 2: Navigate to the login page", async () => {
    // ── page.goto("/login") ─────────────────────────────────────────────────
    // Direct navigation to the login page URL.
    // We go directly instead of clicking the nav link to be reliable —
    // the nav link might be hidden on mobile viewport sizes.
    await page.goto("/login");

    // ── page.getByRole(role, { name }) ──────────────────────────────────────
    // getByRole is the PREFERRED way to find elements in Playwright.
    // It queries elements by their ARIA role + accessible name.
    // role: "heading" matches <h1>, <h2>, etc.
    // { name: "..." } filters by the heading's text content.
    //
    // "Kyqu ne GjirafaNews" = Albanian for "Login to GjirafaNews"
    // This is the <h1> on the login page.
    await expect(
      page.getByRole("heading", { name: "Kyqu ne GjirafaNews" })
    ).toBeVisible();

    // ── page.getByLabel(label) ──────────────────────────────────────────────
    // Finds an <input> by its associated <label> text.
    // This uses the label-input association (htmlFor/id or nesting).
    // "Email" matches <label>Email</label> → finds its <input>.
    await expect(page.getByLabel("Email")).toBeVisible();

    // "Fjalekalimi" = Albanian for "Password"
    await expect(page.getByLabel("Fjalekalimi")).toBeVisible();

    // ── page.getByRole("button", { name }) ──────────────────────────────────
    // Finds a <button> element by its text content.
    // "Kyqu" = Albanian for "Login"
    await expect(
      page.getByRole("button", { name: "Kyqu" })
    ).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 3: Login with admin credentials
  // ═══════════════════════════════════════════════════════════════════════════

  test("Step 3: Login with admin@gjirafanews.com / admin123", async () => {
    // ── locator.fill(value) ─────────────────────────────────────────────────
    // fill() clears the input first, then types the value.
    // It's more reliable than .type() because it:
    //   1. Focuses the input
    //   2. Selects all existing text
    //   3. Replaces it with the new value
    //   4. Fires all input/change events
    //
    // We use getByLabel to find inputs by their label text — this is
    // accessible and matches how screen readers identify form fields.
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Fjalekalimi").fill(ADMIN_PASSWORD);

    // ── locator.click() ─────────────────────────────────────────────────────
    // Simulates a mouse click on the element. Playwright:
    //   1. Scrolls the element into view (if needed)
    //   2. Waits until it's clickable (visible, enabled, not obscured)
    //   3. Clicks the center of the element
    //
    // Click the "Kyqu" (Login) button to submit the form.
    await page.getByRole("button", { name: "Kyqu" }).click();

    // ── page.waitForURL(pattern) ────────────────────────────────────────────
    // Blocks until the browser URL matches the given pattern.
    // After successful login, the app calls router.push("/admin").
    // "**/admin" uses a glob pattern: ** matches anything before "/admin".
    // This confirms the login succeeded and we were redirected.
    await page.waitForURL("**/admin");

    // ── expect(page).toHaveURL(pattern) ─────────────────────────────────────
    // Asserts the current page URL matches. /\/admin/ is a regex.
    // Double-checking after waitForURL to be explicit in the test output.
    await expect(page).toHaveURL(/\/admin/);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 4: Verify admin dashboard loaded
  // ═══════════════════════════════════════════════════════════════════════════

  test("Step 4: Admin dashboard should display with article list", async () => {
    // ── Verify the page heading "Artikujt" (Articles) ───────────────────────
    // The admin dashboard has an <h1> with text "Artikujt".
    await expect(
      page.getByRole("heading", { name: "Artikujt" })
    ).toBeVisible();

    // ── Verify the "New Article" button exists ──────────────────────────────
    // The admin dashboard has a link "+ Artikull i ri" (New article).
    // There are TWO such links (one in admin bar, one in dashboard heading).
    // .first() resolves the strict mode violation by picking the first match.
    await expect(
      page.getByRole("link", { name: "+ Artikull i ri" }).first()
    ).toBeVisible();

    // ── Verify the admin bar shows the user name ────────────────────────────
    // The admin layout shows the logged-in user's name in the top bar.
    // getByText("Admin") finds any element containing "Admin".
    // .first() takes the first match if there are multiple.
    await expect(page.getByText("Admin Panel").first()).toBeVisible();

    // ── Verify the table header exists ──────────────────────────────────────
    // The article table has column headers. "Titulli" = "Title" column.
    await expect(page.getByText("Titulli").first()).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 5: Navigate to create article form
  // ═══════════════════════════════════════════════════════════════════════════

  test("Step 5: Navigate to 'New Article' page", async () => {
    // ── Click the "+ Artikull i ri" link ─────────────────────────────────────
    // This navigates from /admin to /admin/articles/new.
    // We use .first() because there are two "new article" links in the admin
    // layout (one in the admin bar, one in the dashboard heading).
    await page.getByRole("link", { name: "+ Artikull i ri" }).first().click();

    // ── Wait for the URL to change ──────────────────────────────────────────
    await page.waitForURL("**/admin/articles/new");

    // ── Verify the form page heading ────────────────────────────────────────
    // "Artikull i ri" = "New article" — the heading of the create form page.
    await expect(
      page.getByRole("heading", { name: "Artikull i ri" })
    ).toBeVisible();

    // ── Verify form fields are present ──────────────────────────────────────
    // Check that key form labels are rendered (the form loaded correctly).
    await expect(page.getByText("Titulli *")).toBeVisible();
    await expect(page.getByText("Permbledhja *")).toBeVisible();
    await expect(page.getByText("Permbajtja *")).toBeVisible();
    await expect(page.getByText("Kategoria *")).toBeVisible();
    await expect(page.getByText("Burimi *")).toBeVisible();

    // ── Verify the submit button ────────────────────────────────────────────
    // "Krijo artikullin" = "Create the article" — the submit button label.
    await expect(
      page.getByRole("button", { name: "Krijo artikullin" })
    ).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 6: Fill in the article form
  // ═══════════════════════════════════════════════════════════════════════════

  test("Step 6: Fill in all article form fields with test data", async () => {
    // ── TITLE FIELD ─────────────────────────────────────────────────────────
    // page.locator("input[type='text']").first() finds the first text input,
    // which is the title field (it's the first <input type="text"> in the form).
    //
    // .fill(value) clears existing content and types the new value.
    await page.locator("input[type='text']").first().fill(TEST_ARTICLE.title);

    // ── SUMMARY FIELD ───────────────────────────────────────────────────────
    // The summary is a <textarea> — the first one in the form (rows={2}).
    // locator("textarea").first() finds it.
    await page.locator("textarea").first().fill(TEST_ARTICLE.summary);

    // ── CONTENT FIELD ───────────────────────────────────────────────────────
    // The content is the second <textarea> (rows={8}).
    // .nth(1) selects the second match (0-indexed).
    await page.locator("textarea").nth(1).fill(TEST_ARTICLE.content);

    // ── IMAGE URL FIELD ─────────────────────────────────────────────────────
    // The image URL input has a placeholder attribute we can target.
    // getByPlaceholder finds an input by its placeholder text.
    await page
      .getByPlaceholder("https://picsum.photos/seed/example/800/400")
      .fill(TEST_ARTICLE.imageUrl);

    // ── CATEGORY DROPDOWN ───────────────────────────────────────────────────
    // page.locator("select").first() finds the first <select> element.
    //
    // .selectOption({ label: "Teknologji" }) selects the <option> whose
    // visible text matches "Teknologji". This is different from .fill() —
    // dropdowns need selectOption to properly trigger the change event.
    //
    // { label: "..." } matches the visible text of the <option>.
    // You can also use { value: "cat-3" } to match by the value attribute.
    await page.locator("select").first().selectOption({
      label: TEST_ARTICLE.category,
    });

    // ── SOURCE DROPDOWN ─────────────────────────────────────────────────────
    // Second <select> element — the source dropdown.
    await page.locator("select").nth(1).selectOption({
      label: TEST_ARTICLE.source,
    });

    // ── READ TIME FIELD ─────────────────────────────────────────────────────
    // The read time input is <input type="number">.
    // locator("input[type='number']") targets it specifically.
    await page.locator("input[type='number']").fill(TEST_ARTICLE.readTime);

    // ── VERIFY: all fields have the expected values ─────────────────────────
    // toHaveValue checks the current value attribute of the input.
    // This confirms our fill() calls actually worked.
    await expect(page.locator("input[type='text']").first()).toHaveValue(
      TEST_ARTICLE.title
    );
    await expect(page.locator("textarea").first()).toHaveValue(
      TEST_ARTICLE.summary
    );
    await expect(page.locator("textarea").nth(1)).toHaveValue(
      TEST_ARTICLE.content
    );
    await expect(page.locator("input[type='number']")).toHaveValue(
      TEST_ARTICLE.readTime
    );
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 7: Submit the article form
  // ═══════════════════════════════════════════════════════════════════════════

  test("Step 7: Submit the form and get redirected to admin dashboard", async () => {
    // ── Click the submit button ─────────────────────────────────────────────
    // "Krijo artikullin" = "Create the article" button.
    // After clicking, the component:
    //   1. Sends POST /api/articles with the form data
    //   2. On success, invalidates the articles cache
    //   3. Calls router.push("/admin") to redirect
    await page.getByRole("button", { name: "Krijo artikullin" }).click();

    // ── Wait for redirect back to admin dashboard ───────────────────────────
    // The new article page redirects to /admin after successful creation.
    // We wait for the URL to match the admin dashboard pattern.
    // timeout: 15000 gives extra time for the API call + redirect.
    await page.waitForURL("**/admin", { timeout: 15_000 });

    // ── Verify we're back on the dashboard ──────────────────────────────────
    await expect(page).toHaveURL(/\/admin$/);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 8: Verify article appears in admin dashboard
  // ═══════════════════════════════════════════════════════════════════════════

  test("Step 8: Newly created article should appear in the admin table", async () => {
    // ── Wait for the dashboard heading to confirm page loaded ───────────────
    await expect(
      page.getByRole("heading", { name: "Artikujt" })
    ).toBeVisible();

    // ── page.getByText(text) ────────────────────────────────────────────────
    // Finds ANY element on the page containing the given text.
    // Our test article title is unique (includes Date.now()), so there's
    // exactly one match. The title appears in a <td> inside the table.
    //
    // .first() is a safety measure in case the text appears elsewhere.
    const articleInTable = page.getByText(TEST_ARTICLE.title).first();

    // ── expect(locator).toBeVisible() ───────────────────────────────────────
    // Auto-retries for up to 10 seconds (configured in playwright.config.ts).
    // The table data might still be loading when this assertion first runs —
    // Playwright's auto-retry handles the async data fetch gracefully.
    await expect(articleInTable).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 9: Verify article exists via the public API
  // ═══════════════════════════════════════════════════════════════════════════

  test("Step 9: Verify the article exists via the public GET /api/articles", async () => {
    // ── page.request.get(url) ───────────────────────────────────────────────
    // Playwright's built-in API testing. page.request sends HTTP requests
    // using the SAME cookies/session as the browser page.
    // This hits GET /api/articles which returns all articles as JSON.
    const response = await page.request.get("/api/articles");

    // ── expect(response).toBeOK() ───────────────────────────────────────────
    // Asserts the HTTP status code is 2xx (200-299).
    expect(response.ok()).toBeTruthy();

    // ── response.json() ─────────────────────────────────────────────────────
    // Parses the response body as JSON. Returns the articles array.
    const articles = await response.json();

    // ── Array.find() to locate our test article ─────────────────────────────
    // Search the returned articles for our unique title.
    // find() returns the first match or undefined if not found.
    const created = articles.find(
      (a: { title: string }) => a.title === TEST_ARTICLE.title
    );

    // ── expect(created).toBeDefined() ───────────────────────────────────────
    // If the article wasn't found, `created` is undefined and the test fails.
    // This proves the API route returns our newly created article.
    expect(created).toBeDefined();

    // ── Verify the article fields match what we submitted ───────────────────
    expect(created.summary).toEqual(TEST_ARTICLE.summary);
    expect(created.category.name).toEqual(TEST_ARTICLE.category);
    expect(created.source.name).toEqual(TEST_ARTICLE.source);
    expect(created.readTime).toEqual(Number(TEST_ARTICLE.readTime));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 10: Navigate to category page and verify article is visible
  // ═══════════════════════════════════════════════════════════════════════════

  test("Step 10: Article should be visible on the public category page", async () => {
    // ── Navigate to the "Teknologji" category page ──────────────────────────
    // /category/teknologji is a CLIENT component ("use client") that fetches
    // articles via TanStack Query → GET /api/articles?category=teknologji.
    // Unlike the homepage (which is a Server Component that may be cached),
    // this page always fetches fresh data from the API.
    await page.goto("/category/teknologji");

    // ── Verify the category page loaded ─────────────────────────────────────
    // The category page shows the category name as a heading.
    await expect(
      page.getByRole("heading", { name: "Teknologji" })
    ).toBeVisible();

    // ── Find and verify our article ─────────────────────────────────────────
    // page.getByText finds any element containing our unique article title.
    // .first() picks the first match (there should be exactly one).
    const articleOnPage = page.getByText(TEST_ARTICLE.title).first();

    // ── expect(locator).toBeVisible() ───────────────────────────────────────
    // Auto-retries until the element appears (the API fetch is async).
    // This proves the article is visible to public users on the category page.
    await expect(articleOnPage).toBeVisible();

    // ── Verify the article's category badge is shown ────────────────────────
    await expect(page.getByText(TEST_ARTICLE.category).first()).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 11: Click into the article detail page
  // ═══════════════════════════════════════════════════════════════════════════

  test("Step 11: Click the article to open its detail page", async () => {
    // ── Click the article title ─────────────────────────────────────────────
    // The title inside a NewsCard is wrapped in a <Link> to /article/{id}.
    // Clicking it navigates to the full article detail page.
    // The article detail page is "use client" — fetches via the API.
    await page.getByText(TEST_ARTICLE.title).first().click();

    // ── Wait for the article detail page URL ────────────────────────────────
    // /article/{id} — the ID is dynamic so we use a regex.
    // /\/article\// matches any URL containing "/article/"
    await page.waitForURL(/\/article\//);

    // ── Verify the article title is displayed as the page heading ────────────
    // On the detail page, the title renders in a large <h1>.
    await expect(
      page.getByRole("heading", { name: TEST_ARTICLE.title })
    ).toBeVisible();

    // ── Verify the summary is displayed ─────────────────────────────────────
    // The summary appears as a highlighted quote block on the detail page.
    await expect(page.getByText(TEST_ARTICLE.summary)).toBeVisible();

    // ── Verify the full content is displayed ────────────────────────────────
    // The content is rendered in the article body section.
    // We check for a substring to avoid issues with whitespace differences.
    await expect(
      page.getByText(TEST_ARTICLE.content.substring(0, 50))
    ).toBeVisible();

    // ── Verify the source name is displayed ─────────────────────────────────
    // The article detail page shows "Burimi: {source name}" at the bottom.
    await expect(page.getByText(TEST_ARTICLE.source).first()).toBeVisible();

    // ── Verify the category badge is displayed ──────────────────────────────
    await expect(
      page.getByText(TEST_ARTICLE.category).first()
    ).toBeVisible();

    // ── Verify read time is displayed ───────────────────────────────────────
    // "{readTime} min lexim" = "4 min read" shown in the metadata section.
    await expect(
      page.getByText(`${TEST_ARTICLE.readTime} min lexim`)
    ).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// BONUS: Login failure test (separate describe — independent from the flow)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("Login failure scenarios", () => {

  test("Should show error with wrong password", async ({ page }) => {
    // ── { page } fixture ────────────────────────────────────────────────────
    // Unlike the serial tests above, this test receives its OWN fresh page
    // from Playwright's built-in fixtures. No shared state — completely isolated.
    await page.goto("/login");

    // ── Fill with correct email but WRONG password ──────────────────────────
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Fjalekalimi").fill("wrongpassword");

    // ── Click login ─────────────────────────────────────────────────────────
    await page.getByRole("button", { name: "Kyqu" }).click();

    // ── Verify error message appears ────────────────────────────────────────
    // The login page shows "Invalid email or password" on failure.
    // This auto-retries because the error appears after the API responds.
    await expect(page.getByText("Invalid email or password")).toBeVisible();

    // ── Verify we're still on the login page (no redirect) ──────────────────
    // toHaveURL asserts the browser hasn't navigated away.
    await expect(page).toHaveURL(/\/login/);
  });

  test("Should show error with non-existent email", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("nobody@test.com");
    await page.getByLabel("Fjalekalimi").fill("admin123");

    await page.getByRole("button", { name: "Kyqu" }).click();

    await expect(page.getByText("Invalid email or password")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
