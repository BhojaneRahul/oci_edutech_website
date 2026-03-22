import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthForm } from "@/components/auth/auth-form";

export default function AuthPage() {
  return (
    <DashboardShell>
      <div className="flex min-h-[78vh] items-center justify-center">
        <div className="w-full max-w-5xl">
          <AuthForm />
        </div>
      </div>
    </DashboardShell>
  );
}
