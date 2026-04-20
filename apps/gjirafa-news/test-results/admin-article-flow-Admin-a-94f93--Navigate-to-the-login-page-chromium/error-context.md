# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-article-flow.spec.ts >> Admin article creation flow >> Step 2: Navigate to the login page
- Location: e2e/admin-article-flow.spec.ts:140:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Kyqu ne GjirafaNews' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('heading', { name: 'Kyqu ne GjirafaNews' })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "G GjirafaNews" [ref=e4] [cursor=pointer]:
        - /url: /
        - generic [ref=e6]: G
        - generic [ref=e7]: GjirafaNews
      - navigation [ref=e8]:
        - link "Temat" [ref=e9] [cursor=pointer]:
          - /url: /topics
        - 'button "Theme: System. Click to switch." [ref=e10]':
          - img [ref=e11]
        - link "0 artikuj te ruajtur" [ref=e13] [cursor=pointer]:
          - /url: /saved
          - img [ref=e14]
  - main [ref=e16]:
    - generic [ref=e18]:
      - heading "404" [level=1] [ref=e19]
      - heading "This page could not be found." [level=2] [ref=e21]
  - button "Open Next.js Dev Tools" [ref=e27] [cursor=pointer]:
    - img [ref=e28]
  - alert [ref=e31]
```

# Test source

```ts
  57  | // ═══════════════════════════════════════════════════════════════════════════════
  58  | 
  59  | test.describe("Admin article creation flow", () => {
  60  | 
  61  |   // ─── test.describe.configure ──────────────────────────────────────────────
  62  |   // mode: "serial" forces tests in this block to run one after another,
  63  |   // in the exact order they're written. This is critical because each test
  64  |   // depends on the state left by the previous test:
  65  |   //   login → depends on being on /login
  66  |   //   create article → depends on being logged in
  67  |   //   verify on homepage → depends on article being created
  68  |   //
  69  |   // If one test fails, all subsequent tests are SKIPPED (not run with stale state).
  70  |   test.describe.configure({ mode: "serial" });
  71  | 
  72  |   // ─── Shared page variable ────────────────────────────────────────────────
  73  |   // We declare `page` outside the tests so all tests in this describe block
  74  |   // share the SAME browser page (same tab, same cookies, same session).
  75  |   // This is how we maintain login state across tests.
  76  |   let page: Page;
  77  | 
  78  |   // ─── test.beforeAll ───────────────────────────────────────────────────────
  79  |   // Runs ONCE before all tests in this block. We create a new browser page here.
  80  |   //
  81  |   // { browser } is destructured from the test fixtures Playwright provides.
  82  |   // browser is the launched Chromium instance.
  83  |   test.beforeAll(async ({ browser }) => {
  84  |     // browser.newPage() opens a new tab in the browser.
  85  |     // This is the tab we'll use for all tests in this suite.
  86  |     // All cookies, localStorage, and session state persist across tests.
  87  |     page = await browser.newPage();
  88  |   });
  89  | 
  90  |   // ─── test.afterAll ────────────────────────────────────────────────────────
  91  |   // Runs ONCE after all tests finish. Closes the browser page to free resources.
  92  |   test.afterAll(async () => {
  93  |     // page.close() closes the tab and cleans up memory.
  94  |     await page.close();
  95  |   });
  96  | 
  97  |   // ═══════════════════════════════════════════════════════════════════════════
  98  |   // TEST 1: Homepage loads
  99  |   // ═══════════════════════════════════════════════════════════════════════════
  100 | 
  101 |   test("Step 1: Homepage should load and display the GjirafaNews brand", async () => {
  102 |     // ── page.goto(url) ──────────────────────────────────────────────────────
  103 |     // Navigates the browser to the given URL. "/" is relative to baseURL
  104 |     // configured in playwright.config.ts (http://localhost:3000).
  105 |     // Playwright waits until the page fires the "load" event by default.
  106 |     await page.goto("/");
  107 | 
  108 |     // ── page.locator(selector) ──────────────────────────────────────────────
  109 |     // Creates a Locator — a pointer to an element(s) on the page.
  110 |     // Locators are LAZY: they don't query the DOM until you call an action
  111 |     // or assertion on them. This means they auto-retry if the element
  112 |     // isn't there yet (e.g., still loading).
  113 |     //
  114 |     // 'header' is a CSS selector that finds the <header> element.
  115 |     const header = page.locator("header");
  116 | 
  117 |     // ── expect(locator).toBeVisible() ───────────────────────────────────────
  118 |     // Asserts the element is visible in the viewport (not hidden, not display:none).
  119 |     // This is an AUTO-RETRYING assertion: Playwright retries every 100ms
  120 |     // until the element becomes visible OR the timeout (10s) expires.
  121 |     // This is fundamentally different from Jest — no manual waitFor() needed.
  122 |     await expect(header).toBeVisible();
  123 | 
  124 |     // ── locator.getByText(text) ─────────────────────────────────────────────
  125 |     // Finds a child element that contains the given text.
  126 |     // "Gjirafa" appears in the navbar brand logo.
  127 |     await expect(header.getByText("Gjirafa")).toBeVisible();
  128 | 
  129 |     // ── page.title() ────────────────────────────────────────────────────────
  130 |     // Returns the <title> tag content of the current page.
  131 |     // toContain checks if the string includes the expected substring.
  132 |     const title = await page.title();
  133 |     expect(title).toContain("GjirafaNews");
  134 |   });
  135 | 
  136 |   // ═══════════════════════════════════════════════════════════════════════════
  137 |   // TEST 2: Navigate to login page
  138 |   // ═══════════════════════════════════════════════════════════════════════════
  139 | 
  140 |   test("Step 2: Navigate to the login page", async () => {
  141 |     // ── page.goto("/login") ─────────────────────────────────────────────────
  142 |     // Direct navigation to the login page URL.
  143 |     // We go directly instead of clicking the nav link to be reliable —
  144 |     // the nav link might be hidden on mobile viewport sizes.
  145 |     await page.goto("/login");
  146 | 
  147 |     // ── page.getByRole(role, { name }) ──────────────────────────────────────
  148 |     // getByRole is the PREFERRED way to find elements in Playwright.
  149 |     // It queries elements by their ARIA role + accessible name.
  150 |     // role: "heading" matches <h1>, <h2>, etc.
  151 |     // { name: "..." } filters by the heading's text content.
  152 |     //
  153 |     // "Kyqu ne GjirafaNews" = Albanian for "Login to GjirafaNews"
  154 |     // This is the <h1> on the login page.
  155 |     await expect(
  156 |       page.getByRole("heading", { name: "Kyqu ne GjirafaNews" })
> 157 |     ).toBeVisible();
      |       ^ Error: expect(locator).toBeVisible() failed
  158 | 
  159 |     // ── page.getByLabel(label) ──────────────────────────────────────────────
  160 |     // Finds an <input> by its associated <label> text.
  161 |     // This uses the label-input association (htmlFor/id or nesting).
  162 |     // "Email" matches <label>Email</label> → finds its <input>.
  163 |     await expect(page.getByLabel("Email")).toBeVisible();
  164 | 
  165 |     // "Fjalekalimi" = Albanian for "Password"
  166 |     await expect(page.getByLabel("Fjalekalimi")).toBeVisible();
  167 | 
  168 |     // ── page.getByRole("button", { name }) ──────────────────────────────────
  169 |     // Finds a <button> element by its text content.
  170 |     // "Kyqu" = Albanian for "Login"
  171 |     await expect(
  172 |       page.getByRole("button", { name: "Kyqu" })
  173 |     ).toBeVisible();
  174 |   });
  175 | 
  176 |   // ═══════════════════════════════════════════════════════════════════════════
  177 |   // TEST 3: Login with admin credentials
  178 |   // ═══════════════════════════════════════════════════════════════════════════
  179 | 
  180 |   test("Step 3: Login with admin@gjirafanews.com / admin123", async () => {
  181 |     // ── locator.fill(value) ─────────────────────────────────────────────────
  182 |     // fill() clears the input first, then types the value.
  183 |     // It's more reliable than .type() because it:
  184 |     //   1. Focuses the input
  185 |     //   2. Selects all existing text
  186 |     //   3. Replaces it with the new value
  187 |     //   4. Fires all input/change events
  188 |     //
  189 |     // We use getByLabel to find inputs by their label text — this is
  190 |     // accessible and matches how screen readers identify form fields.
  191 |     await page.getByLabel("Email").fill(ADMIN_EMAIL);
  192 |     await page.getByLabel("Fjalekalimi").fill(ADMIN_PASSWORD);
  193 | 
  194 |     // ── locator.click() ─────────────────────────────────────────────────────
  195 |     // Simulates a mouse click on the element. Playwright:
  196 |     //   1. Scrolls the element into view (if needed)
  197 |     //   2. Waits until it's clickable (visible, enabled, not obscured)
  198 |     //   3. Clicks the center of the element
  199 |     //
  200 |     // Click the "Kyqu" (Login) button to submit the form.
  201 |     await page.getByRole("button", { name: "Kyqu" }).click();
  202 | 
  203 |     // ── page.waitForURL(pattern) ────────────────────────────────────────────
  204 |     // Blocks until the browser URL matches the given pattern.
  205 |     // After successful login, the app calls router.push("/admin").
  206 |     // "**/admin" uses a glob pattern: ** matches anything before "/admin".
  207 |     // This confirms the login succeeded and we were redirected.
  208 |     await page.waitForURL("**/admin");
  209 | 
  210 |     // ── expect(page).toHaveURL(pattern) ─────────────────────────────────────
  211 |     // Asserts the current page URL matches. /\/admin/ is a regex.
  212 |     // Double-checking after waitForURL to be explicit in the test output.
  213 |     await expect(page).toHaveURL(/\/admin/);
  214 |   });
  215 | 
  216 |   // ═══════════════════════════════════════════════════════════════════════════
  217 |   // TEST 4: Verify admin dashboard loaded
  218 |   // ═══════════════════════════════════════════════════════════════════════════
  219 | 
  220 |   test("Step 4: Admin dashboard should display with article list", async () => {
  221 |     // ── Verify the page heading "Artikujt" (Articles) ───────────────────────
  222 |     // The admin dashboard has an <h1> with text "Artikujt".
  223 |     await expect(
  224 |       page.getByRole("heading", { name: "Artikujt" })
  225 |     ).toBeVisible();
  226 | 
  227 |     // ── Verify the "New Article" button exists ──────────────────────────────
  228 |     // The admin dashboard has a link "+ Artikull i ri" (New article).
  229 |     // There are TWO such links (one in admin bar, one in dashboard heading).
  230 |     // .first() resolves the strict mode violation by picking the first match.
  231 |     await expect(
  232 |       page.getByRole("link", { name: "+ Artikull i ri" }).first()
  233 |     ).toBeVisible();
  234 | 
  235 |     // ── Verify the admin bar shows the user name ────────────────────────────
  236 |     // The admin layout shows the logged-in user's name in the top bar.
  237 |     // getByText("Admin") finds any element containing "Admin".
  238 |     // .first() takes the first match if there are multiple.
  239 |     await expect(page.getByText("Admin Panel").first()).toBeVisible();
  240 | 
  241 |     // ── Verify the table header exists ──────────────────────────────────────
  242 |     // The article table has column headers. "Titulli" = "Title" column.
  243 |     await expect(page.getByText("Titulli").first()).toBeVisible();
  244 |   });
  245 | 
  246 |   // ═══════════════════════════════════════════════════════════════════════════
  247 |   // TEST 5: Navigate to create article form
  248 |   // ═══════════════════════════════════════════════════════════════════════════
  249 | 
  250 |   test("Step 5: Navigate to 'New Article' page", async () => {
  251 |     // ── Click the "+ Artikull i ri" link ─────────────────────────────────────
  252 |     // This navigates from /admin to /admin/articles/new.
  253 |     // We use .first() because there are two "new article" links in the admin
  254 |     // layout (one in the admin bar, one in the dashboard heading).
  255 |     await page.getByRole("link", { name: "+ Artikull i ri" }).first().click();
  256 | 
  257 |     // ── Wait for the URL to change ──────────────────────────────────────────
```