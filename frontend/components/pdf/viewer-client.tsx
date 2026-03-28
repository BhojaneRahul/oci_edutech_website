"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useAuth } from "../providers/auth-provider";
import { LoginGate } from "../materials/login-gate";
import { resolveMediaUrl } from "@/lib/utils";

const PDFViewer = dynamic(() => import("./PDFViewer").then((module) => module.PDFViewer), {
  ssr: false,
  loading: () => (
    <div className="border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
      Preparing reader...
    </div>
  )
});

export function ViewerClient({
  documentId,
  url,
  title,
  type
}: {
  documentId?: number;
  url: string;
  title: string;
  type: "notes" | "model_qp";
}) {
  const { user, loading } = useAuth();
  const proxiedUrl = useMemo(() => {
    if (!url) {
      return "";
    }

    try {
      const normalizedUrl = resolveMediaUrl(url) ?? url;
      const baseOrigin = typeof window === "undefined" ? "http://localhost:3000" : window.location.origin;
      const absoluteUrl = new URL(normalizedUrl, baseOrigin);
      const isLocalUpload =
        /^https?:\/\/localhost:\d+$/i.test(absoluteUrl.origin) || absoluteUrl.pathname.startsWith("/uploads/");

      return isLocalUpload ? `/api/pdf?src=${encodeURIComponent(absoluteUrl.toString())}` : absoluteUrl.toString();
    } catch {
      return "";
    }
  }, [url]);
  const pdfError = !url ? "PDF URL is missing." : !proxiedUrl ? "This PDF link is invalid." : null;

  if (loading) {
    return <div className="rounded-[28px] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">Loading...</div>;
  }

  if (!user) {
    return <LoginGate />;
  }

  if (pdfError) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10">
        {pdfError}
      </div>
    );
  }

  return (
    <PDFViewer
      documentId={documentId}
      url={proxiedUrl}
      title={title}
      allowDownload={type === "model_qp"}
    />
  );
}
