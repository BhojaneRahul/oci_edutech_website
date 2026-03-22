import { DashboardShell } from "@/components/layout/dashboard-shell";
import { UserDashboardClient } from "@/components/dashboard/user-dashboard-client";

export default function UserDashboardPage() {
  return (
    <DashboardShell>
      <UserDashboardClient />
    </DashboardShell>
  );
}
