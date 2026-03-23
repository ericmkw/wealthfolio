import { z } from "zod";

const portalEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  MASTER_BASE_URL: z.string().url(),
  MASTER_PASSWORD: z.string().min(1),
  DISTRIBUTION_BASE_URL: z.string().url(),
  DISTRIBUTION_PASSWORD: z.string().min(1),
  PUBLISH_TMP_DIR: z.string().min(1),
  SESSION_COOKIE_SECRET: z.string().min(16),
});

const seedEnvSchema = z.object({
  ADMIN_USERNAME: z.string().min(1).default("admin"),
  ADMIN_EMAIL: z.union([z.string().email(), z.literal("")]).optional().default(""),
  ADMIN_PASSWORD: z.string().min(1).default("1234"),
});

export type PortalEnv = z.infer<typeof portalEnvSchema>;

let cachedPortalEnv: PortalEnv | null = null;

export function getPortalEnv() {
  cachedPortalEnv ??= portalEnvSchema.parse(process.env);
  return cachedPortalEnv;
}

export function getSeedEnv() {
  return seedEnvSchema.parse(process.env);
}
