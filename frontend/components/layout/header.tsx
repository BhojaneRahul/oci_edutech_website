"use client";

import Link from "next/link";
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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/40 bg-white/85 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-20 max-w-[1600px] items-center gap-3 px-3 sm:gap-4 sm:px-4 md:px-6">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-xl border border-slate-200 p-2 text-slate-600 dark:border-slate-800 dark:text-slate-200 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link
          href="/"
          className="min-w-0 flex-1 text-center text-base font-semibold tracking-tight text-slate-900 dark:text-white sm:flex-none sm:text-lg"
        >
          <span className="rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
            OCI - EduTech
          </span>
        </Link>

        <div className="hidden min-w-0 flex-1 justify-center md:flex">
          <SearchBar />
        </div>

        <nav className="hidden items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300 lg:flex xl:gap-5">
          <Link href="/">Home</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          {user?.role === "admin" ? <Link href="/admin">Admin Panel</Link> : null}
          <a
            href="https://play.google.com/store"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-3 py-2 text-white xl:px-4"
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
