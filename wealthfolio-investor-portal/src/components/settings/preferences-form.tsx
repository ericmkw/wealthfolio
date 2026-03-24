"use client";

import { useRouter } from "next/navigation";
import React, { startTransition, useEffect, useState } from "react";
import type { ResolvedPreferences } from "@/lib/preferences";
import { getSupportedTimezones } from "@/lib/timezone";

interface PreferencesFormProps {
  initialPreferences: ResolvedPreferences;
  labels: {
    locale: string;
    theme: string;
    baseCurrency: string;
    timezone: string;
    dark: string;
    light: string;
    zhHK: string;
    en: string;
    zhCN: string;
  };
}

interface PreferencesFieldsProps {
  form: ResolvedPreferences;
  isSaving: boolean;
  labels: PreferencesFormProps["labels"];
  timezoneOptions: string[];
  onChange: <Key extends keyof ResolvedPreferences>(field: Key, value: ResolvedPreferences[Key]) => void;
}

const selectClassName =
  "flex h-11 w-full rounded-md border border-[var(--wf-border)] bg-[var(--wf-card)] px-3 py-2 text-sm text-[var(--wf-fg)] outline-none focus:border-[var(--wf-accent)] disabled:cursor-not-allowed disabled:opacity-60";

const TIMEZONE_OPTIONS = getSupportedTimezones();

interface PreferencesResponse {
  message?: string;
  preferences?: ResolvedPreferences;
}

export function PreferencesFields({
  form,
  isSaving,
  labels,
  timezoneOptions,
  onChange,
}: PreferencesFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm text-[var(--wf-muted)]" htmlFor="locale">{labels.locale}</label>
        <select
          id="locale"
          name="locale"
          className={selectClassName}
          value={form.locale}
          disabled={isSaving}
          onChange={(event) => onChange("locale", event.target.value as ResolvedPreferences["locale"])}
        >
          <option value="zh-HK">{labels.zhHK}</option>
          <option value="en">{labels.en}</option>
          <option value="zh-CN">{labels.zhCN}</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-[var(--wf-muted)]" htmlFor="theme">{labels.theme}</label>
        <select
          id="theme"
          name="theme"
          className={selectClassName}
          value={form.theme}
          disabled={isSaving}
          onChange={(event) => onChange("theme", event.target.value as ResolvedPreferences["theme"])}
        >
          <option value="dark">{labels.dark}</option>
          <option value="light">{labels.light}</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-[var(--wf-muted)]" htmlFor="baseCurrency">{labels.baseCurrency}</label>
        <select
          id="baseCurrency"
          name="baseCurrency"
          className={selectClassName}
          value={form.baseCurrency}
          disabled={isSaving}
          onChange={(event) =>
            onChange("baseCurrency", event.target.value as ResolvedPreferences["baseCurrency"])
          }
        >
          <option value="USD">USD</option>
          <option value="HKD">HKD</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-[var(--wf-muted)]" htmlFor="timezone">{labels.timezone}</label>
        <select
          id="timezone"
          name="timezone"
          className={selectClassName}
          value={form.timezone}
          disabled={isSaving}
          onChange={(event) => onChange("timezone", event.target.value)}
        >
          {timezoneOptions.map((timeZone) => (
            <option key={timeZone} value={timeZone}>{timeZone}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function PreferencesForm({ initialPreferences, labels }: PreferencesFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(initialPreferences);
  const [savedForm, setSavedForm] = useState(initialPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(initialPreferences);
    setSavedForm(initialPreferences);
  }, [initialPreferences]);

  const persistPreferences = async (nextForm: ResolvedPreferences, fallbackForm: ResolvedPreferences) => {
    setForm(nextForm);
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/me/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nextForm),
      });
      const body = (await response.json().catch(() => null)) as PreferencesResponse | null;

      if (!response.ok) {
        setForm(fallbackForm);
        setError(body?.message ?? "Unable to save preferences.");
        return;
      }

      const resolvedPreferences = body?.preferences ?? nextForm;
      setForm(resolvedPreferences);
      setSavedForm(resolvedPreferences);
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setForm(fallbackForm);
      setError("Unable to save preferences.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = <Key extends keyof ResolvedPreferences>(
    field: Key,
    value: ResolvedPreferences[Key],
  ) => {
    if (isSaving || value === form[field]) {
      return;
    }

    const nextForm = {
      ...form,
      [field]: value,
    } as ResolvedPreferences;

    void persistPreferences(nextForm, savedForm);
  };

  return (
    <div className="space-y-4">
      <PreferencesFields
        form={form}
        isSaving={isSaving}
        labels={labels}
        timezoneOptions={TIMEZONE_OPTIONS}
        onChange={handleChange}
      />
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
