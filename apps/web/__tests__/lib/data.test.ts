/**
 * ============================================================================
 * TEST SUITE: lib/data.ts — Data layer, types, and helper functions
 * ============================================================================
 *
 * This file tests the core data module which defines:
 *   - Type definitions (Category, Source, Article, User, etc.)
 *   - Static data arrays (categories, sources, articles, users)
 *   - getArticleWithRelations() — joins an article with its category and source
 *   - generateId() / generateUserId() — create unique sequential IDs
 *
 * WHY these tests matter:
 *   The data module is the foundation of the entire app. Every API route reads
 *   from these arrays and every component displays data shaped by
 *   getArticleWithRelations(). If the structure or helpers break, everything
 *   downstream breaks too.
 */

// Import the functions and data we want to test from the data module.
// Each import corresponds to a specific export in lib/data.ts.
import {
  categories,          // Array of Category objects (Politika, Sport, etc.)
  sources,             // Array of Source objects (news outlets)
  articles,            // Mutable array of Article objects
  users,               // Mutable array of User objects
  getArticleWithRelations, // Helper: merges article with its category + source
  generateId,          // Creates sequential article IDs like "art-17"
  generateUserId,      // Creates sequential user IDs like "usr-2"
} from "@/lib/data";

// Import types so we can verify the shape of returned objects
import type {
  Category,
  Source,
  Article,
  ArticleWithRelations,
  User,
  SafeUser,
} from "@/lib/data";

// ─── Categories ───────────────────────────────────────────────────────────────

// describe() groups related tests under a label. All tests inside share context.
describe("categories", () => {

  // test() defines a single test case. The string describes the expected behavior.
  test("should be a non-empty array", () => {
    // expect() wraps the value we want to assert something about.
    // toBeInstanceOf(Array) checks that categories is an Array instance.
    expect(categories).toBeInstanceOf(Array);

    // .toBeGreaterThan(0) asserts the array has at least one item.
    // We use .length because we need at least one category for the app to work.
    expect(categories.length).toBeGreaterThan(0);
  });

  test("should contain exactly 6 categories", () => {
    // toHaveLength() is a Jest matcher that checks .length property.
    // We assert 6 because the data module defines exactly 6 categories.
    expect(categories).toHaveLength(6);
  });

  test("each category should have required fields: id, name, slug, color", () => {
    // .forEach iterates over every category to validate its shape.
    categories.forEach((cat: Category) => {
      // toBeDefined() checks the value is not undefined.
      // We need each field to exist for UI rendering and URL routing.
      expect(cat.id).toBeDefined();
      expect(cat.name).toBeDefined();
      expect(cat.slug).toBeDefined();
      expect(cat.color).toBeDefined();

      // typeof checks ensure fields are strings, not numbers or objects.
      // toEqual("string") compares the typeof result against the expected type.
      expect(typeof cat.id).toEqual("string");
      expect(typeof cat.name).toEqual("string");
      expect(typeof cat.slug).toEqual("string");
      expect(typeof cat.color).toEqual("string");
    });
  });

  test("all category IDs should be unique", () => {
    // Map extracts just the ID strings from the category objects.
    const ids = categories.map((c) => c.id);

    // new Set(ids) removes duplicates. If size equals length, all IDs are unique.
    // This prevents bugs where two categories accidentally share an ID.
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toEqual(ids.length);
  });

  test("all category slugs should be unique", () => {
    // Slugs are used in URLs (/category/:slug). Duplicates would cause routing conflicts.
    const slugs = categories.map((c) => c.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toEqual(slugs.length);
  });

  test("each category color should be a valid hex color", () => {
    // Regular expression that matches hex colors: # followed by 3 or 6 hex digits.
    // This ensures colors render correctly in CSS.
    const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

    categories.forEach((cat) => {
      // toMatch() tests the string against a regex pattern.
      expect(cat.color).toMatch(hexColorRegex);
    });
  });

  test("should contain the expected category names", () => {
    // Extract all names into an array for bulk assertion.
    const names = categories.map((c) => c.name);

    // toContain() checks if the array includes a specific value.
    // These are the 6 Albanian category names defined in the data module.
    expect(names).toContain("Politika");
    expect(names).toContain("Sport");
    expect(names).toContain("Teknologji");
    expect(names).toContain("Kultura");
    expect(names).toContain("Ekonomi");
    expect(names).toContain("Botë");
  });
});

// ─── Sources ──────────────────────────────────────────────────────────────────

describe("sources", () => {

  test("should be a non-empty array", () => {
    expect(sources).toBeInstanceOf(Array);
    expect(sources.length).toBeGreaterThan(0);
  });

  test("should contain exactly 4 sources", () => {
    // The data module defines 4 Kosovo news outlets.
    expect(sources).toHaveLength(4);
  });

  test("each source should have id, name, and url fields", () => {
    sources.forEach((src: Source) => {
      expect(src.id).toBeDefined();
      expect(src.name).toBeDefined();
      expect(src.url).toBeDefined();

      // All three fields must be strings for proper rendering and linking.
      expect(typeof src.id).toEqual("string");
      expect(typeof src.name).toEqual("string");
      expect(typeof src.url).toEqual("string");
    });
  });

  test("all source IDs should be unique", () => {
    const ids = sources.map((s) => s.id);
    expect(new Set(ids).size).toEqual(ids.length);
  });

  test("each source URL should start with https://", () => {
    sources.forEach((src) => {
      // toMatch() with a regex ensures URLs are valid HTTPS links.
      // This prevents accidentally linking to insecure URLs.
      expect(src.url).toMatch(/^https:\/\//);
    });
  });
});

// ─── Articles ─────────────────────────────────────────────────────────────────

describe("articles", () => {

  test("should be a non-empty array", () => {
    expect(articles).toBeInstanceOf(Array);
    expect(articles.length).toBeGreaterThan(0);
  });

  test("should contain at least 16 seed articles", () => {
    // The data module ships with 16 pre-defined articles (art-1 through art-16).
    // toBeGreaterThanOrEqual checks >= because articles can be added at runtime.
    expect(articles.length).toBeGreaterThanOrEqual(16);
  });

  test("each article should have all required fields", () => {
    articles.forEach((article: Article) => {
      // Check every field exists and is the right type.
      // These are the fields the API returns and components render.
      expect(article.id).toBeDefined();
      expect(typeof article.id).toEqual("string");

      expect(article.title).toBeDefined();
      expect(typeof article.title).toEqual("string");

      expect(article.summary).toBeDefined();
      expect(typeof article.summary).toEqual("string");

      expect(article.content).toBeDefined();
      expect(typeof article.content).toEqual("string");

      expect(article.imageUrl).toBeDefined();
      expect(typeof article.imageUrl).toEqual("string");

      expect(article.publishedAt).toBeDefined();
      expect(typeof article.publishedAt).toEqual("string");

      // readTime is a number (minutes to read the article).
      expect(article.readTime).toBeDefined();
      expect(typeof article.readTime).toEqual("number");

      // categoryId and sourceId must reference existing categories/sources.
      expect(article.categoryId).toBeDefined();
      expect(article.sourceId).toBeDefined();
    });
  });

  test("all article IDs should be unique", () => {
    const ids = articles.map((a) => a.id);
    expect(new Set(ids).size).toEqual(ids.length);
  });

  test("every article should reference a valid categoryId", () => {
    // Build a Set of all category IDs for O(1) lookups.
    const categoryIds = new Set(categories.map((c) => c.id));

    articles.forEach((article) => {
      // toBe(true) asserts that the Set contains the article's categoryId.
      // This catches orphaned articles pointing to deleted categories.
      expect(categoryIds.has(article.categoryId)).toBe(true);
    });
  });

  test("every article should reference a valid sourceId", () => {
    const sourceIds = new Set(sources.map((s) => s.id));

    articles.forEach((article) => {
      expect(sourceIds.has(article.sourceId)).toBe(true);
    });
  });

  test("every article publishedAt should be a valid ISO date", () => {
    articles.forEach((article) => {
      // new Date() with a valid ISO string produces a valid Date.
      // isNaN(date.getTime()) returns true for invalid dates.
      const date = new Date(article.publishedAt);
      expect(isNaN(date.getTime())).toBe(false);
    });
  });

  test("readTime should be a positive integer", () => {
    articles.forEach((article) => {
      // toBeGreaterThan(0) ensures readTime isn't zero or negative.
      expect(article.readTime).toBeGreaterThan(0);

      // Number.isInteger() checks there's no fractional part (e.g., 3.5).
      expect(Number.isInteger(article.readTime)).toBe(true);
    });
  });
});

// ─── getArticleWithRelations() ────────────────────────────────────────────────

describe("getArticleWithRelations", () => {

  test("should merge article with its category and source", () => {
    // Pick the first article from the seed data as our test subject.
    const article = articles[0];

    // Call the function under test — it joins article with category + source.
    const result = getArticleWithRelations(article);

    // Verify the result contains all original article fields by checking the ID.
    expect(result.id).toEqual(article.id);
    expect(result.title).toEqual(article.title);

    // Verify the category object was attached.
    // toBeDefined() ensures the category property exists.
    expect(result.category).toBeDefined();
    // The attached category's id should match the article's categoryId.
    expect(result.category.id).toEqual(article.categoryId);

    // Verify the source object was attached.
    expect(result.source).toBeDefined();
    expect(result.source.id).toEqual(article.sourceId);
  });

  test("returned object should have category with name, slug, color", () => {
    const article = articles[0];
    const result = getArticleWithRelations(article);

    // After joining, the category object should have all 4 fields.
    // These are used by NewsCard to show the category badge.
    expect(result.category.name).toBeDefined();
    expect(result.category.slug).toBeDefined();
    expect(result.category.color).toBeDefined();
  });

  test("returned object should have source with name and url", () => {
    const article = articles[0];
    const result = getArticleWithRelations(article);

    // The source object is displayed in the article detail page.
    expect(result.source.name).toBeDefined();
    expect(result.source.url).toBeDefined();
  });

  test("should work correctly for every article in the dataset", () => {
    // Test all articles to ensure no orphaned foreign keys.
    articles.forEach((article) => {
      // This should not throw for any article in the seed data.
      const result = getArticleWithRelations(article);

      // Verify the join produced valid results for every article.
      expect(result.category).toBeDefined();
      expect(result.source).toBeDefined();
      expect(result.category.id).toEqual(article.categoryId);
      expect(result.source.id).toEqual(article.sourceId);
    });
  });

  test("should preserve all original article properties in the result", () => {
    const article = articles[0];
    const result: ArticleWithRelations = getArticleWithRelations(article);

    // Spread operator should copy all fields — verify none are lost.
    expect(result.summary).toEqual(article.summary);
    expect(result.content).toEqual(article.content);
    expect(result.imageUrl).toEqual(article.imageUrl);
    expect(result.publishedAt).toEqual(article.publishedAt);
    expect(result.readTime).toEqual(article.readTime);
    expect(result.categoryId).toEqual(article.categoryId);
    expect(result.sourceId).toEqual(article.sourceId);
  });
});

// ─── generateId() ─────────────────────────────────────────────────────────────

describe("generateId", () => {

  test("should return a string", () => {
    const id = generateId();
    // typeof check ensures the function returns a string, not a number.
    expect(typeof id).toEqual("string");
  });

  test("should return an ID matching the pattern art-{number}", () => {
    const id = generateId();
    // toMatch() with regex ensures the ID follows the expected format.
    // ^ = start, art- = literal prefix, \d+ = one or more digits, $ = end.
    expect(id).toMatch(/^art-\d+$/);
  });

  test("should return unique IDs on consecutive calls", () => {
    // Call generateId() twice and verify the results differ.
    const id1 = generateId();
    const id2 = generateId();

    // not.toEqual() asserts the two values are different.
    // This verifies the internal counter increments.
    expect(id1).not.toEqual(id2);
  });

  test("should return incrementing IDs", () => {
    const id1 = generateId();
    const id2 = generateId();

    // Extract the numeric part by splitting on "-" and taking the second element.
    const num1 = parseInt(id1.split("-")[1]);
    const num2 = parseInt(id2.split("-")[1]);

    // The second ID's number should be exactly 1 greater than the first.
    expect(num2).toEqual(num1 + 1);
  });
});

// ─── generateUserId() ────────────────────────────────────────────────────────

describe("generateUserId", () => {

  test("should return a string", () => {
    const id = generateUserId();
    expect(typeof id).toEqual("string");
  });

  test("should return an ID matching the pattern usr-{number}", () => {
    const id = generateUserId();
    // Same regex pattern but with "usr-" prefix instead of "art-".
    expect(id).toMatch(/^usr-\d+$/);
  });

  test("should return unique IDs on consecutive calls", () => {
    const id1 = generateUserId();
    const id2 = generateUserId();
    expect(id1).not.toEqual(id2);
  });
});

// ─── Users ────────────────────────────────────────────────────────────────────

describe("users", () => {

  test("should contain at least the default admin user", () => {
    // The data module ships with one admin user.
    // toBeGreaterThanOrEqual(1) because more users can be registered at runtime.
    expect(users.length).toBeGreaterThanOrEqual(1);
  });

  test("the default admin user should have correct fields", () => {
    // Find the admin user by email.
    const admin = users.find((u: User) => u.email === "admin@gjirafanews.com");

    // toBeDefined() ensures the admin user exists in the seed data.
    expect(admin).toBeDefined();

    // toEqual("admin") asserts the role is exactly "admin" (not "user").
    expect(admin!.role).toEqual("admin");

    // The name should be "Admin" as defined in the data module.
    expect(admin!.name).toEqual("Admin");

    // ID should follow the usr- pattern.
    expect(admin!.id).toMatch(/^usr-/);
  });

  test("admin user password should be a bcrypt hash", () => {
    const admin = users.find((u) => u.email === "admin@gjirafanews.com");

    // bcrypt hashes start with "$2b$" (or $2a$). This checks the hash format.
    expect(admin!.password).toMatch(/^\$2[ab]\$/);
  });

  test("each user should have all required fields", () => {
    users.forEach((user: User) => {
      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.password).toBeDefined();
      expect(user.name).toBeDefined();
      expect(user.role).toBeDefined();
      expect(user.createdAt).toBeDefined();

      // Role must be either "admin" or "user" — no other value allowed.
      // toContain() on the array checks if the value is one of the valid options.
      expect(["admin", "user"]).toContain(user.role);
    });
  });
});
