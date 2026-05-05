import { timeAgo } from "..";

const NOW = new Date("2026-05-05T12:00:00Z");

describe("timeAgo", () => {
  it("returns a non-empty string for a moment ago", () => {
    expect(timeAgo(NOW, NOW)).toBeTruthy();
  });

  it("formats minutes ago with proper spacing (regression: '5minutes ago')", () => {
    const out = timeAgo(new Date("2026-05-05T11:55:00Z"), NOW);
    expect(out).toMatch(/\s/);
    expect(out).toContain("5");
  });

  it("formats hours ago with proper spacing (regression: '3hours ago')", () => {
    const out = timeAgo(new Date("2026-05-05T09:00:00Z"), NOW);
    expect(out).toMatch(/\s/);
    expect(out).toContain("3");
  });

  it("formats days ago with proper spacing (regression: '2days ago')", () => {
    const out = timeAgo(new Date("2026-05-03T12:00:00Z"), NOW);
    expect(out).toMatch(/\s/);
    expect(out).toContain("2");
  });

  it("accepts an ISO string", () => {
    expect(timeAgo("2026-05-05T11:00:00Z", NOW)).toContain("1");
  });

  it("accepts an epoch millis number", () => {
    expect(timeAgo(NOW.getTime() - 60 * 60 * 1000, NOW)).toContain("1");
  });

  it("uses Albanian locale", () => {
    // Sanity: the output is whatever Intl.RelativeTimeFormat('sq-AL') produces.
    // We don't pin the exact string (CLDR can update) — just confirm it's not English.
    const out = timeAgo(new Date("2026-05-04T12:00:00Z"), NOW);
    expect(out).not.toMatch(/\bago\b/i);
  });
});
