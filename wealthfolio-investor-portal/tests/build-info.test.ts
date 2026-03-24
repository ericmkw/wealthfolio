import { formatBuildTimestamp, resolveBuildInfo } from "@/lib/build-info";

describe("build info", () => {
  it("shortens commit hashes and preserves dirty suffixes", () => {
    expect(
      resolveBuildInfo({
        APP_BUILD_COMMIT: "1234567890abcdef-dirty",
        APP_BUILD_TIME: "2026-03-25T00:10:00Z",
        APP_VERSION: "0.1.0",
      }),
    ).toMatchObject({
      version: "0.1.0",
      commit: "12345678-dirty",
      builtAt: "2026-03-25T00:10:00Z",
    });
  });

  it("formats build timestamps for display", () => {
    expect(formatBuildTimestamp("2026-03-25T00:10:00Z")).toBe(
      new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date("2026-03-25T00:10:00Z")),
    );
  });
});
