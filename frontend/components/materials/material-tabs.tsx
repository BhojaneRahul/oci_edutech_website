"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  BookmarkCheck,
  Download,
  Eye,
  FileText,
  Heart,
  Loader2,
  Share2
} from "lucide-react";
import { api } from "@/lib/api";
import { Document, SavedDocument } from "@/lib/types";
import { useAuth } from "../providers/auth-provider";

export function MaterialTabs({
  notes,
  modelQps
}: {
  notes: Document[];
  modelQps: Document[];
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"notes" | "modelQps">("notes");
  const [busyId, setBusyId] = useState<string | number | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | number | null>(null);
  const downloadAbortRef = useRef<AbortController | null>(null);

  const { data: savedDocuments = [], refetch: refetchSaved } = useQuery({
    queryKey: ["saved-documents-material-tabs"],
    queryFn: async () => {
      const response = await api.get<SavedDocument[]>("/auth/saved-documents");
      return response.data;
    },
    enabled: Boolean(user)
  });

  const savedIds = useMemo(
    () => new Set(savedDocuments.map((entry) => String(entry.document._id))),
    [savedDocuments]
  );

  const activeItems = activeTab === "notes" ? notes : modelQps;

  const likedStatuses = useQueries({
    queries: activeItems.map((item) => ({
      queryKey: ["liked-document-status-list", item._id],
      queryFn: async () => {
        const response = await api.get<{ success: true; liked: boolean; count: number }>(
          `/auth/liked-documents/${item._id}/status`
        );
        return response.data;
      },
      enabled: Boolean(user)
    }))
  });

  const likeMap = useMemo(() => {
    const map = new Map<string, { liked: boolean; count: number }>();
    activeItems.forEach((item, index) => {
      const status = likedStatuses[index]?.data;
      map.set(String(item._id), { liked: Boolean(status?.liked), count: status?.count ?? 0 });
    });
    return map;
  }, [activeItems, likedStatuses]);

  const toggleBookmark = async (item: Document) => {
    if (!user) return;
    setBusyId(item._id);
    try {
      const isSaved = savedIds.has(String(item._id));
      if (isSaved) {
        await api.delete(`/auth/saved-documents/${item._id}`);
      } else {
        await api.post("/auth/saved-documents", { documentId: item._id });
      }
      await refetchSaved();
    } finally {
      setBusyId(null);
    }
  };

  const shareDocument = async (item: Document) => {
    const shareUrl = `${window.location.origin}/viewer?documentId=${item._id}&url=${encodeURIComponent(item.fileUrl)}&title=${encodeURIComponent(item.title)}&type=${item.type}`;
    if (navigator.share) {
      await navigator.share({ title: item.title, url: shareUrl });
      return;
    }
    await navigator.clipboard.writeText(shareUrl);
  };

  const toggleLike = async (item: Document) => {
    if (!user) return;
    setBusyId(item._id);
    try {
      const current = likeMap.get(String(item._id));
      if (current?.liked) {
        await api.delete(`/auth/liked-documents/${item._id}`);
      } else {
        await api.post("/auth/liked-documents", { documentId: item._id });
      }
      await queryClient.invalidateQueries({ queryKey: ["liked-document-status-list", item._id] });
    } finally {
      setBusyId(null);
    }
  };

  const downloadDocument = async (item: Document) => {
    if (item.type !== "model_qp") return;

    setDownloadingId(item._id);
    try {
      await api.post(`/documents/${item._id}/download`).catch(() => undefined);
      const controller = new AbortController();
      downloadAbortRef.current = controller;
      const response = await fetch(item.fileUrl, { signal: controller.signal });
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = `${item.title.replace(/[^a-z0-9-_ ]/gi, "").trim() || "document"}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
    } finally {
      downloadAbortRef.current = null;
      setDownloadingId(null);
    }
  };

  const cancelDownload = () => {
    downloadAbortRef.current?.abort();
    downloadAbortRef.current = null;
    setDownloadingId(null);
  };

  useEffect(() => {
    return () => {
      downloadAbortRef.current?.abort();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="sticky top-[5.7rem] z-20 rounded-[20px] border border-slate-200 bg-white/92 p-1 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/92">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={`rounded-[14px] px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "notes"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950"
                : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-950"
            }`}
          >
            Notes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("modelQps")}
            className={`rounded-[14px] px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "modelQps"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950"
                : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-950"
            }`}
          >
            Model QPs
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {activeItems.length ? (
          activeItems.map((item, index) => {
            const isSaved = savedIds.has(String(item._id));
            const canDownload = item.type === "model_qp";
            const likeInfo = likeMap.get(String(item._id)) ?? { liked: false, count: 0 };

            return (
              <article
                key={item._id}
                className={`px-4 py-3 transition hover:bg-slate-50/80 dark:hover:bg-slate-950 sm:px-5 ${
                  index !== activeItems.length - 1 ? "border-b border-slate-200 dark:border-slate-800" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-300 sm:h-14 sm:w-14 sm:rounded-[18px]">
                    <FileText className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/viewer?documentId=${item._id}&url=${encodeURIComponent(item.fileUrl)}&title=${encodeURIComponent(item.title)}&type=${item.type}`}
                          className="block truncate text-[15px] font-semibold leading-tight text-slate-900 transition hover:text-amber-600 dark:text-white dark:hover:text-amber-300 sm:text-base"
                        >
                          {item.title}
                        </Link>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 sm:text-xs">
                          <span>{item.subject}</span>
                          <span>{item.stream}</span>
                          <span>{canDownload ? "Model QP" : "Notes"}</span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center self-center gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => toggleBookmark(item)}
                          disabled={busyId === item._id}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition sm:h-9 sm:w-9 ${
                            isSaved
                              ? "border-slate-900 bg-slate-900 text-white dark:border-amber-300 dark:bg-amber-300 dark:text-slate-950"
                              : "border-slate-200 text-slate-600 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 dark:border-slate-800 dark:text-slate-300"
                          }`}
                          aria-label={isSaved ? "Remove bookmark" : "Save document"}
                        >
                          {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => shareDocument(item)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 dark:border-slate-800 dark:text-slate-300 sm:h-9 sm:w-9"
                          aria-label="Share document"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                        {canDownload ? (
                          <button
                            type="button"
                            onClick={() => downloadDocument(item)}
                            disabled={downloadingId === item._id}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-60 dark:border-slate-800 dark:text-slate-300 sm:h-9 sm:w-9"
                            aria-label="Download document"
                          >
                            {downloadingId === item._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 sm:text-[11px]">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {item.viewCount ?? 0} views
                      </span>
                      {canDownload ? (
                        <span className="inline-flex items-center gap-1">
                          <Download className="h-3.5 w-3.5" />
                          {item.downloadCount ?? 0} downloads
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => toggleLike(item)}
                        disabled={busyId === item._id}
                        className={`inline-flex items-center gap-1 transition ${
                          likeInfo.liked ? "text-rose-500" : "hover:text-amber-600"
                        }`}
                      >
                        <Heart className={`h-3.5 w-3.5 ${likeInfo.liked ? "fill-current" : ""}`} />
                        {likeInfo.count} likes
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            No materials available in this section yet.
          </div>
        )}
      </div>

      {downloadingId ? (
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
    </div>
  );
}


