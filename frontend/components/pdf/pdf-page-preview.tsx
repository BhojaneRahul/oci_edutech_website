"use client";

import { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

type PDFPagePreviewProps = {
  url: string;
  title: string;
  className?: string;
  canvasClassName?: string;
};

export function PDFPagePreview({
  url,
  title,
  className = "",
  canvasClassName = ""
}: PDFPagePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let isMounted = true;
    let renderTask: { cancel?: () => void } | null = null;
    let pdfDocument: { destroy?: () => void } | null = null;

    const renderPreview = async () => {
      const canvas = canvasRef.current;
      const wrapper = wrapperRef.current;
      if (!canvas || !wrapper) return;

      try {
        setState("loading");
        const loadingTask = getDocument(url);
        pdfDocument = await loadingTask.promise;
        const page = await pdfDocument.getPage(1);

        const targetWidth = Math.max(wrapper.clientWidth || 320, 240);
        const initialViewport = page.getViewport({ scale: 1 });
        const scale = targetWidth / initialViewport.width;
        const viewport = page.getViewport({ scale });

        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("Canvas context not available");
        }

        const ratio = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * ratio);
        canvas.height = Math.floor(viewport.height * ratio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);

        renderTask = page.render({
          canvasContext: context,
          viewport
        });

        await renderTask.promise;

        if (isMounted) {
          setState("ready");
        }
      } catch {
        if (isMounted) {
          setState("error");
        }
      }
    };

    renderPreview();

    return () => {
      isMounted = false;
      renderTask?.cancel?.();
      pdfDocument?.destroy?.();
    };
  }, [url]);

  return (
    <div
      ref={wrapperRef}
      className={`relative overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-inner dark:border-slate-800 dark:bg-slate-950 ${className}`}
    >
      <canvas ref={canvasRef} className={`block w-full ${canvasClassName}`} aria-label={`${title} first page preview`} />

      {state !== "ready" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-white/95 to-slate-50/95 text-center dark:from-slate-950/95 dark:to-slate-900/95">
          <div className="space-y-2 px-4">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              <FileText className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {state === "loading" ? "Loading preview..." : "Preview unavailable"}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
