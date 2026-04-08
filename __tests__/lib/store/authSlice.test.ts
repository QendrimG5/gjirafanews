/**
 * ============================================================================
 * TEST SUITE: lib/store/authSlice.ts — Redux auth state management
 * ============================================================================
 *
 * This file tests the Redux "auth" slice which manages:
 *   - user: the currently logged-in user (SafeUser | null)
 *   - isAuthenticated: boolean flag derived from user presence
 *   - setUser action: sets the user and flips isAuthenticated to true
 *   - clearUser action: resets both fields to null / false
 *
 * WHY these tests matter:
 *   The auth slice controls the entire logged-in/logged-out state on the client.
 *   Components like AdminLogoutButton, AuthNavLink, and the login page all
 *   dispatch these actions. If setUser fails to flip isAuthenticated, the admin
 *   panel won't load. If clearUser doesn't clear user, stale auth data persists.
 */

// Import the reducer (default export) and the action creators (named exports).
import authReducer, { setUser, clearUser } from "@/lib/store/authSlice";

// Import the SafeUser type to create properly typed test fixtures.
import type { SafeUser } from "@/lib/data";

// ─── Test fixtures ──────────────────────────────────────────────────────────

// A mock user object that matches the SafeUser shape (User without password).
// We reuse this across multiple tests to avoid duplication.
const mockUser: SafeUser = {
  id: "usr-1",
  email: "admin@gjirafanews.com",
  name: "Admin",
  role: "admin",
  createdAt: "2026-01-01T00:00:00Z",
};

// ─── Initial state ──────────────────────────────────────────────────────────

describe("authSlice — initial state", () => {

  test("should return the initial state when reducer receives undefined state", () => {
    // Calling the reducer with undefined state and an unknown action type
    // should return the initial state. This is how Redux initializes the store.
    // { type: "unknown" } is a dummy action that won't match any case.
    const state = authReducer(undefined, { type: "unknown" });

    // The initial state should have user as null (nobody logged in).
    // toBeNull() is more specific than toBe(null) — it only matches null.
    expect(state.user).toBeNull();

    // isAuthenticated should start as false.
    // toBe(false) uses strict equality (===) to check the boolean.
    expect(state.isAuthenticated).toBe(false);
  });
});

// ─── setUser action ─────────────────────────────────────────────────────────

describe("authSlice — setUser", () => {

  test("should set the user when setUser action is dispatched", () => {
    // Start from a blank state (no user logged in).
    const previousState = { user: null, isAuthenticated: false };

    // Dispatch the setUser action with our mock user as the payload.
    // authReducer() is a pure function: it takes previous state + action → new state.
    const state = authReducer(previousState, setUser(mockUser));

    // After setUser, the user field should contain the mock user object.
    // toEqual() does deep equality — it checks every property matches.
    expect(state.user).toEqual(mockUser);
  });

  test("should set isAuthenticated to true when user is set", () => {
    const previousState = { user: null, isAuthenticated: false };
    const state = authReducer(previousState, setUser(mockUser));

    // The setUser reducer sets isAuthenticated = true alongside the user.
    // toBe(true) checks strict boolean equality.
    expect(state.isAuthenticated).toBe(true);
  });

  test("should update user if setUser is dispatched with a different user", () => {
    // Start with one user already logged in.
    const previousState = { user: mockUser, isAuthenticated: true };

    // Create a different user to replace the current one.
    const newUser: SafeUser = {
      id: "usr-2",
      email: "user@example.com",
      name: "Regular User",
      role: "user",
      createdAt: "2026-02-01T00:00:00Z",
    };

    const state = authReducer(previousState, setUser(newUser));

    // The user should now be the new user, not the old one.
    expect(state.user).toEqual(newUser);
    // isAuthenticated should still be true.
    expect(state.isAuthenticated).toBe(true);
  });

  test("should correctly store user fields: id, email, name, role, createdAt", () => {
    const state = authReducer(
      { user: null, isAuthenticated: false },
      setUser(mockUser)
    );

    // Verify each individual field to ensure the reducer isn't dropping properties.
    // This catches bugs where the reducer uses Object.assign incorrectly.
    expect(state.user!.id).toEqual("usr-1");
    expect(state.user!.email).toEqual("admin@gjirafanews.com");
    expect(state.user!.name).toEqual("Admin");
    expect(state.user!.role).toEqual("admin");
    expect(state.user!.createdAt).toEqual("2026-01-01T00:00:00Z");
  });
});

// ─── clearUser action ───────────────────────────────────────────────────────

describe("authSlice — clearUser", () => {

  test("should clear the user when clearUser is dispatched", () => {
    // Start with a user logged in.
    const previousState = { user: mockUser, isAuthenticated: true };

    // Dispatch clearUser() — this action has no payload.
    const state = authReducer(previousState, clearUser());

    // After clearUser, user should be null (no one logged in).
    expect(state.user).toBeNull();
  });

  test("should set isAuthenticated to false when user is cleared", () => {
    const previousState = { user: mockUser, isAuthenticated: true };
    const state = authReducer(previousState, clearUser());

    // isAuthenticated must flip back to false on logout.
    expect(state.isAuthenticated).toBe(false);
  });

  test("should be idempotent — clearing an already empty state stays empty", () => {
    // Start with no user (already logged out).
    const emptyState = { user: null, isAuthenticated: false };
    const state = authReducer(emptyState, clearUser());

    // Dispatching clearUser on an already-empty state shouldn't break anything.
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});

// ─── Full login/logout cycle ────────────────────────────────────────────────

describe("authSlice — login/logout cycle", () => {

  test("should handle a complete login then logout cycle", () => {
    // Step 1: Start with initial state (no user).
    let state = authReducer(undefined, { type: "unknown" });
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);

    // Step 2: User logs in — dispatch setUser.
    state = authReducer(state, setUser(mockUser));
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);

    // Step 3: User logs out — dispatch clearUser.
    state = authReducer(state, clearUser());
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  test("should handle multiple login/logout cycles without state leaking", () => {
    const user1: SafeUser = { ...mockUser, id: "usr-1", name: "User One" };
    const user2: SafeUser = { ...mockUser, id: "usr-2", name: "User Two" };

    // Login user1 → logout → login user2 → verify no data from user1 remains.
    let state = authReducer(undefined, { type: "unknown" });

    state = authReducer(state, setUser(user1));
    expect(state.user!.name).toEqual("User One");

    state = authReducer(state, clearUser());
    expect(state.user).toBeNull();

    state = authReducer(state, setUser(user2));
    // After the cycle, the current user should be user2 with no trace of user1.
    expect(state.user!.name).toEqual("User Two");
    expect(state.user!.id).toEqual("usr-2");
  });
});
