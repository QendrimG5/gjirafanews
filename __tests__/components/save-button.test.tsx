/**
 * ============================================================================
 * TEST SUITE: components/save-button.tsx — SaveButton bookmark component
 * ============================================================================
 *
 * This file tests the SaveButton component which:
 *   - Renders a bookmark icon button
 *   - Reads saved state from the Zustand useSavedArticles store
 *   - Calls toggle(articleId) on click
 *   - Prevents event propagation (e.preventDefault, e.stopPropagation)
 *   - Changes appearance based on saved/unsaved state
 *   - Updates aria-label for accessibility based on saved state
 *
 * WHY these tests matter:
 *   SaveButton is nested inside NewsCard (inside a Link). If it doesn't
 *   call preventDefault(), clicking the bookmark navigates to the article
 *   instead of saving it. The aria-label must change for screen readers.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// ─── Mock the Zustand store ────────────────────────────────────────────────
// We mock @/lib/store/saved-articles because the real store uses zustand/persist
// which requires localStorage hydration — not available in jsdom by default.
// Mocking gives us full control over the return values.

// Track what toggle receives.
const mockToggle = jest.fn();
// Control whether an article is saved.
let mockIsSavedReturn = false;

jest.mock("@/lib/store/saved-articles", () => ({
  // useSavedArticles is a Zustand hook. When called without a selector
  // it returns the full state object with savedIds, toggle, and isSaved.
  useSavedArticles: () => ({
    toggle: mockToggle,
    isSaved: () => mockIsSavedReturn,
  }),
}));

// Import the component under test (after mocks are set up).
import SaveButton from "@/components/save-button";

describe("SaveButton component", () => {

  // Reset mock state before each test.
  beforeEach(() => {
    // mockClear removes all call history but keeps the mock function.
    mockToggle.mockClear();
    // Default: article is not saved.
    mockIsSavedReturn = false;
  });

  test("should render a button element", () => {
    render(<SaveButton articleId="art-1" />);

    // getByRole("button") finds the <button> element.
    // This is the semantic way to find buttons (works with <button> and role="button").
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  test("should show 'Ruaj per me vone' aria-label when article is NOT saved", () => {
    // mockIsSavedReturn is already false (set in beforeEach).
    render(<SaveButton articleId="art-1" />);

    // getByLabelText finds elements by their aria-label attribute.
    // "Ruaj per me vone" = Albanian for "Save for later".
    const button = screen.getByLabelText("Ruaj per me vone");
    expect(button).toBeInTheDocument();
  });

  test("should show 'Hiq nga te ruajtura' aria-label when article IS saved", () => {
    // Set the mock so isSaved() returns true.
    mockIsSavedReturn = true;

    render(<SaveButton articleId="art-1" />);

    // "Hiq nga te ruajtura" = Albanian for "Remove from saved".
    const button = screen.getByLabelText("Hiq nga te ruajtura");
    expect(button).toBeInTheDocument();
  });

  test("should call toggle with the articleId when clicked", () => {
    render(<SaveButton articleId="art-1" />);

    const button = screen.getByRole("button");

    // fireEvent.click() simulates a mouse click on the button.
    fireEvent.click(button);

    // toHaveBeenCalledWith checks the exact argument passed to the mock.
    // The component calls toggle(articleId) inside the click handler.
    expect(mockToggle).toHaveBeenCalledWith("art-1");
  });

  test("should call toggle exactly once per click", () => {
    render(<SaveButton articleId="art-1" />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    // toHaveBeenCalledTimes(1) ensures toggle was called exactly once,
    // not zero times (click handler broken) or multiple (duplicate handlers).
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  test("should call toggle with correct ID for different articles", () => {
    render(<SaveButton articleId="art-42" />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    // The argument should match the articleId prop, not a hardcoded value.
    expect(mockToggle).toHaveBeenCalledWith("art-42");
  });

  test("should prevent default event behavior on click", () => {
    render(<SaveButton articleId="art-1" />);

    const button = screen.getByRole("button");

    // Create a custom click event so we can check if preventDefault was called.
    // We need to verify this because SaveButton is inside a Link — without
    // preventDefault, clicking the save button would navigate away.
    let preventDefaultCalled = false;
    const mockEvent = new MouseEvent("click", { bubbles: true });

    // Override preventDefault to track if it was called.
    Object.defineProperty(mockEvent, "preventDefault", {
      value: () => {
        preventDefaultCalled = true;
      },
    });

    // dispatchEvent sends the custom event to the button.
    button.dispatchEvent(mockEvent);

    // The component should have called e.preventDefault().
    expect(preventDefaultCalled).toBe(true);
  });

  test("should have different styling when saved vs unsaved", () => {
    // Render unsaved state.
    mockIsSavedReturn = false;
    const { rerender } = render(<SaveButton articleId="art-1" />);
    const buttonUnsaved = screen.getByRole("button");
    const unsavedClasses = buttonUnsaved.className;

    // Now render saved state.
    mockIsSavedReturn = true;
    rerender(<SaveButton articleId="art-1" />);
    const buttonSaved = screen.getByRole("button");
    const savedClasses = buttonSaved.className;

    // The class names should differ between saved and unsaved states.
    // not.toEqual() checks they're different strings.
    expect(savedClasses).not.toEqual(unsavedClasses);
  });

  test("saved state should include accent background class", () => {
    mockIsSavedReturn = true;
    render(<SaveButton articleId="art-1" />);

    const button = screen.getByRole("button");
    // When saved, the button gets the accent background class.
    expect(button.className).toContain("bg-gn-accent");
  });

  test("unsaved state should NOT include accent background class", () => {
    mockIsSavedReturn = false;
    render(<SaveButton articleId="art-1" />);

    const button = screen.getByRole("button");
    // When not saved, the button should not have the accent class.
    expect(button.className).not.toContain("bg-gn-accent");
  });

  test("should render an SVG icon inside the button", () => {
    render(<SaveButton articleId="art-1" />);

    const button = screen.getByRole("button");

    // querySelector("svg") finds the SVG element inside the button.
    // The bookmark icon is rendered as an inline SVG.
    const svg = button.querySelector("svg");
    expect(svg).not.toBeNull();
  });
});
