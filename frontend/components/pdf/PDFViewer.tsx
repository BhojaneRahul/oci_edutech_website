"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "../providers/auth-provider";
import { PDFCanvas } from "./PDFCanvas";
import { PDFToolbar } from "./PDFToolbar";

export function PDFViewer({
  documentId,
  url,
  title,
  allowDownload,
  protectedMode
}: {
  documentId?: number;
  url: string;
  title: string;
  allowDownload: boolean;
  protectedMode: boolean;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const [scrollMode, setScrollMode] = useState<"vertical" | "horizontal">("vertical");
  const [navigationToken, setNavigationToken] = useState(0);
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

  const bookmarked = Boolean(savedStatus);
  const liked = Boolean(likedStatus?.liked);
  const likeCount = likedStatus?.count ?? 0;

  const openFullscreen = async () => {
    if (!wrapperRef.current) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await wrapperRef.current.requestFullscreen();
  };

  const downloadFile = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareFile = async () => {
    if (navigator.share) {
      await navigator.share({ title, url });
      return;
    }

    await navigator.clipboard.writeText(url);
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
      className="overflow-hidden bg-white shadow-soft dark:bg-slate-950"
    >
      <div className="bg-white px-4 py-4 text-center dark:bg-slate-950">
        <h1 className="mx-auto w-full overflow-hidden text-ellipsis whitespace-nowrap text-xl font-semibold text-slate-900 sm:text-2xl dark:text-white">
          {title}
        </h1>
      </div>

      <PDFToolbar
        pageNumber={pageNumber}
        totalPages={totalPages}
        zoom={zoom}
        likeCount={likeCount}
        canDownload={allowDownload}
        isBookmarked={bookmarked}
        isLiked={liked}
        scrollMode={scrollMode}
        onPrevPage={() => {
          setNavigationToken((value) => value + 1);
          setPageNumber((value) => Math.max(1, value - 1));
        }}
        onNextPage={() => {
          setNavigationToken((value) => value + 1);
          setPageNumber((value) => Math.min(totalPages, value + 1));
        }}
        onZoomOut={() => setZoom((value) => Math.max(60, value - 10))}
        onZoomIn={() => setZoom((value) => Math.min(220, value + 10))}
        onBookmark={toggleSavedDocument}
        onLike={toggleLikedDocument}
        onShare={shareFile}
        onFullscreen={openFullscreen}
        onToggleScrollMode={() =>
          setScrollMode((value) => (value === "vertical" ? "horizontal" : "vertical"))
        }
        onDownload={downloadFile}
      />

      {error ? (
        <div className="border-b border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      ) : null}

      <div className="bg-white dark:bg-slate-950">
        <PDFCanvas
          url={url}
          pageNumber={pageNumber}
          navigationToken={navigationToken}
          zoom={zoom}
          scrollMode={scrollMode}
          protectedMode={protectedMode}
          onDocumentLoaded={handleDocumentLoaded}
          onPageChange={setPageNumber}
          onError={setError}
        />
      </div>
    </section>
  );
}
