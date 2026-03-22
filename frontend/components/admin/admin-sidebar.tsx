import { FileText, FolderKanban, LayoutDashboard, ShieldAlert, ShieldCheck, Sparkles, SquarePen, Upload, Users } from "lucide-react";

const items = [
  { label: "Dashboard", value: "dashboard", icon: LayoutDashboard },
  { label: "Documents", value: "documents", icon: FileText },
  { label: "Document Manager", value: "document-manager", icon: Upload },
  { label: "Projects", value: "projects", icon: FolderKanban },
  { label: "Mock Tests", value: "mock-tests", icon: Sparkles },
  { label: "Mock Test Editor", value: "mock-test-editor", icon: SquarePen },
  { label: "Approvals", value: "teacher-approvals", icon: ShieldCheck },
  { label: "Community Reports", value: "community-reports", icon: ShieldAlert },
  { label: "User Management", value: "users", icon: Users },
  { label: "User Editor", value: "user-editor", icon: SquarePen }
];

export function AdminSidebar({
  activeSection,
  onSectionChange
}: {
  activeSection: string;
  onSectionChange: (section: string) => void;
}) {
  return (
    <aside className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-24">
      <div className="mb-4 rounded-[22px] border border-slate-100 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-950">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Admin</p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">Workspace</p>
        </div>
      </div>
      <nav className="space-y-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onSectionChange(item.value)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                activeSection === item.value
                  ? "bg-slate-950 text-white shadow-sm dark:bg-amber-400 dark:text-slate-950"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-950 dark:hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
