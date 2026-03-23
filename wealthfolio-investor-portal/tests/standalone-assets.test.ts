import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { prepareStandaloneAssets } from "@/lib/standalone-assets";

const tempDirs: string[] = [];

async function makeTempDir() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "wf-standalone-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe("prepareStandaloneAssets", () => {
  it("copies next static assets and public assets into standalone output", async () => {
    const root = await makeTempDir();
    const staticFile = path.join(root, ".next/static/css/app.css");
    const publicFile = path.join(root, "public/logo.txt");
    const standaloneDir = path.join(root, ".next/standalone");

    await fs.mkdir(path.dirname(staticFile), { recursive: true });
    await fs.mkdir(path.dirname(publicFile), { recursive: true });
    await fs.mkdir(standaloneDir, { recursive: true });
    await fs.writeFile(staticFile, "body{}");
    await fs.writeFile(publicFile, "logo");

    await prepareStandaloneAssets(root);

    await expect(fs.readFile(path.join(root, ".next/standalone/.next/static/css/app.css"), "utf8")).resolves.toBe(
      "body{}",
    );
    await expect(fs.readFile(path.join(root, ".next/standalone/public/logo.txt"), "utf8")).resolves.toBe("logo");
  });
});
