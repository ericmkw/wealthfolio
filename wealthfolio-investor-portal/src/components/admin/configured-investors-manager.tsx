"use client";

import React, { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { InvestorMappingForm } from "@/components/admin/investor-mapping-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMessages } from "@/lib/i18n";
import type { AppLocale } from "@/lib/preferences";
import { resolveMappingLabels, type SourceOption } from "@/lib/source-option-labels";
import type { InvestorMappingRecord } from "@/lib/services/admin-service";

interface ConfiguredInvestorsManagerProps {
  locale: AppLocale;
  mappings: InvestorMappingRecord[];
  sourceOptions: {
    accounts: SourceOption[];
    fundAssets: SourceOption[];
  };
}

export function ConfiguredInvestorsManager({
  locale,
  mappings,
  sourceOptions,
}: ConfiguredInvestorsManagerProps) {
  const router = useRouter();
  const messages = getMessages(locale);
  const [editingInvestorId, setEditingInvestorId] = useState<string | null>(null);
  const [deleteInvestorId, setDeleteInvestorId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const editingInvestor = useMemo(
    () => mappings.find((mapping) => mapping.investorId === editingInvestorId) ?? null,
    [editingInvestorId, mappings],
  );

  useEffect(() => {
    if (editingInvestorId && !editingInvestor) {
      setEditingInvestorId(null);
    }
  }, [editingInvestor, editingInvestorId]);

  useEffect(() => {
    if (deleteInvestorId && !mappings.some((mapping) => mapping.investorId === deleteInvestorId)) {
      setDeleteInvestorId(null);
      setDeleteConfirmation("");
    }
  }, [deleteInvestorId, mappings]);

  const refreshPage = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const handleStatusChange = async (investorId: string, isActive: boolean) => {
    setActionError(null);
    setPendingAction(`${investorId}:${isActive ? "reactivate" : "deactivate"}`);

    const response = await fetch(`/api/admin/investor-account-mappings/${investorId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isActive }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      setActionError(body?.message ?? "Unable to update investor status.");
      setPendingAction(null);
      return;
    }

    setDeleteInvestorId(null);
    setDeleteConfirmation("");
    setPendingAction(null);
    refreshPage();
  };

  const handleDelete = async (mapping: InvestorMappingRecord) => {
    setActionError(null);
    setPendingAction(`${mapping.investorId}:delete`);

    const response = await fetch(`/api/admin/investor-account-mappings/${mapping.investorId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ usernameConfirmation: deleteConfirmation }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      setActionError(body?.message ?? "Unable to delete investor.");
      setPendingAction(null);
      return;
    }

    if (editingInvestorId === mapping.investorId) {
      setEditingInvestorId(null);
    }

    setDeleteInvestorId(null);
    setDeleteConfirmation("");
    setPendingAction(null);
    refreshPage();
  };

  return (
    <div className="space-y-6">
      <InvestorMappingForm
        locale={locale}
        mode={editingInvestor ? "edit" : "create"}
        initialValues={
          editingInvestor
            ? {
                investorId: editingInvestor.investorId,
                name: editingInvestor.investorName,
                username: editingInvestor.username ?? "",
                email: editingInvestor.email ?? "",
                distributionAccountId: editingInvestor.distributionAccountId ?? "",
                fundAssetId: editingInvestor.fundAssetId ?? "",
              }
            : null
        }
        sourceOptions={sourceOptions}
        onSaved={() => {
          setEditingInvestorId(null);
          setActionError(null);
          refreshPage();
        }}
        onCancel={() => {
          setEditingInvestorId(null);
          setActionError(null);
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>{messages.admin.configuredInvestorsTitle}</CardTitle>
          <CardDescription>{messages.admin.configuredInvestorsDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {actionError ? <p className="mb-4 text-sm text-rose-300">{actionError}</p> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{messages.admin.name}</TableHead>
                <TableHead>{messages.admin.username}</TableHead>
                <TableHead>{messages.admin.emailOptional}</TableHead>
                <TableHead>{messages.admin.distributionAccount}</TableHead>
                <TableHead>{messages.admin.fundAsset}</TableHead>
                <TableHead>{messages.admin.status}</TableHead>
                <TableHead>{messages.admin.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.length ? (
                mappings.map((mapping) => {
                  const labels = resolveMappingLabels(sourceOptions.accounts, sourceOptions.fundAssets, mapping);
                  const isActive = mapping.isActive ?? false;
                  const deleteOpen = deleteInvestorId === mapping.investorId;
                  const deletePending = pendingAction === `${mapping.investorId}:delete`;
                  const togglePending =
                    pendingAction === `${mapping.investorId}:deactivate` ||
                    pendingAction === `${mapping.investorId}:reactivate`;
                  const rowBusy = deletePending || togglePending;
                  const deleteUsername = mapping.username ?? "";

                  return (
                    <React.Fragment key={mapping.investorId}>
                      <TableRow>
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
                        <TableCell>
                          <Badge variant={isActive ? "active" : "inactive"}>
                            {isActive ? messages.admin.active : messages.admin.inactive}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              disabled={rowBusy}
                              onClick={() => {
                                setEditingInvestorId(mapping.investorId);
                                setDeleteInvestorId(null);
                                setDeleteConfirmation("");
                                setActionError(null);
                              }}
                            >
                              {messages.admin.editInvestor}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              disabled={!mapping.userId || rowBusy}
                              onClick={() => void handleStatusChange(mapping.investorId, !isActive)}
                            >
                              {isActive ? messages.admin.deactivateInvestor : messages.admin.reactivateInvestor}
                            </Button>
                            {!isActive && mapping.username ? (
                              <Button
                                type="button"
                                variant="ghost"
                                disabled={rowBusy}
                                onClick={() => {
                                  setDeleteInvestorId((current) =>
                                    current === mapping.investorId ? null : mapping.investorId,
                                  );
                                  setDeleteConfirmation("");
                                  setActionError(null);
                                }}
                              >
                                {messages.admin.deleteInvestor}
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                      {deleteOpen ? (
                        <TableRow>
                          <TableCell colSpan={7}>
                            <div className="space-y-3 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4">
                              <p className="text-sm text-rose-200">{messages.admin.deleteInvestorWarning}</p>
                              <p className="text-xs text-[var(--wf-muted)]">
                                {messages.admin.deleteInvestorConfirmationHint.replace(
                                  "{username}",
                                  deleteUsername,
                                )}
                              </p>
                              <Input
                                value={deleteConfirmation}
                                onChange={(event) => setDeleteConfirmation(event.target.value)}
                                placeholder={messages.admin.confirmUsername}
                              />
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={deletePending}
                                  onClick={() => {
                                    setDeleteInvestorId(null);
                                    setDeleteConfirmation("");
                                    setActionError(null);
                                  }}
                                >
                                  {messages.admin.cancelEditInvestor}
                                </Button>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  disabled={deletePending || deleteConfirmation.trim() !== deleteUsername}
                                  onClick={() => void handleDelete(mapping)}
                                >
                                  {messages.admin.confirmDeleteInvestor}
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </React.Fragment>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell className="text-[var(--wf-muted)]" colSpan={7}>
                    {messages.admin.noInvestors}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
