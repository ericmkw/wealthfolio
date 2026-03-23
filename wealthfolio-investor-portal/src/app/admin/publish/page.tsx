import { AppShell } from "@/components/layout/app-shell";
import { PublishPanel } from "@/components/admin/publish-panel";
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
import { getMessages } from "@/lib/i18n";
import { getResolvedPreferences } from "@/lib/preferences";
import { getCurrentPublishedVersion, listPublishRuns } from "@/lib/services/admin-service";
import { formatDateTime } from "@/lib/utils";

export default async function AdminPublishPage() {
  const user = await requireUser("admin");
  const preferences = await getResolvedPreferences(user.id);
  const messages = getMessages(preferences.locale);
  const [runs, currentVersion] = await Promise.all([listPublishRuns(), getCurrentPublishedVersion()]);

  return (
    <AppShell
      user={user}
      locale={preferences.locale}
      preferences={preferences}
      title={messages.common.publish}
      description={messages.admin.publishDescription}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <PublishPanel locale={preferences.locale} />
          <Card>
            <CardHeader>
              <CardTitle>{messages.admin.currentVersionTitle}</CardTitle>
              <CardDescription>{messages.admin.currentVersionDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {currentVersion ? (
                <>
                  <p className="text-sm text-[var(--wf-muted)]">{messages.admin.versionId}</p>
                  <p className="font-mono text-sm text-[var(--wf-fg)]">{currentVersion.id}</p>
                  <p className="text-sm text-[var(--wf-muted)]">{messages.admin.publishedAt}</p>
                  <p className="text-sm text-[var(--wf-fg)]">
                    {formatDateTime(currentVersion.createdAt.toISOString(), preferences.locale)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-[var(--wf-muted)]">{messages.admin.noPublishedVersion}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{messages.admin.publishRunsTitle}</CardTitle>
            <CardDescription>{messages.admin.publishRunsDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{messages.admin.started}</TableHead>
                  <TableHead>{messages.admin.status}</TableHead>
                  <TableHead>{messages.admin.version}</TableHead>
                  <TableHead>{messages.admin.masterBackup}</TableHead>
                  <TableHead>{messages.admin.distributionBackup}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.length ? (
                  runs.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell>{formatDateTime(run.startedAt.toISOString(), preferences.locale)}</TableCell>
                      <TableCell>
                        <Badge variant={run.status}>{run.status}</Badge>
                      </TableCell>
                      <TableCell>{run.publishedVersionId ?? "—"}</TableCell>
                      <TableCell>{run.masterSnapshotFilename ?? "—"}</TableCell>
                      <TableCell>{run.distributionSnapshotFilename ?? "—"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-[var(--wf-muted)]">
                      {messages.admin.noPublishRuns}
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
