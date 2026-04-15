/**
 * ============================================================================
 * TEST SUITE: lib/store/store.ts — Redux store configuration
 * ============================================================================
 *
 * This file tests the Redux store factory function `makeStore()` which:
 *   - Creates a new Redux store with configureStore()
 *   - Registers the auth reducer under the "auth" key
 *   - Returns a fully typed store (AppStore)
 *
 * WHY these tests matter:
 *   makeStore() is called once per page load in the StoreProvider component.
 *   If the store shape is wrong or the reducer isn't registered, every
 *   useAppSelector and useAppDispatch call in the app will fail silently or
 *   return undefined. These tests catch configuration errors early.
 */

// Import the store factory and types.
import { makeStore } from "@/lib/store/store";
import type { RootState } from "@/lib/store/store";

// Import actions to test dispatching through the real store.
import { setUser, clearUser } from "@/lib/store/authSlice";
import type { SafeUser } from "@/lib/data";

describe("makeStore", () => {

  test("should create a store instance", () => {
    // makeStore() should return an object (the Redux store).
    const store = makeStore();

    // toBeDefined() ensures makeStore didn't return undefined.
    expect(store).toBeDefined();

    // The store should have a getState method — this is the core Redux API.
    expect(store.getState).toBeDefined();

    // typeof check verifies getState is a function, not some other value.
    expect(typeof store.getState).toEqual("function");
  });

  test("should create independent store instances on each call", () => {
    // Each call to makeStore() should return a fresh store.
    // This is important because the StoreProvider uses useRef to ensure
    // one store per page load — but tests should get isolated stores.
    const store1 = makeStore();
    const store2 = makeStore();

    // not.toBe() checks reference inequality (they're different objects).
    expect(store1).not.toBe(store2);
  });

  test("should have an auth slice in the initial state", () => {
    const store = makeStore();
    const state: RootState = store.getState();

    // The state tree should have an "auth" key because we configured
    // the store with `reducer: { auth: authReducer }`.
    expect(state.auth).toBeDefined();
  });

  test("initial auth state should have null user and false isAuthenticated", () => {
    const store = makeStore();
    const state = store.getState();

    // Verify the auth slice initialized correctly with default values.
    expect(state.auth.user).toBeNull();
    expect(state.auth.isAuthenticated).toBe(false);
  });

  test("should accept dispatched actions and update state", () => {
    const store = makeStore();

    // Create a mock user to dispatch.
    const mockUser: SafeUser = {
      id: "usr-1",
      email: "test@test.com",
      name: "Test",
      role: "admin",
      createdAt: "2026-01-01T00:00:00Z",
    };

    // store.dispatch() sends an action through the reducer pipeline.
    // After dispatch, getState() should reflect the change.
    store.dispatch(setUser(mockUser));

    const state = store.getState();

    // The auth slice should now contain the dispatched user.
    expect(state.auth.user).toEqual(mockUser);
    expect(state.auth.isAuthenticated).toBe(true);
  });

  test("should handle clearUser action after setUser", () => {
    const store = makeStore();

    const mockUser: SafeUser = {
      id: "usr-1",
      email: "test@test.com",
      name: "Test",
      role: "user",
      createdAt: "2026-01-01T00:00:00Z",
    };

    // Set user then clear — simulates login followed by logout.
    store.dispatch(setUser(mockUser));
    store.dispatch(clearUser());

    const state = store.getState();

    // After clearUser, the state should be back to initial values.
    expect(state.auth.user).toBeNull();
    expect(state.auth.isAuthenticated).toBe(false);
  });
});
