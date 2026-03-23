import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { hash } from "@node-rs/argon2";
import pg from "pg";

const { Client } = pg;

const argonOptions = {
  algorithm: 2,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

function getEnv(name, fallback) {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS portal_schema_migrations (
      filename TEXT PRIMARY KEY,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function runMigrations(client) {
  const migrationsDir = path.join(process.cwd(), "src", "db", "migrations");
  const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

  await ensureMigrationsTable(client);

  for (const file of files) {
    const existing = await client.query(
      "SELECT 1 FROM portal_schema_migrations WHERE filename = $1 LIMIT 1",
      [file],
    );

    if (existing.rowCount) {
      continue;
    }

    const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");

    await client.query("BEGIN");

    try {
      await client.query(sql);
      await client.query("INSERT INTO portal_schema_migrations (filename) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`[init] applied migration ${file}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
}

async function ensureAdminUser(client) {
  const username = getEnv("ADMIN_USERNAME", "admin");
  const password = getEnv("ADMIN_PASSWORD", "1234");
  const email = process.env.ADMIN_EMAIL?.trim() || null;
  const passwordHash = await hash(password, argonOptions);

  const existing = await client.query("SELECT id FROM users WHERE username = $1 LIMIT 1", [username]);

  if (existing.rowCount) {
    const userId = existing.rows[0]?.id;

    await client.query(
      `UPDATE users
       SET email = $2,
           role = 'admin',
           display_name = 'Portal Admin',
           is_active = TRUE,
           updated_at = NOW()
       WHERE id = $1`,
      [userId, email],
    );

    await client.query(
      `INSERT INTO password_credentials (user_id, password_hash, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = NOW()`,
      [userId, passwordHash],
    );

    console.log(`[init] refreshed admin account ${username}`);
    return;
  }

  const userId = randomUUID();

  await client.query(
    `INSERT INTO users (id, username, email, role, display_name, is_active)
     VALUES ($1, $2, $3, 'admin', 'Portal Admin', TRUE)`,
    [userId, username, email],
  );

  await client.query(
    `INSERT INTO password_credentials (user_id, password_hash)
     VALUES ($1, $2)`,
    [userId, passwordHash],
  );

  console.log(`[init] created admin account ${username}`);
}

async function initDatabase() {
  const client = new Client({
    connectionString: getEnv("DATABASE_URL"),
  });

  await client.connect();

  try {
    await runMigrations(client);
    await ensureAdminUser(client);
  } finally {
    await client.end();
  }
}

function startServer() {
  const child = spawn("node", ["server.js"], {
    stdio: "inherit",
    env: process.env,
  });

  const forwardSignal = (signal) => {
    if (!child.killed) {
      child.kill(signal);
    }
  };

  process.on("SIGINT", forwardSignal);
  process.on("SIGTERM", forwardSignal);

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

async function main() {
  await initDatabase();
  startServer();
}

main().catch((error) => {
  console.error("[init] failed", error);
  process.exit(1);
});
