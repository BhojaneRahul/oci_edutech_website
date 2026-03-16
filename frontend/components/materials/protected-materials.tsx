"use client";

import { DegreeDetail, Document } from "@/lib/types";
import { useAuth } from "../providers/auth-provider";
import { LoginGate } from "./login-gate";
import { MaterialTabs } from "./material-tabs";

export function ProtectedDegreeMaterials({ data }: { data: DegreeDetail }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="rounded-[28px] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">Loading...</div>;
  }

  if (!user) {
    return <LoginGate />;
  }

  return <MaterialTabs notes={data.notes.notes as Document[]} modelQps={data.notes.modelQps as Document[]} />;
}

export function ProtectedPucMaterials({ documents }: { documents: Document[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="rounded-[28px] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">Loading...</div>;
  }

  if (!user) {
    return <LoginGate />;
  }

  return (
    <div className="grid gap-4">
      {documents.map((document) => (
        <div key={document._id} className="flex items-center justify-between rounded-[28px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h3 className="text-lg font-semibold">{document.title}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{document.subject}</p>
          </div>
          <a
            href={`/viewer?url=${encodeURIComponent(document.fileUrl)}&title=${encodeURIComponent(document.title)}&type=${document.type}`}
            className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-amber-500"
          >
            Open PDF
          </a>
        </div>
      ))}
    </div>
  );
}
