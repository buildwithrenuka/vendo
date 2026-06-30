import type { User } from "@vendo/shared";
import { findEmployeeByUserId } from "./employee-auth";

/** Legacy env allowlist — used only when no vendo_employees row exists */
function legacyEmployeeEmail(user: User, env: Env): boolean {
  const email = user.email.toLowerCase();
  if (email.endsWith("@vendo.app")) return true;
  const allowlist = env.DEV_EMAILS?.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean) ?? [];
  return allowlist.includes(email);
}

export async function isVendoEmployeeUser(db: D1Database, user: User, env: Env): Promise<boolean> {
  const employee = await findEmployeeByUserId(db, user.id);
  if (employee) return true;
  return legacyEmployeeEmail(user, env);
}

export async function isVendoAdminUser(db: D1Database, user: User): Promise<boolean> {
  const employee = await findEmployeeByUserId(db, user.id);
  return employee?.employee_role === "admin";
}

/** Sync fallback for legacy — prefer async helpers */
export function isVendoEmployee(user: User, env: Env): boolean {
  return legacyEmployeeEmail(user, env);
}

export const isDeveloper = isVendoEmployee;
