import packageJson from "../../package.json";
import { normalizeTimeZone } from "@/lib/timezone";

interface BuildInfoInput {
  APP_VERSION?: string;
  APP_BUILD_COMMIT?: string;
  APP_BUILD_TIME?: string;
}

export interface BuildInfo {
  version: string;
  commit: string | null;
  builtAt: string | null;
}

function normalizeValue(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function shortenCommit(value: string) {
  const dirtySuffix = value.endsWith("-dirty") ? "-dirty" : "";
  const base = dirtySuffix ? value.slice(0, -dirtySuffix.length) : value;
  return `${base.slice(0, 8)}${dirtySuffix}`;
}

export function resolveBuildInfo(input: BuildInfoInput): BuildInfo {
  const commit = normalizeValue(input.APP_BUILD_COMMIT);

  return {
    version: normalizeValue(input.APP_VERSION) ?? packageJson.version,
    commit: commit ? shortenCommit(commit) : null,
    builtAt: normalizeValue(input.APP_BUILD_TIME),
  };
}

export function formatBuildTimestamp(
  value: string | null | undefined,
  locale: string | undefined = undefined,
  timeZone?: string | null,
) {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return normalized;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timeZone ? normalizeTimeZone(timeZone) : undefined,
  }).format(parsed);
}

export function getBuildInfo() {
  return resolveBuildInfo({
    APP_VERSION: process.env.APP_VERSION,
    APP_BUILD_COMMIT: process.env.APP_BUILD_COMMIT,
    APP_BUILD_TIME: process.env.APP_BUILD_TIME,
  });
}
