"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, ChevronDown, Download, FileText, FolderOpen, GraduationCap, Loader2, Search, ShieldCheck, SlidersHorizontal, UploadCloud } from "lucide-react";
import { api } from "@/lib/api";
import { CommunityBootstrap, Document } from "@/lib/types";
import { useAuth } from "../providers/auth-provider";
import { FormSelect } from "../ui/form-select";

const streamOptions = ["BCA", "B.Com", "BSc", "BA", "BBA", "1st PUC", "2nd PUC"];
const categoryOptions = ["All", "Full Notes", "Revision", "Important Questions", "Unit Notes"];
const sortOptions = [
  { label: "Latest", value: "latest" },
  { label: "Oldest", value: "oldest" },
  { label: "A to Z", value: "title-asc" },
  { label: "Z to A", value: "title-desc" },
  { label: "Names A-Z", value: "teacher-asc" },
  { label: "Names Z-A", value: "teacher-desc" },
  { label: "Numbers first", value: "numeric-first" },
  { label: "Most viewed", value: "views" },
  { label: "Most downloaded", value: "downloads" }
] as const;

function getTeacherNoteCategory(note: Document) {
  const title = `${note.title} ${note.subject}`.toLowerCase();

  if (title.includes("question") || title.includes("important question") || title.includes("2 mark") || title.includes("5 mark") || title.includes("10 mark")) {
    return "Important Questions";
  }

  if (title.includes("revision") || title.includes("summary") || title.includes("quick")) {
    return "Revision";
  }

  if (title.includes("unit") || title.includes("chapter") || title.includes("module")) {
    return "Unit Notes";
  }

  return "Full Notes";
}

export function TeacherNotesPageClient({ initialNotes }: { initialNotes: Document[] }) {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const verificationFileRef = useRef<HTMLInputElement | null>(null);
  const actionPanelRef = useRef<HTMLDivElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [stream, setStream] = useState("BCA");
  const [editingNoteId, setEditingNoteId] = useState<string | number | null>(null);
  const [activeStream, setActiveStream] = useState("All");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTeacher, setActiveTeacher] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]["value"]>("latest");
  const [uploadMessage, setUploadMessage] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [verificationBusy, setVerificationBusy] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [verificationForm, setVerificationForm] = useState({
    fullName: user?.name || "",
    collegeName: "",
    universityBoard: user?.university || "",
    subjectExpertise: ""
  });
  const isTeacher = user?.role === "teacher";

  const { data: teacherNotes = [] } = useQuery({
    queryKey: ["teacher-notes"],
    queryFn: async () => {
      const response = await api.get<Document[]>("/documents/teacher-notes");
      return response.data;
    },
    initialData: initialNotes
  });

  const { data: savedDocuments = [] } = useQuery({
    queryKey: ["saved-documents-teacher-notes"],
    queryFn: async () => {
      const response = await api.get<{ document: Document }[]>("/auth/saved-documents");
      return response.data;
    },
    enabled: Boolean(user)
  });

  const { data: communityBootstrap } = useQuery({
    queryKey: ["teacher-notes-community-bootstrap"],
    queryFn: async () => {
      const response = await api.get<CommunityBootstrap>("/community");
      return response.data;
    },
    enabled: Boolean(user && isTeacher)
  });
  const isVerifiedTeacher = isTeacher && user?.verifiedTeacher;
  const latestVerification = communityBootstrap?.verification || null;
  const verificationStatus = latestVerification?.status || null;
  const hasPendingVerification = verificationStatus === "pending";

  useEffect(() => {
    if (user) {
      setVerificationForm((current) => ({
        ...current,
        fullName: current.fullName || user.name || "",
        universityBoard: current.universityBoard || user.university || ""
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!showUploadForm && !showVerificationForm) {
      return;
    }

    const timeout = window.setTimeout(() => {
      actionPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 80);

    return () => window.clearTimeout(timeout);
  }, [showUploadForm, showVerificationForm]);

  const teacherFolders = useMemo(() => {
    const grouped = new Map<
      string,
      {
        key: string;
        name: string;
        email: string;
        profilePhoto?: string | null;
        noteCount: number;
      }
    >();

    teacherNotes.forEach((note) => {
      const key = String(note.uploader?.id ?? note.uploader?.email ?? note._id);
      const existing = grouped.get(key);

      if (existing) {
        existing.noteCount += 1;
        return;
      }

      grouped.set(key, {
        key,
        name: note.uploader?.name || "Verified teacher",
        email: note.uploader?.email || "",
        profilePhoto: note.uploader?.profilePhoto ?? null,
        noteCount: 1
      });
    });

    return Array.from(grouped.values()).sort((left, right) => left.name.localeCompare(right.name));
  }, [teacherNotes]);

  const filteredNotes = useMemo(() => {
    const nextNotes = teacherNotes.filter((note) => {
      const matchesStream = activeStream === "All" ? true : note.stream === activeStream;
      const matchesCategory = activeCategory === "All" ? true : getTeacherNoteCategory(note) === activeCategory;
      const teacherKey = String(note.uploader?.id ?? note.uploader?.email ?? note._id);
      const matchesTeacher = activeTeacher === "All" ? true : teacherKey === activeTeacher;
      const query = search.trim().toLowerCase();
      const matchesSearch = !query
        ? true
        : [note.title, note.subject, note.stream, note.uploader?.name, note.uploader?.email]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));

      return matchesStream && matchesCategory && matchesTeacher && matchesSearch;
    });

    return nextNotes.sort((left, right) => {
      switch (sortBy) {
        case "oldest":
          return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
        case "title-asc":
          return left.title.localeCompare(right.title);
        case "title-desc":
          return right.title.localeCompare(left.title);
        case "teacher-asc":
          return String(left.uploader?.name || left.uploader?.email || "").localeCompare(String(right.uploader?.name || right.uploader?.email || ""));
        case "teacher-desc":
          return String(right.uploader?.name || right.uploader?.email || "").localeCompare(String(left.uploader?.name || left.uploader?.email || ""));
        case "numeric-first": {
          const leftStartsNumeric = /^\d/.test(left.title.trim());
          const rightStartsNumeric = /^\d/.test(right.title.trim());
          if (leftStartsNumeric === rightStartsNumeric) {
            return left.title.localeCompare(right.title, undefined, { numeric: true });
          }
          return leftStartsNumeric ? -1 : 1;
        }
        case "views":
          return (right.viewCount ?? 0) - (left.viewCount ?? 0);
        case "downloads":
          return (right.downloadCount ?? 0) - (left.downloadCount ?? 0);
        case "latest":
        default:
          return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }
    });
  }, [activeCategory, activeStream, activeTeacher, search, sortBy, teacherNotes]);

  const openUploadFlow = () => {
    setUploadMessage("");
    setVerificationMessage("");

    if (!user) {
      window.location.href = "/auth";
      return;
    }

    if (hasPendingVerification) {
      setShowUploadForm(false);
      setShowVerificationForm(false);
      setVerificationMessage("Your teacher verification is already pending admin review. Upload access will unlock automatically after approval.");
      return;
    }

    if (isVerifiedTeacher) {
      setShowVerificationForm(false);
      if (!showUploadForm) {
        setEditingNoteId(null);
        setTitle("");
        setSubject("");
        setStream("BCA");
        setSelectedFile(null);
      }
      setShowUploadForm((current) => !current);
      return;
    }

    if (isTeacher) {
      setShowUploadForm(false);
      setShowVerificationForm((current) => !current);
      return;
    }

    setUploadMessage("Teacher Notes uploads are available only for verified teacher accounts.");
  };

  const uploadTeacherNote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile && !editingNoteId) {
      setUploadMessage("Please select a PDF file first.");
      return;
    }

    setBusy(true);
    setUploadMessage("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("subject", subject);
      formData.append("stream", stream);
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const response = editingNoteId
        ? await api.put<{ success: true; message: string; document: Document }>(`/documents/teacher-notes/${editingNoteId}`, formData, {
            headers: {
              "Content-Type": "multipart/form-data"
            }
          })
        : await api.post<{ success: true; message: string; document: Document }>("/documents/teacher-notes", formData, {
            headers: {
              "Content-Type": "multipart/form-data"
            }
          });

      setUploadMessage(response.data.message);
      setTitle("");
      setSubject("");
      setStream("BCA");
      setEditingNoteId(null);
      setSelectedFile(null);
      setShowUploadForm(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await queryClient.invalidateQueries({ queryKey: ["teacher-notes"] });
    } catch (error: any) {
      setUploadMessage(
        error?.response?.data?.message ||
          (editingNoteId ? "We could not update the teacher notes right now." : "We could not upload the teacher notes right now.")
      );
    } finally {
      setBusy(false);
    }
  };

  const startEditTeacherNote = (note: Document) => {
    setUploadMessage("");
    setVerificationMessage("");
    setEditingNoteId(note._id);
    setTitle(note.title);
    setSubject(note.subject);
    setStream(note.stream);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setShowVerificationForm(false);
    setShowUploadForm(true);
  };

  const savedDocumentIds = useMemo(
    () => new Set(savedDocuments.map((entry) => String(entry.document._id))),
    [savedDocuments]
  );

  const toggleSavedDocument = async (documentId: string | number) => {
    if (!user) {
      window.location.href = "/auth";
      return;
    }

    const isSaved = savedDocumentIds.has(String(documentId));

    if (isSaved) {
      await api.delete(`/auth/saved-documents/${documentId}`);
    } else {
      await api.post("/auth/saved-documents", { documentId });
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["saved-documents-teacher-notes"] }),
      queryClient.invalidateQueries({ queryKey: ["saved-documents-page"] }),
      queryClient.invalidateQueries({ queryKey: ["saved-documents-home"] }),
      queryClient.invalidateQueries({ queryKey: ["saved-documents-account"] })
    ]);
  };

  const submitTeacherVerification = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!verificationFile) {
      setVerificationMessage("Please upload your college ID card first.");
      return;
    }

    setVerificationBusy(true);
    setVerificationMessage("");

    try {
      const formData = new FormData();
      formData.append("fullName", verificationForm.fullName.trim());
      formData.append("collegeName", verificationForm.collegeName.trim());
      formData.append("universityBoard", verificationForm.universityBoard.trim());
      formData.append("subjectExpertise", verificationForm.subjectExpertise.trim());
      formData.append("idCard", verificationFile);

      const response = await api.post<{ success: true; message: string }>("/community/teacher-verification", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setVerificationMessage(response.data.message);
      setShowVerificationForm(false);
      setVerificationFile(null);
      if (verificationFileRef.current) {
        verificationFileRef.current.value = "";
      }
    } catch (error: any) {
      setVerificationMessage(error?.response?.data?.message || "We could not submit teacher verification right now.");
    } finally {
      setVerificationBusy(false);
    }
  };

  const deleteTeacherNote = async (documentId: string | number) => {
    if (!window.confirm("Delete this teacher note permanently?")) {
      return;
    }

    try {
      await api.delete(`/documents/teacher-notes/${documentId}`);
      setUploadMessage("Teacher notes deleted successfully.");
      await queryClient.invalidateQueries({ queryKey: ["teacher-notes"] });
    } catch (error: any) {
      setUploadMessage(error?.response?.data?.message || "We could not delete these teacher notes right now.");
    }
  };

  return (
    <div className="min-w-0 overflow-x-hidden">
      <section className="min-w-0 bg-white dark:bg-slate-950">
        <div className="space-y-5 px-4 pb-8 pt-4 sm:px-6 lg:px-8">
          {uploadMessage ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              {uploadMessage}
            </div>
          ) : null}

          {verificationMessage ? (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200">
              {verificationMessage}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              Checking your teacher access...
            </div>
          ) : null}

          <div className="sticky top-20 z-20 -mx-4 bg-white/95 px-4 pb-0 pt-3 backdrop-blur dark:bg-slate-950/95 sm:-mx-6 sm:px-6 xl:-mx-8 xl:px-8">
            <div className="flex flex-col gap-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <label className="relative block">
                    <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search teacher notes, subjects, or teacher names"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none transition focus:border-amber-400 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-950 dark:placeholder:text-slate-500"
                    />
                  </label>
                  <label className="relative flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-400" />
                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value as (typeof sortOptions)[number]["value"])}
                      className="h-12 w-full appearance-none bg-transparent pr-8 text-sm font-medium text-slate-700 outline-none dark:text-slate-100"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </label>
              </div>

              <div className="relative z-10 translate-y-4">
                <div
                  className="mx-auto overflow-x-auto overscroll-x-contain px-1 py-1 [&::-webkit-scrollbar]:hidden"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  <div className="flex min-w-max gap-2 lg:min-w-0 lg:flex-wrap lg:justify-center">
                    {categoryOptions.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setActiveCategory(chip)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          activeCategory === chip
                            ? "bg-slate-950 text-white shadow-sm dark:bg-emerald-500 dark:text-slate-950"
                            : "border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div ref={actionPanelRef}>
            {showVerificationForm && isTeacher && !isVerifiedTeacher ? (
              <form
                onSubmit={submitTeacherVerification}
                className="grid gap-4 border-b border-slate-200 bg-slate-50/80 py-6 dark:border-slate-800 dark:bg-slate-950/40 lg:grid-cols-2"
              >
            <div className="lg:col-span-2">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">Verify once, then upload anytime</p>
              <p className="mt-1 text-sm leading-7 text-slate-500 dark:text-slate-400">
                Submit your college ID and subject details here when you are ready to upload teacher notes. Once admin
                approves your ID, the verified teacher badge and Teacher Notes upload access unlock automatically, and you
                will not need to verify again.
              </p>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">Full name</span>
              <input
                required
                value={verificationForm.fullName}
                onChange={(event) => setVerificationForm((current) => ({ ...current, fullName: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400 dark:border-slate-800 dark:bg-slate-950"
                placeholder="Your full name"
              />
            </label>

              <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">College name</span>
              <input
                required
                value={verificationForm.collegeName}
                onChange={(event) => setVerificationForm((current) => ({ ...current, collegeName: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400 dark:border-slate-800 dark:bg-slate-950"
                placeholder="Your college name"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">University / Board</span>
              <input
                required
                value={verificationForm.universityBoard}
                onChange={(event) => setVerificationForm((current) => ({ ...current, universityBoard: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400 dark:border-slate-800 dark:bg-slate-950"
                placeholder="Your university or board"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">Subject expertise</span>
              <input
                required
                value={verificationForm.subjectExpertise}
                onChange={(event) =>
                  setVerificationForm((current) => ({ ...current, subjectExpertise: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400 dark:border-slate-800 dark:bg-slate-950"
                placeholder="Commerce, Mathematics, Physics..."
              />
            </label>

            <label className="lg:col-span-2 block cursor-pointer rounded-[24px] border border-dashed border-slate-200 bg-white p-4 transition hover:border-amber-300 dark:border-slate-800 dark:bg-slate-900">
              <input
                ref={verificationFileRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                className="sr-only"
                onChange={(event) => setVerificationFile(event.target.files?.[0] ?? null)}
              />
              <div className="flex items-start gap-4">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {verificationFile ? verificationFile.name : "Upload college ID card"}
                  </p>
                  <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
                    JPG, PNG, WEBP, or PDF. This is reviewed by admin and not shown publicly.
                  </p>
                </div>
              </div>
            </label>

            <div className="lg:col-span-2 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={verificationBusy}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
              >
                {verificationBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                {verificationBusy ? "Submitting verification..." : "Submit teacher verification"}
              </button>
              <button
                type="button"
                onClick={() => setShowVerificationForm(false)}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-200"
              >
                Cancel
              </button>
            </div>
              </form>
            ) : null}

            {showUploadForm && isVerifiedTeacher ? (
          <form onSubmit={uploadTeacherNote} className="mt-5 grid gap-4 border-b border-slate-200 bg-slate-50/80 py-6 dark:border-slate-800 dark:bg-slate-950/40 lg:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">Note title</span>
              <input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400 dark:border-slate-800 dark:bg-slate-950"
                placeholder="Full Corporate Accounting Notes"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">Subject</span>
              <input
                required
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400 dark:border-slate-800 dark:bg-slate-950"
                placeholder="Corporate Accounting"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">Stream</span>
              <FormSelect
                value={stream}
                onChange={setStream}
                options={streamOptions.map((option) => ({ label: option, value: option }))}
              />
            </label>

            <label className="block cursor-pointer rounded-[24px] border border-dashed border-slate-200 bg-white p-4 transition hover:border-amber-300 dark:border-slate-800 dark:bg-slate-900">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="sr-only"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              />
              <div className="flex items-start gap-4">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedFile ? selectedFile.name : editingNoteId ? "Replace teacher notes PDF (optional)" : "Choose full notes PDF"}
                  </p>
                  <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
                    Upload one complete teacher notes PDF for students to open, save, and download.
                  </p>
                </div>
              </div>
            </label>

            <div className="lg:col-span-2 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                {busy ? (editingNoteId ? "Saving teacher notes..." : "Uploading teacher notes...") : editingNoteId ? "Save teacher notes" : "Upload teacher notes"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUploadForm(false);
                  setEditingNoteId(null);
                  setSelectedFile(null);
                }}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-200"
              >
                Cancel
              </button>
            </div>
          </form>
            ) : null}
          </div>

          <div className="mt-10 space-y-5">
          {filteredNotes.map((note) => {
            const isOwner = Number(note.uploader?.id) === Number(user?.id);

            return (
              <article
                key={note._id}
                className="group flex min-w-0 flex-col rounded-[26px] border border-slate-200 bg-white p-4 transition hover:border-amber-200 hover:shadow-[0_18px_50px_-34px_rgba(15,23,42,0.22)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-500/20"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="w-full shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:w-40 dark:border-slate-800 dark:bg-slate-950">
                    <iframe
                      src={`/api/pdf?src=${encodeURIComponent(note.fileUrl)}#page=1&toolbar=0&navpanes=0&scrollbar=0`}
                      title={`${note.title} first page preview`}
                      className="pointer-events-none h-48 w-full sm:h-52"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Verified teacher
                        </div>
                        <h3 className="line-clamp-2 text-base font-semibold leading-6 text-slate-950 dark:text-white">{note.title}</h3>
                      </div>

                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                        {note.uploader?.profilePhoto ? (
                          <Image src={note.uploader.profilePhoto} alt={note.uploader.name || "Teacher"} fill sizes="40px" className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-500 dark:text-slate-300">
                            {(note.uploader?.name || "T").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                      <p className="line-clamp-1">
                        <span className="font-semibold text-slate-900 dark:text-white">Subject:</span> {note.subject}
                      </p>
                      <p className="line-clamp-1">
                        <span className="font-semibold text-slate-900 dark:text-white">Stream:</span> {note.stream}
                      </p>
                      <p className="line-clamp-1">
                        <span className="font-semibold text-slate-900 dark:text-white">Teacher:</span>{" "}
                        {note.uploader?.name || note.uploader?.email || "Verified teacher"}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {new Date(note.createdAt).toLocaleDateString()} • {note.viewCount ?? 0} views • {note.downloadCount ?? 0} downloads
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/viewer?documentId=${note._id}&url=${encodeURIComponent(note.fileUrl)}&title=${encodeURIComponent(note.title)}&type=${note.type}`}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                  >
                    <FileText className="h-4 w-4" />
                    Open note
                  </Link>
                  <a
                    href={note.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-600 dark:border-slate-700 dark:text-slate-200"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                  {isOwner ? (
                    <button
                      type="button"
                      onClick={() => startEditTeacherNote(note)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-600 dark:border-slate-700 dark:text-slate-200"
                    >
                      Edit
                    </button>
                  ) : null}
                  {isOwner ? (
                    <button
                      type="button"
                      onClick={() => void deleteTeacherNote(note._id)}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-500/20 dark:text-rose-300 dark:hover:bg-rose-500/10"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

          {!filteredNotes.length ? (
            <div className="mt-8 flex min-h-[220px] items-center justify-center rounded-[24px] border border-dashed border-slate-200/80 bg-slate-50/40 px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900/40">
              <div className="mx-auto max-w-md space-y-2">
                <p className="text-base font-semibold text-slate-800 dark:text-slate-100">No teacher notes found</p>
                <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
                  Try another subject, teacher name, or filter to see more approved notes.
                </p>
              </div>
            </div>
          ) : null}

          <div className="fixed bottom-4 left-0 right-0 z-30">
            <div
              className="overflow-x-auto overflow-y-hidden overscroll-x-contain px-4 [&::-webkit-scrollbar]:hidden sm:px-6 lg:pl-[20rem] lg:pr-8"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <div className="mx-auto flex w-max min-w-max items-center gap-3 rounded-[22px] border border-slate-200 bg-white/95 p-2 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
                <button
                  type="button"
                  onClick={() => setActiveTeacher("All")}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
                    activeTeacher === "All"
                      ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                      : "border-transparent bg-transparent text-slate-600 hover:border-amber-200 hover:bg-amber-50/70 hover:text-amber-700 dark:text-slate-300"
                  }`}
                >
                  <FolderOpen className="h-4 w-4" />
                  All teacher folders
                </button>

                {teacherFolders.map((teacher) => (
                  <div
                    key={teacher.key}
                    className={`inline-flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left text-sm transition ${
                      activeTeacher === teacher.key
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveTeacher(teacher.key)}
                      className="inline-flex items-center gap-3 text-left"
                    >
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                        {teacher.profilePhoto ? (
                          <Image src={teacher.profilePhoto} alt={teacher.name} fill sizes="36px" className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-semibold">
                            {teacher.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="flex flex-col">
                        <span className="font-semibold">{teacher.name}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{teacher.noteCount} notes</span>
                      </span>
                    </button>
                    <Link
                      href={`/teacher-notes/teacher/${teacher.key}`}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-amber-300 hover:text-amber-700 dark:border-slate-700 dark:text-slate-300"
                    >
                      Profile
                    </Link>
                  </div>
                ))}
                {isTeacher ? (
                  <button
                    type="button"
                    onClick={openUploadFlow}
                    disabled={hasPendingVerification}
                    className="ml-1 inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                  >
                    {isVerifiedTeacher ? <UploadCloud className="h-4 w-4" /> : <BadgeCheck className="h-4 w-4" />}
                    {isVerifiedTeacher ? "Upload teacher note" : hasPendingVerification ? "Verification pending" : "Verify to upload"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="h-28 md:h-32" />
        </div>
      </section>
    </div>
  );
}
