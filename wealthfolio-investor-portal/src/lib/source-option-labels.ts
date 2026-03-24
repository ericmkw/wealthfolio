export interface SourceOption {
  id: string;
  label: string;
}

function resolveLabel(options: SourceOption[], id: string | null | undefined) {
  if (!id) {
    return null;
  }

  return options.find((option) => option.id === id)?.label ?? null;
}

export function resolveMappingLabels(
  accounts: SourceOption[],
  fundAssets: SourceOption[],
  mapping: {
    distributionAccountId?: string | null;
    fundAssetId?: string | null;
  },
) {
  return {
    distributionAccountLabel: resolveLabel(accounts, mapping.distributionAccountId),
    fundAssetLabel: resolveLabel(fundAssets, mapping.fundAssetId),
  };
}
