"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FolderKanban, ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import { api } from "@/lib/api";
import { Project } from "@/lib/types";

type AdminProjectFormState = {
  title: string;
  description: string;
  category: string;
  level: string;
  technologies: string;
  images: File[];
  projectFile: File | null;
  reportFile: File | null;
};

const initialState: AdminProjectFormState = {
  title: "",
  description: "",
  category: "",
  level: "",
  technologies: "",
  images: [],
  projectFile: null,
  reportFile: null
};

export function AdminProjectsManager() {
  const [formState, setFormState] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { data: projects = [], refetch, isFetching } = useQuery({
    queryKey: ["admin-projects-manager"],
    queryFn: async () => {
      const response = await api.get<Project[]>("/admin/projects");
      return response.data;
    }
  });

  const imagePreviewUrls = useMemo(() => formState.images.map((file) => URL.createObjectURL(file)), [formState.images]);

  const submitProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const payload = new FormData();
      payload.append("title", formState.title);
      payload.append("description", formState.description);
      payload.append("category", formState.category);
      payload.append("level", formState.level);
      payload.append("technologies", formState.technologies);
      formState.images.forEach((image) => payload.append("images", image));
      if (formState.projectFile) payload.append("projectFile", formState.projectFile);
      if (formState.reportFile) payload.append("reportFile", formState.reportFile);

      const response = await api.post("/admin/project", payload, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setMessage(response.data?.message || "Project uploaded successfully");
      setFormState(initialState);
      refetch();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Project upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  const removeProject = async (projectId: string | number) => {
    setMessage("");
    setError("");
    await api.delete(`/admin/projects/${projectId}`);
    setMessage("Project deleted successfully");
    refetch();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_420px]">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Projects</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Uploaded project references</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Review every uploaded project, inspect technologies, and remove outdated project references.
            </p>
          </div>
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
            <FolderKanban className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {isFetching ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
              Loading projects...
            </div>
          ) : projects.length ? (
            projects.map((project) => (
              <article
                key={String(project._id)}
                className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{project.title}</h3>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                        {project.category}
                      </span>
                      <span className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        {project.level}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{project.description}</p>
                    {project.technologies.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {project.technologies.map((technology) => (
                          <span
                            key={technology}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
                          >
                            {technology}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => removeProject(project._id)}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-500/20 dark:text-rose-300 dark:hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No projects uploaded yet.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Admin upload</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Add new project</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Upload a ZIP project, report PDF, and 4–5 preview images in one secure admin form.
        </p>

        {message ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </div>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={submitProject}>
          <FormField label="Project title">
            <input
              value={formState.title}
              onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none dark:border-slate-800"
              placeholder="Student Result Analytics Platform"
            />
          </FormField>

          <FormField label="Description">
            <textarea
              value={formState.description}
              onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
              rows={5}
              className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none dark:border-slate-800"
              placeholder="Write what the project solves, what the user can download, and how the report helps."
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Category">
              <input
                value={formState.category}
                onChange={(event) => setFormState((current) => ({ ...current, category: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none dark:border-slate-800"
                placeholder="BCA / B.Com / MBA"
              />
            </FormField>
            <FormField label="Level">
              <input
                value={formState.level}
                onChange={(event) => setFormState((current) => ({ ...current, level: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none dark:border-slate-800"
                placeholder="Beginner / Intermediate / Advanced"
              />
            </FormField>
          </div>

          <FormField label="Technologies">
            <input
              value={formState.technologies}
              onChange={(event) => setFormState((current) => ({ ...current, technologies: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none dark:border-slate-800"
              placeholder="React, Node.js, MySQL, Express"
            />
          </FormField>

          <FormField label="Project images (up to 5)">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-5 text-sm font-medium text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-amber-500/30 dark:hover:bg-amber-500/10">
              <ImagePlus className="h-4 w-4 text-amber-500" />
              Select images
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    images: Array.from(event.target.files ?? []).slice(0, 5)
                  }))
                }
              />
            </label>
            {imagePreviewUrls.length ? (
              <div className="mt-3 grid grid-cols-3 gap-3">
                {imagePreviewUrls.map((url, index) => (
                  <div key={url} className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                    <Image
                      src={url}
                      alt={`Selected preview ${index + 1}`}
                      width={320}
                      height={160}
                      unoptimized
                      className="h-24 w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Project ZIP">
              <FilePicker
                accept=".zip,application/zip,application/x-zip-compressed"
                onChange={(file) => setFormState((current) => ({ ...current, projectFile: file }))}
                fileName={formState.projectFile?.name}
              />
            </FormField>
            <FormField label="Report PDF">
              <FilePicker
                accept="application/pdf,.pdf"
                onChange={(file) => setFormState((current) => ({ ...current, reportFile: file }))}
                fileName={formState.reportFile?.name}
              />
            </FormField>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {submitting ? "Uploading..." : "Upload Project"}
          </button>
        </form>
      </section>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-900 dark:text-white">{label}</span>
      {children}
    </label>
  );
}

function FilePicker({
  accept,
  onChange,
  fileName
}: {
  accept: string;
  onChange: (file: File | null) => void;
  fileName?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-950">
      <span className="truncate">{fileName || "Choose file"}</span>
      <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white dark:bg-amber-500 dark:text-slate-950">
        Browse
      </span>
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </label>
  );
}
