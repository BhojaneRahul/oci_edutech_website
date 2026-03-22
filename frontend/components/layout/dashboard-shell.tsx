"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Footer } from "./footer";
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
      <div className="lg:pl-64">
        <main
          className={cn(
            fullBleed
              ? "min-w-0 overflow-x-hidden pb-0 pt-20"
              : "mx-auto max-w-[1600px] px-3 pb-10 pt-24 sm:px-4 lg:px-6",
            contentClassName
          )}
        >
          {children}
        </main>
        {!fullBleed ? <Footer /> : null}
      </div>
    </div>
  );
}
