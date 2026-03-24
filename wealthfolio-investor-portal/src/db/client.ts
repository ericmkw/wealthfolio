import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/db/schema";

declare global {
  var __wealthfolioInvestorPortalPool__: Pool | undefined;
}

function createPool() {
  return new Pool({
    connectionString:
      process.env.DATABASE_URL ?? "postgres://wealthfolio:wealthfolio@localhost:5432/wealthfolio_investor_portal",
  });
}

const pool = globalThis.__wealthfolioInvestorPortalPool__ ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalThis.__wealthfolioInvestorPortalPool__ = pool;
}

export const db = drizzle(pool, { schema });
export { pool };
