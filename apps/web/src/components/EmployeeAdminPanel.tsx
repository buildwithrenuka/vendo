import { useCallback, useEffect, useState } from "react";
import type { VendoEmployeePublic } from "@vendo/shared";
import { api } from "../lib/api";
import { Badge, Button, Card, Input, SectionHeader } from "../components/ui";

export function EmployeeAdminPanel() {
  const [employees, setEmployees] = useState<VendoEmployeePublic[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"engineer" | "admin">("engineer");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { items } = await api.listEmployees();
    setEmployees(items);
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  const onboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await api.onboardEmployee({
        username: username.trim(),
        password,
        name: name.trim(),
        email: email.trim() || undefined,
        employeeRole: role,
      });
      setUsername("");
      setPassword("");
      setName("");
      setEmail("");
      setRole("engineer");
      setMessage(`Onboarded @${username.trim()} — they can sign in at /internal/login`);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Onboard failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <SectionHeader
          title="Onboard employee"
          description="Create username + password. Engineer can access Jal; admin can onboard others."
        />
        <form onSubmit={onboard} className="grid gap-3 sm:grid-cols-2">
          <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. priya_dev" required />
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Input label="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="priya@vendo.app" />
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium">Role</span>
            <select
              className="app-field w-full rounded-xl border px-3.5 py-2.5 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as "engineer" | "admin")}
            >
              <option value="engineer">Engineer</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy || username.length < 3 || password.length < 8 || !name.trim()}>
              {busy ? "Creating…" : "Create employee account"}
            </Button>
            {message && <p className="mt-2 text-sm text-[var(--color-copper)]">{message}</p>}
          </div>
        </form>
      </Card>

      <Card>
        <SectionHeader title="Team" description={`${employees.length} accounts`} />
        <ul className="divide-y divide-[var(--color-border)]">
          {employees.map((emp) => (
            <li key={emp.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <div>
                <span className="font-medium">@{emp.username}</span>
                <span className="ml-2 text-[var(--color-ink-muted)]">{emp.name}</span>
                <p className="text-xs text-[var(--color-ink-muted)]">{emp.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={emp.employeeRole === "admin" ? "success" : "neutral"}>{emp.employeeRole}</Badge>
                {!emp.isActive && <Badge tone="warning">Inactive</Badge>}
                {emp.isActive && (
                  <Button
                    variant="ghost"
                    className="text-xs"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      await api.updateEmployee(emp.id, { isActive: false });
                      await load();
                      setBusy(false);
                    }}
                  >
                    Deactivate
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
