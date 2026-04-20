import { test, expect, type Page } from "@playwright/test";

// A 1x1 transparent PNG, inlined so the test is self-contained.
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

const PNG_FILE = {
  name: "test-image.png",
  mimeType: "image/png",
  buffer: PNG_1PX,
};

const TXT_FILE = {
  name: "not-allowed.txt",
  mimeType: "text/plain",
  buffer: Buffer.from("nope"),
};

async function goToContact(page: Page) {
  // Wizard state is persisted in localStorage for 10 min. Wipe it so each
  // test starts on step 1 with empty fields regardless of prior runs.
  await page.goto("/contact");
  await page.evaluate(() => localStorage.removeItem("gn-contact-wizard"));
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Contact us" }),
  ).toBeVisible();
}

async function fillStep1(page: Page) {
  await page.getByLabel("Name").fill("Jane Doe");
  await page.getByLabel("Email").fill("jane@example.com");
  await page.getByLabel("Phone").fill("+383 44 123 456");
  await page.getByRole("button", { name: /^Next$/ }).click();
}

async function fillStep2AsIndividual(page: Page) {
  await page.getByLabel("I am a…").selectOption("individual");
  await page
    .getByRole("checkbox", { name: /newsletter/i })
    .check();
  await page.getByRole("button", { name: /^Next$/ }).click();
}

async function uploadValidFile(page: Page) {
  // The <input type="file"> is hidden; setInputFiles works on it directly
  // and is more reliable than simulating a drag-drop event.
  await page
    .locator('input[type="file"]')
    .setInputFiles(PNG_FILE);
}

test.describe("Contact wizard", () => {
  test("step 1 shows validation errors for empty + invalid fields", async ({
    page,
  }) => {
    await goToContact(page);

    // Submit with nothing filled in → every field should error.
    await page.getByRole("button", { name: /^Next$/ }).click();
    await expect(
      page.getByText("Name must be at least 2 characters"),
    ).toBeVisible();
    await expect(
      page.getByText("Enter a valid email address"),
    ).toBeVisible();
    await expect(page.getByText("Enter a valid phone number")).toBeVisible();

    // Invalid email alone should still block progression.
    await page.getByLabel("Name").fill("Jane Doe");
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Phone").fill("+383 44 123 456");
    await page.getByRole("button", { name: /^Next$/ }).click();
    await expect(
      page.getByText("Enter a valid email address"),
    ).toBeVisible();

    // Still on step 1.
    await expect(page.getByLabel("Name")).toBeVisible();
  });

  test("step 2 swaps conditional fields when user type changes", async ({
    page,
  }) => {
    await goToContact(page);
    await fillStep1(page);

    // Business branch shows company + VAT.
    await page.getByLabel("I am a…").selectOption("business");
    await expect(page.getByLabel("Company name")).toBeVisible();
    await expect(page.getByLabel("VAT number")).toBeVisible();
    await expect(page.getByLabel("University")).toHaveCount(0);

    // Student branch shows university + graduation year; business fields gone.
    await page.getByLabel("I am a…").selectOption("student");
    await expect(page.getByLabel("University")).toBeVisible();
    await expect(page.getByLabel("Graduation year")).toBeVisible();
    await expect(page.getByLabel("Company name")).toHaveCount(0);

    // Validation on student branch: empty + bad year.
    await page.getByRole("button", { name: /^Next$/ }).click();
    await expect(page.getByText("University is required")).toBeVisible();
    await expect(page.getByText("Enter a 4-digit year")).toBeVisible();
  });

  test("step 3 rejects disallowed mime types and lets files be removed", async ({
    page,
  }) => {
    await goToContact(page);
    await fillStep1(page);
    await fillStep2AsIndividual(page);

    // Upload a disallowed type, then try to advance → schema should reject.
    await page.locator('input[type="file"]').setInputFiles(TXT_FILE);
    await page.getByRole("button", { name: /^Next$/ }).click();
    await expect(
      page.getByText("Allowed: PNG, JPEG, WEBP, PDF"),
    ).toBeVisible();

    // Remove the bad file.
    await page
      .getByRole("button", { name: `Remove ${TXT_FILE.name}` })
      .click();

    // Advancing with zero files should surface the min(1) message.
    await page.getByRole("button", { name: /^Next$/ }).click();
    await expect(
      page.getByText("Upload at least one document"),
    ).toBeVisible();

    // Now upload a valid PNG and advance.
    await uploadValidFile(page);
    await expect(
      page.getByRole("button", { name: `Remove ${PNG_FILE.name}` }),
    ).toBeVisible();
    await page.getByRole("button", { name: /^Next$/ }).click();

    // Landed on step 4.
    await expect(
      page.getByRole("heading", { name: "Personal info" }),
    ).toBeVisible();
  });

  test("edit from step 4 returns directly to review (no step 2→3 detour)", async ({
    page,
  }) => {
    await goToContact(page);
    await fillStep1(page);
    await fillStep2AsIndividual(page);
    await uploadValidFile(page);
    await page.getByRole("button", { name: /^Next$/ }).click();

    // On review — click Edit on "Personal info".
    const personalSection = page.locator("section", {
      hasText: "Personal info",
    });
    await personalSection.getByRole("button", { name: "Edit" }).click();

    // Input is pre-filled from the store. The next button is now "Save".
    await expect(page.getByLabel("Name")).toHaveValue("Jane Doe");
    await expect(
      page.getByRole("button", { name: /^Save$/ }),
    ).toBeVisible();

    // Change the name and click Save → should jump straight to step 4.
    await page.getByLabel("Name").fill("Jane Updated");
    await page.getByRole("button", { name: /^Save$/ }).click();

    // Back on review, with the updated value.
    await expect(
      page.getByRole("heading", { name: "Personal info" }),
    ).toBeVisible();
    await expect(personalSection.getByText("Jane Updated")).toBeVisible();
  });

  test("happy path: submit succeeds and shows the thank-you screen", async ({
    page,
  }) => {
    await goToContact(page);
    await fillStep1(page);
    await fillStep2AsIndividual(page);
    await uploadValidFile(page);
    await page.getByRole("button", { name: /^Next$/ }).click();

    // Step 4 → Submit.
    await page.getByRole("button", { name: /^Submit$/ }).click();

    await expect(
      page.getByRole("heading", { name: /Thanks — we got your message\./ }),
    ).toBeVisible();
    await expect(
      page.getByText("We'll reply within 2 business days."),
    ).toBeVisible();

    // "Send another" resets the wizard.
    await page.getByRole("button", { name: "Send another" }).click();
    await expect(page.getByLabel("Name")).toHaveValue("");
  });

  test("persistence: form data survives a reload within the TTL window", async ({
    page,
  }) => {
    await goToContact(page);
    await fillStep1(page);

    // Mid-step 2 reload.
    await page.getByLabel("I am a…").selectOption("business");
    await page.getByLabel("Company name").fill("Acme Ltd.");
    await page.reload();

    // Still on step 2, previous entries rehydrated.
    await expect(page.getByLabel("I am a…")).toHaveValue("business");
    await expect(page.getByLabel("Company name")).toHaveValue("Acme Ltd.");

    // Going back reveals the rehydrated step 1 data.
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByLabel("Name")).toHaveValue("Jane Doe");
    await expect(page.getByLabel("Email")).toHaveValue("jane@example.com");
  });
});
