import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PreferencesFields } from "@/components/settings/preferences-form";

describe("preferences fields", () => {
  it("renders a timezone selector and removes the save button for autosave settings", () => {
    const html = renderToStaticMarkup(
      React.createElement(PreferencesFields, {
        form: {
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
          timezone: "時區",
          dark: "深色",
          light: "淺色",
          zhHK: "繁體中文（香港）",
          en: "English",
          zhCN: "簡體中文",
        },
        timezoneOptions: ["Asia/Hong_Kong", "America/New_York"],
        onChange: () => undefined,
      }),
    );

    expect(html).toContain('name="timezone"');
    expect(html).toContain("Asia/Hong_Kong");
    expect(html).not.toContain('type="submit"');
    expect(html).not.toContain("儲存設定");
  });
});
