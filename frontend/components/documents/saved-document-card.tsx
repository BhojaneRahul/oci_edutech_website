"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BookmarkCheck, Download, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { SavedDocument } from "@/lib/types";
import { useAuth } from "../providers/auth-provider";

type SavedDocumentCardProps = {
  entry: SavedDocument;
  compact?: boolean;
};

export function SavedDocumentCard({ entry, compact = false }: SavedDocumentCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const downloadAbortRef = useRef<AbortController | null>(null);

  const invalidateSavedQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["saved-documents-home"] }),
      queryClient.invalidateQueries({ queryKey: ["saved-documents-page"] }),
      queryClient.invalidateQueries({ queryKey: ["saved-documents-account"] }),
      queryClient.invalidateQueries({ queryKey: ["saved-documents-material-tabs"] }),
      queryClient.invalidateQueries({ queryKey: ["saved-document-status", entry.document._id] })
    ]);
  };

  const toggleSaved = async () => {
    if (!user || busy) return;

    setBusy(true);
    try {
      await api.delete(`/auth/saved-documents/${entry.document._id}`);
      await invalidateSavedQueries();
    } finally {
      setBusy(false);
    }
  };

  const downloadDocument = async () => {
    if (entry.document.type !== "model_qp" || downloading) return;

    setDownloadError(null);
    setDownloading(true);

    try {
      await api.post(`/documents/${entry.document._id}/download`).catch(() => undefined);
      const controller = new AbortController();
      downloadAbortRef.current = controller;
      const response = await fetch(entry.document.fileUrl, { signal: controller.signal });
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = `${entry.document.title.replace(/[^a-z0-9-_ ]/gi, "").trim() || "document"}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setDownloadError("Unable to download right now.");
      }
    } finally {
      downloadAbortRef.current = null;
      setDownloading(false);
    }
  };

  const cancelDownload = () => {
    downloadAbortRef.current?.abort();
    downloadAbortRef.current = null;
    setDownloading(false);
  };

  return (
    <>
      <article
        className={`group relative flex shrink-0 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_42px_-30px_rgba(15,23,42,0.28)] transition hover:-translate-y-1 hover:border-amber-200 hover:shadow-[0_24px_50px_-28px_rgba(15,23,42,0.32)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-500/20 ${
          compact
            ? "min-h-[240px] w-[280px] sm:w-[300px]"
            : "min-h-[248px] w-full"
        }`}
      >
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-amber-50/95 via-white/55 to-transparent dark:from-amber-500/10 dark:via-slate-900/10 dark:to-transparent" />

        <div className="relative flex h-full flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                {entry.document.type === "model_qp" ? "Model QP" : "Notes"}
              </div>
              <h3 className="line-clamp-2 text-[1rem] font-semibold leading-8 text-slate-950 sm:text-[1.1rem] dark:text-white">
                {entry.document.title}
              </h3>
            </div>

            <button
              type="button"
              onClick={toggleSaved}
              disabled={busy}
              aria-label="Remove saved document"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-600 transition hover:border-amber-300 hover:bg-amber-100 disabled:opacity-60 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/15"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookmarkCheck className="h-4 w-4 fill-current" />}
            </button>
          </div>

          <div className="mt-4">
            <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
              {entry.document.subject} • {entry.document.stream}
            </p>
          </div>

          <div className="mt-auto flex items-end justify-between gap-4 border-t border-slate-100 pt-5 dark:border-slate-800">
            <div className="space-y-1">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                Saved on
              </div>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {new Date(entry.savedAt).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {entry.document.type === "model_qp" ? (
                <button
                  type="button"
                  onClick={downloadDocument}
                  disabled={downloading}
                  aria-label={`Download ${entry.document.title}`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-amber-300 hover:text-amber-600 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-amber-500/20 dark:hover:text-amber-300"
                >
                  {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                </button>
              ) : null}

              <Link
                href={`/viewer?documentId=${entry.document._id}&url=${encodeURIComponent(entry.document.fileUrl)}&title=${encodeURIComponent(entry.document.title)}&type=${entry.document.type}`}
                className="inline-flex items-center rounded-full bg-slate-950 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 sm:px-4 sm:text-[13px]"
              >
                Open PDF
              </Link>
            </div>
          </div>
        </div>
      </article>

      {downloading ? (
        <div className="fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
          <span>Downloading PDF...</span>
          <button
            type="button"
            onClick={cancelDownload}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-rose-500/20 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
          >
            Cancel
          </button>
        </div>
      ) : null}

      {downloadError ? (
        <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 shadow-sm dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          {downloadError}
        </div>
      ) : null}
    </>
  );
}
