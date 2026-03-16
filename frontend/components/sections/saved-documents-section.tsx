"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SavedDocument } from "@/lib/types";
import { useAuth } from "../providers/auth-provider";
import { SectionHeading } from "./section-heading";

export function SavedDocumentsSection() {
  const { user, loading } = useAuth();
  const { data: savedDocuments = [] } = useQuery({
    queryKey: ["saved-documents-home"],
    queryFn: async () => {
      const response = await api.get<SavedDocument[]>("/auth/saved-documents");
      return response.data;
    },
    enabled: Boolean(user)
  });

  if (loading || !user || !savedDocuments.length) {
    return null;
  }

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <SectionHeading
        eyebrow="Saved"
        title="Saved notes and model QPs"
        description="Quickly jump back into the PDFs you bookmarked across OCI - EduTech."
      />
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {savedDocuments.slice(0, 6).map((entry) => (
          <article
            key={entry.id}
            className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
                  {entry.document.type === "model_qp" ? "Model QP" : "Notes"}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                  {entry.document.title}
                </h3>
              </div>
              <div className="rounded-2xl bg-amber-100 p-2 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                <Bookmark className="h-5 w-5 fill-current" />
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {entry.document.subject} • {entry.document.stream}
            </p>
            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Saved {new Date(entry.savedAt).toLocaleDateString()}
              </span>
              <Link
                href={`/viewer?documentId=${entry.document._id}&url=${encodeURIComponent(entry.document.fileUrl)}&title=${encodeURIComponent(entry.document.title)}&type=${entry.document.type}`}
                className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-amber-500"
              >
                Open PDF
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
