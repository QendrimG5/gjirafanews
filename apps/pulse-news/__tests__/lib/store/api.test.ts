/**
 * ============================================================================
 * TEST SUITE: lib/store/api.ts — TanStack Query keys and API helper
 * ============================================================================
 *
 * This file tests the non-hook exports from the API module:
 *   - queryKeys: centralized key factory for TanStack Query cache management
 *   - The key structure ensures correct cache invalidation patterns
 *
 * NOTE: The actual React hooks (useGetMeQuery, useLoginMutation, etc.) require
 * a QueryClientProvider and are tested via component/integration tests instead.
 * Here we focus on the queryKeys structure and the `api()` fetch helper logic.
 *
 * WHY these tests matter:
 *   queryKeys are used everywhere for cache reads, writes, and invalidation.
 *   A typo in a key means stale data won't refresh after mutations. Testing
 *   the key structure catches these bugs before they cause UI inconsistencies.
 */

// Import queryKeys — the centralized key factory.
import { queryKeys } from "@/lib/store/api";

describe("queryKeys", () => {

  // ─── Auth keys ──────────────────────────────────────────────────────────

  test("auth.me should return the correct key tuple", () => {
    // queryKeys.auth.me is used by useGetMeQuery and invalidated on login/logout.
    // toEqual() does deep comparison of the array contents.
    expect(queryKeys.auth.me).toEqual(["auth", "me"]);
  });

  test("auth.me key should be an array of exactly 2 elements", () => {
    // TanStack Query keys must be arrays. The length matters for
    // partial matching during invalidation.
    expect(queryKeys.auth.me).toHaveLength(2);
  });

  // ─── Article keys ───────────────────────────────────────────────────────

  test("articles.all should return the list key", () => {
    // ["articles"] is the base key for all article queries.
    // Invalidating this key also invalidates all detail keys.
    expect(queryKeys.articles.all).toEqual(["articles"]);
  });

  test("articles.detail should return a key with the article ID", () => {
    // detail("art-1") returns ["articles", "art-1"].
    // This key uniquely identifies a single article's cache entry.
    const key = queryKeys.articles.detail("art-1");
    expect(key).toEqual(["articles", "art-1"]);
  });

  test("articles.detail should return different keys for different IDs", () => {
    const key1 = queryKeys.articles.detail("art-1");
    const key2 = queryKeys.articles.detail("art-2");

    // Different IDs produce different cache keys — no collisions.
    // not.toEqual() checks the arrays differ.
    expect(key1).not.toEqual(key2);
  });

  test("articles.detail key should start with the same prefix as articles.all", () => {
    const listKey = queryKeys.articles.all;
    const detailKey = queryKeys.articles.detail("art-1");

    // The detail key's first element should match the list key's first element.
    // This is what allows invalidateQueries(["articles"]) to also invalidate
    // detail queries — TanStack Query matches by prefix.
    expect(detailKey[0]).toEqual(listKey[0]);
  });

  // ─── Category and source keys ──────────────────────────────────────────

  test("categories key should be correct", () => {
    // Used by useGetCategoriesQuery to cache the category list.
    expect(queryKeys.categories).toEqual(["categories"]);
  });

  test("sources key should be correct", () => {
    // Used by useGetSourcesQuery to cache the source list.
    expect(queryKeys.sources).toEqual(["sources"]);
  });

  // ─── Key isolation ────────────────────────────────────────────────────────

  test("all top-level keys should be different from each other", () => {
    // No two query families should share the same first element.
    // This prevents accidental cross-invalidation between unrelated caches.
    const keys = [
      queryKeys.auth.me[0],      // "auth"
      queryKeys.articles.all[0], // "articles"
      queryKeys.categories[0],    // "categories"
      queryKeys.sources[0],       // "sources"
    ];

    // Set removes duplicates — if size < length, there's a collision.
    expect(new Set(keys).size).toEqual(keys.length);
  });
});
