import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/server";
import { buildHeaderMetadata } from "@/lib/header-display";
import { getMessages } from "@/lib/i18n";
import { getResolvedPreferences } from "@/lib/preferences";
import { getInvestorOverview } from "@/lib/services/overview-service";
import { formatDate, formatMoney } from "@/lib/utils";

export default async function OverviewPage() {
  const user = await requireUser();
  const preferences = await getResolvedPreferences(user.id);
  const messages = getMessages(preferences.locale);
  const overview = user.investorId ? await getInvestorOverview(user.investorId, user.id) : null;
  const headerMetadata = overview
    ? buildHeaderMetadata({
        locale: preferences.locale,
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
      title={messages.overview.title}
      description={messages.overview.description}
      headerMetadata={headerMetadata}
    >
      {!overview ? (
        <Card>
          <CardHeader>
            <CardTitle>{messages.overview.noSnapshotTitle}</CardTitle>
            <CardDescription>{messages.overview.noSnapshotDescription}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardDescription>{messages.overview.unitsHeld}</CardDescription>
                <CardTitle>{overview.snapshot.unitsHeld}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>{messages.overview.latestUnitPrice}</CardDescription>
                <CardTitle>
                  {formatMoney(
                    overview.display.latestUnitPrice,
                    overview.display.latestUnitPriceCurrency,
                    preferences.locale,
                  )}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>{messages.overview.latestNav}</CardDescription>
                <CardTitle>{formatMoney(overview.display.latestNav, overview.display.latestNavCurrency, preferences.locale)}</CardTitle>
              </CardHeader>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{messages.overview.performanceHistory}</CardTitle>
              <CardDescription>{messages.overview.performanceHistoryDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview.performanceHistory.length ? (
                overview.performanceHistory.map((point) => (
                  <div
                    key={point.id}
                    className="flex items-center justify-between rounded-xl border border-[var(--wf-border)] bg-[var(--wf-soft)] px-4 py-3"
                  >
                    <span className="text-sm text-[var(--wf-muted)]">{formatDate(point.valuationDate, preferences.locale)}</span>
                    <span className="font-medium">{formatMoney(point.displayNav, overview.display.baseCurrency, preferences.locale)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--wf-muted)]">No performance history in the current published snapshot.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{messages.overview.unitPriceHistory}</CardTitle>
              <CardDescription>{messages.overview.unitPriceHistoryDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview.unitPriceHistory.length ? (
                overview.unitPriceHistory.map((point) => (
                  <div
                    key={point.id}
                    className="flex items-center justify-between rounded-xl border border-[var(--wf-border)] bg-[var(--wf-soft)] px-4 py-3"
                  >
                    <span className="text-sm text-[var(--wf-muted)]">{formatDate(point.quoteDay, preferences.locale)}</span>
                    <Badge variant="subscription">
                      {formatMoney(point.displayUnitPrice, point.displayUnitPriceCurrency, preferences.locale)}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--wf-muted)]">No unit price history in the current published snapshot.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
