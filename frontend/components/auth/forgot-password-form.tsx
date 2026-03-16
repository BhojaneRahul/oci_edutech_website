"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  return (
    <form
      className="glass-panel mx-auto max-w-md rounded-[32px] p-8 shadow-soft"
      onSubmit={async (event) => {
        event.preventDefault();
        const response = await api.post("/auth/forgot-password", { email });
        setMessage(response.data.resetUrl ? `${response.data.message} ${response.data.resetUrl}` : response.data.message);
      }}
    >
      <h1 className="text-2xl font-semibold">Forgot Password</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Enter your email to generate a reset link.</p>
      <input
        required
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email address"
        className="mt-5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none dark:border-slate-800 dark:bg-slate-950"
      />
      <button type="submit" className="mt-5 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white dark:bg-amber-500">
        Send Reset Link
      </button>
      {message ? <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-300">{message}</p> : null}
    </form>
  );
}
