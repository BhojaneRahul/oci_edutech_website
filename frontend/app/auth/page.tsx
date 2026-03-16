import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthForm } from "@/components/auth/auth-form";

export default function AuthPage() {
  return (
    <DashboardShell>
      <div className="flex min-h-[70vh] items-center justify-center">
        <AuthForm />
      </div>
    </DashboardShell>
  );
}
