"use client";

import { Document } from "@/lib/types";

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
  return (
    <section id="upload-document" className="rounded-[28px] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-lg font-semibold">{submitLabel === "Upload Document" ? "Upload Study Materials" : "Edit Document"}</h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Upload PDF-only notes and model question papers for degree and PUC students.
      </p>
      <form
        className="mt-5 grid gap-4 md:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          await onSubmit(formData);
          event.currentTarget.reset();
        }}
      >
        <InputField name="title" label="Title" defaultValue={initialValues?.title} />
        <InputField name="subject" label="Subject" defaultValue={initialValues?.subject} />
        <SelectField name="stream" label="Degree / PUC" options={streamOptions} defaultValue={initialValues?.stream} />
        <SelectField name="type" label="Type" options={typeOptions.map((option) => option.value)} defaultValue={initialValues?.type} />
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">PDF Upload</label>
          <input
            name="file"
            type="file"
            accept="application/pdf"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800"
          />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {initialValues ? "Leave empty to keep the current PDF file." : "Only PDF files up to 10 MB are allowed."}
          </p>
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white dark:bg-amber-500"
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
      <select
        required
        name={name}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-amber-400 dark:border-slate-800"
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "model_qp" ? "Model QPs" : option === "notes" ? "Notes" : option}
          </option>
        ))}
      </select>
    </div>
  );
}
