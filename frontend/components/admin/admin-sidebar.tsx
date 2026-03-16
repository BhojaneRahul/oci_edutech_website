import Link from "next/link";

const items = ["Dashboard", "Degrees", "Subjects", "Notes", "Model QPs", "Mock Tests", "Projects", "Users", "Settings"];

export function AdminSidebar() {
  return (
    <aside className="rounded-[28px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 text-lg font-semibold">Admin Panel</h2>
      <nav className="space-y-2">
        {items.map((item) => (
          <Link
            key={item}
            href={`/admin#${item.toLowerCase().replace(/\s+/g, "-")}`}
            className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-950"
          >
            {item}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
