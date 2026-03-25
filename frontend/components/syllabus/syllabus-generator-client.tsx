"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Clock3,
  Download,
  FileText,
  FileUp,
  Layers3,
  Lightbulb,
  ListChecks,
  Loader2,
  Sparkles,
  Trash2,
  Wand2
} from "lucide-react";
import { api } from "@/lib/api";
import type { SyllabusGeneration, SyllabusOutputType } from "@/lib/types";
import { useAuth } from "../providers/auth-provider";

const outputOptions: { value: SyllabusOutputType; label: string }[] = [
  { value: "smart_notes", label: "Smart Notes PDF" },
  { value: "unit_summary", label: "Unit Summary" },
  { value: "question_bank", label: "Question Bank" },
  { value: "study_plan", label: "Study Plan" }
];

export function SyllabusGeneratorClient() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [topics, setTopics] = useState("");
  const [outputType, setOutputType] = useState<SyllabusOutputType>("smart_notes");
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeGeneration, setActiveGeneration] = useState<SyllabusGeneration | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState<"idle" | "uploading" | "processing">("idle");

  const generationsQuery = useQuery({
    queryKey: ["syllabus-generations"],
    enabled: Boolean(user),
    queryFn: async () => {
      const response = await api.get<{ success: true; generations: SyllabusGeneration[] }>("/syllabus");
      return response.data.generations;
    }
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) {
        throw new Error("Please upload a syllabus PDF first.");
      }

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("subject", subject);
      formData.append("course", course);
      formData.append("semester", semester);
      formData.append("outputType", outputType);
      formData.append("topics", topics);

      setUploadProgress(0);
      setGenerationStage("uploading");

      const response = await api.post<{ success: true; generation: SyllabusGeneration }>("/syllabus/generate", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) {
            return;
          }

          const nextProgress = Math.min(100, Math.max(0, Math.round((progressEvent.loaded / progressEvent.total) * 100)));
          setUploadProgress(nextProgress);

          if (nextProgress >= 100) {
            setGenerationStage("processing");
          }
        }
      });

      return response.data.generation;
    },
    onSuccess: async (generation) => {
      setActionError(null);
      setUploadProgress(100);
      setGenerationStage("idle");
      setActiveGeneration(generation);
      await queryClient.invalidateQueries({ queryKey: ["syllabus-generations"] });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "We could not generate smart notes from this syllabus right now.";
      setUploadProgress(0);
      setGenerationStage("idle");
      setActionError(String(message));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (generationId: number) => {
      await api.delete(`/syllabus/${generationId}`);
      return generationId;
    },
    onSuccess: async (generationId) => {
      setActionError(null);
      if (activeGeneration?._id === generationId) {
        setActiveGeneration(null);
      }
      await queryClient.invalidateQueries({ queryKey: ["syllabus-generations"] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "We could not delete this generated file right now.";
      setActionError(String(message));
    }
  });

  const selectedFileSummary = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

    const sizeInMb = selectedFile.size / (1024 * 1024);
    return `${sizeInMb >= 100 ? sizeInMb.toFixed(0) : sizeInMb.toFixed(1)} MB`;
  }, [selectedFile]);

  const visibleGeneration = activeGeneration ?? generationsQuery.data?.[0] ?? null;
  const isGenerating = generateMutation.isPending;
  const uploadStatusLabel =
    generationStage === "uploading"
      ? `Uploading syllabus... ${uploadProgress}%`
      : generationStage === "processing"
        ? "Generating smart notes PDF..."
        : null;

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
          <Wand2 className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-[1.8rem] font-semibold tracking-tight text-slate-950 dark:text-white">
          Sign in to use the Syllabus to Smart Notes generator.
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
          Upload your syllabus copy, generate a study-ready notes PDF, and keep the result available for the next 24
          hours for viewing or download.
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
            <Wand2 className="h-4 w-4" />
            Syllabus to Smart Notes
          </div>
          <h1 className="text-[1.2rem] font-semibold tracking-tight text-slate-950 sm:text-[1.35rem] lg:text-[1.45rem] dark:text-white">
            Upload a syllabus and generate a cleaner AI study PDF.
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            Start with the form below. Upload a syllabus PDF or image, choose the output type, and generate units,
            revision points, keywords, and likely exam questions in one downloadable file.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <MiniInfo icon={FileUp} label="PDF or image upload" />
            <MiniInfo icon={Sparkles} label="AI notes extraction" />
            <MiniInfo icon={Download} label="View and download PDF" />
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900 sm:p-7 lg:p-8">
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            setActionError(null);
            generateMutation.mutate();
          }}
        >
          <div>
            <label className="text-sm font-semibold text-slate-900 dark:text-white">Syllabus upload</label>
            <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50/55 px-5 py-8 text-center transition hover:border-amber-300 hover:bg-amber-50/60 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-amber-400/30 dark:hover:bg-amber-500/5">
              <FileUp className="h-7 w-7 text-amber-500" />
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                {selectedFile ? selectedFile.name : "Choose syllabus PDF or image"}
              </p>
              <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
                PDF, JPG, PNG, or WEBP. Uploaded syllabus and generated notes are auto-deleted after 24 hours.
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

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Subject" value={subject} onChange={setSubject} placeholder="Programming in C" />
            <Field label="Course" value={course} onChange={setCourse} placeholder="BCA" />
            <Field label="Semester" value={semester} onChange={setSemester} placeholder="3rd Semester" />
            <div>
              <label className="text-sm font-semibold text-slate-900 dark:text-white">Output type</label>
              <select
                value={outputType}
                onChange={(event) => setOutputType(event.target.value as SyllabusOutputType)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                {outputOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-900 dark:text-white">Optional key topics or units</label>
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

          {isGenerating && uploadStatusLabel ? (
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 dark:border-amber-500/20 dark:bg-amber-500/10">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-200">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {uploadStatusLabel}
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">
                  {generationStage === "uploading" ? `${uploadProgress}%` : "Processing"}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80 dark:bg-slate-900/80">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${generationStage === "uploading" ? uploadProgress : 100}%` }}
                />
              </div>
              <p className="mt-2 text-xs leading-6 text-amber-700/80 dark:text-amber-200/80">
                {generationStage === "uploading"
                  ? "Your syllabus file is being uploaded to the generator."
                  : "The upload is done. We are extracting units, key concepts, and exam questions now."}
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="submit"
              disabled={isGenerating}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {generationStage === "uploading"
                ? `Uploading... ${uploadProgress}%`
                : generationStage === "processing"
                  ? "Generating smart notes..."
                  : "Generate smart notes PDF"}
            </button>
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
              Works best with clear syllabus PDFs or readable images.
            </div>
          </div>
        </form>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">Generated preview</p>
              <h2 className="mt-3 text-[1.05rem] font-semibold tracking-tight text-slate-950 sm:text-[1.2rem] dark:text-white">
                {visibleGeneration ? visibleGeneration.title : "Your generated notes will appear here"}
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {visibleGeneration
                  ? `Available until ${new Date(visibleGeneration.expiresAt).toLocaleString()}`
                  : "Upload a syllabus PDF and generate a downloadable study draft."}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:border-slate-700 dark:text-slate-300">
              <Clock3 className="h-4 w-4 text-amber-500" />
              24h expiry
            </div>
          </div>

          {visibleGeneration ? (
            <>
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <PreviewCard
                  icon={Layers3}
                  title="Units and sections"
                  items={visibleGeneration.structuredContent.units.map((unit) => unit.title).slice(0, 6)}
                />
                <PreviewCard
                  icon={Lightbulb}
                  title="Keywords and focus areas"
                  items={visibleGeneration.structuredContent.keywords.slice(0, 6)}
                />
              </div>

              <div className="mt-4 rounded-[26px] border border-slate-200 bg-slate-50 px-5 py-5 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Overview</p>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {visibleGeneration.structuredContent.overview}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={visibleGeneration.generatedPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
                >
                  <FileText className="h-4 w-4" />
                  View PDF
                </a>
                <a
                  href={visibleGeneration.generatedPdfUrl}
                  download
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-amber-500/20 dark:hover:text-amber-300"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(Number(visibleGeneration._id))}
                  disabled={deleteMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                >
                  {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Delete
                </button>
              </div>
            </>
          ) : (
            <div className="mt-8 rounded-[26px] border border-dashed border-slate-300 px-6 py-8 text-center dark:border-slate-700">
              <FileText className="mx-auto h-10 w-10 text-amber-500" />
              <p className="mt-4 text-base font-semibold text-slate-900 dark:text-white">No generated syllabus notes yet</p>
              <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                Start by uploading a syllabus PDF. The generated result will appear here with view and download actions.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">Recent generations</p>
          <h2 className="mt-3 text-[1.05rem] font-semibold tracking-tight text-slate-950 sm:text-[1.2rem] dark:text-white">
            Your latest syllabus-to-notes outputs
          </h2>

          <div className="mt-6 space-y-4">
            {generationsQuery.isLoading ? (
              <div className="flex items-center gap-3 rounded-[26px] border border-slate-200 px-5 py-5 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                Loading your generated files...
              </div>
            ) : generationsQuery.data?.length ? (
              generationsQuery.data.map((generation) => (
                <button
                  key={generation._id}
                  type="button"
                  onClick={() => setActiveGeneration(generation)}
                  className={`w-full rounded-[26px] border px-5 py-5 text-left transition ${
                    visibleGeneration?._id === generation._id
                      ? "border-amber-300 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/10"
                      : "border-slate-200 hover:border-amber-200 hover:bg-amber-50/40 dark:border-slate-800 dark:hover:border-amber-500/20 dark:hover:bg-amber-500/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{generation.title}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {[generation.subject, generation.course, generation.semester].filter(Boolean).join(" • ")}
                      </p>
                    </div>
                    <span className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-700 dark:text-slate-300">
                      {generation.outputType.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                    Expires {new Date(generation.expiresAt).toLocaleString()}
                  </p>
                </button>
              ))
            ) : (
              <div className="rounded-[26px] border border-dashed border-slate-300 px-5 py-6 text-sm leading-7 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Your generated syllabus files will stay here for 24 hours and then be removed automatically from the
                site and database.
              </div>
            )}
          </div>

          <div className="mt-6 rounded-[26px] border border-dashed border-slate-300 px-5 py-5 dark:border-slate-700">
            <div className="flex items-start gap-3">
              <ListChecks className="mt-0.5 h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">What the generator creates</p>
                <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Structured units, key concepts, keywords, revision checklist, and likely question prompts based on the
                  uploaded syllabus.
                </p>
              </div>
            </div>
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

function MiniInfo({
  icon: Icon,
  label
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
      <Icon className="h-4 w-4 text-amber-500" />
      <p>{label}</p>
    </div>
  );
}

function PreviewCard({
  icon: Icon,
  title,
  items
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-slate-50 px-5 py-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-amber-500 shadow-sm dark:bg-slate-900">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
      </div>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
