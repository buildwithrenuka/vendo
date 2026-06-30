import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button, Card, Input, Shell, Alert } from "../components/ui";

export function EmployeeLoginPage() {
  const { user, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading) return;
    api.session().then((s) => {
      setIsEmployee(s.isDeveloper);
      setChecked(true);
    });
  }, [loading]);

  if (loading || !checked) {
    return <Shell title="Loading…" />;
  }

  if (user && isEmployee) {
    return <Navigate to="/internal" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.employeeLogin({ username: username.trim(), password });
      await refresh();
      navigate("/internal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title="Vendo Engineering" subtitle="Employee sign in">
      <Card className="mx-auto max-w-md">
        <p className="mb-4 text-sm text-[var(--color-ink-muted)]">
          Username and password from your Vendo admin. Customer Google login is not used here.
        </p>

        {error && <Alert tone="info">{error}</Alert>}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <Button type="submit" disabled={busy || username.length < 3 || !password}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <Link to="/login" className="mt-4 inline-block text-sm text-[var(--color-ink-muted)] hover:underline">
          ← Customer login
        </Link>
      </Card>
    </Shell>
  );
}
