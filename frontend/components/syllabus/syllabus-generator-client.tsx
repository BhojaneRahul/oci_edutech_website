"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowUpRight, ExternalLink, FileUp, Loader2, Send } from "lucide-react";
import { api } from "@/lib/api";
import type { SyllabusGeneration } from "@/lib/types";
import { useAuth } from "../providers/auth-provider";

export function SyllabusGeneratorClient() {
  const { user, loading } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [topics, setTopics] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

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
      setSuccessMessage(request.structuredContent.requestMessage || "Your syllabus request was sent successfully.");
      setUploadProgress(100);
      setTopics("");
    },
    onError: (error: any) => {
      setUploadProgress(0);
      setSuccessMessage(null);
      setActionError(
        String(error?.response?.data?.message || error?.message || "We could not submit this syllabus right now.")
      );
    }
  });

  const selectedFileSummary = useMemo(() => {
    if (!selectedFile) return null;
    const sizeInMb = selectedFile.size / (1024 * 1024);
    return `${sizeInMb >= 100 ? sizeInMb.toFixed(0) : sizeInMb.toFixed(1)} MB`;
  }, [selectedFile]);

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
    <div>
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900 sm:p-7 lg:p-8">
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            setActionError(null);
            setSuccessMessage(null);
            submitMutation.mutate();
          }}
        >
          <div className="text-center">
            <label className="text-lg font-semibold text-slate-900 dark:text-white">Syllabus upload</label>
            <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
              Upload your syllabus and send it to our admin team for review. Verified teachers and students can then
              prepare the latest notes based on your request.
            </p>
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50/55 px-5 py-8 text-center transition hover:border-amber-300 hover:bg-amber-50/60 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-amber-400/30 dark:hover:bg-amber-500/5">
              <FileUp className="h-7 w-7 text-amber-500" />
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                {selectedFile ? selectedFile.name : "Choose syllabus PDF or image"}
              </p>
              <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
                PDF, JPG, PNG, or WEBP. Add your message below if you want specific topics or notes.
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
            <label className="text-sm font-semibold text-slate-900 dark:text-white">Type your message</label>
            <textarea
              value={topics}
              onChange={(event) => setTopics(event.target.value)}
              placeholder={"Type your message, units, topics, chapters, or what kind of notes you need."}
              rows={5}
              className="mt-2 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition focus:border-amber-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          {successMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              {successMessage}
            </div>
          ) : null}

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
            {previewUrl ? (
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:text-amber-300"
              >
                <ExternalLink className="h-4 w-4" />
                Preview syllabus
              </a>
            ) : null}
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
            >
              {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitMutation.isPending ? `Uploading... ${uploadProgress}%` : "Send syllabus request"}
            </button>
          </div>
        </form>
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
