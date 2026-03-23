import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.resolve("."),
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
