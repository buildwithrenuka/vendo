import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LoginPage } from "./pages/LoginPage";
import { InvitePage } from "./pages/InvitePage";
import { DashboardPage } from "./pages/DashboardPage";
import { BuyerVerificationPage } from "./pages/BuyerVerificationPage";
import { SupplierOnboardingPage } from "./pages/SupplierOnboardingPage";
import { OidcCallbackPage } from "./pages/OidcCallbackPage";
import { HomeRoute } from "./pages/HomeRoute";
import { GoogleCallbackPage } from "./pages/GoogleCallbackPage";
import { VendoInternalPage } from "./pages/VendoInternalPage";
import { EmployeeLoginPage } from "./pages/EmployeeLoginPage";
import { StudioHomePage } from "./pages/studio/StudioHomePage";
import { StudioOnboardPage } from "./pages/studio/StudioOnboardPage";
import { StudioProjectPage } from "./pages/studio/StudioProjectPage";
import { StudioEmbedPage } from "./pages/studio/StudioEmbedPage";
import { EmbedWidgetPage } from "./pages/studio/EmbedWidgetPage";
import { DocsLayout } from "./components/docs/DocsLayout";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/callback" element={<OidcCallbackPage />} />
          <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
          <Route path="/invite/:token" element={<InvitePage />} />
          <Route path="/internal/login" element={<EmployeeLoginPage />} />
          <Route path="/studio" element={<StudioHomePage />} />
          <Route path="/studio/onboard" element={<StudioOnboardPage />} />
          <Route path="/studio/projects/:projectId" element={<StudioProjectPage />} />
          <Route path="/studio/projects/:projectId/embed" element={<StudioEmbedPage />} />
          <Route path="/embed/:projectId" element={<EmbedWidgetPage />} />
          <Route path="/docs" element={<DocsLayout />} />
          <Route path="/docs/:slug" element={<DocsLayout />} />
          <Route
            path="/internal"
            element={
              <ProtectedRoute>
                <VendoInternalPage />
              </ProtectedRoute>
            }
          />
          <Route path="/dev" element={<Navigate to="/internal" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/buyer/verify"
            element={
              <ProtectedRoute>
                <BuyerVerificationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/onboarding"
            element={
              <ProtectedRoute>
                <SupplierOnboardingPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
