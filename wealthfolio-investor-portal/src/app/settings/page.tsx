import { AppShell } from "@/components/layout/app-shell";
import { BuildInfoSummary } from "@/components/settings/build-info-summary";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/server";
import { formatBuildTimestamp, getBuildInfo } from "@/lib/build-info";
import { buildHeaderMetadata } from "@/lib/header-display";
import { getMessages } from "@/lib/i18n";
import { getResolvedPreferences } from "@/lib/preferences";
import { getInvestorOverview } from "@/lib/services/overview-service";

export default async function SettingsPage() {
  const user = await requireUser();
  const preferences = await getResolvedPreferences(user.id);
  const messages = getMessages(preferences.locale);
  const buildInfo = getBuildInfo();
  const overview = user.investorId ? await getInvestorOverview(user.investorId, user.id) : null;
  const headerMetadata = overview
    ? buildHeaderMetadata({
        locale: preferences.locale,
        timeZone: preferences.timezone,
        messages,
        sourceCurrency: overview.display.sourceCurrency,
        baseCurrency: overview.display.baseCurrency,
        fxRate: overview.display.fxRate,
        fxUpdatedAt: overview.display.fxUpdatedAt,
        quoteUpdatedAt: overview.display.unitPriceUpdatedAt,
      })
    : [];

  return (
    <AppShell
      user={user}
      locale={preferences.locale}
      preferences={preferences}
      title={messages.settings.title}
      description={messages.settings.description}
      headerMetadata={headerMetadata}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{messages.settings.title}</CardTitle>
            <CardDescription>{messages.settings.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <PreferencesForm
              initialPreferences={preferences}
              labels={{
                locale: messages.settings.locale,
                theme: messages.settings.theme,
                baseCurrency: messages.common.baseCurrency,
                timezone: messages.settings.timezone,
                dark: messages.settings.dark,
                light: messages.settings.light,
                zhHK: messages.settings.zhHK,
                en: messages.settings.en,
                zhCN: messages.settings.zhCN,
              }}
            />
          </CardContent>
        </Card>
        <BuildInfoSummary
          buildInfo={{
            ...buildInfo,
            builtAtDisplay: formatBuildTimestamp(
              buildInfo.builtAt,
              preferences.locale,
              preferences.timezone,
            ),
          }}
          labels={{
            title: messages.settings.buildInfo,
            description: messages.settings.buildInfoDescription,
            version: messages.settings.version,
            build: messages.settings.build,
            builtAt: messages.settings.builtAt,
          }}
        />
      </div>
    </AppShell>
  );
}
