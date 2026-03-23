import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth/server";
import { buildHeaderMetadata } from "@/lib/header-display";
import { getMessages } from "@/lib/i18n";
import { getResolvedPreferences } from "@/lib/preferences";
import { getInvestorOverview } from "@/lib/services/overview-service";
import { listFundOperations, listInvestorCashflows } from "@/lib/services/activity-service";
import { formatDateTime, formatMoney } from "@/lib/utils";

export default async function ActivitiesPage() {
  const user = await requireUser();
  const preferences = await getResolvedPreferences(user.id);
  const messages = getMessages(preferences.locale);
  const [fundOperations, cashflows, overview] = await Promise.all([
    listFundOperations(user.id),
    user.investorId ? listInvestorCashflows(user.investorId, user.id) : Promise.resolve({ display: null, cashflows: [] }),
    user.investorId ? getInvestorOverview(user.investorId, user.id) : Promise.resolve(null),
  ]);
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
      title={messages.activities.title}
      description={messages.activities.description}
      headerMetadata={headerMetadata}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{messages.activities.fundOperations}</CardTitle>
            <CardDescription>{messages.activities.fundOperationsDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{messages.activities.date}</TableHead>
                  <TableHead>{messages.activities.type}</TableHead>
                  <TableHead>{messages.activities.symbol}</TableHead>
                  <TableHead>{messages.activities.assetName}</TableHead>
                  <TableHead>{messages.activities.price}</TableHead>
                  <TableHead>{messages.activities.fee}</TableHead>
                  <TableHead>{messages.activities.account}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fundOperations.activities.length ? (
                  fundOperations.activities.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>{formatDateTime(event.occurredAt, preferences.locale)}</TableCell>
                      <TableCell>
                        <Badge variant={event.activityType}>{event.activityType}</Badge>
                      </TableCell>
                      <TableCell>{event.symbol ?? "—"}</TableCell>
                      <TableCell>{event.assetName ?? "—"}</TableCell>
                      <TableCell>{formatMoney(event.displayUnitPrice, event.displayUnitPriceCurrency, preferences.locale)}</TableCell>
                      <TableCell>{formatMoney(event.displayFee, event.displayCurrency, preferences.locale)}</TableCell>
                      <TableCell>{event.accountName}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell className="text-[var(--wf-muted)]" colSpan={7}>
                      No published fund operations yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{messages.activities.myCashflows}</CardTitle>
            <CardDescription>{messages.activities.myCashflowsDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{messages.activities.date}</TableHead>
                  <TableHead>{messages.activities.type}</TableHead>
                  <TableHead>{messages.activities.amount}</TableHead>
                  <TableHead>{messages.common.currency}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashflows.cashflows.length ? (
                  cashflows.cashflows.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>{formatDateTime(event.occurredAt, preferences.locale)}</TableCell>
                      <TableCell>
                        <Badge variant={event.eventType}>{event.eventType}</Badge>
                      </TableCell>
                      <TableCell>{formatMoney(event.displayAmount, event.displayCurrency, preferences.locale)}</TableCell>
                      <TableCell>{event.displayCurrency}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell className="text-[var(--wf-muted)]" colSpan={4}>
                      No personal cashflow events in the current published snapshot.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
