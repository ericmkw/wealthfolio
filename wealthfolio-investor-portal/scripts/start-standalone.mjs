import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareStandaloneAssets } from "../src/lib/standalone-assets.ts";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

await prepareStandaloneAssets(projectRoot);
await import("../.next/standalone/server.js");
