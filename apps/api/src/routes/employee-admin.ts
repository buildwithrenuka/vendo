import { Hono } from "hono";
import { z } from "zod";
import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../middleware/auth";
import { requireAuth } from "../middleware/auth";
import {
  ensureBootstrapAdmin,
  findEmployeeByUserId,
  listEmployees,
  onboardEmployee,
  setEmployeeActive,
  updateEmployeePassword,
} from "../lib/employee-auth";
import { isVendoAdminUser, isVendoEmployeeUser } from "../lib/dev-access";

export const employeeAdminRoutes = new Hono<AppEnv>();

function requireEmployee() {
  return createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    await ensureBootstrapAdmin(c.env.DB, c.env);
    const ok = await isVendoEmployeeUser(c.env.DB, user, c.env);
    if (!ok) {
      return c.json({ error: "Vendo employee access only", code: "EMPLOYEE_FORBIDDEN" }, 403);
    }
    await next();
  });
}

function requireAdmin() {
  return createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    await ensureBootstrapAdmin(c.env.DB, c.env);
    const ok = await isVendoAdminUser(c.env.DB, user);
    if (!ok) {
      return c.json({ error: "Admin access required", code: "ADMIN_FORBIDDEN" }, 403);
    }
    await next();
  });
}

employeeAdminRoutes.use("*", requireAuth(), requireEmployee());

employeeAdminRoutes.get("/me", async (c) => {
  const user = c.get("user")!;
  const employee = await findEmployeeByUserId(c.env.DB, user.id);
  return c.json({
    employee: employee
      ? {
          id: employee.id,
          username: employee.username,
          employeeRole: employee.employee_role,
          name: employee.name ?? user.name,
          email: employee.email ?? user.email,
        }
      : null,
    isAdmin: employee?.employee_role === "admin",
  });
});

employeeAdminRoutes.get("/", requireAdmin(), async (c) => {
  const items = await listEmployees(c.env.DB);
  return c.json({ items });
});

const onboardSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-z0-9_]+$/i),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  employeeRole: z.enum(["admin", "engineer"]).default("engineer"),
});

employeeAdminRoutes.post("/", requireAdmin(), async (c) => {
  const user = c.get("user")!;
  const body = onboardSchema.parse(await c.req.json());
  const admin = await findEmployeeByUserId(c.env.DB, user.id);

  try {
    const employee = await onboardEmployee(c.env.DB, {
      username: body.username,
      password: body.password,
      name: body.name,
      email: body.email,
      employeeRole: body.employeeRole,
      onboardedBy: admin?.id ?? null,
    });
    return c.json({ employee }, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Onboard failed";
    if (msg === "USERNAME_TAKEN") return c.json({ error: "Username already taken" }, 409);
    if (msg === "EMAIL_TAKEN") return c.json({ error: "Email already in use" }, 409);
    throw err;
  }
});

employeeAdminRoutes.patch("/:id", requireAdmin(), async (c) => {
  const id = c.req.param("id");
  const body = z
    .object({
      isActive: z.boolean().optional(),
      password: z.string().min(8).max(128).optional(),
      employeeRole: z.enum(["admin", "engineer"]).optional(),
    })
    .parse(await c.req.json());

  const existing = await c.env.DB.prepare("SELECT id FROM vendo_employees WHERE id = ?").bind(id).first();
  if (!existing) return c.json({ error: "Not found" }, 404);

  if (body.isActive !== undefined) {
    await setEmployeeActive(c.env.DB, id, body.isActive);
  }
  if (body.password) {
    await updateEmployeePassword(c.env.DB, id, body.password);
  }
  if (body.employeeRole) {
    await c.env.DB
      .prepare("UPDATE vendo_employees SET employee_role = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(body.employeeRole, id)
      .run();
  }

  const items = await listEmployees(c.env.DB);
  const employee = items.find((e) => e.id === id);
  return c.json({ employee });
});
