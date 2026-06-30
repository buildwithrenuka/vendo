/**
 * Seeds the bootstrap admin into local D1 (run once if login fails).
 * Usage: npm run seed:admin --workspace @vendo/api
 */
import { execSync } from "node:child_process";
import crypto from "node:crypto";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ITERATIONS = 100_000;
const KEY_BYTES = 32;
const apiDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadDevVar(name) {
  const content = readFileSync(join(apiDir, ".dev.vars"), "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (key !== name) continue;
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    return value;
  }
  return undefined;
}

function randomHex(bytes) {
  return crypto.randomBytes(bytes).toString("hex");
}

function hashPassword(password) {
  const salt = randomHex(16);
  const hash = crypto.pbkdf2Sync(password, Buffer.from(salt, "hex"), ITERATIONS, KEY_BYTES, "sha256").toString("hex");
  return `pbkdf2$${ITERATIONS}$${salt}$${hash}`;
}

function runSql(sql) {
  const file = join(apiDir, ".seed-admin.tmp.sql");
  writeFileSync(file, sql, "utf8");
  try {
    execSync(`npx wrangler d1 execute vendo-db --local --file "${file}"`, {
      stdio: "inherit",
      cwd: apiDir,
    });
  } finally {
    try {
      unlinkSync(file);
    } catch {
      /* ignore */
    }
  }
}

const username = (loadDevVar("VENDO_ADMIN_USERNAME") ?? "admin").toLowerCase();
const password = loadDevVar("VENDO_ADMIN_PASSWORD") ?? "VendoAdmin123!";
const email = `${username}@employees.vendo.internal`;
const userId = crypto.randomUUID();
const employeeId = crypto.randomUUID();
const passwordHash = hashPassword(password);

console.log(`Seeding admin @${username} into local D1...`);

runSql(`
INSERT OR IGNORE INTO users (id, email, name, role)
VALUES ('${userId}', '${email}', 'Vendo Admin', 'undecided');
`);

runSql(`
INSERT OR IGNORE INTO vendo_employees (id, user_id, username, password_hash, employee_role, is_active)
VALUES ('${employeeId}', '${userId}', '${username}', '${passwordHash}', 'admin', 1);
`);

console.log("Done. Login at /internal/login");
console.log("  Username:", username);
console.log("  Password:", password);
