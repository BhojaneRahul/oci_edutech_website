"use client";

import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Building2, KeyRound, Mail, Phone, Shield, User2 } from "lucide-react";
import { useAuth } from "../providers/auth-provider";
import { FormSelect } from "../ui/form-select";

const UNIVERSITY_OPTIONS = Array.from(
  new Set([
    "Bangalore University",
    "University of Mysore",
    "Karnataka University Dharwad",
    "Mangalore University",
    "Kuvempu University",
    "Gulbarga University",
    "Tumkur University",
    "Davangere University",
    "Rani Channamma University, Belagavi",
    "Vijayanagara Sri Krishnadevaraya University, Ballari",
    "Karnataka State Akkamahadevi Women's University, Vijayapura",
    "Visvesvaraya Technological University, Belagavi",
    "Rajiv Gandhi University of Health Sciences, Karnataka",
    "Karnataka State Law University, Hubballi",
    "University of Agricultural Sciences, Bangalore",
    "University of Agricultural Sciences, Dharwad",
    "University of Agricultural and Horticultural Sciences, Shivamogga",
    "Karnataka Veterinary, Animal and Fisheries Sciences University, Bidar",
    "Karnataka State Rural Development and Panchayat Raj University, Gadag",
    "Bagalkot University",
    "Bengaluru City University",
    "Bengaluru North University",
    "Bidar University",
    "Chamarajanagar University",
    "Dr. B. R. Ambedkar School of Economics University",
    "Hassan University",
    "Haveri University",
    "Kannada University, Hampi",
    "Karnatak University, Dharwad",
    "Karnataka Folklore University",
    "Karnataka Samskrit University",
    "Karnataka State Law University",
    "Karnataka State Open University",
    "Karnataka State Akkamahadevi Women's University",
    "Vijayanagara Sri Krishnadevaraya University",
    "Karnataka School Examination and Assessment Board (KSEAB)",
    "Central Board of Secondary Education (CBSE)",
    "Council for the Indian School Certificate Examinations (CISCE)",
    "National Institute of Open Schooling (NIOS)",
    "International Baccalaureate (IB)",
    "Cambridge Assessment International Education (CAIE)"
  ])
)
  .sort((left, right) => left.localeCompare(right))
  .map((label) => ({ label, value: label }));

const OTHER_UNIVERSITY_VALUE = "__other__";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.77-.07-1.5-.2-2.21H12v4.19h5.4a4.62 4.62 0 0 1-2 3.03v2.52h3.24c1.9-1.75 2.96-4.32 2.96-7.53Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.61-2.44l-3.24-2.52c-.9.6-2.05.96-3.37.96-2.59 0-4.78-1.75-5.56-4.1H3.09v2.58A9.99 9.99 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.44 13.9A5.99 5.99 0 0 1 6.13 12c0-.66.11-1.3.31-1.9V7.52H3.09A9.99 9.99 0 0 0 2 12c0 1.61.39 3.13 1.09 4.48l3.35-2.58Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.96c1.47 0 2.78.5 3.82 1.48l2.87-2.87C16.95 2.96 14.7 2 12 2A9.99 9.99 0 0 0 3.09 7.52L6.44 10.1c.78-2.35 2.97-4.14 5.56-4.14Z"
      />
    </svg>
  );
}

function InputWithIcon({
  icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
        {icon}
      </div>
      <input
        {...props}
        className={`w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 outline-none transition focus:border-amber-400 dark:border-slate-800 dark:bg-slate-950 ${props.className ?? ""}`}
      />
    </div>
  );
}

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student" as "student" | "teacher",
    university: "",
    customUniversity: "",
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

        const finalUniversity =
          form.university === OTHER_UNIVERSITY_VALUE ? form.customUniversity.trim() : form.university.trim();

        if (!finalUniversity) {
          throw new Error("Please select your university / PUC board");
        }

        loggedInUser = await signup({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          university: finalUniversity,
          phone: form.phone,
          course: form.course,
          semester: form.semester
        });
      }

      router.push(loggedInUser?.role === "admin" ? "/admin" : "/account");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || "Authentication failed. Please check your credentials.");
      } else {
        setError(error instanceof Error ? error.message : "Authentication failed. Please check your credentials.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`glass-panel mx-auto w-full rounded-[32px] border border-slate-200/80 bg-white/95 p-6 shadow-soft backdrop-blur xl:p-8 dark:border-slate-800 dark:bg-slate-900/95 ${mode === "signup" ? "max-w-[880px]" : "max-w-[430px]"}`}>
      <div className="mb-6 space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">Welcome back</p>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Continue with OCI - EduTech</h2>
        <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
          Sign in with email or Google to access your notes, saved PDFs, dashboard, and community.
        </p>
      </div>

      <div className="mb-6 flex rounded-full bg-slate-100 p-1 dark:bg-slate-900">
        {(["login", "signup"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMode(tab)}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold capitalize transition ${
              mode === tab ? "bg-amber-500 text-white shadow-sm" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <form className="space-y-4" onSubmit={submit}>
        <div className={mode === "signup" ? "grid gap-4 md:grid-cols-2" : "space-y-4"}>
          {mode === "signup" && (
            <>
              <InputWithIcon
                icon={<User2 className="h-4 w-4" />}
                required
                placeholder="Full name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
              <div className="space-y-2">
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4 text-slate-400">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <FormSelect
                    required
                    value={form.university}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        university: value,
                        customUniversity: value === OTHER_UNIVERSITY_VALUE ? current.customUniversity : ""
                      }))
                    }
                    options={[
                      ...UNIVERSITY_OPTIONS,
                      {
                        label: "Others (write your own university or college)",
                        value: OTHER_UNIVERSITY_VALUE
                      }
                    ]}
                    placeholder="University / PUC Board"
                    className="[&_button]:pl-11"
                  />
                </div>
                {form.university === OTHER_UNIVERSITY_VALUE ? (
                  <InputWithIcon
                    icon={<Building2 className="h-4 w-4" />}
                    required
                    placeholder="Write your university or college name"
                    value={form.customUniversity}
                    onChange={(event) => setForm((current) => ({ ...current, customUniversity: event.target.value }))}
                  />
                ) : null}
              </div>
              <div className="md:col-span-2">
                <FormSelect
                  value={form.role}
                  onChange={(value) => setForm((current) => ({ ...current, role: value as "student" | "teacher" }))}
                  options={[
                    { label: "Student", value: "student" },
                    { label: "Teacher", value: "teacher" }
                  ]}
                />
              </div>
            </>
          )}

          <InputWithIcon
            icon={<Mail className="h-4 w-4" />}
            required
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
          <InputWithIcon
            icon={<KeyRound className="h-4 w-4" />}
            required
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />

          {mode === "signup" ? (
            <>
              <InputWithIcon
                icon={<Shield className="h-4 w-4" />}
                required
                type="password"
                placeholder="Confirm password"
                value={form.confirmPassword}
                onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
              />
              <InputWithIcon
                icon={<Phone className="h-4 w-4" />}
                placeholder="Phone (optional)"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
              <input
                placeholder="Course (optional)"
                value={form.course}
                onChange={(event) => setForm((current) => ({ ...current, course: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none transition focus:border-amber-400 dark:border-slate-800 dark:bg-slate-950"
              />
              <input
                placeholder="Semester (optional)"
                value={form.semester}
                onChange={(event) => setForm((current) => ({ ...current, semester: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none transition focus:border-amber-400 dark:border-slate-800 dark:bg-slate-950"
              />

            </>
          ) : null}
        </div>

        {error ? <p className="text-sm text-rose-500">{error}</p> : null}

        {mode === "signup" && form.role === "teacher" ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
            Teacher accounts are created first as normal accounts. Inside Community, upload your college ID card and
            submit teacher verification when you are ready to join teacher chat. After admin approval, the verified
            teacher badge and Teacher Notes upload access will unlock automatically.
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
        >
          {submitting ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
        </button>

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:bg-slate-900">
              Or continue with
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={loginWithGoogle}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-slate-700 dark:hover:bg-slate-900"
        >
          <GoogleIcon />
          {mode === "signup" ? "Signup with Google" : "Login with Google"}
        </button>

        {mode === "login" ? (
          <div className="text-center">
            <a href="/auth/forgot-password" className="text-sm font-medium text-amber-600 transition hover:text-amber-500">
              Forgot password?
            </a>
          </div>
        ) : null}
      </form>
    </div>
  );
}
