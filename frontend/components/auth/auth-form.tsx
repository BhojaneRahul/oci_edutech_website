"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../providers/auth-provider";

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    university: "",
    phone: "",
    semester: "",
    course: ""
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { login, signup, loginWithGoogle } = useAuth();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      let loggedInUser;

      if (mode === "login") {
        loggedInUser = await login(form.email, form.password);
      } else {
        if (form.password !== form.confirmPassword) {
          throw new Error("Passwords do not match");
        }

        loggedInUser = await signup({
          name: form.name,
          email: form.email,
          password: form.password,
          university: form.university,
          phone: form.phone,
          course: form.course,
          semester: form.semester
        });
      }

      router.push(loggedInUser?.role === "admin" ? "/admin" : "/");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Authentication failed. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-panel mx-auto max-w-md rounded-[32px] p-8 shadow-soft">
      <div className="mb-6 flex rounded-full bg-slate-100 p-1 dark:bg-slate-900">
        {(["login", "signup"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMode(tab)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
              mode === tab ? "bg-amber-500 text-white" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <form className="space-y-4" onSubmit={submit}>
        {mode === "signup" && (
          <>
            <input
              required
              placeholder="Professional full name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-amber-400 dark:border-slate-800 dark:bg-slate-950"
            />
            <input
              required
              placeholder="University / PUC Board"
              value={form.university}
              onChange={(event) => setForm((current) => ({ ...current, university: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-amber-400 dark:border-slate-800 dark:bg-slate-950"
            />
          </>
        )}
        <input
          required
          type="email"
          placeholder="Email address"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-amber-400 dark:border-slate-800 dark:bg-slate-950"
        />
        <input
          required
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-amber-400 dark:border-slate-800 dark:bg-slate-950"
        />
        {mode === "signup" ? (
          <>
            <input
              required
              type="password"
              placeholder="Confirm password"
              value={form.confirmPassword}
              onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-amber-400 dark:border-slate-800 dark:bg-slate-950"
            />
            <input
              placeholder="Phone (optional)"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-amber-400 dark:border-slate-800 dark:bg-slate-950"
            />
            <input
              placeholder="Course (optional)"
              value={form.course}
              onChange={(event) => setForm((current) => ({ ...current, course: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-amber-400 dark:border-slate-800 dark:bg-slate-950"
            />
            <input
              placeholder="Semester (optional)"
              value={form.semester}
              onChange={(event) => setForm((current) => ({ ...current, semester: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-amber-400 dark:border-slate-800 dark:bg-slate-950"
            />
          </>
        ) : null}
        {error ? <p className="text-sm text-rose-500">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white dark:bg-amber-500"
        >
          {submitting ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
        </button>
        <button
          type="button"
          onClick={loginWithGoogle}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-100"
        >
          {mode === "signup" ? "Signup with Google" : "Login with Google"}
        </button>
        {mode === "login" ? (
          <div className="text-center">
            <a href="/auth/forgot-password" className="text-sm font-medium text-amber-600">
              Forgot password?
            </a>
          </div>
        ) : null}
      </form>
    </div>
  );
}
