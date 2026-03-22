"use client";

import { Info, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { Document } from "@/lib/types";
import { useAuth } from "../providers/auth-provider";
import { PDFCanvas } from "./PDFCanvas";
import { PDFToolbar } from "./PDFToolbar";

export function PDFViewer({
  documentId,
  url,
  title,
  allowDownload
}: {
  documentId?: number;
  url: string;
  title: string;
  allowDownload: boolean;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrollMode, setScrollMode] = useState<"vertical" | "horizontal">("vertical");
  const [navigationToken, setNavigationToken] = useState(0);
  const [highlighterOpen, setHighlighterOpen] = useState(false);
  const [highlightColor, setHighlightColor] = useState<"yellow" | "red" | "blue" | "green" | "grey">("yellow");
  const [undoHighlightToken, setUndoHighlightToken] = useState(0);
  const [clearHighlightsToken, setClearHighlightsToken] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);
  const [fileSizeLabel, setFileSizeLabel] = useState<string | null>(null);
  const openedDocumentRef = useRef<number | null>(null);
  const lastTrackedPageRef = useRef(0);

  const { data: savedStatus } = useQuery({
    queryKey: ["saved-document-status", documentId],
    queryFn: async () => {
      const response = await api.get<{ success: true; saved: boolean }>(`/auth/saved-documents/${documentId}/status`);
      return response.data.saved;
    },
    enabled: Boolean(user && documentId)
  });

  const { data: likedStatus } = useQuery({
    queryKey: ["liked-document-status", documentId],
    queryFn: async () => {
      const response = await api.get<{ success: true; liked: boolean; count: number }>(
        `/auth/liked-documents/${documentId}/status`
      );
      return response.data;
    },
    enabled: Boolean(user && documentId)
  });

  const { data: documentInfo } = useQuery({
    queryKey: ["document-info", documentId],
    queryFn: async () => {
      const response = await api.get<Document>(`/documents/${documentId}`);
      return response.data;
    },
    enabled: Boolean(documentId)
  });

  const bookmarked = Boolean(savedStatus);
  const liked = Boolean(likedStatus?.liked);
  const pdfInfoItems = useMemo(
    () => [
      { label: "Title", value: documentInfo?.title ?? title },
      { label: "Subject", value: documentInfo?.subject ?? "Not available" },
      { label: "Stream", value: documentInfo?.stream ?? "Not available" },
      { label: "Type", value: allowDownload ? "Model QP" : "Notes" },
      { label: "Pages", value: totalPages ? String(totalPages) : "Loading..." },
      { label: "Size", value: fileSizeLabel ?? "Checking..." },
      { label: "Views", value: String(documentInfo?.viewCount ?? 0) },
      { label: "Downloads", value: allowDownload ? String(documentInfo?.downloadCount ?? 0) : "View only" }
    ],
    [allowDownload, documentInfo, fileSizeLabel, title, totalPages]
  );

  useEffect(() => {
    let active = true;

    const loadFileSize = async () => {
      try {
        const response = await fetch(url, { method: "HEAD" });
        const contentLength = response.headers.get("content-length");

        if (!active || !contentLength) {
          if (active) {
            setFileSizeLabel("Not available");
          }
          return;
        }

        const bytes = Number(contentLength);
        const units = ["B", "KB", "MB", "GB"];
        let unitIndex = 0;
        let size = bytes;

        while (size >= 1024 && unitIndex < units.length - 1) {
          size /= 1024;
          unitIndex += 1;
        }

        setFileSizeLabel(`${size >= 10 || unitIndex === 0 ? Math.round(size) : size.toFixed(1)} ${units[unitIndex]}`);
      } catch {
        if (active) {
          setFileSizeLabel("Not available");
        }
      }
    };

    loadFileSize();

    return () => {
      active = false;
    };
  }, [url]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    handleFullscreenChange();
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!user || !documentId || openedDocumentRef.current === documentId) return;

    openedDocumentRef.current = documentId;
    api.post(`/documents/${documentId}/view`).catch(() => undefined);
    api.post("/gamification/document-open", { documentId }).catch(() => undefined);
  }, [documentId, user]);

  useEffect(() => {
    if (!user || !documentId || !totalPages) return;
    if (pageNumber <= lastTrackedPageRef.current) return;

    lastTrackedPageRef.current = pageNumber;
    api
      .post("/gamification/study-progress", {
        documentId,
        currentPage: pageNumber,
        totalPages
      })
      .catch(() => undefined);
  }, [documentId, pageNumber, totalPages, user]);

  const openFullscreen = async () => {
    if (!wrapperRef.current) return;

    if (document.fullscreenElement) {
      setIsFullscreen(false);
      await document.exitFullscreen();
      return;
    }

    setIsFullscreen(true);
    await wrapperRef.current.requestFullscreen();
  };

  const downloadFile = async () => {
    if (!allowDownload) return;

    try {
      if (documentId) {
        await api.post(`/documents/${documentId}/download`).catch(() => undefined);
      }

      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = `${title.replace(/[^a-z0-9-_ ]/gi, "").trim() || "document"}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      setError("Unable to download this PDF right now.");
    }
  };

  const shareFile = async () => {
    const shareUrl =
      typeof window === "undefined"
        ? url
        : `${window.location.origin}/viewer?documentId=${documentId ?? ""}&url=${encodeURIComponent(url)}&title=${encodeURIComponent(
            title
          )}&type=${allowDownload ? "model_qp" : "notes"}`;

    if (navigator.share) {
      await navigator.share({ title, url: shareUrl });
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
  };

  const toggleSavedDocument = async () => {
    if (!user || !documentId) return;

    if (bookmarked) {
      await api.delete(`/auth/saved-documents/${documentId}`);
    } else {
      await api.post("/auth/saved-documents", { documentId });
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["saved-document-status", documentId] }),
      queryClient.invalidateQueries({ queryKey: ["saved-documents-home"] }),
      queryClient.invalidateQueries({ queryKey: ["saved-documents-account"] })
    ]);
  };

  const toggleLikedDocument = async () => {
    if (!user || !documentId) return;

    if (liked) {
      await api.delete(`/auth/liked-documents/${documentId}`);
    } else {
      await api.post("/auth/liked-documents", { documentId });
    }

    await queryClient.invalidateQueries({ queryKey: ["liked-document-status", documentId] });
  };

  const handleDocumentLoaded = useCallback((pages: number) => {
    setTotalPages(pages);
    setPageNumber((current) => Math.min(current, pages));
  }, []);

  return (
    <section
      ref={wrapperRef}
      className={`overflow-hidden bg-white shadow-soft dark:bg-slate-950 ${
        isFullscreen ? "fixed inset-0 z-[80] flex h-screen w-screen flex-col shadow-none" : ""
      }`}
    >
      <div
        className={`z-40 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 ${
          isFullscreen ? "sticky top-0" : "fixed inset-x-0 top-20 lg:left-64"
        }`}
      >
        <PDFToolbar
          pageNumber={pageNumber}
          totalPages={totalPages}
          zoom={zoom}
          rotation={rotation}
          canDownload={allowDownload}
          isBookmarked={bookmarked}
          isLiked={liked}
          scrollMode={scrollMode}
          highlighterOpen={highlighterOpen}
          highlightColor={highlightColor}
          onPrevPage={() => {
            setNavigationToken((value) => value + 1);
            setPageNumber((value) => Math.max(1, value - 1));
          }}
          onNextPage={() => {
            setNavigationToken((value) => value + 1);
            setPageNumber((value) => Math.min(totalPages, value + 1));
          }}
          onZoomOut={() => setZoom((value) => Math.max(60, value - 10))}
          onZoomIn={() => setZoom((value) => Math.min(240, value + 10))}
          onRotate={() => setRotation((value) => (value + 90) % 360)}
          onBookmark={toggleSavedDocument}
          onLike={toggleLikedDocument}
          onShare={shareFile}
          onFullscreen={openFullscreen}
          onToggleScrollMode={() => setScrollMode((value) => (value === "vertical" ? "horizontal" : "vertical"))}
          onToggleHighlighter={() => setHighlighterOpen((value) => !value)}
          onHighlightColorChange={setHighlightColor}
          onUndoHighlight={() => setUndoHighlightToken((value) => value + 1)}
          onClearHighlights={() => setClearHighlightsToken((value) => value + 1)}
          onInfo={() => setInfoOpen(true)}
          onDownload={downloadFile}
        />
      </div>

      {!isFullscreen ? <div className="h-[74px]" /> : null}

      {error ? (
        <div className="border-b border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      ) : null}

      <div className={`bg-white dark:bg-slate-950 ${isFullscreen ? "min-h-0 flex-1" : ""}`}>
        <PDFCanvas
          url={url}
          pageNumber={pageNumber}
          navigationToken={navigationToken}
          zoom={zoom}
          rotation={rotation}
          isFullscreen={isFullscreen}
          highlighterEnabled={highlighterOpen}
          highlightColor={highlightColor}
          undoHighlightToken={undoHighlightToken}
          clearHighlightsToken={clearHighlightsToken}
          scrollMode={scrollMode}
          onDocumentLoaded={handleDocumentLoaded}
          onPinchZoom={setZoom}
          onPageChange={setPageNumber}
          onError={setError}
        />
      </div>

      {infoOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm md:items-center md:p-4">
          <div className="flex max-h-[82vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 md:rounded-[28px]">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                  <Info className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">PDF Information</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Quick document details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInfoOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="clean-scroll overflow-y-auto px-5 py-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {pdfInfoItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-2 break-words text-sm font-medium text-slate-900 dark:text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

