import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Shell } from "../components/ui";
import { BuyerDashboard } from "./BuyerDashboard";

export function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Shell title="Loading…" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "supplier") {
    return <Navigate to="/supplier/onboarding" replace />;
  }

  if (user.role === "buyer") {
    return <BuyerDashboard />;
  }

  return <Navigate to="/buyer/verify" replace />;
}
