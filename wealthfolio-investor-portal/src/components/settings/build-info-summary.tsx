import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { BuildInfo } from "@/lib/build-info";

interface BuildInfoSummaryProps {
  buildInfo: BuildInfo & {
    builtAtDisplay?: string | null;
  };
  labels: {
    title: string;
    description: string;
    version: string;
    build: string;
    builtAt: string;
  };
}

function renderValue(value: string | null | undefined) {
  return value ?? "—";
}

export function BuildInfoSummary({ buildInfo, labels }: BuildInfoSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
        <CardDescription>{labels.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3 text-sm">
          <div className="space-y-1">
            <dt className="text-[var(--wf-muted)]">{labels.version}</dt>
            <dd className="font-mono text-[var(--wf-fg)]">{renderValue(buildInfo.version)}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-[var(--wf-muted)]">{labels.build}</dt>
            <dd className="font-mono text-[var(--wf-fg)]">{renderValue(buildInfo.commit)}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-[var(--wf-muted)]">{labels.builtAt}</dt>
            <dd className="text-[var(--wf-fg)]">
              {renderValue(buildInfo.builtAtDisplay ?? buildInfo.builtAt)}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
