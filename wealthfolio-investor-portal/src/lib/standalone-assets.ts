import fs from "node:fs/promises";
import path from "node:path";

async function pathExists(targetPath: string) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function copyDirectoryIfExists(sourcePath: string, destinationPath: string) {
  if (!(await pathExists(sourcePath))) {
    return;
  }

  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.rm(destinationPath, { recursive: true, force: true });
  await fs.cp(sourcePath, destinationPath, { recursive: true });
}

export async function prepareStandaloneAssets(projectRoot: string) {
  const nextStaticPath = path.join(projectRoot, ".next/static");
  const standaloneStaticPath = path.join(projectRoot, ".next/standalone/.next/static");
  const publicPath = path.join(projectRoot, "public");
  const standalonePublicPath = path.join(projectRoot, ".next/standalone/public");

  await copyDirectoryIfExists(nextStaticPath, standaloneStaticPath);
  await copyDirectoryIfExists(publicPath, standalonePublicPath);
}
