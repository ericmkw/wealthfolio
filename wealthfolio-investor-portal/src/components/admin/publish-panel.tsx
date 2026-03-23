"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMessages } from "@/lib/i18n";
import type { AppLocale } from "@/lib/preferences";

interface SourceOptionsResponse {
  masterPath: string | null;
  distributionPath: string | null;
}

export function PublishPanel({ locale }: { locale: AppLocale }) {
  const router = useRouter();
  const messages = getMessages(locale);
  const [error, setError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [masterPath, setMasterPath] = useState("");
  const [distributionPath, setDistributionPath] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadLatestPaths = async () => {
      const response = await fetch("/api/admin/source-options");
      if (!response.ok) {
        return;
      }

      const body = (await response.json()) as SourceOptionsResponse;
      if (cancelled) {
        return;
      }

      setMasterPath((current) => current || body.masterPath || "");
      setDistributionPath((current) => current || body.distributionPath || "");
    };

    void loadLatestPaths();

    return () => {
      cancelled = true;
    };
  }, []);

  const handlePublish = async () => {
    setIsPublishing(true);
    setError(null);

    const response = await fetch("/api/admin/publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...(masterPath.trim() ? { masterPath: masterPath.trim() } : {}),
        ...(distributionPath.trim() ? { distributionPath: distributionPath.trim() } : {}),
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      setError(body?.message ?? "Publish failed.");
      setIsPublishing(false);
      return;
    }

    router.refresh();
    setIsPublishing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{messages.admin.publishPanelTitle}</CardTitle>
        <CardDescription>{messages.admin.publishPanelDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="masterPath">{messages.admin.masterBackupPath}</Label>
            <Input
              id="masterPath"
              placeholder="/Volumes/docker/wealthfolio-1/.../backup.db"
              value={masterPath}
              onChange={(event) => setMasterPath(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="distributionPath">{messages.admin.distributionBackupPath}</Label>
            <Input
              id="distributionPath"
              placeholder="/Volumes/docker/wealthfolio-2/.../backup.db"
              value={distributionPath}
              onChange={(event) => setDistributionPath(event.target.value)}
            />
          </div>
        </div>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <Button onClick={handlePublish} disabled={isPublishing}>
          {isPublishing
            ? messages.admin.publishing
            : masterPath || distributionPath
              ? messages.admin.publishLocal
              : messages.admin.publishLatest}
        </Button>
      </CardContent>
    </Card>
  );
}
