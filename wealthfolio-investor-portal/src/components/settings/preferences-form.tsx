"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface PreferencesFormProps {
  initialPreferences: {
    locale: "en" | "zh-HK" | "zh-CN";
    theme: "dark" | "light";
    baseCurrency: "USD" | "HKD";
  };
  labels: {
    locale: string;
    theme: string;
    baseCurrency: string;
    save: string;
    dark: string;
    light: string;
    zhHK: string;
    en: string;
    zhCN: string;
  };
}

const selectClassName =
  "flex h-11 w-full rounded-md border border-[var(--wf-border)] bg-[var(--wf-card)] px-3 py-2 text-sm text-[var(--wf-fg)] outline-none focus:border-[var(--wf-accent)]";

export function PreferencesForm({ initialPreferences, labels }: PreferencesFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(initialPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    const response = await fetch("/api/me/preferences", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      setError(body?.message ?? "Unable to save preferences.");
      setIsSaving(false);
      return;
    }

    router.refresh();
    setIsSaving(false);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm text-[var(--wf-muted)]" htmlFor="locale">{labels.locale}</label>
        <select
          id="locale"
          className={selectClassName}
          value={form.locale}
          onChange={(event) => setForm((current) => ({ ...current, locale: event.target.value as typeof form.locale }))}
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
          className={selectClassName}
          value={form.theme}
          onChange={(event) => setForm((current) => ({ ...current, theme: event.target.value as typeof form.theme }))}
        >
          <option value="dark">{labels.dark}</option>
          <option value="light">{labels.light}</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-[var(--wf-muted)]" htmlFor="baseCurrency">{labels.baseCurrency}</label>
        <select
          id="baseCurrency"
          className={selectClassName}
          value={form.baseCurrency}
          onChange={(event) =>
            setForm((current) => ({ ...current, baseCurrency: event.target.value as typeof form.baseCurrency }))
          }
        >
          <option value="USD">USD</option>
          <option value="HKD">HKD</option>
        </select>
      </div>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <Button type="submit" disabled={isSaving}>
        {isSaving ? `${labels.save}...` : labels.save}
      </Button>
    </form>
  );
}
