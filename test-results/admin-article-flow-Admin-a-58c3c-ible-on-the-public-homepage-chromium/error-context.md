# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-article-flow.spec.ts >> Admin article creation flow >> Step 10: Newly created article should be visible on the public homepage
- Location: e2e/admin-article-flow.spec.ts:419:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('E2E Test Artikull 1775585402987').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('E2E Test Artikull 1775585402987').first()

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
        - link "0 artikuj te ruajtur" [ref=e10] [cursor=pointer]:
          - /url: /saved
          - img [ref=e11]
        - link "Admin" [ref=e13] [cursor=pointer]:
          - /url: /admin
  - main [ref=e14]:
    - generic [ref=e17]:
      - link "Te gjitha" [ref=e18] [cursor=pointer]:
        - /url: /
      - link "Politika" [ref=e19] [cursor=pointer]:
        - /url: /category/politika
      - link "Sport" [ref=e20] [cursor=pointer]:
        - /url: /category/sport
      - link "Teknologji" [ref=e21] [cursor=pointer]:
        - /url: /category/teknologji
      - link "Kultura" [ref=e22] [cursor=pointer]:
        - /url: /category/kultura
      - link "Ekonomi" [ref=e23] [cursor=pointer]:
        - /url: /category/ekonomi
      - link "Botë" [ref=e24] [cursor=pointer]:
        - /url: /category/bote
    - generic [ref=e25]:
      - link [ref=e26] [cursor=pointer]:
        - /url: /article/art-2
        - article [ref=e27]:
          - img "Kosova U21 fiton ndeshjen kundër Shqipërisë U21" [ref=e28]
          - button "Ruaj per me vone" [ref=e31]:
            - img [ref=e32]
          - generic [ref=e34]:
            - generic [ref=e35]: Sport
            - heading "Kosova U21 fiton ndeshjen kundër Shqipërisë U21" [level=1] [ref=e36]
            - paragraph [ref=e37]: Një ndeshje e jashtëzakonshme ku ekipi kosovar tregoi lojë të shkëlqyer me rezultat 2-1.
            - generic [ref=e38]:
              - generic [ref=e39]: Telegrafi
              - generic [ref=e40]: ·
              - generic [ref=e41]: 7d
              - generic [ref=e42]: ·
              - generic [ref=e43]: 3 min lexim
      - heading "Me te rejat" [level=2] [ref=e45]
      - generic [ref=e47]:
        - link [ref=e48] [cursor=pointer]:
          - /url: /article/art-3
          - article [ref=e49]:
            - generic [ref=e50]:
              - img "Startup-i kosovar mbledh 5 milion euro investim" [ref=e51]
              - generic [ref=e53]: Teknologji
              - button "Ruaj per me vone" [ref=e55]:
                - img [ref=e56]
            - generic [ref=e58]:
              - heading "Startup-i kosovar mbledh 5 milion euro investim" [level=3] [ref=e59]
              - paragraph [ref=e60]: Kompania e teknologjisë nga Prishtina ka tërhequr investitorë nga Berlini dhe Vjena.
              - generic [ref=e61]:
                - generic [ref=e62]: Koha Ditore
                - generic [ref=e63]: "|"
                - generic [ref=e64]: 7d
                - generic [ref=e65]: "|"
                - generic [ref=e66]: 5 min
        - link [ref=e67] [cursor=pointer]:
          - /url: /article/art-1
          - article [ref=e68]:
            - generic [ref=e69]:
              - img "Qeveria miraton pakon e re ekonomike për vitin 2026" [ref=e70]
              - generic [ref=e72]: Politika
              - button "Ruaj per me vone" [ref=e74]:
                - img [ref=e75]
            - generic [ref=e77]:
              - heading "Qeveria miraton pakon e re ekonomike për vitin 2026" [level=3] [ref=e78]
              - paragraph [ref=e79]: Pakoja e re përfshin masa për përkrahjen e bizneseve të vogla dhe uljen e tatimeve për sektorin e teknologjisë.
              - generic [ref=e80]:
                - generic [ref=e81]: Gazeta Express
                - generic [ref=e82]: "|"
                - generic [ref=e83]: 7d
                - generic [ref=e84]: "|"
                - generic [ref=e85]: 4 min
        - link [ref=e86] [cursor=pointer]:
          - /url: /article/art-5
          - article [ref=e87]:
            - generic [ref=e88]:
              - img "Eksporti i Kosovës rritet për 15% në tremujorin e parë" [ref=e89]
              - generic [ref=e91]: Ekonomi
              - button "Ruaj per me vone" [ref=e93]:
                - img [ref=e94]
            - generic [ref=e96]:
              - heading "Eksporti i Kosovës rritet për 15% në tremujorin e parë" [level=3] [ref=e97]
              - paragraph [ref=e98]: Sektorët e teknologjisë dhe bujqësisë udhëheqin rritjen e eksporteve në tregjet evropiane.
              - generic [ref=e99]:
                - generic [ref=e100]: Gazeta Express
                - generic [ref=e101]: "|"
                - generic [ref=e102]: 7d
                - generic [ref=e103]: "|"
                - generic [ref=e104]: 4 min
        - link [ref=e105] [cursor=pointer]:
          - /url: /article/art-12
          - article [ref=e106]:
            - generic [ref=e107]:
              - img "5G lansohet zyrtarisht në Kosovë" [ref=e108]
              - generic [ref=e110]: Teknologji
              - button "Ruaj per me vone" [ref=e112]:
                - img [ref=e113]
            - generic [ref=e115]:
              - heading "5G lansohet zyrtarisht në Kosovë" [level=3] [ref=e116]
              - paragraph [ref=e117]: Operatorët e telekomit fillojnë ofrimin e shërbimeve 5G në Prishtinë dhe Prizren.
              - generic [ref=e118]:
                - generic [ref=e119]: Klan Kosova
                - generic [ref=e120]: "|"
                - generic [ref=e121]: 7d
                - generic [ref=e122]: "|"
                - generic [ref=e123]: 3 min
        - link [ref=e124] [cursor=pointer]:
          - /url: /article/art-6
          - article [ref=e125]:
            - generic [ref=e126]:
              - img "BE miraton planin e ri për zgjerimin në Ballkanin Perëndimor" [ref=e127]
              - generic [ref=e129]: Botë
              - button "Ruaj per me vone" [ref=e131]:
                - img [ref=e132]
            - generic [ref=e134]:
              - heading "BE miraton planin e ri për zgjerimin në Ballkanin Perëndimor" [level=3] [ref=e135]
              - paragraph [ref=e136]: Plani i ri përfshin kritere të reja dhe afate kohore për integrimin e vendeve të rajonit.
              - generic [ref=e137]:
                - generic [ref=e138]: Koha Ditore
                - generic [ref=e139]: "|"
                - generic [ref=e140]: 8d
                - generic [ref=e141]: "|"
                - generic [ref=e142]: 6 min
        - link [ref=e143] [cursor=pointer]:
          - /url: /article/art-4
          - article [ref=e144]:
            - generic [ref=e145]:
              - img "Festivali Ndërkombëtar i Filmit hapet në Prizren" [ref=e146]
              - generic [ref=e148]: Kultura
              - button "Ruaj per me vone" [ref=e150]:
                - img [ref=e151]
            - generic [ref=e153]:
              - heading "Festivali Ndërkombëtar i Filmit hapet në Prizren" [level=3] [ref=e154]
              - paragraph [ref=e155]: Edicioni i ri sjell mbi 50 filma nga e gjithë bota me fokus në kinematografinë ballkanike.
              - generic [ref=e156]:
                - generic [ref=e157]: Klan Kosova
                - generic [ref=e158]: "|"
                - generic [ref=e159]: 8d
                - generic [ref=e160]: "|"
                - generic [ref=e161]: 3 min
        - link [ref=e162] [cursor=pointer]:
          - /url: /article/art-7
          - article [ref=e163]:
            - generic [ref=e164]:
              - 'img "Prishtina Smart City: Projekti i ri i digjitalizimit" [ref=e165]'
              - generic [ref=e167]: Teknologji
              - button "Ruaj per me vone" [ref=e169]:
                - img [ref=e170]
            - generic [ref=e172]:
              - 'heading "Prishtina Smart City: Projekti i ri i digjitalizimit" [level=3] [ref=e173]'
              - paragraph [ref=e174]: Komuna e Prishtinës lanson platformën e re dixhitale për shërbime komunale.
              - generic [ref=e175]:
                - generic [ref=e176]: Telegrafi
                - generic [ref=e177]: "|"
                - generic [ref=e178]: 8d
                - generic [ref=e179]: "|"
                - generic [ref=e180]: 4 min
        - link [ref=e181] [cursor=pointer]:
          - /url: /article/art-11
          - article [ref=e182]:
            - generic [ref=e183]:
              - 'img "BQK: Inflacioni bie në 2.1% në muajin mars" [ref=e184]'
              - generic [ref=e186]: Ekonomi
              - button "Ruaj per me vone" [ref=e188]:
                - img [ref=e189]
            - generic [ref=e191]:
              - 'heading "BQK: Inflacioni bie në 2.1% në muajin mars" [level=3] [ref=e192]'
              - paragraph [ref=e193]: Banka Qendrore raporton stabilizim të çmimeve pas masave të marra në fillim të vitit.
              - generic [ref=e194]:
                - generic [ref=e195]: Telegrafi
                - generic [ref=e196]: "|"
                - generic [ref=e197]: 8d
                - generic [ref=e198]: "|"
                - generic [ref=e199]: 4 min
        - link [ref=e200] [cursor=pointer]:
          - /url: /article/art-8
          - article [ref=e201]:
            - generic [ref=e202]:
              - 'img "Superliga: Prishtina FC kryeson tabelën" [ref=e203]'
              - generic [ref=e205]: Sport
              - button "Ruaj per me vone" [ref=e207]:
                - img [ref=e208]
            - generic [ref=e210]:
              - 'heading "Superliga: Prishtina FC kryeson tabelën" [level=3] [ref=e211]'
              - paragraph [ref=e212]: Pas fitores bindëse 3-0, Prishtina FC merr kreun e tabelës me 5 pikë dallim.
              - generic [ref=e213]:
                - generic [ref=e214]: Klan Kosova
                - generic [ref=e215]: "|"
                - generic [ref=e216]: 8d
                - generic [ref=e217]: "|"
                - generic [ref=e218]: 3 min
        - link [ref=e219] [cursor=pointer]:
          - /url: /article/art-13
          - article [ref=e220]:
            - generic [ref=e221]:
              - 'img "Samiti i Berlinit: Liderat diskutojnë stabilitetin rajonal" [ref=e222]'
              - generic [ref=e224]: Botë
              - button "Ruaj per me vone" [ref=e226]:
                - img [ref=e227]
            - generic [ref=e229]:
              - 'heading "Samiti i Berlinit: Liderat diskutojnë stabilitetin rajonal" [level=3] [ref=e230]'
              - paragraph [ref=e231]: Kryeministrat e Ballkanit Perëndimor takohen me liderat e BE-së në Berlin.
              - generic [ref=e232]:
                - generic [ref=e233]: Gazeta Express
                - generic [ref=e234]: "|"
                - generic [ref=e235]: 9d
                - generic [ref=e236]: "|"
                - generic [ref=e237]: 5 min
        - link [ref=e238] [cursor=pointer]:
          - /url: /article/art-9
          - article [ref=e239]:
            - generic [ref=e240]:
              - img "Artisti kosovar fiton çmimin në Bienalen e Venedikut" [ref=e241]
              - generic [ref=e243]: Kultura
              - button "Ruaj per me vone" [ref=e245]:
                - img [ref=e246]
            - generic [ref=e248]:
              - heading "Artisti kosovar fiton çmimin në Bienalen e Venedikut" [level=3] [ref=e249]
              - paragraph [ref=e250]: Instalacioni artistik 'Kufiri i Memories' tërhoqi vëmendjen e kritikëve ndërkombëtarë.
              - generic [ref=e251]:
                - generic [ref=e252]: Gazeta Express
                - generic [ref=e253]: "|"
                - generic [ref=e254]: 9d
                - generic [ref=e255]: "|"
                - generic [ref=e256]: 4 min
        - link [ref=e257] [cursor=pointer]:
          - /url: /article/art-10
          - article [ref=e258]:
            - generic [ref=e259]:
              - 'img "Zgjedhjet lokale: Partitë fillojnë fushatën elektorale" [ref=e260]'
              - generic [ref=e262]: Politika
              - button "Ruaj per me vone" [ref=e264]:
                - img [ref=e265]
            - generic [ref=e267]:
              - 'heading "Zgjedhjet lokale: Partitë fillojnë fushatën elektorale" [level=3] [ref=e268]'
              - paragraph [ref=e269]: Fushata zyrtare fillon sot me mitingje në Prishtinë, Prizren dhe Pejë.
              - generic [ref=e270]:
                - generic [ref=e271]: Koha Ditore
                - generic [ref=e272]: "|"
                - generic [ref=e273]: 9d
                - generic [ref=e274]: "|"
                - generic [ref=e275]: 5 min
        - link [ref=e276] [cursor=pointer]:
          - /url: /article/art-14
          - article [ref=e277]:
            - generic [ref=e278]:
              - img "Basketbollisti kosovar transferohet në NBA" [ref=e279]
              - generic [ref=e281]: Sport
              - button "Ruaj per me vone" [ref=e283]:
                - img [ref=e284]
            - generic [ref=e286]:
              - heading "Basketbollisti kosovar transferohet në NBA" [level=3] [ref=e287]
              - paragraph [ref=e288]: Lojtari 22-vjeçar nënshkruan kontratë dy-vjeçare me ekipin amerikan.
              - generic [ref=e289]:
                - generic [ref=e290]: Telegrafi
                - generic [ref=e291]: "|"
                - generic [ref=e292]: 9d
                - generic [ref=e293]: "|"
                - generic [ref=e294]: 3 min
        - link [ref=e295] [cursor=pointer]:
          - /url: /article/art-16
          - article [ref=e296]:
            - generic [ref=e297]:
              - 'img "Turizmi në Kosovë: Numri i vizitorëve dyfishohet" [ref=e298]'
              - generic [ref=e300]: Ekonomi
              - button "Ruaj per me vone" [ref=e302]:
                - img [ref=e303]
            - generic [ref=e305]:
              - 'heading "Turizmi në Kosovë: Numri i vizitorëve dyfishohet" [level=3] [ref=e306]'
              - paragraph [ref=e307]: Rugova, Sharri dhe Prizreni tërheqin turistë nga e gjithë Evropa.
              - generic [ref=e308]:
                - generic [ref=e309]: Koha Ditore
                - generic [ref=e310]: "|"
                - generic [ref=e311]: 10d
                - generic [ref=e312]: "|"
                - generic [ref=e313]: 4 min
        - link [ref=e314] [cursor=pointer]:
          - /url: /article/art-15
          - article [ref=e315]:
            - generic [ref=e316]:
              - 'img "Reforma arsimore: Kurrikula e re për shkollat fillore" [ref=e317]'
              - generic [ref=e319]: Politika
              - button "Ruaj per me vone" [ref=e321]:
                - img [ref=e322]
            - generic [ref=e324]:
              - 'heading "Reforma arsimore: Kurrikula e re për shkollat fillore" [level=3] [ref=e325]'
              - paragraph [ref=e326]: Ministria e Arsimit prezanton ndryshime të mëdha në planprogramin mësimor.
              - generic [ref=e327]:
                - generic [ref=e328]: Klan Kosova
                - generic [ref=e329]: "|"
                - generic [ref=e330]: 10d
                - generic [ref=e331]: "|"
                - generic [ref=e332]: 5 min
  - button "Open Next.js Dev Tools" [ref=e338] [cursor=pointer]:
    - img [ref=e339]
  - alert [ref=e342]
```

# Test source

```ts
  330 |     // The read time input is <input type="number">.
  331 |     // locator("input[type='number']") targets it specifically.
  332 |     await page.locator("input[type='number']").fill(TEST_ARTICLE.readTime);
  333 | 
  334 |     // ── VERIFY: all fields have the expected values ─────────────────────────
  335 |     // toHaveValue checks the current value attribute of the input.
  336 |     // This confirms our fill() calls actually worked.
  337 |     await expect(page.locator("input[type='text']").first()).toHaveValue(
  338 |       TEST_ARTICLE.title
  339 |     );
  340 |     await expect(page.locator("textarea").first()).toHaveValue(
  341 |       TEST_ARTICLE.summary
  342 |     );
  343 |     await expect(page.locator("textarea").nth(1)).toHaveValue(
  344 |       TEST_ARTICLE.content
  345 |     );
  346 |     await expect(page.locator("input[type='number']")).toHaveValue(
  347 |       TEST_ARTICLE.readTime
  348 |     );
  349 |   });
  350 | 
  351 |   // ═══════════════════════════════════════════════════════════════════════════
  352 |   // TEST 7: Submit the article form
  353 |   // ═══════════════════════════════════════════════════════════════════════════
  354 | 
  355 |   test("Step 7: Submit the form and get redirected to admin dashboard", async () => {
  356 |     // ── Click the submit button ─────────────────────────────────────────────
  357 |     // "Krijo artikullin" = "Create the article" button.
  358 |     // After clicking, the component:
  359 |     //   1. Sends POST /api/articles with the form data
  360 |     //   2. On success, invalidates the articles cache
  361 |     //   3. Calls router.push("/admin") to redirect
  362 |     await page.getByRole("button", { name: "Krijo artikullin" }).click();
  363 | 
  364 |     // ── Wait for redirect back to admin dashboard ───────────────────────────
  365 |     // The new article page redirects to /admin after successful creation.
  366 |     // We wait for the URL to match the admin dashboard pattern.
  367 |     // timeout: 15000 gives extra time for the API call + redirect.
  368 |     await page.waitForURL("**/admin", { timeout: 15_000 });
  369 | 
  370 |     // ── Verify we're back on the dashboard ──────────────────────────────────
  371 |     await expect(page).toHaveURL(/\/admin$/);
  372 |   });
  373 | 
  374 |   // ═══════════════════════════════════════════════════════════════════════════
  375 |   // TEST 8: Verify article appears in admin dashboard
  376 |   // ═══════════════════════════════════════════════════════════════════════════
  377 | 
  378 |   test("Step 8: Newly created article should appear in the admin table", async () => {
  379 |     // ── Wait for the dashboard heading to confirm page loaded ───────────────
  380 |     await expect(
  381 |       page.getByRole("heading", { name: "Artikujt" })
  382 |     ).toBeVisible();
  383 | 
  384 |     // ── page.getByText(text) ────────────────────────────────────────────────
  385 |     // Finds ANY element on the page containing the given text.
  386 |     // Our test article title is unique (includes Date.now()), so there's
  387 |     // exactly one match. The title appears in a <td> inside the table.
  388 |     //
  389 |     // .first() is a safety measure in case the text appears elsewhere.
  390 |     const articleInTable = page.getByText(TEST_ARTICLE.title).first();
  391 | 
  392 |     // ── expect(locator).toBeVisible() ───────────────────────────────────────
  393 |     // Auto-retries for up to 10 seconds (configured in playwright.config.ts).
  394 |     // The table data might still be loading when this assertion first runs —
  395 |     // Playwright's auto-retry handles the async data fetch gracefully.
  396 |     await expect(articleInTable).toBeVisible();
  397 |   });
  398 | 
  399 |   // ═══════════════════════════════════════════════════════════════════════════
  400 |   // TEST 9: Navigate to public homepage
  401 |   // ═══════════════════════════════════════════════════════════════════════════
  402 | 
  403 |   test("Step 9: Navigate to the public homepage", async () => {
  404 |     // ── page.goto("/") ──────────────────────────────────────────────────────
  405 |     // Navigate directly to the homepage. This leaves the admin panel
  406 |     // and loads the public-facing page that all visitors see.
  407 |     await page.goto("/");
  408 | 
  409 |     // ── Verify homepage loaded ──────────────────────────────────────────────
  410 |     // "Me te rejat" = "Latest news" — the section heading on the homepage.
  411 |     // This confirms the homepage rendered its content.
  412 |     await expect(page.getByText("Me te rejat")).toBeVisible();
  413 |   });
  414 | 
  415 |   // ═══════════════════════════════════════════════════════════════════════════
  416 |   // TEST 10: Verify article is published and visible on homepage
  417 |   // ═══════════════════════════════════════════════════════════════════════════
  418 | 
  419 |   test("Step 10: Newly created article should be visible on the public homepage", async () => {
  420 |     // ── Find the article title on the homepage ──────────────────────────────
  421 |     // The homepage renders articles using <NewsCard> components.
  422 |     // Each NewsCard shows the article title in an <h3>.
  423 |     // Our unique title (with Date.now()) guarantees no false matches.
  424 |     const articleOnHomepage = page.getByText(TEST_ARTICLE.title).first();
  425 | 
  426 |     // ── Assert the article is visible ───────────────────────────────────────
  427 |     // This is the FINAL assertion — the most important one.
  428 |     // It proves the complete flow works:
  429 |     //   login → create article via admin form → article appears on public site
> 430 |     await expect(articleOnHomepage).toBeVisible();
      |                                     ^ Error: expect(locator).toBeVisible() failed
  431 | 
  432 |     // ── Verify the article's category is also displayed ─────────────────────
  433 |     // The homepage shows category badges on each card.
  434 |     // "Teknologji" should appear somewhere on the page (possibly on multiple cards).
  435 |     await expect(page.getByText(TEST_ARTICLE.category).first()).toBeVisible();
  436 |   });
  437 | 
  438 |   // ═══════════════════════════════════════════════════════════════════════════
  439 |   // TEST 11: Click into the article detail page
  440 |   // ═══════════════════════════════════════════════════════════════════════════
  441 | 
  442 |   test("Step 11: Click the article to open its detail page", async () => {
  443 |     // ── Click the article title ─────────────────────────────────────────────
  444 |     // The title inside a NewsCard is wrapped in a <Link> to /article/{id}.
  445 |     // Clicking it navigates to the full article detail page.
  446 |     await page.getByText(TEST_ARTICLE.title).first().click();
  447 | 
  448 |     // ── Wait for the article detail page URL ────────────────────────────────
  449 |     // /article/{id} — the ID is dynamic so we use a regex.
  450 |     // /\/article\// matches any URL containing "/article/"
  451 |     await page.waitForURL(/\/article\//);
  452 | 
  453 |     // ── Verify the article title is displayed as the page heading ────────────
  454 |     // On the detail page, the title renders in a large <h1>.
  455 |     await expect(
  456 |       page.getByRole("heading", { name: TEST_ARTICLE.title })
  457 |     ).toBeVisible();
  458 | 
  459 |     // ── Verify the summary is displayed ─────────────────────────────────────
  460 |     // The summary appears as a highlighted quote block on the detail page.
  461 |     await expect(page.getByText(TEST_ARTICLE.summary)).toBeVisible();
  462 | 
  463 |     // ── Verify the full content is displayed ────────────────────────────────
  464 |     // The content is rendered in the article body section.
  465 |     // We check for a substring to avoid issues with whitespace differences.
  466 |     await expect(
  467 |       page.getByText(TEST_ARTICLE.content.substring(0, 50))
  468 |     ).toBeVisible();
  469 | 
  470 |     // ── Verify the source name is displayed ─────────────────────────────────
  471 |     // The article detail page shows "Burimi: {source name}" at the bottom.
  472 |     await expect(page.getByText(TEST_ARTICLE.source).first()).toBeVisible();
  473 | 
  474 |     // ── Verify the category badge is displayed ──────────────────────────────
  475 |     await expect(
  476 |       page.getByText(TEST_ARTICLE.category).first()
  477 |     ).toBeVisible();
  478 | 
  479 |     // ── Verify read time is displayed ───────────────────────────────────────
  480 |     // "{readTime} min lexim" = "4 min read" shown in the metadata section.
  481 |     await expect(
  482 |       page.getByText(`${TEST_ARTICLE.readTime} min lexim`)
  483 |     ).toBeVisible();
  484 |   });
  485 | });
  486 | 
  487 | // ═══════════════════════════════════════════════════════════════════════════════
  488 | // BONUS: Login failure test (separate describe — independent from the flow)
  489 | // ═══════════════════════════════════════════════════════════════════════════════
  490 | 
  491 | test.describe("Login failure scenarios", () => {
  492 | 
  493 |   test("Should show error with wrong password", async ({ page }) => {
  494 |     // ── { page } fixture ────────────────────────────────────────────────────
  495 |     // Unlike the serial tests above, this test receives its OWN fresh page
  496 |     // from Playwright's built-in fixtures. No shared state — completely isolated.
  497 |     await page.goto("/login");
  498 | 
  499 |     // ── Fill with correct email but WRONG password ──────────────────────────
  500 |     await page.getByLabel("Email").fill(ADMIN_EMAIL);
  501 |     await page.getByLabel("Fjalekalimi").fill("wrongpassword");
  502 | 
  503 |     // ── Click login ─────────────────────────────────────────────────────────
  504 |     await page.getByRole("button", { name: "Kyqu" }).click();
  505 | 
  506 |     // ── Verify error message appears ────────────────────────────────────────
  507 |     // The login page shows "Invalid email or password" on failure.
  508 |     // This auto-retries because the error appears after the API responds.
  509 |     await expect(page.getByText("Invalid email or password")).toBeVisible();
  510 | 
  511 |     // ── Verify we're still on the login page (no redirect) ──────────────────
  512 |     // toHaveURL asserts the browser hasn't navigated away.
  513 |     await expect(page).toHaveURL(/\/login/);
  514 |   });
  515 | 
  516 |   test("Should show error with non-existent email", async ({ page }) => {
  517 |     await page.goto("/login");
  518 | 
  519 |     await page.getByLabel("Email").fill("nobody@test.com");
  520 |     await page.getByLabel("Fjalekalimi").fill("admin123");
  521 | 
  522 |     await page.getByRole("button", { name: "Kyqu" }).click();
  523 | 
  524 |     await expect(page.getByText("Invalid email or password")).toBeVisible();
  525 |     await expect(page).toHaveURL(/\/login/);
  526 |   });
  527 | });
  528 | 
```