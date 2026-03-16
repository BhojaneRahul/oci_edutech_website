"use client";

import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Download,
  Maximize,
  Share2,
  ThumbsUp,
  ZoomIn,
  ZoomOut,
  Rows3
} from "lucide-react";

type PDFToolbarProps = {
  pageNumber: number;
  totalPages: number;
  zoom: number;
  likeCount: number;
  canDownload: boolean;
  isBookmarked: boolean;
  isLiked: boolean;
  scrollMode: "vertical" | "horizontal";
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onBookmark: () => void;
  onLike: () => void;
  onShare: () => void;
  onFullscreen: () => void;
  onToggleScrollMode: () => void;
  onDownload: () => void;
};

function IconButton({
  onClick,
  label,
  children,
  active = false,
  disabled = false,
  activeClassName
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  activeClassName?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-slate-600 transition ${
        active
          ? activeClassName ||
            "border-amber-300 bg-amber-50 text-amber-600 dark:border-amber-400/50 dark:bg-amber-500/10 dark:text-amber-300"
          : "border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-amber-400/40 dark:hover:bg-amber-500/10 dark:hover:text-amber-300"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      {children}
    </button>
  );
}

export function PDFToolbar({
  pageNumber,
  totalPages,
  zoom,
  likeCount,
  canDownload,
  isBookmarked,
  isLiked,
  scrollMode,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onBookmark,
  onLike,
  onShare,
  onFullscreen,
  onToggleScrollMode,
  onDownload
}: PDFToolbarProps) {
  return (
    <div className="sticky top-20 z-30 bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-slate-950/90 dark:shadow-black/20">
      <div className="overflow-x-auto lg:overflow-visible">
        <div className="flex w-full min-w-max items-center justify-between gap-4 px-3 py-3 sm:px-4 lg:min-w-0 lg:flex-wrap lg:gap-5 lg:px-5">
          <div className="flex items-center gap-3">
            <IconButton onClick={onPrevPage} label="Previous Page" disabled={pageNumber <= 1}>
              <ChevronLeft className="h-5 w-5" />
            </IconButton>
            <div className="min-w-[88px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              {pageNumber} / {Math.max(totalPages, 1)}
            </div>
            <IconButton onClick={onNextPage} label="Next Page" disabled={pageNumber >= totalPages}>
              <ChevronRight className="h-5 w-5" />
            </IconButton>
          </div>

          <div className="flex items-center gap-3">
            <IconButton onClick={onZoomOut} label="Zoom Out">
              <ZoomOut className="h-5 w-5" />
            </IconButton>
            <div className="min-w-[84px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              {zoom}%
            </div>
            <IconButton onClick={onZoomIn} label="Zoom In">
              <ZoomIn className="h-5 w-5" />
            </IconButton>
          </div>

          <div className="relative flex items-center gap-3">
            <IconButton
              onClick={onToggleScrollMode}
              label={scrollMode === "vertical" ? "Switch to Horizontal Scroll" : "Switch to Vertical Scroll"}
              active={scrollMode === "horizontal"}
            >
              {scrollMode === "vertical" ? <Columns2 className="h-5 w-5" /> : <Rows3 className="h-5 w-5" />}
            </IconButton>
            <IconButton
              onClick={onBookmark}
              label="Bookmark"
              active={isBookmarked}
              activeClassName="border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950"
            >
              <Bookmark className="h-5 w-5" />
            </IconButton>
            <div className="flex items-center gap-2">
              <IconButton
                onClick={onLike}
                label="Like"
                active={isLiked}
                activeClassName="border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-400/50 dark:bg-emerald-500/10 dark:text-emerald-300"
              >
                <ThumbsUp className="h-5 w-5" />
              </IconButton>
              <span className={`text-sm font-semibold ${isLiked ? "text-emerald-600 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}`}>
                {likeCount}
              </span>
            </div>
            <IconButton onClick={onShare} label="Share">
              <Share2 className="h-5 w-5" />
            </IconButton>
            <IconButton onClick={onFullscreen} label="Fullscreen">
              <Maximize className="h-5 w-5" />
            </IconButton>
            {canDownload ? (
              <IconButton onClick={onDownload} label="Download">
                <Download className="h-5 w-5" />
              </IconButton>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
