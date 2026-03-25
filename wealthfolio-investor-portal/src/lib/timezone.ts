const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const DEFAULT_TIMEZONE = "Asia/Hong_Kong";

const TIMEZONE_FALLBACKS = [
  DEFAULT_TIMEZONE,
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
];

function normalizeValue(value: string | null | undefined) {
  return value?.trim() ?? "";
}

export function canonicalizeTimeZone(value: string | null | undefined) {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: normalized,
    }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

export function normalizeTimeZone(value: string | null | undefined) {
  return canonicalizeTimeZone(value) ?? DEFAULT_TIMEZONE;
}

export function isValidTimeZone(value: string | null | undefined) {
  return canonicalizeTimeZone(value) !== null;
}

export function getSupportedTimezones() {
  const supportedValuesOf = (
    Intl as typeof Intl & {
      supportedValuesOf?: (key: "timeZone") => string[];
    }
  ).supportedValuesOf;

  const rawValues =
    typeof supportedValuesOf === "function"
      ? supportedValuesOf("timeZone")
      : TIMEZONE_FALLBACKS;

  return Array.from(new Set([DEFAULT_TIMEZONE, ...rawValues])).sort((left, right) =>
    left.localeCompare(right),
  );
}

export function formatPortalDateTime(
  value: string,
  locale = "en-US",
  timeZone?: string | null,
) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZone: normalizeTimeZone(timeZone),
  }).format(parsed);
}

export function formatPortalDate(value: string, locale = "en-US", timeZone?: string | null) {
  const parsed = DATE_ONLY_PATTERN.test(value) ? new Date(`${value}T00:00:00Z`) : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: DATE_ONLY_PATTERN.test(value) ? "UTC" : normalizeTimeZone(timeZone),
  }).format(parsed);
}
