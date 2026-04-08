/**
 * ============================================================================
 * TEST SUITE: components/auth-nav-link.tsx — AuthNavLink conditional nav link
 * ============================================================================
 *
 * This file tests the AuthNavLink component which:
 *   - Shows nothing (null) while the auth query is loading
 *   - Shows "Admin" link to /admin when the user is an admin
 *   - Shows "Kyqu" (Login) link to /login when user is not logged in
 *
 * WHY these tests matter:
 *   AuthNavLink controls what the user sees in the Navbar's auth section.
 *   Showing the wrong link (e.g., "Admin" to a non-admin) is a UX bug.
 *   Showing nothing forever (stuck loading) makes the nav feel broken.
 */

import React from "react";
import { render, screen } from "@testing-library/react";

// Mock variables to control what useGetMeQuery returns in each test.
let mockMeData: { user: { role: string } | null } | undefined = undefined;
let mockIsLoading = false;

// Mock the entire api module — we only need useGetMeQuery for this component.
jest.mock("@/lib/store/api", () => ({
  // useGetMeQuery returns an object with { data, isLoading }.
  // We control these via the mock variables above.
  useGetMeQuery: () => ({
    data: mockMeData,
    isLoading: mockIsLoading,
  }),
}));

// Mock next/link — replace with <a> for testing.
jest.mock("next/link", () => {
  return function MockLink({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

// Import component after mocks.
import AuthNavLink from "@/components/auth-nav-link";

describe("AuthNavLink component", () => {

  // Reset mock state before each test.
  beforeEach(() => {
    mockMeData = undefined;
    mockIsLoading = false;
  });

  test("should render nothing while loading", () => {
    // Simulate loading state — no data yet, isLoading is true.
    mockIsLoading = true;
    mockMeData = undefined;

    const { container } = render(<AuthNavLink />);

    // container.firstChild is null when the component returns null.
    // The component returns null during loading to avoid flashing.
    expect(container.firstChild).toBeNull();
  });

  test("should render 'Kyqu' (Login) link when user is not logged in", () => {
    // Simulate: query finished loading but no user is authenticated.
    mockIsLoading = false;
    mockMeData = undefined; // no data → not logged in

    render(<AuthNavLink />);

    // "Kyqu" = Albanian for "Login"
    const loginLink = screen.getByText("Kyqu");
    expect(loginLink).toBeInTheDocument();

    // The login link should point to /login.
    const anchor = loginLink.closest("a");
    expect(anchor?.getAttribute("href")).toEqual("/login");
  });

  test("should render 'Admin' link when user is admin", () => {
    // Simulate: authenticated admin user.
    mockIsLoading = false;
    mockMeData = { user: { role: "admin" } };

    render(<AuthNavLink />);

    // "Admin" link should appear for admin users.
    const adminLink = screen.getByText("Admin");
    expect(adminLink).toBeInTheDocument();

    // It should link to /admin.
    const anchor = adminLink.closest("a");
    expect(anchor?.getAttribute("href")).toEqual("/admin");
  });

  test("should render 'Kyqu' link when user is a regular user (not admin)", () => {
    // Simulate: authenticated but with "user" role (not admin).
    mockIsLoading = false;
    mockMeData = { user: { role: "user" } };

    render(<AuthNavLink />);

    // Non-admin users should see the login link, not the admin link.
    const loginLink = screen.getByText("Kyqu");
    expect(loginLink).toBeInTheDocument();

    // The admin link should NOT be present.
    const adminLink = screen.queryByText("Admin");
    // queryByText returns null when the element doesn't exist.
    expect(adminLink).toBeNull();
  });

  test("should render 'Kyqu' when user data is null", () => {
    // Simulate: query returned but with null user (logged out).
    mockIsLoading = false;
    mockMeData = { user: null };

    render(<AuthNavLink />);

    expect(screen.getByText("Kyqu")).toBeInTheDocument();
  });

  test("Admin link should have special styling (rounded bg)", () => {
    mockIsLoading = false;
    mockMeData = { user: { role: "admin" } };

    render(<AuthNavLink />);

    const adminLink = screen.getByText("Admin");
    // Admin link has special styling with bg-gn-primary.
    expect(adminLink.className).toContain("bg-gn-primary");
  });
});
