import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HeaderPreferencesFields } from "@/components/layout/header-preferences";
import { buildHeaderMetadata } from "@/lib/header-display";
import { getMessages } from "@/lib/i18n";

describe("header display", () => {
  it("builds compact header metadata with fx and quote freshness", () => {
    const messages = getMessages("zh-HK");

    expect(
      buildHeaderMetadata({
        locale: "zh-HK",
        messages,
        sourceCurrency: "USD",
        baseCurrency: "HKD",
        fxRate: "7.8312",
        fxUpdatedAt: "2026-03-22",
        quoteUpdatedAt: "2026-03-21",
      }),
    ).toEqual([
      "USD → HKD · 匯率 7.8312",
      "匯率更新時間：2026年3月22日",
      "報價更新時間：2026年3月21日",
    ]);
  });

  it("renders quick switch controls for locale, theme, and base currency", () => {
    const html = renderToStaticMarkup(
      React.createElement(HeaderPreferencesFields, {
        preferences: {
          locale: "zh-HK",
          theme: "dark",
          baseCurrency: "USD",
          timezone: "Asia/Hong_Kong",
        },
        isSaving: false,
        labels: {
          locale: "語言",
          theme: "主題",
          baseCurrency: "基準貨幣",
          dark: "深色",
          light: "淺色",
          zhHK: "繁體中文（香港）",
          en: "English",
          zhCN: "簡體中文",
        },
        onChange: () => undefined,
      }),
    );

    expect(html).toContain('name="locale"');
    expect(html).toContain('name="theme"');
    expect(html).toContain('name="baseCurrency"');
    expect(html).toContain("繁體中文（香港）");
    expect(html).toContain("USD");
  });
});
