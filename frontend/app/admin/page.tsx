import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default function AdminPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">Admin</p>
          <h1 className="mt-3 text-4xl font-semibold">Content management dashboard</h1>
        </div>
        <AdminDashboard />
      </div>
    </DashboardShell>
  );
}
