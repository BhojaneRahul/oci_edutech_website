"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Document, Settings } from "@/lib/types";
import { useAuth } from "../providers/auth-provider";
import { AdminSidebar } from "./admin-sidebar";
import { DocumentUploadForm } from "./document-upload-form";

type AdminOverview = {
  stats: {
    users: number;
    degrees: number;
    subjects: number;
    notes: number;
    mockTests: number;
    projects: number;
    documents: number;
  };
  settings: Settings;
};

export function AdminDashboard() {
  const { user, loading } = useAuth();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "admin" | "student">("all");
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    university: "",
    phone: "",
    course: "",
    semester: "",
    role: "student",
    password: ""
  });
  const { data, refetch } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const response = await api.get<AdminOverview>("/admin/overview");
      return response.data;
    },
    enabled: user?.role === "admin"
  });
  const { data: documents = [], refetch: refetchDocuments } = useQuery({
    queryKey: ["admin-documents"],
    queryFn: async () => {
      const response = await api.get<Document[]>("/admin/documents");
      return response.data;
    },
    enabled: user?.role === "admin"
  });
  const { data: users = [], refetch: refetchUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const response = await api.get<
        {
          id: number;
          name: string;
          email: string;
          university?: string | null;
          phone?: string | null;
          course?: string | null;
          semester?: string | null;
          role: "admin" | "student";
          createdAt: string;
        }[]
      >("/admin/users");
      return response.data;
    },
    enabled: user?.role === "admin"
  });

  const uploadDocument = async (formData: FormData) => {
    setSubmitting(true);
    setMessage("");

    try {
      const endpoint = editingDocument ? `/admin/documents/${editingDocument._id}` : "/admin/upload-document";
      const method = editingDocument ? "put" : "post";
      const response = await api[method](endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setMessage(response.data.message);
      refetch();
      refetchDocuments();
      setEditingDocument(null);
    } finally {
      setSubmitting(false);
    }
  };

  const startEditUser = (account: (typeof users)[number]) => {
    setEditingUserId(account.id);
    setUserForm({
      name: account.name ?? "",
      email: account.email,
      university: account.university ?? "",
      phone: account.phone ?? "",
      course: account.course ?? "",
      semester: account.semester ?? "",
      role: account.role,
      password: ""
    });
  };

  const saveUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingUserId) return;

    setMessage("");
    await api.put(`/admin/users/${editingUserId}`, userForm);
    setMessage("User updated successfully");
    setEditingUserId(null);
    refetchUsers();
  };

  const deleteUser = async (userId: number) => {
    setMessage("");
    await api.delete(`/admin/users/${userId}`);
    setMessage("User deleted successfully");
    if (editingUserId === userId) {
      setEditingUserId(null);
    }
    refetchUsers();
    refetch();
  };

  const filteredUsers = useMemo(
    () =>
      users.filter((account) => {
        const matchesSearch =
          account.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
          account.email.toLowerCase().includes(userSearch.toLowerCase()) ||
          account.university?.toLowerCase().includes(userSearch.toLowerCase());

        const matchesRole = userRoleFilter === "all" ? true : account.role === userRoleFilter;
        return matchesSearch && matchesRole;
      }),
    [users, userRoleFilter, userSearch]
  );

  let content: React.ReactNode;

  if (loading) {
    content = (
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        Loading admin dashboard...
      </div>
    );
  } else if (user?.role !== "admin") {
    content = (
      <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10">
        Students cannot access admin routes.
      </div>
    );
  } else {
    content = (
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <AdminSidebar />
        <div className="space-y-6">
          {message ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">{message}</div> : null}

          <section id="dashboard" className="grid gap-4 md:grid-cols-4">
            {Object.entries(data?.stats ?? {}).map(([key, value]) => (
              <div key={key} className="rounded-[28px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm capitalize text-slate-500 dark:text-slate-400">{key}</p>
                <p className="mt-3 text-3xl font-semibold">{value}</p>
              </div>
            ))}
          </section>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Uploaded Documents</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Review uploaded materials and update them without leaving the admin panel.
                  </p>
                </div>
                {editingDocument ? (
                  <button
                    type="button"
                    onClick={() => setEditingDocument(null)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-800"
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-slate-500 dark:text-slate-400">
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="px-3 py-3 font-medium">Title</th>
                      <th className="px-3 py-3 font-medium">Subject</th>
                      <th className="px-3 py-3 font-medium">Stream</th>
                      <th className="px-3 py-3 font-medium">Type</th>
                      <th className="px-3 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((document) => (
                      <tr key={document._id} className="border-b border-slate-100 dark:border-slate-900">
                        <td className="px-3 py-4 font-medium">{document.title}</td>
                        <td className="px-3 py-4">{document.subject}</td>
                        <td className="px-3 py-4">{document.stream}</td>
                        <td className="px-3 py-4">{document.type === "model_qp" ? "Model QPs" : "Notes"}</td>
                        <td className="px-3 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingDocument(document)}
                              className="rounded-full bg-amber-500 px-3 py-2 text-xs font-semibold text-white"
                            >
                              Edit
                            </button>
                            <a
                              href={`/viewer?documentId=${document._id}&url=${encodeURIComponent(document.fileUrl)}&title=${encodeURIComponent(document.title)}&type=${document.type}`}
                              className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-slate-800"
                            >
                              Open
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!documents.length ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-slate-500 dark:text-slate-400">
                          No documents uploaded yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

            <DocumentUploadForm
              key={editingDocument ? String(editingDocument._id) : "create"}
              onSubmit={uploadDocument}
              submitting={submitting}
              initialValues={editingDocument ?? undefined}
              submitLabel={editingDocument ? "Save Changes" : "Upload Document"}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-lg font-semibold">Manage Users</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Review all registered accounts, update details, or remove access when needed.
              </p>
              <div className="mt-5 flex flex-col gap-3 md:flex-row">
                <input
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="Search by name, email, or board"
                  className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none dark:border-slate-800"
                />
                <select
                  value={userRoleFilter}
                  onChange={(event) => setUserRoleFilter(event.target.value as "all" | "admin" | "student")}
                  className="rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none dark:border-slate-800"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admins</option>
                  <option value="student">Students</option>
                </select>
              </div>
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-slate-500 dark:text-slate-400">
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="px-3 py-3 font-medium">Name</th>
                      <th className="px-3 py-3 font-medium">Email</th>
                      <th className="px-3 py-3 font-medium">Board</th>
                      <th className="px-3 py-3 font-medium">Role</th>
                      <th className="px-3 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((account) => (
                      <tr key={account.id} className="border-b border-slate-100 dark:border-slate-900">
                        <td className="px-3 py-4 font-medium">{account.name}</td>
                        <td className="px-3 py-4">{account.email}</td>
                        <td className="px-3 py-4">{account.university || "Not set"}</td>
                        <td className="px-3 py-4">{account.role}</td>
                        <td className="px-3 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => startEditUser(account)}
                              className="rounded-full bg-amber-500 px-3 py-2 text-xs font-semibold text-white"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteUser(account.id)}
                              disabled={account.id === Number(user?.id)}
                              className="rounded-full bg-rose-500 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!filteredUsers.length ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-slate-500 dark:text-slate-400">
                          No users match the current search or filter.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold">Edit User</h3>
                {editingUserId ? (
                  <button
                    type="button"
                    onClick={() => setEditingUserId(null)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-800"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
              <form className="mt-5 space-y-4" onSubmit={saveUser}>
                <UserInput label="Professional Name" value={userForm.name} onChange={(value) => setUserForm((current) => ({ ...current, name: value }))} />
                <UserInput label="Email" type="email" value={userForm.email} onChange={(value) => setUserForm((current) => ({ ...current, email: value }))} />
                <UserInput label="University / PUC Board" value={userForm.university} onChange={(value) => setUserForm((current) => ({ ...current, university: value }))} />
                <UserInput label="Phone" value={userForm.phone} onChange={(value) => setUserForm((current) => ({ ...current, phone: value }))} />
                <UserInput label="Course" value={userForm.course} onChange={(value) => setUserForm((current) => ({ ...current, course: value }))} />
                <UserInput label="Semester" value={userForm.semester} onChange={(value) => setUserForm((current) => ({ ...current, semester: value }))} />
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Role</span>
                  <select
                    value={userForm.role}
                    onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value as "admin" | "student" }))}
                    className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none dark:border-slate-800"
                  >
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <UserInput
                  label="New Password (optional)"
                  type="password"
                  value={userForm.password}
                  onChange={(value) => setUserForm((current) => ({ ...current, password: value }))}
                />
                <button
                  type="submit"
                  disabled={!editingUserId}
                  className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-500"
                >
                  Save User Changes
                </button>
              </form>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return content;
}

function UserInput({
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
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none dark:border-slate-800"
      />
    </label>
  );
}
