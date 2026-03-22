"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SavedDocument } from "@/lib/types";
import { SavedDocumentCard } from "../documents/saved-document-card";
import { useAuth } from "../providers/auth-provider";

export function SavedNotesPageClient() {
  const { user, loading } = useAuth();
  const { data: savedDocuments = [] } = useQuery({
    queryKey: ["saved-documents-page"],
    queryFn: async () => {
      const response = await api.get<SavedDocument[]>("/auth/saved-documents");
      return response.data;
    },
    enabled: Boolean(user)
  });

  if (loading) {
    return (
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        Loading saved notes...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-8 text-sm text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10">
        Please login to view your saved notes.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {savedDocuments.length ? (
          savedDocuments.map((entry) => (
            <SavedDocumentCard key={entry.id} entry={entry} />
          ))
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white/70 px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900/70 md:col-span-2 xl:col-span-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-500 shadow-[0_18px_42px_-30px_rgba(245,158,11,0.55)] dark:bg-amber-500/10 dark:text-amber-300">
              <Bookmark className="h-9 w-9" />
            </div>
            <h2 className="mt-6 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
              No saved PDFs yet
            </h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-500 dark:text-slate-400">
              Save notes and model question papers from the viewer to build your quick-access study shelf here.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              Explore resources
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
