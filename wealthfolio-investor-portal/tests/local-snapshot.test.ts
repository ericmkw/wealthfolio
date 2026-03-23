import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { readLocalSnapshotFile } from "@/lib/publish/local-snapshot";

describe("readLocalSnapshotFile", () => {
  it("loads a local sqlite backup file by absolute path", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "wf-portal-snapshot-"));
    const snapshotPath = path.join(tempDir, "wealthfolio_backup_test.db");

    await fs.writeFile(snapshotPath, "snapshot-bytes");

    const snapshot = await readLocalSnapshotFile(snapshotPath);

    expect(snapshot.filename).toBe("wealthfolio_backup_test.db");
    expect(snapshot.bytes.toString("utf8")).toBe("snapshot-bytes");

    await fs.rm(tempDir, { recursive: true, force: true });
  });
});
