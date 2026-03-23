import fs from "node:fs/promises";
import path from "node:path";
import { openReadonlySnapshot } from "@/lib/publish/source-readers";

const DEFAULT_MASTER_BACKUP_DIR = "/Volumes/docker/wealthfolio-1/data/backups";
const DEFAULT_DISTRIBUTION_BACKUP_DIR = "/Volumes/docker/wealthfolio-2/data/backups";

export interface LocalBackupOption {
  id: string;
  label: string;
}

export interface LocalBackupSources {
  masterPath: string | null;
  distributionPath: string | null;
  accounts: LocalBackupOption[];
  fundAssets: LocalBackupOption[];
}

async function findLatestBackupPath(directory: string) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const backupFiles = entries.filter(
    (entry) => entry.isFile() && /^wealthfolio_backup_.*\.db$/i.test(entry.name),
  );

  if (!backupFiles.length) {
    return null;
  }

  const stats = await Promise.all(
    backupFiles.map(async (entry) => {
      const filePath = path.join(directory, entry.name);
      const fileStat = await fs.stat(filePath);
      return {
        filePath,
        mtimeMs: fileStat.mtimeMs,
      };
    }),
  );

  return stats.sort((left, right) => right.mtimeMs - left.mtimeMs)[0]?.filePath ?? null;
}

function getConfiguredBackupDir(kind: "master" | "distribution") {
  if (kind === "master") {
    return process.env.MASTER_BACKUP_DIR ?? DEFAULT_MASTER_BACKUP_DIR;
  }

  return process.env.DISTRIBUTION_BACKUP_DIR ?? DEFAULT_DISTRIBUTION_BACKUP_DIR;
}

function listDistributionAccounts(snapshotPath: string) {
  const database = openReadonlySnapshot(snapshotPath);

  try {
    return database
      .prepare(
        `
          SELECT id, name
          FROM accounts
          WHERE is_active = 1
          ORDER BY name ASC
        `,
      )
      .all()
      .map((row) => ({
        id: String((row as { id: string }).id),
        label: String((row as { name: string }).name),
      })) as LocalBackupOption[];
  } finally {
    database.close();
  }
}

function listDistributionFundAssets(snapshotPath: string) {
  const database = openReadonlySnapshot(snapshotPath);

  try {
    return database
      .prepare(
        `
          SELECT
            id,
            COALESCE(display_code, instrument_symbol, name, id) AS code,
            name
          FROM assets
          WHERE is_active = 1
          ORDER BY name ASC
        `,
      )
      .all()
      .map((row) => {
        const asset = row as { id: string; code: string | null; name: string | null };
        return {
          id: asset.id,
          label: asset.code && asset.name ? `${asset.code} - ${asset.name}` : asset.name ?? asset.id,
        };
      }) as LocalBackupOption[];
  } finally {
    database.close();
  }
}

export async function getLocalBackupSources(): Promise<LocalBackupSources> {
  const [masterPath, distributionPath] = await Promise.all([
    findLatestBackupPath(getConfiguredBackupDir("master")).catch(() => null),
    findLatestBackupPath(getConfiguredBackupDir("distribution")).catch(() => null),
  ]);

  return {
    masterPath,
    distributionPath,
    accounts: distributionPath ? listDistributionAccounts(distributionPath) : [],
    fundAssets: distributionPath ? listDistributionFundAssets(distributionPath) : [],
  };
}
