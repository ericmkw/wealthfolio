import React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ConfiguredInvestorsManager } from "@/components/admin/configured-investors-manager";
import { requireUser } from "@/lib/auth/server";
import { getMessages } from "@/lib/i18n";
import { getResolvedPreferences } from "@/lib/preferences";
import { listInvestorMappings } from "@/lib/services/admin-service";
import { getAdminSourceOptions } from "@/lib/services/source-options-service";

export default async function AdminInvestorsPage() {
  const user = await requireUser("admin");
  const preferences = await getResolvedPreferences(user.id);
  const messages = getMessages(preferences.locale);
  const [mappings, sourceOptions] = await Promise.all([listInvestorMappings(), getAdminSourceOptions()]);

  return (
    <AppShell
      user={user}
      locale={preferences.locale}
      preferences={preferences}
      title={messages.common.investors}
      description={messages.admin.investorsDescription}
    >
      <ConfiguredInvestorsManager
        locale={preferences.locale}
        mappings={mappings}
        sourceOptions={{
          accounts: sourceOptions.accounts,
          fundAssets: sourceOptions.fundAssets,
        }}
      />
    </AppShell>
  );
}
