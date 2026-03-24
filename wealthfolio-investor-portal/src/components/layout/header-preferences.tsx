"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ResolvedPreferences } from "@/lib/preferences";

interface HeaderPreferencesProps {
  initialPreferences: ResolvedPreferences;
  labels: {
    locale: string;
    theme: string;
    baseCurrency: string;
    dark: string;
    light: string;
    zhHK: string;
    en: string;
    zhCN: string;
  };
}

interface HeaderPreferencesFieldsProps {
  preferences: ResolvedPreferences;
  isSaving: boolean;
  labels: HeaderPreferencesProps["labels"];
  onChange: (nextPreferences: ResolvedPreferences) => void;
}

const selectClassName =
  "h-9 rounded-md border border-[var(--wf-border)] bg-[var(--wf-card)] px-2 py-1 text-xs text-[var(--wf-fg)] outline-none focus:border-[var(--wf-accent)]";

export function HeaderPreferences({ initialPreferences, labels }: HeaderPreferencesProps) {
  const router = useRouter();
  const [preferences, setPreferences] = useState(initialPreferences);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setPreferences(initialPreferences);
  }, [initialPreferences]);

  const updatePreferences = async (nextPreferences: ResolvedPreferences) => {
    setPreferences(nextPreferences);
    setIsSaving(true);

    const response = await fetch("/api/me/preferences", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nextPreferences),
    });

    if (!response.ok) {
      setPreferences(initialPreferences);
      setIsSaving(false);
      return;
    }

    router.refresh();
    setIsSaving(false);
  };

  return (
    <HeaderPreferencesFields
      preferences={preferences}
      isSaving={isSaving}
      labels={labels}
      onChange={(nextPreferences) => void updatePreferences(nextPreferences)}
    />
  );
}

export function HeaderPreferencesFields({
  preferences,
  isSaving,
  labels,
  onChange,
}: HeaderPreferencesFieldsProps) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-[11px] text-[var(--wf-muted)]">
        <span>{labels.locale}</span>
        <select
          id="header-locale"
          name="locale"
          className={selectClassName}
          value={preferences.locale}
          disabled={isSaving}
          onChange={(event) =>
            onChange({
              ...preferences,
              locale: event.target.value as ResolvedPreferences["locale"],
            })
          }
        >
          <option value="zh-HK">{labels.zhHK}</option>
          <option value="en">{labels.en}</option>
          <option value="zh-CN">{labels.zhCN}</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-[11px] text-[var(--wf-muted)]">
        <span>{labels.theme}</span>
        <select
          id="header-theme"
          name="theme"
          className={selectClassName}
          value={preferences.theme}
          disabled={isSaving}
          onChange={(event) =>
            onChange({
              ...preferences,
              theme: event.target.value as ResolvedPreferences["theme"],
            })
          }
        >
          <option value="dark">{labels.dark}</option>
          <option value="light">{labels.light}</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-[11px] text-[var(--wf-muted)]">
        <span>{labels.baseCurrency}</span>
        <select
          id="header-base-currency"
          name="baseCurrency"
          className={selectClassName}
          value={preferences.baseCurrency}
          disabled={isSaving}
          onChange={(event) =>
            onChange({
              ...preferences,
              baseCurrency: event.target.value as ResolvedPreferences["baseCurrency"],
            })
          }
        >
          <option value="USD">USD</option>
          <option value="HKD">HKD</option>
        </select>
      </label>
    </div>
  );
}
