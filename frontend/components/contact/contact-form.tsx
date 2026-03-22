"use client";

import { useState } from "react";
import { MessageSquareQuote, SendHorizontal } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "../providers/auth-provider";
import { FormSelect } from "../ui/form-select";

const categoryOptions = [
  "General Inquiry",
  "Technical Support",
  "Feature Request",
  "Bug Fix / Report",
  "Feedback",
  "Other"
];

export function ContactForm() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.name ?? "",
    email: user?.email ?? "",
    category: "General Inquiry",
    message: ""
  });
  const [message, setMessage] = useState("");

  return (
    <form
      className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8"
      onSubmit={async (event) => {
        event.preventDefault();
        const response = await api.post("/contact", {
          ...form,
          userId: user?.id
        });
        setMessage(response.data.message);
        setForm((current) => ({ ...current, category: "General Inquiry", message: "" }));
      }}
    >
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Support form</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Tell us how we can help</h2>
          <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
            Share your message clearly and our team will review it as soon as possible.
          </p>
        </div>
        <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          <MessageSquareQuote className="h-4 w-4 text-amber-500" />
          Professional support for notes, features, and technical help
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Input
          label="Full Name"
          value={form.fullName}
          onChange={(value) => setForm((current) => ({ ...current, fullName: value }))}
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(value) => setForm((current) => ({ ...current, email: value }))}
        />
        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium">General Enquiry</span>
          <FormSelect
            value={form.category}
            onChange={(value) => setForm((current) => ({ ...current, category: value }))}
            options={categoryOptions.map((option) => ({ label: option, value: option }))}
          />
        </label>
        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium">Message</span>
          <textarea
            required
            rows={7}
            value={form.message}
            onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
            placeholder="Write your message here..."
            className="w-full rounded-[24px] border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-amber-400 dark:border-slate-800"
          />
        </label>
      </div>
      <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm dark:bg-amber-500">
          <SendHorizontal className="h-4 w-4" />
          Submit message
        </button>
        <p className="max-w-xl text-xs leading-6 text-slate-500 dark:text-slate-400">
          For urgent queries, you can also reach us at <span className="font-semibold text-amber-600">support@ourcreativeinfo.in</span>.
        </p>
      </div>
      {message ? <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-300">{message}</p> : null}
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <input
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-amber-400 dark:border-slate-800"
      />
    </label>
  );
}
