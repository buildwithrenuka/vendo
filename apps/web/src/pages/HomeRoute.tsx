import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { HomePage } from "./HomePage";

export function HomeRoute() {
  const { user, loading } = useAuth();
  const [employeeChecked, setEmployeeChecked] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);

  useEffect(() => {
    if (!user) {
      setEmployeeChecked(true);
      return;
    }
    api.session()
      .then((s) => {
        setIsEmployee(s.isDeveloper);
      })
      .catch(() => {
        setIsEmployee(false);
      })
      .finally(() => {
        setEmployeeChecked(true);
      });
  }, [user]);

  if (loading || (user && !employeeChecked)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-landing-bg)]">
        <p className="text-sm text-[var(--color-landing-muted)]">Loading…</p>
      </div>
    );
  }

  if (user) {
    if (isEmployee) return <Navigate to="/internal" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <HomePage />;
}
