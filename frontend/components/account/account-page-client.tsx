"use client";

import Link from "next/link";
import { Camera, Shield, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SavedDocument } from "@/lib/types";
import { useAuth } from "../providers/auth-provider";

export function AccountPageClient() {
  const { user, loading, setAuthUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    university: user?.university ?? "",
    phone: user?.phone ?? "",
    course: user?.course ?? "",
    semester: user?.semester ?? ""
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { data: savedDocuments = [] } = useQuery({
    queryKey: ["saved-documents-account"],
    queryFn: async () => {
      const response = await api.get<SavedDocument[]>("/auth/saved-documents");
      return response.data;
    },
    enabled: Boolean(user)
  });

  useEffect(() => {
    if (!user) return;

    setProfileForm({
      name: user.name ?? "",
      email: user.email ?? "",
      university: user.university ?? "",
      phone: user.phone ?? "",
      course: user.course ?? "",
      semester: user.semester ?? ""
    });
  }, [user]);

  if (loading) {
    return (
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        Loading account...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-8 text-sm text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10">
        Please login to view your account.
      </div>
    );
  }

  const updateProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await api.put("/auth/profile", profileForm);
      setAuthUser(response.data.user);
      setMessage(response.data.message);
    } catch {
      setError("Profile update failed.");
    }
  };

  const updatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      const response = await api.put("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setMessage(response.data.message);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      setError("Password update failed.");
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await api.post("/auth/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      setAuthUser(response.data.user);
      setMessage(response.data.message);
    } catch {
      setError("Avatar upload failed.");
    }
  };

  return (
    <div className="space-y-6">
      <section id="saved-library" className="rounded-[32px] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {user.profilePhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profilePhoto} alt={user.name} className="h-20 w-20 rounded-3xl object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-100 text-amber-600 dark:bg-amber-500/15">
                <UserRound className="h-8 w-8" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">Account</p>
              <h1 className="mt-2 text-3xl font-semibold">{user.name}</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
              <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-800">
                <Camera className="h-4 w-4" />
                Upload Avatar
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={uploadAvatar} />
              </label>
            </div>
          </div>

          {user.role === "admin" ? (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white dark:bg-amber-500"
            >
              <Shield className="h-4 w-4" />
              Open Admin Dashboard
            </Link>
          ) : null}
        </div>
      </section>

      {message ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">{message}</div> : null}
      {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">{error}</div> : null}

      <section className="grid gap-4 md:grid-cols-2">
        <ProfileCard label="Role" value={user.role === "admin" ? "Administrator" : "Student"} />
        <ProfileCard label="University" value={user.university || "Not added yet"} />
        <ProfileCard label="Phone" value={user.phone || "Not added yet"} />
        <ProfileCard label="Course" value={user.course || "Not added yet"} />
        <ProfileCard label="Semester" value={user.semester || "Not added yet"} />
        <ProfileCard label="Member Since" value={new Date(user.createdAt).toLocaleDateString()} />
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">Library</p>
            <h2 className="mt-2 text-2xl font-semibold">Saved notes and model QPs</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            PDFs you bookmarked from the viewer appear here automatically.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {savedDocuments.length ? (
            savedDocuments.map((entry) => (
              <div
                key={entry.id}
                className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
                  {entry.document.type === "model_qp" ? "Model QP" : "Notes"}
                </p>
                <h3 className="mt-3 text-lg font-semibold">{entry.document.title}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {entry.document.subject} • {entry.document.stream}
                </p>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    Saved {new Date(entry.savedAt).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/viewer?documentId=${entry.document._id}&url=${encodeURIComponent(entry.document.fileUrl)}&title=${encodeURIComponent(entry.document.title)}&type=${entry.document.type}`}
                    className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-amber-500"
                  >
                    Open PDF
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-200 p-6 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
              No saved PDFs yet. Open a note or model question paper and use the bookmark button to save it.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={updateProfile} className="rounded-[32px] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-2xl font-semibold">Edit Profile</h2>
          <div className="mt-5 space-y-4">
            <ProfileInput label="Professional Name" value={profileForm.name} onChange={(value) => setProfileForm((current) => ({ ...current, name: value }))} required />
            <ProfileInput label="Email" type="email" value={profileForm.email} onChange={(value) => setProfileForm((current) => ({ ...current, email: value }))} required />
            <ProfileInput label="University / PUC Board" value={profileForm.university} onChange={(value) => setProfileForm((current) => ({ ...current, university: value }))} required />
            <ProfileInput label="Phone" value={profileForm.phone} onChange={(value) => setProfileForm((current) => ({ ...current, phone: value }))} />
            <ProfileInput label="Course" value={profileForm.course} onChange={(value) => setProfileForm((current) => ({ ...current, course: value }))} />
            <ProfileInput label="Semester" value={profileForm.semester} onChange={(value) => setProfileForm((current) => ({ ...current, semester: value }))} />
          </div>
          <button type="submit" className="mt-6 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white dark:bg-amber-500">
            Save Profile
          </button>
        </form>

        <form onSubmit={updatePassword} className="rounded-[32px] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-2xl font-semibold">Change Password</h2>
          <div className="mt-5 space-y-4">
            <ProfileInput
              label="Current Password"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(value) => setPasswordForm((current) => ({ ...current, currentPassword: value }))}
              required
            />
            <ProfileInput
              label="New Password"
              type="password"
              value={passwordForm.newPassword}
              onChange={(value) => setPasswordForm((current) => ({ ...current, newPassword: value }))}
              required
            />
            <ProfileInput
              label="Confirm New Password"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(value) => setPasswordForm((current) => ({ ...current, confirmPassword: value }))}
              required
            />
          </div>
          <button type="submit" className="mt-6 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white dark:bg-amber-500">
            Update Password
          </button>
        </form>
      </section>
    </div>
  );
}

function ProfileCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function ProfileInput({
  label,
  value,
  onChange,
  required,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-amber-400 dark:border-slate-800"
      />
    </label>
  );
}
