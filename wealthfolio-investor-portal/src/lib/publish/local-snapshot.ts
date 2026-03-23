import fs from "node:fs/promises";
import path from "node:path";

export async function readLocalSnapshotFile(filePath: string) {
  const bytes = await fs.readFile(filePath);

  return {
    filename: path.basename(filePath),
    bytes,
  };
}
