"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  BookOpenText,
  FileText,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users as UsersIcon
} from "lucide-react";
import { api } from "@/lib/api";
import { AdminSyllabusRequest, Degree, Document, MockTest, Settings, TeacherVerification } from "@/lib/types";
import { FormSelect } from "../ui/form-select";
import { useAuth } from "../providers/auth-provider";
import { AdminSidebar } from "./admin-sidebar";
import { AdminProjectsManager } from "./admin-projects-manager";
import { DocumentUploadForm } from "./document-upload-form";
import { MockTestManagerForm } from "./mock-test-manager-form";

type AdminOverview = {
  stats: {
    users: number;
    degrees: number;
    subjects: number;
    notes: number;
    mockTests: number;
    projects: number;
    documents: number;
    teacherVerifications: number;
  };
  settings: Settings;
};

type AdminUserRow = {
  id: number;
  name: string;
  email: string;
  university?: string | null;
  phone?: string | null;
  course?: string | null;
  semester?: string | null;
  role: "admin" | "student" | "teacher";
  verifiedTeacher?: boolean;
  communityGroup?: {
    id: number;
    name: string;
  } | null;
  createdAt: string;
};

type CommunityReportRow = {
  id: number;
  reason: string;
  createdAt: string;
  reporter?: {
    id: number;
    name?: string | null;
    email: string;
  } | null;
  reportedUser?: {
    id: number;
    name?: string | null;
    email: string;
  } | null;
  message?: {
    id: number;
    content: string;
    createdAt: string;
  } | null;
  group?: {
    id: number;
    name: string;
  } | null;
};

const statConfig: Record<
  string,
  { label: string; helper: string; icon: React.ComponentType<{ className?: string }> }
> = {
  users: { label: "Users", helper: "Accounts", icon: UsersIcon },
  degrees: { label: "Degrees", helper: "Streams", icon: GraduationCap },
  subjects: { label: "Subjects", helper: "Coverage", icon: BookOpenText },
  notes: { label: "Notes", helper: "Published", icon: FileText },
  mockTests: { label: "Mock Tests", helper: "Live exams", icon: Sparkles },
  projects: { label: "Projects", helper: "References", icon: FolderKanban },
  documents: { label: "Documents", helper: "Library", icon: FileText },
  teacherVerifications: { label: "Approvals", helper: "Pending", icon: ShieldCheck }
};

const validSections = new Set([
  "dashboard",
  "documents",
  "teacher-notes",
  "document-manager",
  "projects",
  "mock-tests",
  "mock-test-editor",
  "teacher-approvals",
  "syllabus-requests",
  "community-reports",
  "users",
  "user-editor"
]);

export function AdminDashboard() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mockTestError, setMockTestError] = useState("");
  const [siteStatsSubmitting, setSiteStatsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editingMockTest, setEditingMockTest] = useState<MockTest | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "admin" | "student" | "teacher">("all");
  const [appInstallsInput, setAppInstallsInput] = useState("0");
  const [youtubeMembersInput, setYoutubeMembersInput] = useState("0");
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    university: "",
    phone: "",
    course: "",
    semester: "",
    role: "student" as "admin" | "student" | "teacher",
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

  const { data: adminTeacherNotes = [], refetch: refetchTeacherNotes } = useQuery({
    queryKey: ["admin-teacher-notes"],
    queryFn: async () => {
      const response = await api.get<Document[]>("/documents/admin/teacher-notes");
      return response.data;
    },
    enabled: user?.role === "admin"
  });

  const { data: users = [], refetch: refetchUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const response = await api.get<AdminUserRow[]>("/admin/users");
      return response.data;
    },
    enabled: user?.role === "admin"
  });

  const { data: adminMockTests = [], refetch: refetchMockTests } = useQuery({
    queryKey: ["admin-mock-tests"],
    queryFn: async () => {
      const response = await api.get<MockTest[]>("/admin/mock-tests");
      return response.data;
    },
    enabled: user?.role === "admin"
  });

  const { data: degrees = [] } = useQuery({
    queryKey: ["admin-degrees"],
    queryFn: async () => {
      const response = await api.get<Degree[]>("/degrees");
      return response.data;
    },
    enabled: user?.role === "admin"
  });

  const { data: teacherVerifications = [], refetch: refetchTeacherVerifications } = useQuery({
    queryKey: ["admin-teacher-verifications"],
    queryFn: async () => {
      const response = await api.get<TeacherVerification[]>("/admin/teacher-verifications");
      return response.data;
    },
    enabled: user?.role === "admin"
  });

  const { data: communityReports = [], refetch: refetchCommunityReports } = useQuery({
    queryKey: ["admin-community-reports"],
    queryFn: async () => {
      const response = await api.get<{ success: true; reports: CommunityReportRow[] }>("/community/reports");
      return response.data.reports ?? [];
    },
    enabled: user?.role === "admin"
  });

  const { data: syllabusRequests = [], refetch: refetchSyllabusRequests } = useQuery({
    queryKey: ["admin-syllabus-requests"],
    queryFn: async () => {
      const response = await api.get<{ success: true; requests: AdminSyllabusRequest[] }>("/syllabus/admin/requests");
      return response.data.requests ?? [];
    },
    enabled: user?.role === "admin",
    refetchInterval: 15000
  });

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (validSections.has(hash)) {
      setActiveSection(hash);
    }
  }, []);

  useEffect(() => {
    setAppInstallsInput(String(data?.settings?.siteStats?.appInstalls ?? 0));
  }, [data?.settings?.siteStats?.appInstalls]);

  useEffect(() => {
    setYoutubeMembersInput(String(data?.settings?.siteStats?.youtubeMembers ?? 0));
  }, [data?.settings?.siteStats?.youtubeMembers]);

  const changeSection = (section: string) => {
    setActiveSection(section);
    window.history.replaceState(null, "", `/admin#${section}`);
  };

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

  const startEditMockTest = async (mockTestId: string | number) => {
    setMockTestError("");
    const response = await api.get<{ success: true; mockTest: MockTest }>(`/admin/mock-tests/${mockTestId}`);
    setEditingMockTest(response.data.mockTest);
    changeSection("mock-test-editor");
  };

  const saveMockTest = async (payload: {
    title: string;
    description: string;
    durationMinutes: number;
    difficulty: "easy" | "medium" | "hard";
    subject: string;
    degreeId: number;
    stream: string;
    isPublished: boolean;
    questions: {
      questionText: string;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
      correctAnswer: "A" | "B" | "C" | "D";
    }[];
  }) => {
    setSubmitting(true);
    setMessage("");
    setMockTestError("");

    try {
      if (editingMockTest?._id) {
        await api.put(`/admin/mock-tests/${editingMockTest._id}`, payload);
        setMessage("Mock test updated successfully");
      } else {
        await api.post("/admin/mock-tests", payload);
        setMessage("Mock test created successfully");
      }

      setEditingMockTest(null);
      refetchMockTests();
      refetch();
      changeSection("mock-tests");
    } catch (error: any) {
      setMockTestError(error?.response?.data?.message || "Mock test could not be saved. Please check the fields and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMockTest = async (mockTestId: string | number) => {
    setMessage("");
    await api.delete(`/admin/mock-tests/${mockTestId}`);
    setMessage("Mock test deleted successfully");
    if (editingMockTest?._id === mockTestId) {
      setEditingMockTest(null);
    }
    refetchMockTests();
    refetch();
  };

  const startEditUser = (account: AdminUserRow) => {
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

  const reviewTeacherVerification = async (verificationId: number, status: "approved" | "rejected") => {
    setMessage("");
    await api.put(`/admin/teacher-verifications/${verificationId}`, { status });
    setMessage(
      status === "approved"
        ? "Teacher approved and notified successfully"
        : "Teacher verification rejected and user notified successfully"
    );
    refetchTeacherVerifications();
    refetchUsers();
    refetch();
  };

  const deleteTeacherVerification = async (verificationId: number) => {
    if (!window.confirm("Delete this approval request permanently?")) {
      return;
    }

    setMessage("");
    await api.delete(`/admin/teacher-verifications/${verificationId}`);
    setMessage("Teacher verification request deleted successfully");
    refetchTeacherVerifications();
    refetchUsers();
    refetch();
  };

  const deleteSyllabusRequest = async (requestId: number | string) => {
    await api.delete(`/syllabus/${requestId}`);
    setMessage("Syllabus request deleted successfully");
    queryClient.setQueryData<AdminSyllabusRequest[] | undefined>(["admin-syllabus-requests"], (current) =>
      (current ?? []).filter((request) => String(request._id) !== String(requestId))
    );
    refetchSyllabusRequests();
  };

  const updateTeacherNoteStatus = async (
    documentId: string | number,
    updates: {
      isFeatured?: boolean;
      isHidden?: boolean;
    }
  ) => {
    setMessage("");
    await api.put(`/documents/admin/teacher-notes/${documentId}/status`, updates);
    setMessage("Teacher note status updated successfully");
    refetchTeacherNotes();
  };

  const deleteAdminTeacherNote = async (documentId: string | number) => {
    if (!window.confirm("Delete this teacher note permanently?")) {
      return;
    }

    setMessage("");
    await api.delete(`/documents/teacher-notes/${documentId}`);
    setMessage("Teacher note deleted successfully");
    refetchTeacherNotes();
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

  const pendingTeacherCount = teacherVerifications.filter((item) => item.status === "pending").length;
  const verifiedTeacherCount = users.filter((account) => account.verifiedTeacher).length;
  const recentDocumentCount = documents.length;
  const syllabusRequestCount = syllabusRequests.length;
  const liveYoutubeMembers = data?.settings?.siteStats?.youtubeMembers ?? "0";
  const openCommunityReportsCount = communityReports.length;

  const saveSiteStats = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSiteStatsSubmitting(true);
    setMessage("");

    try {
      const response = await api.put("/admin/site-stats", {
        appInstalls: appInstallsInput,
        youtubeMembers: youtubeMembersInput
      });

      setMessage(response.data.message);
      refetch();
    } finally {
      setSiteStatsSubmitting(false);
    }
  };

  const deleteDocument = async (documentId: string | number) => {
    if (!window.confirm("Delete this document permanently?")) {
      return;
    }

    setMessage("");

    try {
      const response = await api.delete(`/admin/documents/${documentId}`);
      setMessage(response.data.message ?? "Document deleted successfully.");
      if (editingDocument?._id === documentId) {
        setEditingDocument(null);
      }
      refetch();
    } catch (error) {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : "We couldn't delete this document right now.";
      setMessage(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        Loading admin dashboard...
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10">
        Students cannot access admin routes.
      </div>
    );
  }

  let sectionContent: React.ReactNode;

  if (activeSection === "documents") {
    sectionContent = (
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Documents</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Uploaded study materials</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Review uploaded materials and open or edit them from one clean list.
          </p>
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
                  <td className="px-3 py-4 font-medium text-slate-900 dark:text-white">{document.title}</td>
                  <td className="px-3 py-4">{document.subject}</td>
                  <td className="px-3 py-4">{document.stream}</td>
                  <td className="px-3 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      document.type === "model_qp"
                        ? "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                    }`}>
                      {document.type === "model_qp" ? "Model QPs" : "Notes"}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDocument(document);
                          changeSection("document-manager");
                        }}
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
                      <button
                        type="button"
                        onClick={() => void deleteDocument(document._id)}
                        className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 dark:border-rose-500/20 dark:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
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
    );
  } else if (activeSection === "teacher-notes") {
    sectionContent = (
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Teacher Notes</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Verified teacher uploads</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Review all verified-teacher PDFs, open teacher profile pages, and manage note visibility from one place.
          </p>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500 dark:text-slate-400">
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="px-3 py-3 font-medium">Note</th>
                <th className="px-3 py-3 font-medium">Teacher</th>
                <th className="px-3 py-3 font-medium">Stream</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminTeacherNotes.map((document) => {
                const statusLabel = document.isHidden ? "Hidden" : document.isFeatured ? "Featured" : "New";
                const statusClassName = document.isHidden
                  ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  : document.isFeatured
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";

                return (
                  <tr key={String(document._id)} className="border-b border-slate-100 dark:border-slate-900">
                    <td className="px-3 py-4">
                      <p className="font-medium text-slate-900 dark:text-white">{document.title}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{document.subject}</p>
                    </td>
                    <td className="px-3 py-4">
                      <p className="font-medium text-slate-900 dark:text-white">{document.uploader?.name || "Verified teacher"}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{document.uploader?.email}</p>
                    </td>
                    <td className="px-3 py-4">{document.stream}</td>
                    <td className="px-3 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClassName}`}>{statusLabel}</span>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`/teacher-notes/teacher/${document.uploader?.id ?? document.uploader?.email ?? document._id}`}
                          className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-slate-800"
                        >
                          Teacher profile
                        </a>
                        <button
                          type="button"
                          onClick={() => updateTeacherNoteStatus(document._id, { isFeatured: !document.isFeatured, isHidden: false })}
                          className="rounded-full bg-emerald-500 px-3 py-2 text-xs font-semibold text-white"
                        >
                          {document.isFeatured ? "Unfeature" : "Feature"}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateTeacherNoteStatus(document._id, { isHidden: !document.isHidden })}
                          className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-slate-800"
                        >
                          {document.isHidden ? "Unhide" : "Hide"}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAdminTeacherNote(document._id)}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 dark:border-rose-500/20 dark:text-rose-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!adminTeacherNotes.length ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500 dark:text-slate-400">
                    No teacher notes uploaded yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    );
  } else if (activeSection === "projects") {
    sectionContent = <AdminProjectsManager />;
  } else if (activeSection === "mock-tests") {
    sectionContent = (
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Mock tests</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Manage exam library</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Create, publish, edit, and clean up sequential mock tests with their full MCQ sets.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingMockTest(null);
              setMockTestError("");
              changeSection("mock-test-editor");
            }}
            className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Create Mock Test
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500 dark:text-slate-400">
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="px-3 py-3 font-medium">Title</th>
                <th className="px-3 py-3 font-medium">Subject</th>
                <th className="px-3 py-3 font-medium">Stream</th>
                <th className="px-3 py-3 font-medium">Difficulty</th>
                <th className="px-3 py-3 font-medium">Questions</th>
                <th className="px-3 py-3 font-medium">Attempts</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminMockTests.map((mockTest) => (
                <tr key={String(mockTest._id)} className="border-b border-slate-100 dark:border-slate-900">
                  <td className="px-3 py-4">
                    <p className="font-medium text-slate-900 dark:text-white">{mockTest.title}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{mockTest.description}</p>
                  </td>
                  <td className="px-3 py-4">{mockTest.subject}</td>
                  <td className="px-3 py-4">{mockTest.stream}</td>
                  <td className="px-3 py-4 capitalize">{mockTest.difficulty}</td>
                  <td className="px-3 py-4">{mockTest.totalQuestions}</td>
                  <td className="px-3 py-4">{mockTest.attemptsCount ?? 0}</td>
                  <td className="px-3 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        mockTest.isPublished
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {mockTest.isPublished ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEditMockTest(mockTest._id)}
                        className="rounded-full bg-amber-500 px-3 py-2 text-xs font-semibold text-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMockTest(mockTest._id)}
                        className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 dark:border-rose-500/20 dark:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!adminMockTests.length ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-slate-500 dark:text-slate-400">
                    No mock tests created yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    );
  } else if (activeSection === "mock-test-editor") {
    sectionContent = (
      <MockTestManagerForm
        key={editingMockTest ? String(editingMockTest._id) : "create-mock-test"}
        onSubmit={saveMockTest}
        submitting={submitting}
        initialValues={editingMockTest ?? undefined}
        errorMessage={mockTestError}
        degreeOptions={degrees.map((degree) => ({
          label: degree.name,
          value: String((degree as Degree & { id?: string | number }).id ?? degree._id)
        }))}
        submitLabel={editingMockTest ? "Save Mock Test" : "Create Mock Test"}
      />
    );
  } else if (activeSection === "document-manager") {
    sectionContent = (
      <DocumentUploadForm
        key={editingDocument ? String(editingDocument._id) : "create"}
        onSubmit={uploadDocument}
        submitting={submitting}
        initialValues={editingDocument ?? undefined}
        submitLabel={editingDocument ? "Save Changes" : "Upload Document"}
      />
    );
  } else if (activeSection === "teacher-approvals") {
    sectionContent = (
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Approvals</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Teacher verification requests</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Review teacher applications, inspect uploaded ID cards, and notify them automatically after approval or rejection.
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500 dark:text-slate-400">
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="px-3 py-3 font-medium">Teacher</th>
                <th className="px-3 py-3 font-medium">Community</th>
                <th className="px-3 py-3 font-medium">Expertise</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teacherVerifications.map((verification) => (
                <tr key={verification.id} className="border-b border-slate-100 dark:border-slate-900">
                  <td className="px-3 py-4">
                    <p className="font-medium">{verification.fullName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{verification.user?.email}</p>
                  </td>
                  <td className="px-3 py-4">{verification.communityGroup.name}</td>
                  <td className="px-3 py-4">{verification.subjectExpertise}</td>
                  <td className="px-3 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      verification.status === "approved"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : verification.status === "rejected"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                    }`}>
                      {verification.status}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={verification.idCardUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-slate-800"
                      >
                        View ID
                      </a>
                      <button
                        type="button"
                        onClick={() => reviewTeacherVerification(verification.id, "approved")}
                        className="rounded-full bg-emerald-500 px-3 py-2 text-xs font-semibold text-white"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => reviewTeacherVerification(verification.id, "rejected")}
                        className="rounded-full bg-rose-500 px-3 py-2 text-xs font-semibold text-white"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteTeacherVerification(verification.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 dark:border-rose-500/20 dark:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!teacherVerifications.length ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500 dark:text-slate-400">
                    No teacher verification requests yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    );
  } else if (activeSection === "community-reports") {
    sectionContent = (
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Community reports</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Review flagged users and messages</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Reports are submitted by learners inside community groups for spam, abuse, or inappropriate content.
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetchCommunityReports()}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-800 dark:text-slate-200"
          >
            Refresh
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500 dark:text-slate-400">
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="px-3 py-3 font-medium">Reason</th>
                <th className="px-3 py-3 font-medium">Reporter</th>
                <th className="px-3 py-3 font-medium">Reported user</th>
                <th className="px-3 py-3 font-medium">Group</th>
                <th className="px-3 py-3 font-medium">Message</th>
                <th className="px-3 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {communityReports.map((report) => (
                <tr key={report.id} className="border-b border-slate-100 align-top dark:border-slate-900">
                  <td className="px-3 py-4">
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold capitalize text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                      {report.reason}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <p className="font-medium text-slate-900 dark:text-white">{report.reporter?.name || "Unknown user"}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{report.reporter?.email || "No email"}</p>
                  </td>
                  <td className="px-3 py-4">
                    <p className="font-medium text-slate-900 dark:text-white">{report.reportedUser?.name || "Unknown user"}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{report.reportedUser?.email || "No email"}</p>
                  </td>
                  <td className="px-3 py-4">{report.group?.name || "Unknown group"}</td>
                  <td className="px-3 py-4">
                    <div className="max-w-sm rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                      {report.message?.content || "Reported user / attachment only"}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-xs text-slate-500 dark:text-slate-400">
                    {new Date(report.createdAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit"
                    })}
                  </td>
                </tr>
              ))}
              {!communityReports.length ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-500 dark:text-slate-400">
                    No community reports have been submitted yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    );
  } else if (activeSection === "syllabus-requests") {
    sectionContent = (
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Syllabus requests</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Uploaded syllabus requests</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Review syllabus uploads from users and use them to prepare notes, model QPs, or other study material.
          </p>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500 dark:text-slate-400">
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="px-3 py-3 font-medium">Student</th>
                <th className="px-3 py-3 font-medium">Subject</th>
                <th className="px-3 py-3 font-medium">Course</th>
                <th className="px-3 py-3 font-medium">Semester</th>
                <th className="px-3 py-3 font-medium">Topics</th>
                <th className="px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {syllabusRequests.map((request) => (
                <tr key={request._id} className="border-b border-slate-100 dark:border-slate-900">
                  <td className="px-3 py-4">
                    <p className="font-medium text-slate-900 dark:text-white">{request.user?.name || "Unknown user"}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{request.user?.email}</p>
                  </td>
                  <td className="px-3 py-4 font-medium text-slate-900 dark:text-white">{request.subject}</td>
                  <td className="px-3 py-4">{request.course || "Not set"}</td>
                  <td className="px-3 py-4">{request.semester || "Not set"}</td>
                  <td className="px-3 py-4">
                    <div className="max-w-sm rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                      {(request.structuredContent?.manualTopics || []).slice(0, 3).join(", ") || "No extra topics added"}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={request.sourceFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-slate-800"
                      >
                        View
                      </a>
                      <button
                        type="button"
                        onClick={() => void deleteSyllabusRequest(request._id)}
                        className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 dark:border-rose-500/20 dark:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!syllabusRequests.length ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-500 dark:text-slate-400">
                    No syllabus requests yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    );
  } else if (activeSection === "users") {
    sectionContent = (
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">User management</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Manage users</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Review all registered accounts, search quickly, and open any user for editing.
        </p>
        <div className="mt-5 flex flex-col gap-3 md:flex-row">
          <input
            value={userSearch}
            onChange={(event) => setUserSearch(event.target.value)}
            placeholder="Search by name, email, or board"
            className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none dark:border-slate-800"
          />
          <FormSelect
            value={userRoleFilter}
            onChange={(value) => setUserRoleFilter(value as "all" | "admin" | "student" | "teacher")}
            className="md:w-[220px]"
            options={[
              { label: "All Roles", value: "all" },
              { label: "Admins", value: "admin" },
              { label: "Students", value: "student" },
              { label: "Teachers", value: "teacher" }
            ]}
          />
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500 dark:text-slate-400">
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="px-3 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Email</th>
                <th className="px-3 py-3 font-medium">Board</th>
                <th className="px-3 py-3 font-medium">Community</th>
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
                  <td className="px-3 py-4">{account.communityGroup?.name || "Not joined"}</td>
                  <td className="px-3 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      account.role === "admin"
                        ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        : account.role === "teacher"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                    }`}>
                      {account.role}
                      {account.verifiedTeacher ? " • verified" : ""}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          startEditUser(account);
                          changeSection("user-editor");
                        }}
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
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-500 dark:text-slate-400">
                    No users match the current search or filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    );
  } else if (activeSection === "user-editor") {
    sectionContent = (
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">User editor</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Edit selected user</h3>
          </div>
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
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Update profile details, access role, and password for the selected account.
        </p>
        <form className="mt-5 space-y-4" onSubmit={saveUser}>
          <UserInput label="Professional Name" value={userForm.name} onChange={(value) => setUserForm((current) => ({ ...current, name: value }))} />
          <UserInput label="Email" type="email" value={userForm.email} onChange={(value) => setUserForm((current) => ({ ...current, email: value }))} />
          <UserInput label="University / PUC Board" value={userForm.university} onChange={(value) => setUserForm((current) => ({ ...current, university: value }))} />
          <UserInput label="Phone" value={userForm.phone} onChange={(value) => setUserForm((current) => ({ ...current, phone: value }))} />
          <UserInput label="Course" value={userForm.course} onChange={(value) => setUserForm((current) => ({ ...current, course: value }))} />
          <UserInput label="Semester" value={userForm.semester} onChange={(value) => setUserForm((current) => ({ ...current, semester: value }))} />
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Role</span>
            <FormSelect
              value={userForm.role}
              onChange={(value) => setUserForm((current) => ({ ...current, role: value as "admin" | "student" | "teacher" }))}
              options={[
                { label: "Student", value: "student" },
                { label: "Teacher", value: "teacher" },
                { label: "Admin", value: "admin" }
              ]}
            />
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
    );
  } else {
    sectionContent = (
      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid self-start gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {Object.entries(data?.stats ?? {}).map(([key, value]) => {
            const config = statConfig[key] ?? { label: key, helper: "Overview", icon: LayoutDashboard };
            const Icon = config.icon;
            return (
              <div
                key={key}
                className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-28px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="border-b border-slate-100 bg-gradient-to-br from-white to-amber-50/40 px-4 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 shadow-sm dark:bg-amber-500/10 dark:text-amber-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                        {config.label}
                      </p>
                      <p className="mt-1 text-sm font-medium leading-5 text-slate-600 dark:text-slate-300">{config.helper}</p>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-5">
                  <div className="flex items-end justify-between gap-3">
                    <p className="text-[2rem] font-semibold leading-none text-slate-900 dark:text-white">
                      {value}
                    </p>
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      Live total
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:sticky xl:top-24">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Admin pulse</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Teacher approvals</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Pending teachers waiting for review</p>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">{pendingTeacherCount}</span>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Verified teachers</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Approved mentors across communities</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{verifiedTeacherCount}</span>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Published documents</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Visible study materials in the library</p>
                </div>
                <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{recentDocumentCount}</span>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Syllabus requests</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Uploads waiting for note preparation</p>
                </div>
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">{syllabusRequestCount}</span>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Community reports</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Messages and users flagged in group chat</p>
                </div>
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{openCommunityReportsCount}</span>
              </div>
            </div>
            <div className="rounded-3xl bg-amber-50 p-4 text-sm leading-6 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
              Approving a teacher automatically sends a notification to that user and unlocks verified access to their selected community.
            </div>
            <form
              onSubmit={saveSiteStats}
              className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Platform counters</p>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Update both public-facing counters here. You can use formats like 10K, 25K, or 500K.
              </p>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  YouTube subscribers
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{liveYoutubeMembers}</p>
              </div>

              <label className="mt-4 block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  Play Store installs
                </span>
                <input
                  value={appInstallsInput}
                  onChange={(event) => setAppInstallsInput(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-amber-300 dark:border-slate-800 dark:focus:border-amber-500/40"
                  placeholder="e.g. 10K"
                />
              </label>

              <label className="mt-4 block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  YouTube subscribers
                </span>
                <input
                  value={youtubeMembersInput}
                  onChange={(event) => setYoutubeMembersInput(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-amber-300 dark:border-slate-800 dark:focus:border-amber-500/40"
                  placeholder="e.g. 25K"
                />
              </label>

              <button
                type="submit"
                disabled={siteStatsSubmitting}
                className="mt-4 w-full rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
              >
                {siteStatsSubmitting ? "Saving..." : "Save platform counts"}
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <AdminSidebar activeSection={activeSection} onSectionChange={changeSection} />
      <div className="space-y-6">
        {message ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            {message}
          </div>
        ) : null}
        {sectionContent}
      </div>
    </div>
  );
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



