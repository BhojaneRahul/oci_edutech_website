import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AdminProjectsManager } from "@/components/admin/admin-projects-manager";

export default function AdminProjectsPage() {
  return (
    <DashboardShell>
      <AdminProjectsManager />
    </DashboardShell>
  );
}
