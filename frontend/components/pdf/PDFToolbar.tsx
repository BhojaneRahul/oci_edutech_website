"use client";

import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Download,
  Eraser,
  Highlighter,
  Info,
  Maximize,
  RotateCw,
  Share2,
  ThumbsUp,
  Undo2,
  ZoomIn,
  ZoomOut,
  Rows3
} from "lucide-react";
import { useMemo } from "react";

type PDFToolbarProps = {
  pageNumber: number;
  totalPages: number;
  zoom: number;
  rotation: number;
  canDownload: boolean;
  isBookmarked: boolean;
  isLiked: boolean;
  scrollMode: "vertical" | "horizontal";
  highlighterOpen: boolean;
  highlightColor: "yellow" | "red" | "blue" | "green" | "grey";
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotate: () => void;
  onBookmark: () => void;
  onLike: () => void;
  onShare: () => void;
  onFullscreen: () => void;
  onToggleScrollMode: () => void;
  onToggleHighlighter: () => void;
  onHighlightColorChange: (color: "yellow" | "red" | "blue" | "green" | "grey") => void;
  onUndoHighlight: () => void;
  onClearHighlights: () => void;
  onInfo: () => void;
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
  rotation,
  canDownload,
  isBookmarked,
  isLiked,
  scrollMode,
  highlighterOpen,
  highlightColor,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onRotate,
  onBookmark,
  onLike,
  onShare,
  onFullscreen,
  onToggleScrollMode,
  onToggleHighlighter,
  onHighlightColorChange,
  onUndoHighlight,
  onClearHighlights,
  onInfo,
  onDownload
}: PDFToolbarProps) {
  const highlighterColors = useMemo(
    () => [
      {
        key: "yellow" as const,
        label: "Yellow highlight",
        buttonClass:
          "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/25"
      },
      {
        key: "red" as const,
        label: "Red highlight",
        buttonClass:
          "bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/25"
      },
      {
        key: "blue" as const,
        label: "Blue highlight",
        buttonClass:
          "bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-200 dark:ring-sky-400/25"
      },
      {
        key: "green" as const,
        label: "Green highlight",
        buttonClass:
          "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/25"
      },
      {
        key: "grey" as const,
        label: "Grey highlight",
        buttonClass:
          "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-500/15 dark:text-slate-200 dark:ring-slate-400/25"
      }
    ],
    []
  );

  const desktopActionItems = useMemo(
    () => [
      {
        key: "scroll",
        label: scrollMode === "vertical" ? "Switch to Horizontal Scroll" : "Switch to Vertical Scroll",
        active: scrollMode === "horizontal",
        onClick: onToggleScrollMode,
        icon:
          scrollMode === "vertical" ? <Columns2 className="h-5 w-5" /> : <Rows3 className="h-5 w-5" />
      },
      {
        key: "bookmark",
        label: "Bookmark",
        active: isBookmarked,
        onClick: onBookmark,
        activeClassName: "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950",
        icon: <Bookmark className="h-5 w-5" />
      },
      {
        key: "like",
        label: "Like",
        active: isLiked,
        onClick: onLike,
        activeClassName:
          "border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-400/50 dark:bg-emerald-500/10 dark:text-emerald-300",
        icon: <ThumbsUp className="h-5 w-5" />
      },
      {
        key: "highlighter",
        label: highlighterOpen ? "Close highlighter" : "Open highlighter",
        active: highlighterOpen,
        onClick: onToggleHighlighter,
        icon: <Highlighter className="h-5 w-5" />
      },
      {
        key: "rotate",
        label: `Rotate ${rotation} degrees`,
        active: false,
        onClick: onRotate,
        icon: <RotateCw className="h-5 w-5" />
      },
      {
        key: "info",
        label: "PDF Info",
        active: false,
        onClick: onInfo,
        icon: <Info className="h-5 w-5" />
      },
      {
        key: "share",
        label: "Share",
        active: false,
        onClick: onShare,
        icon: <Share2 className="h-5 w-5" />
      },
      {
        key: "fullscreen",
        label: "Fullscreen",
        active: false,
        onClick: onFullscreen,
        icon: <Maximize className="h-5 w-5" />
      },
      ...(canDownload
        ? [
            {
              key: "download",
              label: "Download",
              active: false,
              onClick: onDownload,
              icon: <Download className="h-5 w-5" />
            }
          ]
        : [])
    ],
    [
      canDownload,
      highlighterOpen,
      isBookmarked,
      isLiked,
      onBookmark,
      onDownload,
      onFullscreen,
      onInfo,
      onLike,
      onRotate,
      onShare,
      onToggleHighlighter,
      onToggleScrollMode,
      rotation,
      scrollMode
    ]
  );

  return (
    <>
      <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="md:hidden">
          <div className="clean-scroll flex items-center gap-2 overflow-x-auto px-3 py-3">
            <div className="flex shrink-0 items-center gap-2">
              <IconButton onClick={onPrevPage} label="Previous Page" disabled={pageNumber <= 1}>
                <ChevronLeft className="h-5 w-5" />
              </IconButton>
              <div className="min-w-[86px] rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                {pageNumber} / {Math.max(totalPages, 1)}
              </div>
              <IconButton onClick={onNextPage} label="Next Page" disabled={pageNumber >= totalPages}>
                <ChevronRight className="h-5 w-5" />
              </IconButton>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <IconButton onClick={onZoomOut} label="Zoom Out">
                <ZoomOut className="h-5 w-5" />
              </IconButton>
              <div className="min-w-[76px] rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                {zoom}%
              </div>
              <IconButton onClick={onZoomIn} label="Zoom In">
                <ZoomIn className="h-5 w-5" />
              </IconButton>
            </div>

            <div className="flex shrink-0 items-center gap-2 pl-1">
              <IconButton onClick={onToggleScrollMode} label={scrollMode === "vertical" ? "Switch to Horizontal Scroll" : "Switch to Vertical Scroll"} active={scrollMode === "horizontal"}>
                {scrollMode === "vertical" ? <Columns2 className="h-5 w-5" /> : <Rows3 className="h-5 w-5" />}
              </IconButton>
              <IconButton onClick={onToggleHighlighter} label={highlighterOpen ? "Close highlighter" : "Open highlighter"} active={highlighterOpen}>
                <Highlighter className="h-5 w-5" />
              </IconButton>
              <IconButton onClick={onRotate} label={`Rotate ${rotation} degrees`}>
                <RotateCw className="h-5 w-5" />
              </IconButton>
              <IconButton onClick={onInfo} label="PDF Info">
                <Info className="h-5 w-5" />
              </IconButton>
              <IconButton onClick={onFullscreen} label="Fullscreen">
                <Maximize className="h-5 w-5" />
              </IconButton>
              <IconButton
                onClick={onBookmark}
                label="Bookmark"
                active={isBookmarked}
                activeClassName="border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950"
              >
                <Bookmark className="h-5 w-5" />
              </IconButton>
              <IconButton
                onClick={onLike}
                label="Like"
                active={isLiked}
                activeClassName="border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-400/50 dark:bg-emerald-500/10 dark:text-emerald-300"
              >
                <ThumbsUp className="h-5 w-5" />
              </IconButton>
              <IconButton onClick={onShare} label="Share">
                <Share2 className="h-5 w-5" />
              </IconButton>
              {canDownload ? (
                <IconButton onClick={onDownload} label="Download">
                  <Download className="h-5 w-5" />
                </IconButton>
              ) : null}
            </div>
          </div>
        </div>

        <div className="hidden md:block">
          <div className="flex w-full items-center justify-between gap-4 px-4 py-3 lg:px-5">
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

            <div className="clean-scroll flex max-w-[42vw] items-center gap-3 overflow-x-auto">
              {desktopActionItems.map((item) => (
                <div key={item.key} className="shrink-0">
                  <IconButton
                    onClick={item.onClick}
                    label={item.label}
                    active={item.active}
                    activeClassName={item.activeClassName}
                  >
                    {item.icon}
                  </IconButton>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`pointer-events-none absolute inset-x-0 top-full z-20 flex justify-center px-3 transition-all duration-300 ease-out ${
          highlighterOpen ? "translate-y-2 opacity-100" : "-translate-y-2 opacity-0"
        }`}
      >
        <div
          className={`clean-scroll pointer-events-auto flex max-w-3xl items-center gap-2 overflow-x-auto rounded-[24px] border border-slate-200/80 bg-white/92 px-3 py-2 shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/92 dark:shadow-black/35 ${
            highlighterOpen ? "scale-100" : "scale-[0.98]"
          } transition-transform duration-300 ease-out`}
        >
          {highlighterColors.map((color) => {
            const active = highlightColor === color.key;

            return (
              <button
                key={color.key}
                type="button"
                aria-label={color.label}
                title={color.label}
                onClick={() => onHighlightColorChange(color.key)}
                className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ring-1 transition ${
                  color.buttonClass
                } ${
                  active
                    ? "shadow-[0_8px_24px_rgba(15,23,42,0.14)] ring-offset-2 ring-offset-white dark:ring-offset-slate-950"
                    : "opacity-80 hover:opacity-100"
                }`}
              >
                {color.key.charAt(0).toUpperCase() + color.key.slice(1)}
              </button>
            );
          })}
          <div className="mx-1 h-8 w-px shrink-0 bg-slate-200 dark:bg-slate-700" />
          <button
            type="button"
            onClick={onUndoHighlight}
            className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-900"
          >
            <Undo2 className="h-4 w-4" />
            Undo
          </button>
          <button
            type="button"
            onClick={onClearHighlights}
            className="flex shrink-0 items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-white dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:border-rose-400/40 dark:hover:bg-slate-900"
          >
            <Eraser className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] md:hidden dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/30">
        <div className="mx-auto max-w-md space-y-3">
          <div className="flex items-center justify-between gap-2 rounded-[24px] border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950">
            <button
              type="button"
              onClick={onBookmark}
              className={`flex min-w-[108px] flex-1 items-center justify-center gap-2 rounded-[18px] px-3 py-2 text-xs font-semibold ${
                isBookmarked
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-500 dark:text-slate-300"
              }`}
            >
              <Bookmark className="h-4 w-4" />
              Save
            </button>
            <button
              type="button"
              onClick={onShare}
              className="flex min-w-[108px] flex-1 items-center justify-center gap-2 rounded-[18px] px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-300"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
