"use client";

import Link from "next/link";
import Image from "next/image";
import { Download, Menu, UserCircle2 } from "lucide-react";
import { SearchBar } from "./search-bar";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "../providers/auth-provider";
import { AccountMenu } from "./account-menu";
import { MobileSearch } from "./mobile-search";
import { NotificationMenu } from "./notification-menu";

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { user } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:left-64">
      <div className="mx-auto flex h-20 w-full max-w-none items-center gap-3 px-3 sm:gap-4 sm:px-5 lg:px-6 xl:px-8">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-xl border border-slate-200 p-2 text-slate-600 dark:border-slate-800 dark:text-slate-200 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link
          href="/"
          className="min-w-0 flex-1 text-center text-sm font-semibold tracking-tight text-slate-900 dark:text-white md:flex-none md:text-lg lg:hidden"
        >
          <span className="mobile-brand-gradient">OCI - EduTech</span>
        </Link>

        <div className="hidden min-w-0 flex-1 justify-start md:flex">
          <SearchBar />
        </div>

        <nav className="hidden shrink-0 items-center gap-4 text-sm font-medium text-slate-700 dark:text-slate-200 xl:flex xl:gap-5">
          <Link href="/about" className="transition hover:text-slate-950 dark:hover:text-white">About</Link>
          <Link href="/contact" className="transition hover:text-slate-950 dark:hover:text-white">Contact</Link>
          {user?.role === "admin" ? <Link href="/admin" className="transition hover:text-slate-950 dark:hover:text-white">Admin Panel</Link> : null}
          <a
            href="https://play.google.com/store/apps/details?id=com.oci.studyresources"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-white shadow-sm transition hover:bg-amber-600"
          >
            <Download className="h-4 w-4" />
            <span className="hidden xl:inline">Download App</span>
            <span className="xl:hidden">App</span>
          </a>
        </nav>

        <div className="ml-auto hidden items-center gap-2 sm:gap-3 md:flex">
          <ThemeToggle />
          <NotificationMenu />
          <AccountMenu />
        </div>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <MobileSearch />
          <NotificationMenu />
          {user ? <AccountMenu /> : <Link href="/auth" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"><UserCircle2 className="h-4 w-4 text-amber-500" /></Link>}
        </div>
      </div>
    </header>
  );
}
