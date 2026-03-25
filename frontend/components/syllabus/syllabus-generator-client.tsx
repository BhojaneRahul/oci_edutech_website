"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Clock3, FileText, FileUp, Loader2, Send, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Document, SyllabusGeneration } from "@/lib/types";
import { useAuth } from "../providers/auth-provider";

export function SyllabusGeneratorClient() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [topics, setTopics] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeRequest, setActiveRequest] = useState<SyllabusGeneration | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const requestsQuery = useQuery({
    queryKey: ["syllabus-generations"],
    enabled: Boolean(user),
    queryFn: async () => {
      const response = await api.get<{ success: true; generations: SyllabusGeneration[] }>("/syllabus");
      return response.data.generations;
    }
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) {
        throw new Error("Please upload a syllabus PDF or image first.");
      }

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("subject", subject);
      formData.append("course", course);
      formData.append("semester", semester);
      formData.append("topics", topics);

      setUploadProgress(0);

      const response = await api.post<{ success: true; generation: SyllabusGeneration }>(
        "/syllabus/generate",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          },
          onUploadProgress: (progressEvent) => {
            if (!progressEvent.total) return;
            setUploadProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
          }
        }
      );

      return response.data.generation;
    },
    onSuccess: async (request) => {
      setActionError(null);
      setActiveRequest(request);
      setUploadProgress(100);
      await queryClient.invalidateQueries({ queryKey: ["syllabus-generations"] });
    },
    onError: (error: any) => {
      setUploadProgress(0);
      setActionError(
        String(error?.response?.data?.message || error?.message || "We could not submit this syllabus right now.")
      );
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (requestId: number) => {
      await api.delete(`/syllabus/${requestId}`);
      return requestId;
    },
    onSuccess: async (requestId) => {
      setActionError(null);
      if (activeRequest?._id === requestId) {
        setActiveRequest(null);
      }
      await queryClient.invalidateQueries({ queryKey: ["syllabus-generations"] });
    },
    onError: (error: any) => {
      setActionError(String(error?.response?.data?.message || "We could not delete this request right now."));
    }
  });

  const selectedFileSummary = useMemo(() => {
    if (!selectedFile) return null;
    const sizeInMb = selectedFile.size / (1024 * 1024);
    return `${sizeInMb >= 100 ? sizeInMb.toFixed(0) : sizeInMb.toFixed(1)} MB`;
  }, [selectedFile]);

  const visibleRequest = activeRequest ?? requestsQuery.data?.[0] ?? null;
  const matchedDocuments = visibleRequest?.structuredContent?.matchedDocuments ?? [];

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <section className="rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
          <FileUp className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-[1.5rem] font-semibold tracking-tight text-slate-950 dark:text-white">
          Sign in to submit a syllabus request.
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
          Upload your syllabus and we will match recent notes while your request becomes visible in the admin panel for
          review.
        </p>
        <Link
          href="/auth"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
        >
          Continue to login
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900 sm:p-7 lg:p-8">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
            <Send className="h-4 w-4" />
            Syllabus to Notes
          </div>
          <h1 className="text-[1.2rem] font-semibold tracking-tight text-slate-950 sm:text-[1.35rem] lg:text-[1.45rem] dark:text-white">
            Upload a syllabus and request prepared notes from our latest resources.
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            Upload your syllabus PDF or image once. We will show matching recent notes below and also send your request
            to the admin panel for review by the team, verified teachers, or students.
          </p>
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900 sm:p-7 lg:p-8">
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            setActionError(null);
            submitMutation.mutate();
          }}
        >
          <div className="text-center">
            <label className="text-base font-semibold text-slate-900 dark:text-white">Syllabus upload</label>
            <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
              Upload the syllabus once and we will help you find recent matching notes. The uploaded file is removed
              automatically after 24 hours.
            </p>
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50/55 px-5 py-8 text-center transition hover:border-amber-300 hover:bg-amber-50/60 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-amber-400/30 dark:hover:bg-amber-500/5">
              <FileUp className="h-7 w-7 text-amber-500" />
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                {selectedFile ? selectedFile.name : "Choose syllabus PDF or image"}
              </p>
              <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
                PDF, JPG, PNG, or WEBP. You can also add unit names or topics below.
              </p>
              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              />
            </label>
            {selectedFileSummary ? (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Selected file size: {selectedFileSummary}</p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Subject" value={subject} onChange={setSubject} placeholder="Investment Management" />
            <Field label="Course" value={course} onChange={setCourse} placeholder="B.Com" />
            <Field label="Semester" value={semester} onChange={setSemester} placeholder="4th SEM" />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-900 dark:text-white">Units, topics, or hints</label>
            <textarea
              value={topics}
              onChange={(event) => setTopics(event.target.value)}
              placeholder={"Unit 1 - Basics\nUnit 2 - Core concepts\nUnit 3 - Applications"}
              rows={5}
              className="mt-2 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition focus:border-amber-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          {actionError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              {actionError}
            </div>
          ) : null}

          {submitMutation.isPending ? (
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 dark:border-amber-500/20 dark:bg-amber-500/10">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-200">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading syllabus request...
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">
                  {uploadProgress}%
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80 dark:bg-slate-900/80">
                <div className="h-full rounded-full bg-amber-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
            >
              {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitMutation.isPending ? `Uploading... ${uploadProgress}%` : "Upload syllabus request"}
            </button>
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
              Recent matching notes will appear below after upload.
            </div>
          </div>
        </form>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">Request preview</p>
              <h2 className="mt-3 text-[1.05rem] font-semibold tracking-tight text-slate-950 sm:text-[1.2rem] dark:text-white">
                {visibleRequest ? visibleRequest.title : "Your latest syllabus request will appear here"}
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {visibleRequest
                  ? `Available until ${new Date(visibleRequest.expiresAt).toLocaleString()}`
                  : "Upload a syllabus to create a request and surface recent related notes."}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:border-slate-700 dark:text-slate-300">
              <Clock3 className="h-4 w-4 text-amber-500" />
              24h expiry
            </div>
          </div>

          {visibleRequest ? (
            <>
              <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-5 dark:border-amber-500/20 dark:bg-amber-500/10">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Request status</p>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {visibleRequest.structuredContent.requestMessage ||
                    "Your syllabus is now visible in the admin panel for review."}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={visibleRequest.sourceFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
                >
                  <FileText className="h-4 w-4" />
                  View uploaded syllabus
                </a>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(Number(visibleRequest._id))}
                  disabled={deleteMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                >
                  {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Delete request
                </button>
              </div>
            </>
          ) : (
            <div className="mt-8 rounded-[26px] border border-dashed border-slate-300 px-6 py-8 text-center dark:border-slate-700">
              <FileText className="mx-auto h-10 w-10 text-amber-500" />
              <p className="mt-4 text-base font-semibold text-slate-900 dark:text-white">No syllabus requests yet</p>
              <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                Upload a syllabus to request prepared notes and see related recent materials.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">Recent matching notes</p>
          <h2 className="mt-3 text-[1.05rem] font-semibold tracking-tight text-slate-950 sm:text-[1.2rem] dark:text-white">
            Latest resources related to your syllabus
          </h2>

          <div className="mt-6 space-y-4">
            {matchedDocuments.length ? (
              matchedDocuments.map((document) => <MatchedDocumentCard key={String(document._id)} document={document} />)
            ) : (
              <div className="rounded-[26px] border border-dashed border-slate-300 px-5 py-6 text-sm leading-7 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Upload a syllabus and we will show the latest matching notes, model QPs, or related resources here.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-900 dark:text-white">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      />
    </div>
  );
}

function MatchedDocumentCard({ document }: { document: Document }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{document.title}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {[document.subject, document.stream].filter(Boolean).join(" • ")}
          </p>
        </div>
        <span className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-700 dark:text-slate-300">
          {document.type === "model_qp" ? "Model QP" : "Notes"}
        </span>
      </div>
      <div className="mt-4">
        <a
          href={`/viewer?documentId=${document._id}&url=${encodeURIComponent(document.fileUrl)}&title=${encodeURIComponent(document.title)}&type=${document.type}`}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-amber-300"
        >
          Open resource
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
