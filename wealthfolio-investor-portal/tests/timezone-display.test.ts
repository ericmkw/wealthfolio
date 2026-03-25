import {
  DEFAULT_TIMEZONE,
  formatPortalDate,
  formatPortalDateTime,
  normalizeTimeZone,
} from "@/lib/timezone";

describe("timezone helpers", () => {
  it("defaults invalid or empty values to Hong Kong time", () => {
    expect(normalizeTimeZone("")).toBe(DEFAULT_TIMEZONE);
    expect(normalizeTimeZone("Mars/Phobos")).toBe(DEFAULT_TIMEZONE);
  });

  it("formats activity timestamps using the configured timezone", () => {
    const instant = "2026-03-18T13:53:03Z";
    const expected = new Intl.DateTimeFormat("zh-HK", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "America/New_York",
    }).format(new Date(instant));

    expect(formatPortalDateTime(instant, "zh-HK", "America/New_York")).toBe(expected);
  });

  it("treats date-only values as calendar dates instead of shifting them across timezones", () => {
    const expected = new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date("2026-03-18T00:00:00Z"));

    expect(formatPortalDate("2026-03-18", "en", "America/New_York")).toBe(expected);
  });
});
