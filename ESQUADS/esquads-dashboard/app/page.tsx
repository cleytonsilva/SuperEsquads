import { AuthProvider } from "@/contexts/auth-context";
import { DashboardRouter } from "@/components/dashboard-router";

export default function HomePage() {
  return (
    <AuthProvider>
      <DashboardRouter />
    </AuthProvider>
  );
}