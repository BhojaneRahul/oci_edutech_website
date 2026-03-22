"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type SetStateAction
} from "react";
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy, type RenderTask } from "pdfjs-dist/legacy/build/pdf.mjs";

GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

type HighlightStroke = {
  color: string;
  points: { x: number; y: number }[];
};

type PDFCanvasProps = {
  url: string;
  pageNumber: number;
  navigationToken: number;
  zoom: number;
  rotation: number;
  isFullscreen: boolean;
  highlighterEnabled: boolean;
  highlightColor: "yellow" | "red" | "blue" | "green" | "grey";
  undoHighlightToken: number;
  clearHighlightsToken: number;
  scrollMode: "vertical" | "horizontal";
  onDocumentLoaded: (totalPages: number) => void;
  onPinchZoom: Dispatch<SetStateAction<number>>;
  onPageChange: (page: number) => void;
  onError: (message: string | null) => void;
};

export function PDFCanvas({
  url,
  pageNumber,
  navigationToken,
  zoom,
  rotation,
  isFullscreen,
  highlighterEnabled,
  highlightColor,
  undoHighlightToken,
  clearHighlightsToken,
  scrollMode,
  onDocumentLoaded,
  onPinchZoom,
  onPageChange,
  onError
}: PDFCanvasProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const documentRef = useRef<PDFDocumentProxy | null>(null);
  const renderTasksRef = useRef<Map<number, RenderTask>>(new Map());
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const overlayRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const highlightStrokesRef = useRef<Record<number, HighlightStroke[]>>({});
  const activeStrokeRef = useRef<{
    page: number;
    pointerId: number;
    stroke: HighlightStroke;
  } | null>(null);
  const currentPageRef = useRef(pageNumber);
  const pinchStateRef = useRef<{ distance: number; zoom: number } | null>(null);
  const resizeFrameRef = useRef<number | null>(null);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const renderRetryFrameRef = useRef<number | null>(null);
  const hasRenderedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [documentVersion, setDocumentVersion] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollViewportWidth, setScrollViewportWidth] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [renderedPages, setRenderedPages] = useState<number[]>([]);

  const cancelRenderTasks = useCallback(async () => {
    const currentTasks = Array.from(renderTasksRef.current.entries());
    currentTasks.forEach(([, task]) => task.cancel());
    renderTasksRef.current = new Map();
    await Promise.allSettled(currentTasks.map(([, task]) => task.promise.catch(() => undefined)));
  }, []);

  const pages = useMemo(() => Array.from({ length: totalPages }, (_, index) => index + 1), [totalPages]);
  const horizontalPageWidth = Math.max(scrollViewportWidth || containerWidth || viewportRef.current?.clientWidth || 900, 320);

  const highlighterColorMap = useMemo(
    () => ({
      yellow: "rgba(250, 204, 21, 0.24)",
      red: "rgba(248, 113, 113, 0.22)",
      blue: "rgba(96, 165, 250, 0.22)",
      green: "rgba(74, 222, 128, 0.22)",
      grey: "rgba(148, 163, 184, 0.24)"
    }),
    []
  );

  const redrawHighlights = useCallback((page: number) => {
    const overlay = overlayRefs.current[page - 1];
    if (!overlay) return;

    const context = overlay.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, overlay.width, overlay.height);

    const strokes = highlightStrokesRef.current[page] ?? [];
    const lineWidth = Math.max(14, Math.min(overlay.width, overlay.height) * 0.032);

    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;

      context.strokeStyle = stroke.color;
      context.lineWidth = lineWidth;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.beginPath();
      context.moveTo(stroke.points[0].x * overlay.width, stroke.points[0].y * overlay.height);

      stroke.points.slice(1).forEach((point) => {
        context.lineTo(point.x * overlay.width, point.y * overlay.height);
      });

      context.stroke();
    });
  }, []);

  const redrawAllHighlights = useCallback(() => {
    Object.keys(highlightStrokesRef.current).forEach((pageKey) => {
      redrawHighlights(Number(pageKey));
    });
  }, [redrawHighlights]);

  const getNormalizedPoint = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)),
      y: Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height))
    };
  }, []);

  const handleHighlightStart = useCallback(
    (page: number, event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!highlighterEnabled) return;

      const point = getNormalizedPoint(event);
      const stroke = {
        color: highlighterColorMap[highlightColor],
        points: [point, point]
      };

      activeStrokeRef.current = {
        page,
        pointerId: event.pointerId,
        stroke
      };

      highlightStrokesRef.current[page] = [...(highlightStrokesRef.current[page] ?? []), stroke];
      event.currentTarget.setPointerCapture(event.pointerId);
      redrawHighlights(page);
    },
    [getNormalizedPoint, highlighterColorMap, highlightColor, highlighterEnabled, redrawHighlights]
  );

  const handleHighlightMove = useCallback(
    (page: number, event: ReactPointerEvent<HTMLCanvasElement>) => {
      const activeStroke = activeStrokeRef.current;
      if (!highlighterEnabled || !activeStroke || activeStroke.page !== page || activeStroke.pointerId !== event.pointerId) {
        return;
      }

      activeStroke.stroke.points.push(getNormalizedPoint(event));
      redrawHighlights(page);
    },
    [getNormalizedPoint, highlighterEnabled, redrawHighlights]
  );

  const handleHighlightEnd = useCallback(
    (page: number, event: ReactPointerEvent<HTMLCanvasElement>) => {
      const activeStroke = activeStrokeRef.current;
      if (!activeStroke || activeStroke.page !== page || activeStroke.pointerId !== event.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      activeStrokeRef.current = null;
      redrawHighlights(page);
    },
    [redrawHighlights]
  );

  useEffect(() => {
    if (!undoHighlightToken) return;
    const page = currentPageRef.current;
    const existing = highlightStrokesRef.current[page] ?? [];
    if (!existing.length) return;
    highlightStrokesRef.current[page] = existing.slice(0, -1);
    redrawHighlights(page);
  }, [redrawHighlights, undoHighlightToken]);

  useEffect(() => {
    if (!clearHighlightsToken) return;
    highlightStrokesRef.current = {};
    activeStrokeRef.current = null;
    redrawAllHighlights();
  }, [clearHighlightsToken, redrawAllHighlights]);

  useEffect(() => {
    currentPageRef.current = pageNumber;
  }, [pageNumber]);

  useEffect(() => {
    const updateMobileState = () => setIsMobile(window.innerWidth < 768);
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

      if (resizeFrameRef.current) cancelAnimationFrame(resizeFrameRef.current);
      resizeFrameRef.current = requestAnimationFrame(() => {
        const nextWidth = Math.round(entry.contentRect.width);
        if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = setTimeout(() => {
          setContainerWidth((currentWidth) =>
            Math.abs(currentWidth - nextWidth) > (window.innerWidth < 768 ? 140 : 24) ? nextWidth : currentWidth || nextWidth
          );
        }, window.innerWidth < 768 ? 260 : 120);
      });
    });

    resizeObserver.observe(element);
    setContainerWidth(element.clientWidth);

    return () => {
      resizeObserver.disconnect();
      if (resizeFrameRef.current) cancelAnimationFrame(resizeFrameRef.current);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      if (renderRetryFrameRef.current) cancelAnimationFrame(renderRetryFrameRef.current);
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
      highlightStrokesRef.current = {};
      activeStrokeRef.current = null;
      if (renderRetryFrameRef.current) {
        cancelAnimationFrame(renderRetryFrameRef.current);
        renderRetryFrameRef.current = null;
      }
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
        if (error instanceof Error && error.name === "AbortError") return;
        onError(error instanceof Error ? error.message : "Unable to load this PDF.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDocument();

    return () => {
      active = false;
      controller.abort();
      void cancelRenderTasks();
      if (renderRetryFrameRef.current) {
        cancelAnimationFrame(renderRetryFrameRef.current);
        renderRetryFrameRef.current = null;
      }
      documentRef.current?.destroy();
      documentRef.current = null;
    };
  }, [cancelRenderTasks, onDocumentLoaded, onError, url]);

  useEffect(() => {
    let active = true;

    const renderPages = async () => {
      if (!documentRef.current || !pages.length) return;

      let didRenderAnyPage = false;
      let missingCanvasTargets = false;

      try {
        if (!hasRenderedRef.current) setLoading(true);
        await cancelRenderTasks();
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

        const deviceScale = typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 2);

        for (const pageIndex of pages) {
          const holder = pageRefs.current[pageIndex - 1];
          const canvas = canvasRefs.current[pageIndex - 1];
          const overlay = overlayRefs.current[pageIndex - 1];

          if (!active) continue;
          if (!holder || !canvas || !overlay) {
            missingCanvasTargets = true;
            continue;
          }

          const page = await documentRef.current.getPage(pageIndex);
          const baseViewport = page.getViewport({ scale: 1, rotation });
          const holderWidth =
            scrollMode === "horizontal"
              ? horizontalPageWidth
              : holder.clientWidth || containerWidth || viewportRef.current?.clientWidth || 900;
          const availableWidth = Math.max(
            holderWidth - (scrollMode === "vertical" ? (isMobile ? 8 : 20) : isMobile ? 18 : 40),
            260
          );
          const fitScale = availableWidth / baseViewport.width;
          const scale = fitScale * (zoom / 100);
          const viewport = page.getViewport({ scale, rotation });
          const context = canvas.getContext("2d");

          if (!context) {
            onError("Canvas rendering is not supported in this browser.");
            return;
          }

          const previousTask = renderTasksRef.current.get(pageIndex);
          if (previousTask) {
            previousTask.cancel();
            await previousTask.promise.catch(() => undefined);
            renderTasksRef.current.delete(pageIndex);
          }

          canvas.width = Math.floor(viewport.width * deviceScale);
          canvas.height = Math.floor(viewport.height * deviceScale);
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;

          overlay.width = Math.floor(viewport.width * deviceScale);
          overlay.height = Math.floor(viewport.height * deviceScale);
          overlay.style.width = `${viewport.width}px`;
          overlay.style.height = `${viewport.height}px`;

          const renderTask = page.render({
            canvasContext: context,
            viewport,
            transform: deviceScale === 1 ? undefined : [deviceScale, 0, 0, deviceScale, 0, 0]
          });

          renderTasksRef.current.set(pageIndex, renderTask);
          try {
            await renderTask.promise;
          } finally {
            renderTasksRef.current.delete(pageIndex);
          }

          if (active) {
            didRenderAnyPage = true;
            setRenderedPages((current) => (current.includes(pageIndex) ? current : [...current, pageIndex]));
            redrawHighlights(pageIndex);
          }
        }

        if (active) {
          hasRenderedRef.current = didRenderAnyPage || hasRenderedRef.current;
          onError(null);

          if (!didRenderAnyPage && missingCanvasTargets) {
            renderRetryFrameRef.current = requestAnimationFrame(() => {
              setDocumentVersion((value) => value + 1);
            });
            return;
          }
        }
      } catch (error) {
        if (active && !(error instanceof Error && error.name === "RenderingCancelledException")) {
          onError(error instanceof Error ? error.message : "Unable to render this PDF.");
        }
      } finally {
        if (active) {
          setLoading(!didRenderAnyPage && !hasRenderedRef.current && !missingCanvasTargets);
        }
      }
    };

    renderPages();

    return () => {
      active = false;
      void cancelRenderTasks();
      if (renderRetryFrameRef.current) {
        cancelAnimationFrame(renderRetryFrameRef.current);
        renderRetryFrameRef.current = null;
      }
    };
  }, [cancelRenderTasks, containerWidth, documentVersion, horizontalPageWidth, isMobile, onError, pages, redrawHighlights, rotation, scrollMode, zoom]);

  useEffect(() => {
    const currentPage = pageRefs.current[currentPageRef.current - 1];
    const root = scrollRef.current;
    if (!currentPage || !root) return;

    currentPage.scrollIntoView({
      behavior: isMobile ? "auto" : "smooth",
      block: scrollMode === "vertical" ? "start" : "nearest",
      inline: scrollMode === "horizontal" ? "center" : "nearest"
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
        threshold: scrollMode === "horizontal" ? [0.55, 0.7, 0.85] : isMobile ? [0.65, 0.82] : [0.45, 0.65, 0.85]
      }
    );

    pageRefs.current.forEach((page) => {
      if (page) observer.observe(page);
    });

    return () => observer.disconnect();
  }, [isMobile, onPageChange, pages, scrollMode]);

  useEffect(() => {
    if (!documentRef.current || !totalPages || renderedPages.length > 0) return;
    const fallbackTimer = setTimeout(() => {
      setDocumentVersion((value) => value + 1);
    }, 250);
    return () => clearTimeout(fallbackTimer);
  }, [renderedPages.length, totalPages]);

  const getTouchDistance = useCallback((touches: TouchList) => {
    if (touches.length < 2) return 0;
    const first = touches[0];
    const second = touches[1];
    return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
  }, []);

  return (
    <div ref={viewportRef} className="bg-white dark:bg-slate-950">
      <div
        ref={scrollRef}
        className={`[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
          isFullscreen
            ? "h-[calc(100vh-8.5rem)] pb-24 md:h-[calc(100vh-4.75rem)] md:pb-3"
            : "h-[calc(100vh-15.5rem)] pb-28 sm:h-[calc(100vh-15rem)] md:h-[calc(100vh-10rem)] md:pb-8"
        } ${scrollMode === "vertical" ? "overflow-y-auto overflow-x-auto" : "overflow-x-auto overflow-y-hidden"}`}
        style={scrollMode === "horizontal" ? { scrollSnapType: isMobile ? "none" : "x mandatory" } : undefined}
        onTouchStart={(event) => {
          if (event.touches.length === 2) {
            pinchStateRef.current = {
              distance: getTouchDistance(event.touches),
              zoom
            };
          }
        }}
        onTouchMove={(event) => {
          if (event.touches.length !== 2 || !pinchStateRef.current || highlighterEnabled) return;
          const nextDistance = getTouchDistance(event.touches);
          if (!nextDistance || !pinchStateRef.current.distance) return;

          event.preventDefault();
          const scaledZoom = pinchStateRef.current.zoom * (nextDistance / pinchStateRef.current.distance);
          onPinchZoom((current) => {
            const nextZoom = Math.max(60, Math.min(240, Math.round(scaledZoom)));
            return nextZoom === current ? current : nextZoom;
          });
        }}
        onTouchEnd={() => {
          pinchStateRef.current = null;
        }}
      >
        <div
          className={`${
            scrollMode === "vertical"
              ? isFullscreen
                ? "space-y-2 px-1 py-0 sm:px-1 sm:py-1"
                : "space-y-3 px-1 py-3 sm:px-2 sm:py-4"
              : isFullscreen
                ? "flex w-max items-start gap-3 px-2 py-1 sm:px-3"
                : "flex w-max items-start gap-4 px-3 py-4 sm:px-4"
          }`}
          style={scrollMode === "horizontal" ? { minWidth: `${horizontalPageWidth * pages.length}px` } : undefined}
        >
          {pages.map((page) => (
            <div
              key={page}
              ref={(element) => {
                pageRefs.current[page - 1] = element;
              }}
              data-page={page}
              className={`shrink-0 ${scrollMode === "vertical" ? "snap-start" : "snap-center"}`}
              style={scrollMode === "horizontal" ? { width: `${horizontalPageWidth}px` } : undefined}
            >
              <div className={scrollMode === "vertical" ? "mx-auto w-max min-w-full" : "mx-auto flex w-full justify-center"}>
                <div
                  className="relative mx-auto overflow-hidden bg-white shadow-[0_18px_48px_rgba(15,23,42,0.12)] transition dark:shadow-black/30"
                  style={{ minHeight: isMobile ? "48vh" : "62vh" }}
                >
                  {!renderedPages.includes(page) ? (
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800" />
                  ) : null}
                  <canvas
                    ref={(element) => {
                      canvasRefs.current[page - 1] = element;
                    }}
                    className="mx-auto block bg-white dark:[filter:invert(0.92)_hue-rotate(180deg)]"
                  />
                  <canvas
                    ref={(element) => {
                      overlayRefs.current[page - 1] = element;
                    }}
                    onPointerDown={(event) => handleHighlightStart(page, event)}
                    onPointerMove={(event) => handleHighlightMove(page, event)}
                    onPointerUp={(event) => handleHighlightEnd(page, event)}
                    onPointerCancel={(event) => handleHighlightEnd(page, event)}
                    onPointerLeave={(event) => handleHighlightEnd(page, event)}
                    className={`absolute inset-0 mx-auto block ${
                      highlighterEnabled ? "cursor-crosshair touch-none pointer-events-auto" : "pointer-events-none"
                    }`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="pointer-events-none sticky bottom-5 mx-auto flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/96 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[0_18px_44px_rgba(15,23,42,0.14)] backdrop-blur dark:border-slate-700 dark:bg-slate-950/96 dark:text-slate-100">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-500" />
            Loading PDF
          </div>
        ) : null}
      </div>
    </div>
  );
}
