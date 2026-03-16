import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <DashboardShell>
      <div className="flex min-h-[70vh] items-center justify-center">
        <ForgotPasswordForm />
      </div>
    </DashboardShell>
  );
}
