import { appSettings, publishedFundHoldings, userPreferences } from "@/db/schema";

describe("db schema", () => {
  it("exports publishedFundHoldings for holdings projections", () => {
    expect(publishedFundHoldings).toBeDefined();
    expect(
      ((publishedFundHoldings as unknown) as Record<symbol, unknown>)[Symbol.for("drizzle:Name")],
    ).toBe("published_fund_holdings");
  });

  it("exposes timezone columns for default and per-user preferences", () => {
    expect(appSettings.defaultTimezone).toBeDefined();
    expect(userPreferences.timezone).toBeDefined();
  });
});
