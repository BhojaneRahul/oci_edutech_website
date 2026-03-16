"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy, type RenderTask } from "pdfjs-dist/legacy/build/pdf.mjs";

GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

type PDFCanvasProps = {
  url: string;
  pageNumber: number;
  navigationToken: number;
  zoom: number;
  searchQuery: string;
  scrollMode: "vertical" | "horizontal";
  protectedMode: boolean;
  onDocumentLoaded: (totalPages: number) => void;
  onTextIndexReady: (texts: string[]) => void;
  onPageChange: (page: number) => void;
  onError: (message: string | null) => void;
};

export function PDFCanvas({
  url,
  pageNumber,
  navigationToken,
  zoom,
  searchQuery,
  scrollMode,
  protectedMode,
  onDocumentLoaded,
  onTextIndexReady,
  onPageChange,
  onError
}: PDFCanvasProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const documentRef = useRef<PDFDocumentProxy | null>(null);
  const renderTasksRef = useRef<RenderTask[]>([]);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentVersion, setDocumentVersion] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollViewportWidth, setScrollViewportWidth] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [renderedPages, setRenderedPages] = useState<number[]>([]);
  const currentPageRef = useRef(pageNumber);
  const resizeFrameRef = useRef<number | null>(null);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRenderedRef = useRef(false);

  const pages = useMemo(() => Array.from({ length: totalPages }, (_, index) => index + 1), [totalPages]);
  const horizontalPageWidth = Math.max(scrollViewportWidth || containerWidth || viewportRef.current?.clientWidth || 900, 320);

  useEffect(() => {
    currentPageRef.current = pageNumber;
  }, [pageNumber]);

  useEffect(() => {
    const updateMobileState = () => {
      setIsMobile((current) => {
        const next = window.innerWidth < 768;
        return current === next ? current : next;
      });
    };

    updateMobileState();
    window.addEventListener("resize", updateMobileState);

    return () => window.removeEventListener("resize", updateMobileState);
  }, []);

  useEffect(() => {
    if (!viewportRef.current) return;

    const element = viewportRef.current;
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      if (resizeFrameRef.current) {
        cancelAnimationFrame(resizeFrameRef.current);
      }

      resizeFrameRef.current = requestAnimationFrame(() => {
        const nextWidth = Math.round(entry.contentRect.width);

        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current);
        }

        resizeTimeoutRef.current = setTimeout(() => {
          setContainerWidth((currentWidth) =>
            Math.abs(currentWidth - nextWidth) > (window.innerWidth < 768 ? 120 : 24)
              ? nextWidth
              : currentWidth || nextWidth
          );
        }, window.innerWidth < 768 ? 260 : 120);
      });
    });

    resizeObserver.observe(element);
    setContainerWidth(element.clientWidth);

    return () => {
      resizeObserver.disconnect();
      if (resizeFrameRef.current) {
        cancelAnimationFrame(resizeFrameRef.current);
      }
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;

    const updateScrollViewportWidth = () => {
      const nextWidth = scrollRef.current?.clientWidth ?? 0;
      setScrollViewportWidth((current) => (Math.abs(current - nextWidth) > 8 ? nextWidth : current || nextWidth));
    };

    updateScrollViewportWidth();
    window.addEventListener("resize", updateScrollViewportWidth);

    return () => window.removeEventListener("resize", updateScrollViewportWidth);
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const loadDocument = async () => {
      setLoading(true);
      setDocumentVersion(0);
      setTotalPages(0);
      setRenderedPages([]);
      hasRenderedRef.current = false;
      onError(null);

      try {
        const resolvedUrl = new URL(url, window.location.origin);
        const sameOrigin = resolvedUrl.origin === window.location.origin;
        const response = await fetch(url, {
          credentials: sameOrigin ? "include" : "omit",
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("Unable to fetch this PDF file.");
        }

        const buffer = await response.arrayBuffer();
        const loadingTask = getDocument({
          data: new Uint8Array(buffer),
          disableRange: true,
          disableStream: true
        });
        const pdf = await loadingTask.promise;

        if (!active) {
          await pdf.destroy();
          return;
        }

        documentRef.current = pdf;
        setTotalPages(pdf.numPages);
        onDocumentLoaded(pdf.numPages);
        setDocumentVersion((value) => value + 1);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        onError(error instanceof Error ? error.message : "Unable to load this PDF.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      active = false;
      controller.abort();
      renderTasksRef.current.forEach((task) => task.cancel());
      renderTasksRef.current = [];
      documentRef.current?.destroy();
      documentRef.current = null;
    };
  }, [onDocumentLoaded, onError, url]);

  useEffect(() => {
    let active = true;

    const renderPages = async () => {
      if (!documentRef.current || !pages.length) return;

      try {
        if (!hasRenderedRef.current) {
          setLoading(true);
        }
        renderTasksRef.current.forEach((task) => task.cancel());
        renderTasksRef.current = [];
        const extractedTexts: string[] = [];

        for (const pageIndex of pages) {
          const holder = pageRefs.current[pageIndex - 1];
          const canvas = canvasRefs.current[pageIndex - 1];

          if (!holder || !canvas || !active) {
            continue;
          }

          const page = await documentRef.current.getPage(pageIndex);
          const textContent = await page.getTextContent();
          extractedTexts[pageIndex - 1] = textContent.items
            .map((item) => ("str" in item ? item.str : ""))
            .join(" ");
          const baseViewport = page.getViewport({ scale: 1 });
          const holderWidth =
            scrollMode === "horizontal"
              ? horizontalPageWidth
              : holder.clientWidth || containerWidth || viewportRef.current?.clientWidth || 900;
          const availableWidth = Math.max(
            holderWidth - (scrollMode === "vertical" ? (isMobile ? 4 : 12) : isMobile ? 12 : 28),
            260
          );
          const fitScale = availableWidth / baseViewport.width;
          const scale = fitScale * (zoom / 100);
          const viewport = page.getViewport({ scale });
          const context = canvas.getContext("2d");

          if (!context) {
            onError("Canvas rendering is not supported in this browser.");
            setLoading(false);
            return;
          }

          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;

          const renderTask = page.render({
            canvasContext: context,
            viewport
          });

          renderTasksRef.current.push(renderTask);
          await renderTask.promise;

          if (active) {
            setRenderedPages((current) => (current.includes(pageIndex) ? current : [...current, pageIndex]));
          }
        }

        if (active) {
          hasRenderedRef.current = true;
          onTextIndexReady(extractedTexts);
          onError(null);
        }
      } catch (error) {
        if (active && !(error instanceof Error && error.name === "RenderingCancelledException")) {
          onError(error instanceof Error ? error.message : "Unable to render this PDF.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    renderPages();

    return () => {
      active = false;
      renderTasksRef.current.forEach((task) => task.cancel());
      renderTasksRef.current = [];
    };
  }, [containerWidth, documentVersion, horizontalPageWidth, isMobile, onError, onTextIndexReady, pages, scrollMode, zoom]);

  useEffect(() => {
    const currentPage = pageRefs.current[currentPageRef.current - 1];
    const root = scrollRef.current;

    if (!currentPage || !root) return;

    currentPage.scrollIntoView({
      behavior: isMobile ? "auto" : "smooth",
      block: scrollMode === "vertical" ? "start" : "nearest",
      inline: scrollMode === "horizontal" ? "start" : "nearest"
    });
  }, [isMobile, navigationToken, scrollMode]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root || !pages.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) return;

        const nextPage = Number(visibleEntry.target.getAttribute("data-page"));
        if (Number.isFinite(nextPage) && nextPage !== currentPageRef.current) {
          currentPageRef.current = nextPage;
          onPageChange(nextPage);
        }
      },
      {
        root,
        threshold: isMobile ? [0.6, 0.8] : [0.45, 0.65, 0.85]
      }
    );

    pageRefs.current.forEach((page) => {
      if (page) {
        observer.observe(page);
      }
    });

    return () => observer.disconnect();
  }, [isMobile, onPageChange, pages]);

  return (
    <div
      ref={viewportRef}
      className="bg-[#f3f6fb] dark:bg-slate-950"
      onContextMenu={protectedMode ? (event) => event.preventDefault() : undefined}
      onCopy={protectedMode ? (event) => event.preventDefault() : undefined}
      style={protectedMode ? { userSelect: "none" } : undefined}
    >
      <div
        ref={scrollRef}
        className={`h-[calc(100vh-11rem)] px-0 py-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:h-[calc(100vh-10rem)] ${
          scrollMode === "vertical" ? "overflow-y-auto overflow-x-auto" : "overflow-x-auto overflow-y-hidden"
        }`}
        style={scrollMode === "horizontal" ? { scrollSnapType: isMobile ? "none" : "x mandatory" } : undefined}
      >
        <div
          className={`${
            scrollMode === "vertical"
              ? isMobile
                ? ""
                : "snap-y snap-mandatory"
              : isMobile
                ? "flex w-max items-start"
                : "flex w-max items-start"
          }`}
          style={scrollMode === "horizontal" ? { minWidth: `${horizontalPageWidth * pages.length}px` } : undefined}
        >
          {pages.map((page) => (
            (() => {
              const normalizedQuery = searchQuery.trim().toLowerCase();
              const pageText = normalizedQuery ? (pageRefs.current ? "" : "") : "";
              return null;
            })(),
            <div
              key={page}
              ref={(element) => {
                pageRefs.current[page - 1] = element;
              }}
              data-page={page}
              className={`shrink-0 snap-start ${
                scrollMode === "vertical" ? "px-0 py-2 sm:px-1 sm:py-3" : "px-1 py-3 sm:px-2 sm:py-4"
              }`}
              style={scrollMode === "horizontal" ? { width: `${horizontalPageWidth}px` } : undefined}
            >
              <div
                className={`${
                  scrollMode === "vertical"
                    ? "mx-auto w-max min-w-full"
                    : "mx-auto w-full"
                }`}
              >
                <div
                  className="relative mx-auto"
                  style={{ minHeight: isMobile ? "55vh" : "70vh" }}
                >
                  {!renderedPages.includes(page) ? (
                    <div className="absolute inset-0 rounded-sm bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 animate-pulse dark:from-slate-800 dark:via-slate-900 dark:to-slate-800" />
                  ) : null}
                  <canvas
                    ref={(element) => {
                      canvasRefs.current[page - 1] = element;
                    }}
                    className="mx-auto block bg-white shadow-[0_18px_48px_rgba(15,23,42,0.12)] dark:[filter:invert(0.92)_hue-rotate(180deg)] dark:shadow-black/40"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="pointer-events-none sticky bottom-5 mx-auto w-fit rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-lg dark:bg-white dark:text-slate-950">
            Rendering PDF...
          </div>
        ) : null}
      </div>
    </div>
  );
}
