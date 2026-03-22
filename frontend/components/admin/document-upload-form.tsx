"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Document } from "@/lib/types";
import { FormSelect } from "../ui/form-select";
import { FileText, UploadCloud, X } from "lucide-react";

const streamOptions = ["BCA", "B.Com", "BSc", "BA", "BBA", "1st PUC", "2nd PUC"];
const typeOptions = [
  { label: "Notes", value: "notes" },
  { label: "Model QPs", value: "model_qp" }
];

export function DocumentUploadForm({
  onSubmit,
  submitting,
  initialValues,
  submitLabel = "Upload Document"
}: {
  onSubmit: (formData: FormData) => Promise<void>;
  submitting: boolean;
  initialValues?: Partial<Document>;
  submitLabel?: string;
}) {
  const isEditing = Boolean(initialValues?._id);
  const [selectedStreams, setSelectedStreams] = useState<string[]>(initialValues?.stream ? [initialValues.stream] : []);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    setSelectedStreams(initialValues?.stream ? [initialValues.stream] : []);
    setSelectedFile(null);
  }, [initialValues?._id, initialValues?.stream]);

  const selectedFileSummary = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

    const sizeInMb = selectedFile.size / (1024 * 1024);
    return `${sizeInMb >= 100 ? sizeInMb.toFixed(0) : sizeInMb.toFixed(1)} MB`;
  }, [selectedFile]);

  return (
    <section id="documents" className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Document manager</p>
      <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{submitLabel === "Upload Document" ? "Upload Study Materials" : "Edit Document"}</h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Upload PDF-only notes and model question papers for degree and PUC students.
      </p>
      <form
        className="mt-5 grid gap-4 md:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!isEditing && !selectedStreams.length) {
            return;
          }
          const form = event.currentTarget;
          const formData = new FormData(form);
          await onSubmit(formData);
          form.reset();
          setSelectedStreams(initialValues?.stream ? [initialValues.stream] : []);
          setSelectedFile(null);
        }}
      >
        <InputField name="title" label="Title" defaultValue={initialValues?.title} />
        <InputField name="subject" label="Subject" defaultValue={initialValues?.subject} />
        {isEditing ? (
          <SelectField name="stream" label="Degree / PUC" options={streamOptions} defaultValue={initialValues?.stream} />
        ) : (
          <div>
            <label className="mb-2 block text-sm font-medium">Degree / PUC</label>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
              <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                Select one or more streams. The same PDF will be added to every selected stream.
              </p>
              <div className="flex flex-wrap gap-2">
                {streamOptions.map((option) => {
                  const active = selectedStreams.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() =>
                        setSelectedStreams((current) =>
                          current.includes(option) ? current.filter((stream) => stream !== option) : [...current, option]
                        )
                      }
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        active
                          ? "border-amber-500 bg-amber-500 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:text-amber-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {!selectedStreams.length ? (
                <p className="mt-3 text-xs text-rose-500">Select at least one stream to upload this PDF.</p>
              ) : null}
              {selectedStreams.map((stream) => (
                <input key={stream} type="hidden" name="streams" value={stream} />
              ))}
            </div>
          </div>
        )}
        <SelectField name="type" label="Type" options={typeOptions.map((option) => option.value)} defaultValue={initialValues?.type} />
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">PDF Upload</label>
          <label className="block cursor-pointer rounded-[28px] border border-dashed border-slate-200 bg-gradient-to-br from-amber-50/70 via-white to-slate-50 p-5 transition hover:border-amber-300 hover:shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
            <input
              name="file"
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={(event: ChangeEvent<HTMLInputElement>) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-sm dark:bg-amber-500/15 dark:text-amber-300">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-slate-900 dark:text-white">Choose your PDF file</p>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      Up to 500 MB
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {initialValues
                      ? "Upload a replacement PDF or leave this empty to keep the current file."
                      : "Upload one PDF and publish it across one or more selected streams."}
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center justify-center rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700 shadow-sm dark:border-amber-500/20 dark:bg-slate-900 dark:text-amber-300">
                Browse PDF
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-950/90">
              {selectedFile ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{selectedFileSummary}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      setSelectedFile(null);
                      const form = event.currentTarget.closest("form");
                      const input = form?.querySelector<HTMLInputElement>('input[name="file"]');
                      if (input) {
                        input.value = "";
                      }
                    }}
                    className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-rose-200 hover:text-rose-500 dark:border-slate-700 dark:text-slate-300"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400">
                  <p className="font-medium text-slate-700 dark:text-slate-200">No PDF selected yet</p>
                  <p>Choose a file to upload. Large study materials up to 500 MB are supported.</p>
                </div>
              )}
            </div>
          </label>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            PDF only. Files up to 500 MB are allowed.
          </p>
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm dark:bg-amber-500"
          >
            {submitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}

function InputField({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <input
        required
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-amber-400 dark:border-slate-800"
      />
    </div>
  );
}

function SelectField({ name, label, options, defaultValue }: { name: string; label: string; options: string[]; defaultValue?: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <FormSelect
        required
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={`Select ${label}`}
        options={options.map((option) => ({
          value: option,
          label: option === "model_qp" ? "Model QPs" : option === "notes" ? "Notes" : option
        }))}
      />
    </div>
  );
}

