"use client";

import Link from "next/link";
import { BookCopy, FolderKanban, GraduationCap, House, ListChecks, LogOut, School2, Settings2, SunMoon, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useAuth } from "../providers/auth-provider";

const items = [
  { href: "/", label: "Home", icon: House },
  { href: "/degree", label: "Degree", icon: GraduationCap },
  { href: "/puc", label: "PUC", icon: School2 },
  { href: "/mock-tests", label: "Mock Test", icon: ListChecks },
  { href: "/projects", label: "Projects", icon: FolderKanban }
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/50 transition lg:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed left-0 top-20 z-50 h-[calc(100vh-5rem)] w-72 border-r border-white/30 bg-white/85 px-4 py-6 backdrop-blur-xl transition-transform dark:border-slate-800 dark:bg-slate-950/90 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Explore</p>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 p-2 dark:border-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-8 rounded-3xl bg-gradient-to-br from-brand-primary to-brand-secondary p-[1px] shadow-soft">
          <div className="rounded-[calc(1.5rem-1px)] bg-white/90 p-5 dark:bg-slate-900/95">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/15">
              <BookCopy className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold">Study smarter</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Quick access to degree notes, model question papers, mock tests, and projects.
            </p>
          </div>
        </div>

        <nav className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  active
                    ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 space-y-2 border-t border-slate-200 pt-6 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            <SunMoon className="h-5 w-5" />
            {resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          {user ? (
            <Link
              href="/account"
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              <Settings2 className="h-5 w-5" />
              Account Settings
            </Link>
          ) : null}
          {user ? (
            <button
              type="button"
              onClick={async () => {
                await logout();
                onClose();
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          ) : null}
        </div>
      </aside>
    </>
  );
}
