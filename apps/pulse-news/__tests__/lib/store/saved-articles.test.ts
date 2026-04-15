/**
 * ============================================================================
 * TEST SUITE: lib/store/saved-articles.ts — Zustand saved articles store
 * ============================================================================
 *
 * This file tests the Zustand store `useSavedArticles` which manages:
 *   - savedIds: string[] — array of saved article IDs
 *   - toggle(id): adds an ID if not saved, removes it if already saved
 *   - isSaved(id): returns true if the ID is in the savedIds array
 *
 * The store uses zustand/persist to save to localStorage under key
 * "gjirafanews-saved", so saved articles survive page refreshes.
 *
 * WHY these tests matter:
 *   The saved articles feature is user-facing — SaveButton, SavedCount,
 *   BottomNav badge, and the /saved page all read from this store. If
 *   toggle doesn't remove properly, users can't unsave articles. If
 *   isSaved returns wrong values, the bookmark icon shows the wrong state.
 */

// Import the Zustand store hook.
import { useSavedArticles } from "@/lib/store/saved-articles";

// Zustand stores can be used outside React by accessing .getState() and
// .setState() directly on the store. This is perfect for unit testing
// because we don't need to render any React components.

describe("useSavedArticles — Zustand store", () => {

  // beforeEach runs before every single test in this describe block.
  // We reset the store to a clean state so tests don't affect each other.
  beforeEach(() => {
    // setState() replaces the store's state entirely.
    // We pass `true` as the second arg to replace (not merge) the state.
    useSavedArticles.setState({ savedIds: [] });
  });

  // ─── Initial state ───────────────────────────────────────────────────────

  test("should start with an empty savedIds array", () => {
    // getState() returns the current snapshot of the store.
    const state = useSavedArticles.getState();

    // toEqual([]) checks the array is empty — no articles saved initially.
    expect(state.savedIds).toEqual([]);
  });

  test("should expose toggle and isSaved functions", () => {
    const state = useSavedArticles.getState();

    // Verify the API shape — both methods must exist.
    expect(typeof state.toggle).toEqual("function");
    expect(typeof state.isSaved).toEqual("function");
  });

  // ─── toggle() — adding articles ──────────────────────────────────────────

  test("toggle() should add an article ID when it is not saved", () => {
    // Call toggle with an article ID that doesn't exist in savedIds.
    useSavedArticles.getState().toggle("art-1");

    // After toggling, the ID should appear in the savedIds array.
    const state = useSavedArticles.getState();
    // toContain() checks if the array includes the value.
    expect(state.savedIds).toContain("art-1");
  });

  test("toggle() should add multiple article IDs", () => {
    // Save three different articles.
    useSavedArticles.getState().toggle("art-1");
    useSavedArticles.getState().toggle("art-2");
    useSavedArticles.getState().toggle("art-3");

    const state = useSavedArticles.getState();

    // All three IDs should be in the array.
    expect(state.savedIds).toHaveLength(3);
    expect(state.savedIds).toContain("art-1");
    expect(state.savedIds).toContain("art-2");
    expect(state.savedIds).toContain("art-3");
  });

  // ─── toggle() — removing articles ────────────────────────────────────────

  test("toggle() should remove an article ID when it is already saved", () => {
    // First add the article.
    useSavedArticles.getState().toggle("art-1");
    // Verify it was added.
    expect(useSavedArticles.getState().savedIds).toContain("art-1");

    // Toggle again — should remove it.
    useSavedArticles.getState().toggle("art-1");

    const state = useSavedArticles.getState();
    // not.toContain() asserts the ID is no longer in the array.
    expect(state.savedIds).not.toContain("art-1");
    // The array should be empty now.
    expect(state.savedIds).toHaveLength(0);
  });

  test("toggle() should only remove the targeted ID, not others", () => {
    // Save two articles.
    useSavedArticles.getState().toggle("art-1");
    useSavedArticles.getState().toggle("art-2");

    // Remove only art-1.
    useSavedArticles.getState().toggle("art-1");

    const state = useSavedArticles.getState();
    // art-1 should be gone.
    expect(state.savedIds).not.toContain("art-1");
    // art-2 should still be there — toggle only affects the given ID.
    expect(state.savedIds).toContain("art-2");
    expect(state.savedIds).toHaveLength(1);
  });

  // ─── toggle() — toggle cycle ─────────────────────────────────────────────

  test("toggle() should re-add an article that was previously removed", () => {
    // Save → unsave → save again.
    useSavedArticles.getState().toggle("art-1"); // add
    useSavedArticles.getState().toggle("art-1"); // remove
    useSavedArticles.getState().toggle("art-1"); // add again

    const state = useSavedArticles.getState();
    // After three toggles (add-remove-add), the article should be saved.
    expect(state.savedIds).toContain("art-1");
    expect(state.savedIds).toHaveLength(1);
  });

  // ─── isSaved() ────────────────────────────────────────────────────────────

  test("isSaved() should return false for unsaved articles", () => {
    const state = useSavedArticles.getState();

    // isSaved checks if the ID exists in savedIds.
    // toBe(false) — strict equality check for the boolean.
    expect(state.isSaved("art-1")).toBe(false);
    expect(state.isSaved("art-999")).toBe(false);
  });

  test("isSaved() should return true for saved articles", () => {
    // Save an article first.
    useSavedArticles.getState().toggle("art-1");

    const state = useSavedArticles.getState();
    // Now isSaved should return true for art-1.
    expect(state.isSaved("art-1")).toBe(true);
  });

  test("isSaved() should return false after an article is un-saved", () => {
    // Save then unsave.
    useSavedArticles.getState().toggle("art-1");
    useSavedArticles.getState().toggle("art-1");

    const state = useSavedArticles.getState();
    // After toggling twice (save + unsave), isSaved should be false.
    expect(state.isSaved("art-1")).toBe(false);
  });

  test("isSaved() should correctly distinguish between saved and unsaved", () => {
    // Save art-1 but not art-2.
    useSavedArticles.getState().toggle("art-1");

    const state = useSavedArticles.getState();
    // art-1 is saved, art-2 is not.
    expect(state.isSaved("art-1")).toBe(true);
    expect(state.isSaved("art-2")).toBe(false);
  });

  // ─── Edge cases ───────────────────────────────────────────────────────────

  test("should handle toggling with empty string ID", () => {
    // Edge case: empty string as ID should still work without errors.
    useSavedArticles.getState().toggle("");

    const state = useSavedArticles.getState();
    // The empty string should be added as-is (no crash).
    expect(state.savedIds).toContain("");
  });

  test("should handle many saved articles", () => {
    // Stress test: save 100 articles.
    for (let i = 0; i < 100; i++) {
      useSavedArticles.getState().toggle(`art-${i}`);
    }

    const state = useSavedArticles.getState();
    // All 100 should be saved.
    expect(state.savedIds).toHaveLength(100);
    // Spot-check a few.
    expect(state.isSaved("art-0")).toBe(true);
    expect(state.isSaved("art-50")).toBe(true);
    expect(state.isSaved("art-99")).toBe(true);
  });
});
