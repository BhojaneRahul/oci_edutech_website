"use client";

import { useState } from "react";
import Link from "next/link";
import { Document } from "@/lib/types";

export function MaterialTabs({
  notes,
  modelQps
}: {
  notes: Document[];
  modelQps: Document[];
}) {
  const [activeTab, setActiveTab] = useState<"notes" | "modelQps">("notes");
  const activeItems = activeTab === "notes" ? notes : modelQps;

  return (
    <div className="space-y-6">
      <div className="flex justify-center overflow-x-auto">
        <div className="inline-flex rounded-full bg-slate-100 p-1 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={`rounded-full px-6 py-2 text-sm font-semibold ${
              activeTab === "notes" ? "bg-amber-500 text-white" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            Notes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("modelQps")}
            className={`rounded-full px-6 py-2 text-sm font-semibold ${
              activeTab === "modelQps" ? "bg-amber-500 text-white" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            Model QPs
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {activeItems.map((item) => (
          <div
            key={item._id}
            className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.subject}</p>
            </div>
            <Link
              href={`/viewer?documentId=${item._id}&url=${encodeURIComponent(item.fileUrl)}&title=${encodeURIComponent(item.title)}&type=${item.type}`}
              className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-amber-500"
            >
              Open PDF
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
