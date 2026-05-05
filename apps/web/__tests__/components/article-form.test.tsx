/**
 * ============================================================================
 * TEST SUITE: components/article-form.tsx — ArticleForm with regex in tests
 * ============================================================================
 *
 * This file uses toMatch(regex) inside tests to validate dummy article data
 * against expected formats. The regex lives in the TEST, not the component.
 *
 * We autofill dummy articles (both correct and wrong format) and use regex
 * to check whether the data would be valid or invalid before/after submission.
 *
 * Regex patterns used:
 *   - Title:      /^[A-Za-zÇçËëÜü].{2,199}$/     → starts with letter, 3-200 chars
 *   - Summary:    /^.{10,500}$/s                    → 10-500 characters
 *   - Content:    /^.{20,}$/s                       → at least 20 characters
 *   - Image URL:  /^https:\/\/.+\..+\/.+$/          → valid HTTPS URL with path
 *   - CategoryId: /^cat-\d+$/                        → "cat-" followed by digits
 *   - SourceId:   /^src-\d+$/                        → "src-" followed by digits
 *   - PublishedAt: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/ → ISO date format
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ─── Mock TanStack Query hooks ──────────────────────────────────────────────
const mockCategories = [
  {
    id: "cat-1",
    name: "Politika",
    slug: "politika",
    color: "#cf222e",
    articleCount: 3,
  },
  {
    id: "cat-2",
    name: "Sport",
    slug: "sport",
    color: "#1a7f37",
    articleCount: 5,
  },
];

const mockSources = [
  { id: "src-1", name: "Gazeta Express", url: "https://www.gazetaexpress.com" },
  { id: "src-2", name: "Koha Ditore", url: "https://www.koha.net" },
];

jest.mock("@/lib/store/api", () => ({
  useGetCategoriesQuery: () => ({ data: mockCategories }),
  useGetSourcesQuery: () => ({ data: mockSources }),
}));

// ─── Import component after mocks ──────────────────────────────────────────
import ArticleForm from "@/components/article-form";
import type { ArticleFormData } from "@/components/article-form";

// ═══════════════════════════════════════════════════════════════════════════════
// DUMMY DATA — correct and wrong format articles for regex testing
// ═══════════════════════════════════════════════════════════════════════════════

// A correctly formatted article — every field matches its regex.
const validArticle = {
  title: "Qeveria miraton planin e ri ekonomik",
  summary: "Plani i ri perfshin masa te ndryshme per ekonomine e vendit.",
  content:
    "Qeveria ka miratuar sot planin e ri ekonomik qe synon rritjen e eksportit dhe investimeve te huaja.",
  imageUrl: "https://picsum.photos/seed/economy/800/400",
  categoryId: "cat-1",
  sourceId: "src-1",
  readTime: 5,
  publishedAt: "2026-03-31T08:00:00Z",
};

// WRONG format articles — each has one deliberately broken field.
const wrongTitleNumber = { ...validArticle, title: "123 starts with number" };
const wrongTitleShort = { ...validArticle, title: "Ab" };
const wrongTitleSpecial = { ...validArticle, title: "!@# special chars" };
const wrongTitleEmpty = { ...validArticle, title: "" };

const wrongSummaryShort = { ...validArticle, summary: "Too short" };
const wrongSummaryEmpty = { ...validArticle, summary: "" };

const wrongContentShort = { ...validArticle, content: "Only 19 chars here" };
const wrongContentEmpty = { ...validArticle, content: "" };

const wrongImageHttp = {
  ...validArticle,
  imageUrl: "http://insecure.com/img.jpg",
};
const wrongImageNoUrl = { ...validArticle, imageUrl: "not-a-url-at-all" };
const wrongImageNoPath = { ...validArticle, imageUrl: "https://example.com" };

const wrongCategoryPrefix = { ...validArticle, categoryId: "wrong-1" };
const wrongCategoryLetters = { ...validArticle, categoryId: "cat-abc" };
const wrongCategoryEmpty = { ...validArticle, categoryId: "" };

const wrongSourcePrefix = { ...validArticle, sourceId: "source-1" };
const wrongSourceEmpty = { ...validArticle, sourceId: "" };

const wrongDateFormat = { ...validArticle, publishedAt: "March 31, 2026" };
const wrongDateRandom = { ...validArticle, publishedAt: "not-a-date" };

// ═══════════════════════════════════════════════════════════════════════════════
// REGEX PATTERNS — defined once, used across all tests with toMatch()
// ═══════════════════════════════════════════════════════════════════════════════

// Title: must start with a letter (Latin/Albanian), then 2-199 more chars = 3-200 total.
const titleRegex = /^[A-Za-zÇçËëÜüÖöÄäÉéÈèÊêÎîÔôÛû].{2,199}$/;

// Summary: between 10 and 500 characters. The 's' flag makes . match newlines too.
const summaryRegex = /^.{10,500}$/s;

// Content: at least 20 characters.
const contentRegex = /^.{20,}$/s;

// Image URL: must be https://, then domain with dot, then a path segment.
const imageUrlRegex = /^https:\/\/.+\..+\/.+$/;

// Category ID: literal "cat-" followed by one or more digits.
const categoryIdRegex = /^cat-\d+$/;

// Source ID: literal "src-" followed by one or more digits.
const sourceIdRegex = /^src-\d+$/;

// Published date: ISO 8601 format — YYYY-MM-DDTHH:MM
const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

// ═══════════════════════════════════════════════════════════════════════════════
// TITLE REGEX TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("Title regex validation with toMatch", () => {
  // toMatch(regex) tests if the string matches the regular expression.
  // It passes when the regex finds a match, fails when it doesn't.

  test("CORRECT: valid Albanian title should match the title regex", () => {
    // "Qeveria miraton..." starts with "Q" (letter) and has >3 chars.
    // toMatch returns true because titleRegex matches this string.
    expect(validArticle.title).toMatch(titleRegex);
  });

  test("WRONG: title starting with number should NOT match", () => {
    // "123 starts with number" — first char is "1", not a letter.
    // not.toMatch asserts the regex does NOT match the string.
    expect(wrongTitleNumber.title).not.toMatch(titleRegex);
  });

  test("WRONG: title with only 2 chars should NOT match", () => {
    // "Ab" is only 2 characters. The regex needs [letter] + .{2,199} = min 3 total.
    // The first char "A" is a letter, but .{2,199} needs at least 2 more chars.
    // "Ab" only has 1 char after "A", so it fails.
    expect(wrongTitleShort.title).not.toMatch(titleRegex);
  });

  test("WRONG: title starting with special character should NOT match", () => {
    // "!@# special chars" starts with "!" — not in the allowed character class.
    expect(wrongTitleSpecial.title).not.toMatch(titleRegex);
  });

  test("WRONG: empty title should NOT match", () => {
    // "" is empty — regex requires at least 3 characters.
    expect(wrongTitleEmpty.title).not.toMatch(titleRegex);
  });

  test("CORRECT: title with Albanian characters Ë, ç should match", () => {
    // "Është një test valid" starts with "Ë" — included in the regex char class.
    const albanianTitle = "Është një titull i artikullit";
    expect(albanianTitle).toMatch(titleRegex);
  });

  test("CORRECT: title with exactly 3 characters should match (boundary)", () => {
    // "Abc" = first char "A" (letter) + "bc" (2 more chars) = 3 total. Minimum valid.
    expect("Abc").toMatch(titleRegex);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARY REGEX TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("Summary regex validation with toMatch", () => {
  test("CORRECT: valid summary should match", () => {
    // validArticle.summary has 60 chars — within the 10-500 range.
    expect(validArticle.summary).toMatch(summaryRegex);
  });

  test("WRONG: summary with 9 chars should NOT match", () => {
    // "Too short" = 9 characters. Regex needs minimum 10.
    // not.toMatch confirms the regex rejects this string.
    expect(wrongSummaryShort.summary).not.toMatch(summaryRegex);
  });

  test("WRONG: empty summary should NOT match", () => {
    // "" = 0 characters. Far below the 10 minimum.
    expect(wrongSummaryEmpty.summary).not.toMatch(summaryRegex);
  });

  test("CORRECT: summary with exactly 10 characters should match (boundary)", () => {
    // "1234567890" = exactly 10 chars. Minimum valid length.
    expect("1234567890").toMatch(summaryRegex);
  });

  test("CORRECT: summary with 500 characters should match (boundary max)", () => {
    // Create a string of exactly 500 "a" characters.
    // "a".repeat(500) creates "aaaa...a" (500 times).
    const maxSummary = "a".repeat(500);
    expect(maxSummary).toMatch(summaryRegex);
  });

  test("WRONG: summary with 501 characters should NOT match", () => {
    // One character over the 500 maximum.
    const tooLong = "a".repeat(501);
    expect(tooLong).not.toMatch(summaryRegex);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT REGEX TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("Content regex validation with toMatch", () => {
  test("CORRECT: valid content should match", () => {
    // validArticle.content is 90+ chars — above the 20 minimum.
    expect(validArticle.content).toMatch(contentRegex);
  });

  test("WRONG: content with 18 chars should NOT match", () => {
    // "Only 19 chars here" is actually 18 chars. Below 20 minimum.
    expect(wrongContentShort.content).not.toMatch(contentRegex);
  });

  test("WRONG: empty content should NOT match", () => {
    expect(wrongContentEmpty.content).not.toMatch(contentRegex);
  });

  test("CORRECT: content with exactly 20 characters should match (boundary)", () => {
    // "12345678901234567890" = exactly 20 chars. Minimum valid.
    expect("12345678901234567890").toMatch(contentRegex);
  });

  test("WRONG: content with 19 characters should NOT match (boundary)", () => {
    // "1234567890123456789" = 19 chars. One short.
    expect("1234567890123456789").not.toMatch(contentRegex);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE URL REGEX TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("Image URL regex validation with toMatch", () => {
  test("CORRECT: valid HTTPS URL with path should match", () => {
    // "https://picsum.photos/seed/economy/800/400" — https, domain, path.
    expect(validArticle.imageUrl).toMatch(imageUrlRegex);
  });

  test("WRONG: HTTP URL (not HTTPS) should NOT match", () => {
    // "http://insecure.com/img.jpg" — starts with http:// instead of https://
    // The regex requires ^https:// — "http://" doesn't match.
    expect(wrongImageHttp.imageUrl).not.toMatch(imageUrlRegex);
  });

  test("WRONG: random text that is not a URL should NOT match", () => {
    // "not-a-url-at-all" has no protocol, no domain, no path.
    expect(wrongImageNoUrl.imageUrl).not.toMatch(imageUrlRegex);
  });

  test("WRONG: HTTPS URL without path segment should NOT match", () => {
    // "https://example.com" has domain but no path after the domain.
    // The regex requires /.+ at the end (at least one path segment).
    expect(wrongImageNoPath.imageUrl).not.toMatch(imageUrlRegex);
  });

  test("CORRECT: HTTPS URL with subdomain should match", () => {
    // "https://cdn.example.com/images/photo.jpg" — has subdomain and path.
    expect("https://cdn.example.com/images/photo.jpg").toMatch(imageUrlRegex);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY ID REGEX TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("CategoryId regex validation with toMatch", () => {
  test("CORRECT: 'cat-1' should match", () => {
    // "cat-1" = literal "cat-" followed by digit "1". Matches /^cat-\d+$/
    expect(validArticle.categoryId).toMatch(categoryIdRegex);
  });

  test("CORRECT: 'cat-99' should match (multi-digit)", () => {
    // \d+ matches one or more digits — "99" is two digits.
    expect("cat-99").toMatch(categoryIdRegex);
  });

  test("WRONG: 'wrong-1' should NOT match (bad prefix)", () => {
    // "wrong-1" doesn't start with "cat-".
    expect(wrongCategoryPrefix.categoryId).not.toMatch(categoryIdRegex);
  });

  test("WRONG: 'cat-abc' should NOT match (letters after prefix)", () => {
    // "cat-abc" has "abc" after "cat-" but \d+ only matches digits [0-9].
    expect(wrongCategoryLetters.categoryId).not.toMatch(categoryIdRegex);
  });

  test("WRONG: empty string should NOT match", () => {
    // "" doesn't match ^cat-\d+$ at all.
    expect(wrongCategoryEmpty.categoryId).not.toMatch(categoryIdRegex);
  });

  test("WRONG: 'CAT-1' (uppercase) should NOT match", () => {
    // The regex uses lowercase "cat-". "CAT-1" has uppercase letters.
    expect("CAT-1").not.toMatch(categoryIdRegex);
  });

  test("WRONG: 'cat-' with no number should NOT match", () => {
    // "cat-" has the prefix but \d+ requires at least one digit after it.
    expect("cat-").not.toMatch(categoryIdRegex);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SOURCE ID REGEX TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("SourceId regex validation with toMatch", () => {
  test("CORRECT: 'src-1' should match", () => {
    // "src-1" = "src-" + digit "1". Matches /^src-\d+$/
    expect(validArticle.sourceId).toMatch(sourceIdRegex);
  });

  test("CORRECT: 'src-123' should match (multi-digit)", () => {
    expect("src-123").toMatch(sourceIdRegex);
  });

  test("WRONG: 'source-1' should NOT match (wrong prefix)", () => {
    // "source-1" has extra characters before the dash.
    expect(wrongSourcePrefix.sourceId).not.toMatch(sourceIdRegex);
  });

  test("WRONG: empty string should NOT match", () => {
    expect(wrongSourceEmpty.sourceId).not.toMatch(sourceIdRegex);
  });

  test("WRONG: 'SRC-1' (uppercase) should NOT match", () => {
    expect("SRC-1").not.toMatch(sourceIdRegex);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLISHED DATE REGEX TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("PublishedAt date regex validation with toMatch", () => {
  test("CORRECT: ISO date should match", () => {
    // "2026-03-31T08:00:00Z" matches YYYY-MM-DDTHH:MM pattern.
    expect(validArticle.publishedAt).toMatch(dateRegex);
  });

  test("WRONG: human-readable date should NOT match", () => {
    // "March 31, 2026" — not ISO format, doesn't match \d{4}-\d{2}-\d{2}T
    expect(wrongDateFormat.publishedAt).not.toMatch(dateRegex);
  });

  test("WRONG: random string should NOT match", () => {
    // "not-a-date" is not a date at all.
    expect(wrongDateRandom.publishedAt).not.toMatch(dateRegex);
  });

  test("CORRECT: another valid ISO date should match", () => {
    expect("2026-01-15T14:30:00Z").toMatch(dateRegex);
  });

  test("WRONG: date with slashes should NOT match", () => {
    // "2026/03/31" uses slashes instead of dashes.
    expect("2026/03/31T08:00:00Z").not.toMatch(dateRegex);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FULL DUMMY ARTICLE VALIDATION — validate all fields of a dummy article at once
// ═══════════════════════════════════════════════════════════════════════════════

describe("Full dummy article validation — all fields checked", () => {
  test("CORRECT article: every field should pass its regex", () => {
    // Validate every field of validArticle against its regex.
    // If any toMatch fails, the test fails — proving one field is wrong.
    expect(validArticle.title).toMatch(titleRegex);
    expect(validArticle.summary).toMatch(summaryRegex);
    expect(validArticle.content).toMatch(contentRegex);
    expect(validArticle.imageUrl).toMatch(imageUrlRegex);
    expect(validArticle.categoryId).toMatch(categoryIdRegex);
    expect(validArticle.sourceId).toMatch(sourceIdRegex);
    expect(validArticle.publishedAt).toMatch(dateRegex);
    // readTime is a number — we check with toBeGreaterThanOrEqual / toBeLessThanOrEqual
    expect(validArticle.readTime).toBeGreaterThanOrEqual(1);
    expect(validArticle.readTime).toBeLessThanOrEqual(30);
  });

  test("WRONG article (bad title): title fails, others pass", () => {
    // wrongTitleNumber has "123 starts with number" as title.
    expect(wrongTitleNumber.title).not.toMatch(titleRegex);
    // All other fields are still valid (inherited from validArticle).
    expect(wrongTitleNumber.summary).toMatch(summaryRegex);
    expect(wrongTitleNumber.content).toMatch(contentRegex);
    expect(wrongTitleNumber.categoryId).toMatch(categoryIdRegex);
    expect(wrongTitleNumber.sourceId).toMatch(sourceIdRegex);
  });

  test("WRONG article (bad imageUrl): URL fails, others pass", () => {
    expect(wrongImageHttp.imageUrl).not.toMatch(imageUrlRegex);
    expect(wrongImageHttp.title).toMatch(titleRegex);
    expect(wrongImageHttp.categoryId).toMatch(categoryIdRegex);
  });

  test("WRONG article (bad categoryId): category fails, others pass", () => {
    expect(wrongCategoryPrefix.categoryId).not.toMatch(categoryIdRegex);
    expect(wrongCategoryPrefix.title).toMatch(titleRegex);
    expect(wrongCategoryPrefix.sourceId).toMatch(sourceIdRegex);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT RENDERING + SUBMISSION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("ArticleForm component — rendering and submission", () => {
  const defaultProps = {
    onSubmit: jest.fn(),
    isSubmitting: false,
    submitLabel: "Krijo artikullin",
  };

  beforeEach(() => {
    (defaultProps.onSubmit as jest.Mock).mockClear();
    (defaultProps.onSubmit as jest.Mock).mockResolvedValue(undefined);
  });

  test("should render all form labels", () => {
    render(<ArticleForm {...defaultProps} />);

    expect(screen.getByText("Titulli *")).toBeInTheDocument();
    expect(screen.getByText("Permbledhja *")).toBeInTheDocument();
    expect(screen.getByText("Permbajtja *")).toBeInTheDocument();
    expect(screen.getByText("URL e fotos")).toBeInTheDocument();
    expect(screen.getByText("Kategoria *")).toBeInTheDocument();
    expect(screen.getByText("Burimi *")).toBeInTheDocument();
  });

  test("should show error on empty submission", async () => {
    render(<ArticleForm {...defaultProps} />);

    // fireEvent.submit dispatches the form's submit event.
    const form = document.querySelector("form")!;
    fireEvent.submit(form);

    // waitFor retries until the error message appears in the DOM.
    await waitFor(() => {
      expect(
        screen.getByText("Ploteso te gjitha fushat e kerkuara."),
      ).toBeInTheDocument();
    });

    // not.toHaveBeenCalled — onSubmit was never invoked.
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  test("should call onSubmit when valid data is filled", async () => {
    render(<ArticleForm {...defaultProps} />);

    // Fill fields with the valid dummy article data.
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: validArticle.title } });
    fireEvent.change(inputs[1], { target: { value: validArticle.summary } });
    fireEvent.change(inputs[2], { target: { value: validArticle.content } });

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], {
      target: { value: validArticle.categoryId },
    });
    fireEvent.change(selects[1], { target: { value: validArticle.sourceId } });

    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => {
      // toHaveBeenCalledTimes(1) — onSubmit was called exactly once.
      expect(defaultProps.onSubmit).toHaveBeenCalledTimes(1);
    });

    // Verify the submitted data matches what we filled in.
    // expect.objectContaining does partial matching.
    expect(defaultProps.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: validArticle.title,
        summary: validArticle.summary,
        content: validArticle.content,
        categoryId: validArticle.categoryId,
        sourceId: validArticle.sourceId,
      }),
    );

    // BONUS: validate the submitted data against our regex patterns.
    // Extract the first argument passed to onSubmit.
    const submittedData = (defaultProps.onSubmit as jest.Mock).mock.calls[0][0];
    expect(submittedData.title).toMatch(titleRegex);
    expect(submittedData.summary).toMatch(summaryRegex);
    expect(submittedData.content).toMatch(contentRegex);
    expect(submittedData.categoryId).toMatch(categoryIdRegex);
    expect(submittedData.sourceId).toMatch(sourceIdRegex);
  });

  test("should show server error when onSubmit rejects", async () => {
    (defaultProps.onSubmit as jest.Mock).mockRejectedValue(new Error("fail"));

    render(<ArticleForm {...defaultProps} />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: validArticle.title } });
    fireEvent.change(inputs[1], { target: { value: validArticle.summary } });
    fireEvent.change(inputs[2], { target: { value: validArticle.content } });

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "cat-1" } });
    fireEvent.change(selects[1], { target: { value: "src-1" } });

    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => {
      expect(
        screen.getByText("Gabim gjate ruajtjes se artikullit."),
      ).toBeInTheDocument();
    });
  });

  test("should pre-fill form in edit mode and submitted data should match regex", async () => {
    const initialData: ArticleFormData = {
      title: validArticle.title,
      summary: validArticle.summary,
      content: validArticle.content,
      imageUrl: validArticle.imageUrl,
      categoryId: "cat-2",
      sourceId: "src-2",
      readTime: 7,
    };

    render(
      <ArticleForm
        {...defaultProps}
        initialData={initialData}
        submitLabel="Ruaj"
      />,
    );

    // toHaveValue checks the input's current value.
    const inputs = screen.getAllByRole("textbox");
    expect(inputs[0]).toHaveValue(validArticle.title);
    expect(screen.getByRole("spinbutton")).toHaveValue(7);

    // Submit the pre-filled form.
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledTimes(1);
    });

    // Validate the submitted edit data passes all regex checks.
    const submitted = (defaultProps.onSubmit as jest.Mock).mock.calls[0][0];
    expect(submitted.title).toMatch(titleRegex);
    expect(submitted.summary).toMatch(summaryRegex);
    expect(submitted.content).toMatch(contentRegex);
    expect(submitted.imageUrl).toMatch(imageUrlRegex);
    expect(submitted.categoryId).toMatch(categoryIdRegex);
    expect(submitted.sourceId).toMatch(sourceIdRegex);
  });
});
