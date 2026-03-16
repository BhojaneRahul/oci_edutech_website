"use client";

import Link from "next/link";
import { ChevronDown, LogOut, Shield, UserCircle2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../providers/auth-provider";

export function AccountMenu() {
  const { user, logout, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  if (loading) {
    return (
      <div className="hidden items-center gap-2 rounded-full border border-slate-200 px-3 py-2 dark:border-slate-800 sm:flex">
        <UserCircle2 className="h-5 w-5 text-amber-500" />
        <span className="text-sm font-medium">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <Link
        href="/auth"
        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-amber-500"
      >
        Login / Signup
      </Link>
    );
  }

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setOpen(false);
      router.push("/auth");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 dark:border-slate-800"
      >
        {user.profilePhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.profilePhoto} alt={user.name} className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <UserCircle2 className="h-5 w-5 text-amber-500" />
        )}
        <span className="hidden text-sm font-medium sm:inline">{user.name ?? "Account"}</span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {open ? (
        <div className="absolute right-0 top-14 z-50 w-64 rounded-3xl border border-slate-200 bg-white p-3 shadow-soft dark:border-slate-800 dark:bg-slate-950">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
            <span className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              {user.role === "admin" ? "Admin" : "Student"}
            </span>
          </div>

          <div className="mt-3 grid gap-2">
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <UserRound className="h-4 w-4" />
              My Account
            </Link>
            <Link
              href="/account#saved-library"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <UserRound className="h-4 w-4" />
              Saved Notes
            </Link>
            <Link
              href="/account#saved-library"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <UserRound className="h-4 w-4" />
              Bookmarks
            </Link>
            {user.role === "admin" ? (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                <Shield className="h-4 w-4" />
                Admin Dashboard
              </Link>
            ) : null}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
