"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMessages } from "@/lib/i18n";
import type { AppLocale } from "@/lib/preferences";

interface SourceOption {
  id: string;
  label: string;
}

interface SourceOptionsResponse {
  accounts: SourceOption[];
  fundAssets: SourceOption[];
}

interface MappingSaveResponse {
  distributionAccountLabel?: string;
  fundAssetLabel?: string;
}

const selectClassName =
  "flex h-11 w-full rounded-md border border-[var(--wf-border)] bg-[var(--wf-card)] px-3 py-2 text-sm text-[var(--wf-fg)] outline-none focus:border-[var(--wf-accent)]";

export function InvestorMappingForm({ locale }: { locale: AppLocale }) {
  const router = useRouter();
  const messages = getMessages(locale);
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    distributionAccountId: "",
    fundAssetId: "",
  });
  const [accountSearch, setAccountSearch] = useState("");
  const [assetSearch, setAssetSearch] = useState("");
  const [accounts, setAccounts] = useState<SourceOption[]>([]);
  const [fundAssets, setFundAssets] = useState<SourceOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      const response = await fetch("/api/admin/source-options");
      if (!response.ok) {
        return;
      }

      const body = (await response.json()) as SourceOptionsResponse;
      if (cancelled) {
        return;
      }

      setAccounts(body.accounts);
      setFundAssets(body.fundAssets);
    };

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredAccounts = useMemo(() => {
    const query = accountSearch.trim().toLowerCase();
    return query
      ? accounts.filter((account) => account.label.toLowerCase().includes(query))
      : accounts;
  }, [accountSearch, accounts]);

  const filteredFundAssets = useMemo(() => {
    const query = assetSearch.trim().toLowerCase();
    return query
      ? fundAssets.filter((asset) => asset.label.toLowerCase().includes(query))
      : fundAssets;
  }, [assetSearch, fundAssets]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSavedMessage(null);
    setIsSaving(true);

    const response = await fetch("/api/admin/investor-account-mappings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      setError(body?.message ?? "Unable to save investor mapping.");
      setIsSaving(false);
      return;
    }

    const body = (await response.json().catch(() => null)) as MappingSaveResponse | null;

    setForm({
      name: "",
      username: "",
      email: "",
      password: "",
      distributionAccountId: "",
      fundAssetId: "",
    });
    setAccountSearch("");
    setAssetSearch("");
    setSavedMessage(
      body?.distributionAccountLabel && body?.fundAssetLabel
        ? `Saved mapping: ${body.distributionAccountLabel} / ${body.fundAssetLabel}`
        : "Investor mapping saved.",
    );
    router.refresh();
    setIsSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{messages.admin.addOrUpdateInvestorTitle}</CardTitle>
        <CardDescription>{messages.admin.addOrUpdateInvestorDescription}</CardDescription>
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
              minLength={1}
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              required
            />
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
            {accounts.length ? (
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
            {fundAssets.length ? (
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
          <div className="md:col-span-2">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? messages.admin.savingInvestor : messages.admin.saveInvestor}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
