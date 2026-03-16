"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "../providers/auth-provider";

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
      className="rounded-[32px] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900"
      onSubmit={async (event) => {
        event.preventDefault();
        const response = await api.post("/contact", {
          ...form,
          userId: user?.id
        });
        setMessage(response.data.message);
        setForm((current) => ({ ...current, message: "" }));
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
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
          <select
            value={form.category}
            onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none dark:border-slate-800"
          >
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium">Message</span>
          <textarea
            required
            rows={6}
            value={form.message}
            onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none dark:border-slate-800"
          />
        </label>
      </div>
      <button type="submit" className="mt-6 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white dark:bg-amber-500">
        Submit
      </button>
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
        className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none dark:border-slate-800"
      />
    </label>
  );
}
