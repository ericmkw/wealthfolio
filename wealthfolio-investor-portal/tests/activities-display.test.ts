import {
  buildHoldingCompositionSegments,
  buildPositionDisplay,
  formatPercent,
} from "@/lib/activities-display";

describe("activities display helpers", () => {
  it("formats merged position labels and percentages", () => {
    expect(buildPositionDisplay({ symbol: "AAPL", assetName: "Apple Inc." })).toEqual({
      title: "AAPL",
      subtitle: "Apple Inc.",
    });

    expect(buildPositionDisplay({ symbol: null, assetName: "Cash USD" })).toEqual({
      title: "Cash USD",
      subtitle: null,
    });

    expect(formatPercent("5.26315789", "en")).toBe("5.26%");
    expect(formatPercent("-3.84615385", "zh-HK")).toBe("-3.85%");
    expect(formatPercent(null, "en")).toBe("—");
  });

  it("builds donut segments that cover the full circle", () => {
    const segments = buildHoldingCompositionSegments([
      { key: "a", label: "AAPL · Apple Inc.", weightPct: "50", positionKind: "security" },
      { key: "b", label: "TSLA · Tesla, Inc.", weightPct: "25", positionKind: "security" },
      { key: "c", label: "Cash USD", weightPct: "25", positionKind: "cash" },
    ]);

    expect(segments).toHaveLength(3);
    expect(segments[0]).toMatchObject({
      key: "a",
      label: "AAPL · Apple Inc.",
      dashArray: "50 50",
      dashOffset: "0",
    });
    expect(segments[2]).toMatchObject({
      key: "c",
      dashOffset: "-75",
    });
  });
});
