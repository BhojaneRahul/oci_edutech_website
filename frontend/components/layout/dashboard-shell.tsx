"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

export function DashboardShell({
  children,
  contentClassName,
  fullBleed = false
}: {
  children: React.ReactNode;
  contentClassName?: string;
  fullBleed?: boolean;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Header onToggleSidebar={() => setSidebarOpen((value) => !value)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main
        className={cn(
          fullBleed
            ? "min-w-0 overflow-x-hidden pb-0 pt-20 lg:ml-72"
            : "mx-auto max-w-[1600px] px-3 pb-10 pt-24 sm:px-4 lg:pl-[19rem] lg:pr-6",
          contentClassName
        )}
      >
        {children}
      </main>
    </div>
  );
}
