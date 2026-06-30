import { createUser, findUserByEmail } from "./users";
import { randomToken, timingSafeEqual } from "./crypto";

const PBKDF2_ITERATIONS = 100_000;
const KEY_BYTES = 32;
const encoder = new TextEncoder();

export type EmployeeRole = "admin" | "engineer";

export type VendoEmployeeRow = {
  id: string;
  user_id: string;
  username: string;
  password_hash: string;
  employee_role: EmployeeRole;
  is_active: number;
  onboarded_by: string | null;
  created_at: string;
  updated_at: string;
  email?: string;
  name?: string | null;
};

export type VendoEmployeePublic = {
  id: string;
  userId: string;
  username: string;
  email: string;
  name: string | null;
  employeeRole: EmployeeRole;
  isActive: boolean;
  createdAt: string;
};

function employeeEmail(username: string, email?: string): string {
  return (email ?? `${username.toLowerCase()}@employees.vendo.internal`).toLowerCase();
}

async function derivePasswordHash(password: string, saltHex: string): Promise<string> {
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    KEY_BYTES * 8,
  );
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomToken(16);
  const hash = await derivePasswordHash(password, salt);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const delimiter = stored.includes("$") ? "$" : ":";
  const parts = stored.split(delimiter);
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  if (iterations !== PBKDF2_ITERATIONS) return false;
  const salt = parts[2]!;
  const expected = parts[3]!;
  const actual = await derivePasswordHash(password, salt);
  return timingSafeEqual(actual, expected);
}

export function mapEmployeePublic(row: VendoEmployeeRow & { email?: string; name?: string | null }): VendoEmployeePublic {
  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    email: row.email ?? employeeEmail(row.username),
    name: row.name ?? null,
    employeeRole: row.employee_role,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  };
}

export async function findEmployeeByUsername(db: D1Database, username: string): Promise<VendoEmployeeRow | null> {
  return db
    .prepare(
      `SELECT e.*, u.email, u.name
       FROM vendo_employees e
       JOIN users u ON u.id = e.user_id
       WHERE e.username = ? COLLATE NOCASE`,
    )
    .bind(username.trim().toLowerCase())
    .first<VendoEmployeeRow>();
}

export async function findEmployeeByUserId(db: D1Database, userId: string): Promise<VendoEmployeeRow | null> {
  return db
    .prepare(
      `SELECT e.*, u.email, u.name
       FROM vendo_employees e
       JOIN users u ON u.id = e.user_id
       WHERE e.user_id = ? AND e.is_active = 1`,
    )
    .bind(userId)
    .first<VendoEmployeeRow>();
}

export async function listEmployees(db: D1Database): Promise<VendoEmployeePublic[]> {
  const { results } = await db
    .prepare(
      `SELECT e.*, u.email, u.name
       FROM vendo_employees e
       JOIN users u ON u.id = e.user_id
       ORDER BY e.created_at DESC`,
    )
    .all<VendoEmployeeRow>();
  return (results ?? []).map(mapEmployeePublic);
}

export async function onboardEmployee(
  db: D1Database,
  input: {
    username: string;
    password: string;
    name: string;
    email?: string;
    employeeRole?: EmployeeRole;
    onboardedBy?: string | null;
  },
): Promise<VendoEmployeePublic> {
  const username = input.username.trim().toLowerCase();
  const email = employeeEmail(username, input.email);

  const existingUsername = await findEmployeeByUsername(db, username);
  if (existingUsername) throw new Error("USERNAME_TAKEN");

  const existingEmail = await findUserByEmail(db, email);
  if (existingEmail) throw new Error("EMAIL_TAKEN");

  const userId = crypto.randomUUID();
  await createUser(db, {
    id: userId,
    email,
    name: input.name,
    role: "undecided",
  });

  const employeeId = crypto.randomUUID();
  const passwordHash = await hashPassword(input.password);

  await db
    .prepare(
      `INSERT INTO vendo_employees (id, user_id, username, password_hash, employee_role, onboarded_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      employeeId,
      userId,
      username,
      passwordHash,
      input.employeeRole ?? "engineer",
      input.onboardedBy ?? null,
    )
    .run();

  const row = await findEmployeeByUserId(db, userId);
  if (!row) throw new Error("Failed to create employee");
  return mapEmployeePublic(row);
}

export async function ensureBootstrapAdmin(db: D1Database, env: Env): Promise<void> {
  const existing = await db
    .prepare("SELECT id FROM vendo_employees WHERE employee_role = 'admin' AND is_active = 1 LIMIT 1")
    .first();
  if (existing) return;

  const username = env.VENDO_ADMIN_USERNAME?.trim().toLowerCase();
  const password = env.VENDO_ADMIN_PASSWORD?.trim();
  if (!username || !password) {
    console.warn(
      "[employee] Bootstrap skipped — set VENDO_ADMIN_USERNAME and VENDO_ADMIN_PASSWORD in apps/api/.dev.vars, then restart API",
    );
    return;
  }

  try {
    await onboardEmployee(db, {
      username,
      password,
      name: "Vendo Admin",
      employeeRole: "admin",
    });
    console.log("[employee] Bootstrap admin created:", username);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "USERNAME_TAKEN" || msg === "EMAIL_TAKEN") {
      console.warn("[employee] Bootstrap admin already partially exists:", msg);
      return;
    }
    console.error("[employee] Bootstrap admin failed:", err);
    throw err;
  }
}

export async function loginEmployee(
  db: D1Database,
  username: string,
  password: string,
): Promise<VendoEmployeeRow | null> {
  const employee = await findEmployeeByUsername(db, username);
  if (!employee || employee.is_active !== 1) return null;
  const valid = await verifyPassword(password, employee.password_hash);
  if (!valid) return null;
  return employee;
}

export async function updateEmployeePassword(
  db: D1Database,
  employeeId: string,
  password: string,
): Promise<void> {
  const passwordHash = await hashPassword(password);
  await db
    .prepare("UPDATE vendo_employees SET password_hash = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(passwordHash, employeeId)
    .run();
}

export async function setEmployeeActive(db: D1Database, employeeId: string, isActive: boolean): Promise<void> {
  await db
    .prepare("UPDATE vendo_employees SET is_active = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(isActive ? 1 : 0, employeeId)
    .run();
}
