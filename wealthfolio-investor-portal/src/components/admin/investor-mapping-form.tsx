"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMessages } from "@/lib/i18n";
import type { AppLocale } from "@/lib/preferences";
import type { SourceOption } from "@/lib/source-option-labels";

export interface InvestorFormValues {
  investorId?: string;
  name: string;
  username: string;
  email: string;
  password: string;
  distributionAccountId: string;
  fundAssetId: string;
}

interface InvestorMappingFormProps {
  locale: AppLocale;
  mode?: "create" | "edit";
  initialValues?: Partial<InvestorFormValues> | null;
  sourceOptions: {
    accounts: SourceOption[];
    fundAssets: SourceOption[];
  };
  onSaved?: () => void;
  onCancel?: () => void;
}

interface SaveInvestorResponse {
  message?: string;
  investorId?: string;
}

const selectClassName =
  "flex h-11 w-full rounded-md border border-[var(--wf-border)] bg-[var(--wf-card)] px-3 py-2 text-sm text-[var(--wf-fg)] outline-none focus:border-[var(--wf-accent)]";

function buildFormState(initialValues?: Partial<InvestorFormValues> | null): InvestorFormValues {
  return {
    investorId: initialValues?.investorId,
    name: initialValues?.name ?? "",
    username: initialValues?.username ?? "",
    email: initialValues?.email ?? "",
    password: "",
    distributionAccountId: initialValues?.distributionAccountId ?? "",
    fundAssetId: initialValues?.fundAssetId ?? "",
  };
}

export function InvestorMappingForm({
  locale,
  mode = "create",
  initialValues,
  sourceOptions,
  onSaved,
  onCancel,
}: InvestorMappingFormProps) {
  const router = useRouter();
  const messages = getMessages(locale);
  const isEditMode = mode === "edit";
  const [form, setForm] = useState(() => buildFormState(initialValues));
  const [accountSearch, setAccountSearch] = useState("");
  const [assetSearch, setAssetSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(buildFormState(initialValues));
    setAccountSearch("");
    setAssetSearch("");
    setError(null);
  }, [initialValues, mode]);

  const filteredAccounts = useMemo(() => {
    const query = accountSearch.trim().toLowerCase();
    return query
      ? sourceOptions.accounts.filter((account) => account.label.toLowerCase().includes(query))
      : sourceOptions.accounts;
  }, [accountSearch, sourceOptions.accounts]);

  const filteredFundAssets = useMemo(() => {
    const query = assetSearch.trim().toLowerCase();
    return query
      ? sourceOptions.fundAssets.filter((asset) => asset.label.toLowerCase().includes(query))
      : sourceOptions.fundAssets;
  }, [assetSearch, sourceOptions.fundAssets]);

  const updateField = (field: keyof InvestorFormValues, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSavedMessage(null);
    setIsSaving(true);

    const payload = isEditMode
      ? {
          investorId: form.investorId,
          name: form.name,
          username: form.username,
          email: form.email,
          password: form.password,
          distributionAccountId: form.distributionAccountId,
          fundAssetId: form.fundAssetId,
        }
      : {
          name: form.name,
          username: form.username,
          email: form.email,
          password: form.password,
          distributionAccountId: form.distributionAccountId,
          fundAssetId: form.fundAssetId,
        };

    const response = await fetch("/api/admin/investor-account-mappings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      setError(body?.message ?? "Unable to save investor mapping.");
      setIsSaving(false);
      return;
    }

    await response.json().catch(() => null as SaveInvestorResponse | null);
    setSavedMessage(isEditMode ? messages.admin.investorUpdated : messages.admin.investorCreated);

    if (!isEditMode) {
      setForm(buildFormState(null));
      setAccountSearch("");
      setAssetSearch("");
    }

    if (onSaved) {
      onSaved();
    } else {
      router.refresh();
    }
    setIsSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? messages.admin.editInvestorTitle : messages.admin.createInvestorTitle}</CardTitle>
        <CardDescription>
          {isEditMode ? messages.admin.editInvestorDescription : messages.admin.createInvestorDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">{messages.admin.name}</Label>
            <Input id="name" value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">{messages.admin.username}</Label>
            <Input
              id="username"
              autoComplete="username"
              value={form.username}
              onChange={(event) => updateField("username", event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{messages.admin.emailOptional}</Label>
            <Input id="email" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{messages.admin.password}</Label>
            <Input
              id="password"
              type="password"
              minLength={isEditMode ? undefined : 1}
              required={!isEditMode}
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
            />
            {isEditMode ? <p className="text-xs text-[var(--wf-muted)]">{messages.admin.passwordOptionalHint}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountSearch">{messages.admin.searchDistributionAccount}</Label>
            <Input
              id="accountSearch"
              placeholder="Search e.g. KHM_USD"
              value={accountSearch}
              onChange={(event) => setAccountSearch(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="distributionAccountId">{messages.admin.distributionAccount}</Label>
            {sourceOptions.accounts.length ? (
              <select
                id="distributionAccountId"
                className={selectClassName}
                value={form.distributionAccountId}
                onChange={(event) => updateField("distributionAccountId", event.target.value)}
                required
              >
                <option value="">{messages.admin.selectAccount}</option>
                {filteredAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.label}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id="distributionAccountId"
                value={form.distributionAccountId}
                onChange={(event) => updateField("distributionAccountId", event.target.value)}
                required
              />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="assetSearch">{messages.admin.searchFundAsset}</Label>
            <Input
              id="assetSearch"
              placeholder="Search e.g. RICHUSD"
              value={assetSearch}
              onChange={(event) => setAssetSearch(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fundAssetId">{messages.admin.fundAsset}</Label>
            {sourceOptions.fundAssets.length ? (
              <select
                id="fundAssetId"
                className={selectClassName}
                value={form.fundAssetId}
                onChange={(event) => updateField("fundAssetId", event.target.value)}
                required
              >
                <option value="">{messages.admin.selectFundAsset}</option>
                {filteredFundAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.label}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id="fundAssetId"
                value={form.fundAssetId}
                onChange={(event) => updateField("fundAssetId", event.target.value)}
                required
              />
            )}
          </div>
          {error ? <p className="md:col-span-2 text-sm text-rose-300">{error}</p> : null}
          {savedMessage ? <p className="md:col-span-2 text-sm text-emerald-300">{savedMessage}</p> : null}
          <div className="md:col-span-2 flex flex-wrap gap-2">
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? messages.admin.savingInvestor
                : isEditMode
                  ? messages.admin.updateInvestor
                  : messages.admin.createInvestor}
            </Button>
            {isEditMode ? (
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={() => {
                  setForm(buildFormState(null));
                  setAccountSearch("");
                  setAssetSearch("");
                  setError(null);
                  onCancel?.();
                }}
              >
                {messages.admin.cancelEditInvestor}
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
