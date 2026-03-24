import { AppShell } from "@/components/layout/app-shell";
import { InvestorMappingForm } from "@/components/admin/investor-mapping-form";
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
import { getMessages } from "@/lib/i18n";
import { getResolvedPreferences } from "@/lib/preferences";
import { resolveMappingLabels } from "@/lib/source-option-labels";
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
      <div className="space-y-6">
        <InvestorMappingForm locale={preferences.locale} />
        <Card>
          <CardHeader>
            <CardTitle>{messages.admin.configuredInvestorsTitle}</CardTitle>
            <CardDescription>{messages.admin.configuredInvestorsDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{messages.admin.name}</TableHead>
                  <TableHead>{messages.admin.username}</TableHead>
                  <TableHead>{messages.admin.emailOptional}</TableHead>
                  <TableHead>{messages.admin.distributionAccount}</TableHead>
                  <TableHead>{messages.admin.fundAsset}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.length ? (
                  mappings.map((mapping) => {
                    const labels = resolveMappingLabels(sourceOptions.accounts, sourceOptions.fundAssets, mapping);

                    return (
                      <TableRow key={mapping.investorId}>
                        <TableCell>{mapping.investorName}</TableCell>
                        <TableCell>{mapping.username ?? "—"}</TableCell>
                        <TableCell>{mapping.email ?? "—"}</TableCell>
                        <TableCell>
                          {labels.distributionAccountLabel ?? "Unknown account"}
                          <div className="text-xs text-[var(--wf-muted)]">{mapping.distributionAccountId ?? "—"}</div>
                        </TableCell>
                        <TableCell>
                          {labels.fundAssetLabel ?? "Unknown asset"}
                          <div className="text-xs text-[var(--wf-muted)]">{mapping.fundAssetId ?? "—"}</div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell className="text-[var(--wf-muted)]" colSpan={5}>
                      {messages.admin.noInvestors}
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
