"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  return (
    <form
      className="glass-panel mx-auto max-w-md rounded-[32px] p-8 shadow-soft"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }

        const response = await api.post("/auth/reset-password", { token, password });
        setMessage(response.data.message);
      }}
    >
      <h1 className="text-2xl font-semibold">Reset Password</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Choose your new password.</p>
      <input
        required
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="New password"
        className="mt-5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none dark:border-slate-800 dark:bg-slate-950"
      />
      <input
        required
        type="password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        placeholder="Confirm new password"
        className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none dark:border-slate-800 dark:bg-slate-950"
      />
      <button type="submit" className="mt-5 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white dark:bg-amber-500">
        Reset Password
      </button>
      {error ? <p className="mt-4 text-sm text-rose-500">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-300">{message}</p> : null}
    </form>
  );
}
