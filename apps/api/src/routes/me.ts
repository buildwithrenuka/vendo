import { Hono } from "hono";
import type { AppEnv } from "../middleware/auth";
import { requireAuth } from "../middleware/auth";
import { findEmployeeByUserId } from "../lib/employee-auth";
import { isVendoAdminUser, isVendoEmployeeUser } from "../lib/dev-access";

export const meRoutes = new Hono<AppEnv>();

meRoutes.get("/", requireAuth(), async (c) => {
  const user = c.get("user")!;
  const employee = await findEmployeeByUserId(c.env.DB, user.id);
  const isEmployee = await isVendoEmployeeUser(c.env.DB, user, c.env);
  const isAdmin = await isVendoAdminUser(c.env.DB, user);
  return c.json({
    user,
    isDeveloper: isEmployee,
    isVendoAdmin: isAdmin,
    employeeUsername: employee?.username ?? null,
  });
});

meRoutes.get("/session", async (c) => {
  const user = c.get("user");
  const employee = user ? await findEmployeeByUserId(c.env.DB, user.id) : null;
  const isEmployee = user ? await isVendoEmployeeUser(c.env.DB, user, c.env) : false;
  const isAdmin = user ? await isVendoAdminUser(c.env.DB, user) : false;
  return c.json({
    authenticated: Boolean(user),
    user,
    isDeveloper: isEmployee,
    isVendoAdmin: isAdmin,
    employeeUsername: employee?.username ?? null,
  });
});
