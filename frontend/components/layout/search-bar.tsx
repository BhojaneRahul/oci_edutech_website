"use client";

import { Search } from "lucide-react";

export function SearchBar() {
  return (
    <div className="hidden w-full min-w-0 flex-1 items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex md:max-w-md xl:max-w-xl">
      <Search className="h-4 w-4 text-slate-400" />
      <input
        type="text"
        placeholder="Search notes, papers, mock tests..."
        className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100"
      />
    </div>
  );
}
