/**
 * ============================================================================
 * TEST SUITE: components/admin-logout-button.tsx — Admin logout button
 * ============================================================================
 *
 * This file tests the AdminLogoutButton component which:
 *   - Renders a "Dil" (Logout) button
 *   - Calls the logout mutation on click
 *   - Dispatches clearUser() to clear Redux auth state
 *   - Navigates to "/" after successful logout
 *   - Disables itself while the logout mutation is pending
 *
 * WHY these tests matter:
 *   If logout fails silently, users remain "logged in" with stale state.
 *   If clearUser isn't dispatched, the Redux store and TanStack Query cache
 *   become out of sync. The disable-while-pending behavior prevents double
 *   logout requests.
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock functions we'll track across tests.
const mockPush = jest.fn(); // tracks router.push calls
const mockLogout = jest.fn(); // tracks the logout mutation call
const mockDispatch = jest.fn(); // tracks Redux dispatch calls

// Track whether logout is in progress.
let mockIsPending = false;

// Mock next/navigation — useRouter returns our mock push function.
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the API module — useLogoutMutation returns our controlled mock.
jest.mock("@/lib/store/api", () => ({
  useLogoutMutation: () => ({
    // mutateAsync resolves immediately (successful logout).
    mutateAsync: mockLogout,
    isPending: mockIsPending,
  }),
}));

// Mock Redux hooks — useAppDispatch returns our mock dispatch function.
jest.mock("@/lib/store/hooks", () => ({
  useAppDispatch: () => mockDispatch,
}));

// Mock the clearUser action creator.
// When imported by the component, it returns a recognizable action object.
jest.mock("@/lib/store/authSlice", () => ({
  clearUser: () => ({ type: "auth/clearUser" }),
}));

// Import component after all mocks.
import AdminLogoutButton from "@/components/admin-logout-button";

describe("AdminLogoutButton component", () => {
  // Reset all mock call histories before each test.
  beforeEach(() => {
    // jest.fn().mockClear() removes all recorded calls but keeps the mock.
    mockPush.mockClear();
    mockLogout.mockClear();
    mockDispatch.mockClear();
    mockIsPending = false;

    // Make mockLogout resolve successfully by default.
    // mockResolvedValue means mutateAsync() returns a resolved Promise.
    mockLogout.mockResolvedValue({ message: "Logged out" });
  });

  test("should render a button with text 'Dil'", () => {
    render(<AdminLogoutButton />);

    // "Dil" = Albanian for "Exit" / "Logout"
    const button = screen.getByText("Dil");
    expect(button).toBeInTheDocument();

    // Verify it's actually a <button> element (not a styled div or link).
    expect(button.tagName).toEqual("BUTTON");
  });

  test("should call logout mutation when clicked", async () => {
    render(<AdminLogoutButton />);

    const button = screen.getByText("Dil");

    // fireEvent.click simulates a user click.
    fireEvent.click(button);

    // waitFor retries the assertion until it passes or times out.
    // We need it here because the click handler is async (await logout()).
    await waitFor(() => {
      // toHaveBeenCalled() checks if the mock function was invoked.
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  test("should dispatch clearUser after successful logout", async () => {
    render(<AdminLogoutButton />);

    fireEvent.click(screen.getByText("Dil"));

    await waitFor(() => {
      // After logout resolves, the component dispatches clearUser().
      // toHaveBeenCalledWith checks the exact argument passed to dispatch.
      expect(mockDispatch).toHaveBeenCalledWith({ type: "auth/clearUser" });
    });
  });

  test("should navigate to '/' after successful logout", async () => {
    render(<AdminLogoutButton />);

    fireEvent.click(screen.getByText("Dil"));

    await waitFor(() => {
      // After logout + clearUser, the component calls router.push("/").
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  test("should call logout, then dispatch, then navigate in order", async () => {
    // Track the order of operations using a shared array.
    const callOrder: string[] = [];

    mockLogout.mockImplementation(async () => {
      callOrder.push("logout");
    });
    mockDispatch.mockImplementation(() => {
      callOrder.push("dispatch");
    });
    mockPush.mockImplementation(() => {
      callOrder.push("push");
    });

    render(<AdminLogoutButton />);
    fireEvent.click(screen.getByText("Dil"));

    await waitFor(() => {
      // The component does: await logout() → dispatch(clearUser()) → router.push("/")
      // Verify the correct order of operations.
      expect(callOrder).toEqual(["logout", "dispatch", "push"]);
    });
  });

  test("should disable the button while logout is pending", () => {
    // Simulate pending state — the logout request is in flight.
    mockIsPending = true;

    render(<AdminLogoutButton />);

    const button = screen.getByText("Dil");
    // toBeDisabled() checks the disabled attribute on the button.
    // This prevents users from clicking logout multiple times.
    expect(button).toBeDisabled();
  });

  test("should NOT be disabled when logout is not pending", () => {
    mockIsPending = false;

    render(<AdminLogoutButton />);

    const button = screen.getByText("Dil");
    // not.toBeDisabled() ensures the button is clickable.
    expect(button).not.toBeDisabled();
  });
});
