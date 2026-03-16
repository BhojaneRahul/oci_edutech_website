import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <DashboardShell>
      <div className="flex min-h-[70vh] items-center justify-center">
        <ResetPasswordForm />
      </div>
    </DashboardShell>
  );
}
