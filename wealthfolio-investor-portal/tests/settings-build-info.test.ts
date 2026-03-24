import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BuildInfoSummary } from "@/components/settings/build-info-summary";

describe("build info summary", () => {
  it("renders visible version and build details", () => {
    const html = renderToStaticMarkup(
      React.createElement(BuildInfoSummary, {
        buildInfo: {
          version: "0.1.0",
          commit: "12345678",
          builtAt: "2026年3月25日 上午8:10",
        },
        labels: {
          title: "Build Info",
          description: "Confirm the deployed build.",
          version: "Version",
          build: "Build",
          builtAt: "Built At",
        },
      }),
    );

    expect(html).toContain("Build Info");
    expect(html).toContain("0.1.0");
    expect(html).toContain("12345678");
    expect(html).toContain("2026年3月25日 上午8:10");
  });
});
