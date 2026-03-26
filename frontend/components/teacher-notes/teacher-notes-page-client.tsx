"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  BookOpenText,
  Download,
  FileText,
  FolderOpen,
  GraduationCap,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud
} from "lucide-react";
import { api } from "@/lib/api";
import { CommunityBootstrap, Document } from "@/lib/types";
import { useAuth } from "../providers/auth-provider";
import { FormSelect } from "../ui/form-select";

const streamOptions = ["BCA", "B.Com", "BSc", "BA", "BBA", "1st PUC", "2nd PUC"];
const categoryOptions = ["All", "Full Notes", "Revision", "Important Questions", "Unit Notes"];

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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [stream, setStream] = useState("BCA");
  const [activeStream, setActiveStream] = useState("All");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTeacher, setActiveTeacher] = useState("All");
  const [search, setSearch] = useState("");
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
  const showTeacherHero = !isVerifiedTeacher;

  const streamChips = useMemo(() => {
    const uniqueStreams = Array.from(new Set(teacherNotes.map((note) => note.stream))).filter(Boolean);
    return ["All", ...uniqueStreams];
  }, [teacherNotes]);

  useEffect(() => {
    if (user) {
      setVerificationForm((current) => ({
        ...current,
        fullName: current.fullName || user.name || "",
        universityBoard: current.universityBoard || user.university || ""
      }));
    }
  }, [user]);

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
    return teacherNotes.filter((note) => {
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
  }, [activeCategory, activeStream, activeTeacher, search, teacherNotes]);

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
    if (!selectedFile) {
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
      formData.append("file", selectedFile);

      const response = await api.post<{ success: true; message: string; document: Document }>("/documents/teacher-notes", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setUploadMessage(response.data.message);
      setTitle("");
      setSubject("");
      setStream("BCA");
      setSelectedFile(null);
      setShowUploadForm(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await queryClient.invalidateQueries({ queryKey: ["teacher-notes"] });
    } catch (error: any) {
      setUploadMessage(error?.response?.data?.message || "We could not upload the teacher note right now.");
    } finally {
      setBusy(false);
    }
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
      setUploadMessage("Teacher note deleted successfully.");
      await queryClient.invalidateQueries({ queryKey: ["teacher-notes"] });
    } catch (error: any) {
      setUploadMessage(error?.response?.data?.message || "We could not delete this teacher note right now.");
    }
  };

  return (
    <div className="space-y-6">
      {showTeacherHero ? (
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="rounded-[28px] border border-slate-200/70 bg-[linear-gradient(135deg,rgba(255,247,214,0.9),rgba(255,255,255,0.96),rgba(226,255,244,0.82))] px-5 py-5 dark:border-slate-800/80 dark:bg-[linear-gradient(135deg,rgba(38,38,14,0.42),rgba(15,23,42,0.94),rgba(4,120,87,0.18))]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700 shadow-sm dark:border-emerald-500/20 dark:bg-slate-950/60 dark:text-emerald-300">
              <BookOpenText className="h-4 w-4" />
              Teacher Notes
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Full notes from verified teachers
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-8 text-slate-500 dark:text-slate-400">
              Browse cleaner subject-wise PDFs from approved teachers, search by stream or subject, and open trusted notes
              without mixing them into the general uploads library.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-200">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Full notes only
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-200">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Verified teacher uploads
              </span>
              {hasPendingVerification ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 shadow-sm dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200">
                  <BadgeCheck className="h-4 w-4" />
                  Verification pending
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row lg:flex-col lg:items-end">
            {isTeacher ? (
              <button
                type="button"
                onClick={openUploadFlow}
                disabled={hasPendingVerification}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
              >
                {isVerifiedTeacher ? <UploadCloud className="h-4 w-4" /> : <BadgeCheck className="h-4 w-4" />}
                {isVerifiedTeacher ? "Upload teacher note" : hasPendingVerification ? "Verification pending" : "Verify to upload"}
              </button>
            ) : null}
            <div className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 dark:border-slate-800 dark:text-slate-300">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              {isVerifiedTeacher
                ? "Verified teacher access active"
                : hasPendingVerification
                  ? "Admin review is in progress"
                : isTeacher
                  ? "Verify once to unlock uploads later"
                  : "Students can browse teacher notes only"}
            </div>
          </div>
        </div>
        </div>

        {showVerificationForm && isTeacher && !isVerifiedTeacher ? (
          <form
            onSubmit={submitTeacherVerification}
            className="mt-5 grid gap-4 rounded-[28px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/70 lg:grid-cols-2"
          >
            <div className="lg:col-span-2">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">Verify once, then upload anytime</p>
              <p className="mt-1 text-sm leading-7 text-slate-500 dark:text-slate-400">
                Submit your college ID and subject details here when you are ready to upload teacher notes. You can also
                complete this same verification later inside Community when you are ready to join teacher chat. Once admin
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
      </section>
      ) : null}

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        {uploadMessage ? (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
            {uploadMessage}
          </div>
        ) : null}

        {verificationMessage ? (
          <div className="mb-5 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200">
            {verificationMessage}
          </div>
        ) : null}

        {loading ? (
          <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
            Checking your teacher access...
          </div>
        ) : null}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-600">Library</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Teacher notes</h2>
            <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
              Search by note title, subject, teacher, or stream and open full PDFs uploaded by approved teachers.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">{filteredNotes.length} notes in view</p>
            {isVerifiedTeacher ? (
              <button
                type="button"
                onClick={openUploadFlow}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
              >
                <UploadCloud className="h-4 w-4" />
                Upload teacher note
              </button>
            ) : null}
          </div>
        </div>

        {showUploadForm && isVerifiedTeacher ? (
          <form onSubmit={uploadTeacherNote} className="mt-5 grid gap-4 rounded-[28px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/70 lg:grid-cols-2">
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
                    {selectedFile ? selectedFile.name : "Choose full notes PDF"}
                  </p>
                  <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
                    Upload one complete teacher note PDF for students to open and download.
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
                {busy ? "Uploading teacher note..." : "Upload full teacher note"}
              </button>
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-200"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search teacher notes, subjects, or teacher names"
              className="w-full rounded-2xl border border-slate-200 bg-transparent px-11 py-3 text-sm outline-none transition focus:border-amber-400 dark:border-slate-800"
            />
          </label>
          <div className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 dark:border-slate-800 dark:text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Verified teacher uploads only
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
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

        <div className="mt-3 flex flex-wrap gap-2">
          {streamChips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setActiveStream(chip)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeStream === chip
                  ? "bg-amber-500 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:text-amber-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Teacher folders</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActiveTeacher("All")}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                activeTeacher === "All"
                  ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                  : "border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              }`}
            >
              <FolderOpen className="h-4 w-4" />
              All teacher folders
            </button>

            {teacherFolders.map((teacher) => (
              <button
                key={teacher.key}
                type="button"
                onClick={() => setActiveTeacher(teacher.key)}
                className={`inline-flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  activeTeacher === teacher.key
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                }`}
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
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {filteredNotes.map((note) => {
            const isOwner = Number(note.uploader?.id) === Number(user?.id);

            return (
              <article
                key={note._id}
                className="group flex h-full flex-col rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-[0_18px_50px_-34px_rgba(15,23,42,0.32)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-500/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verified teacher
                    </div>
                    <h3 className="text-lg font-semibold leading-8 text-slate-950 dark:text-white">{note.title}</h3>
                  </div>

                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                    {note.uploader?.profilePhoto ? (
                      <Image src={note.uploader.profilePhoto} alt={note.uploader.name || "Teacher"} fill sizes="48px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-500 dark:text-slate-300">
                        {(note.uploader?.name || "T").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <p>
                    <span className="font-semibold text-slate-900 dark:text-white">Subject:</span> {note.subject}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900 dark:text-white">Stream:</span> {note.stream}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900 dark:text-white">Teacher:</span>{" "}
                    {note.uploader?.name || note.uploader?.email || "Verified teacher"}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                  <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{note.viewCount ?? 0} views</span>
                  <span>•</span>
                  <span>{note.downloadCount ?? 0} downloads</span>
                </div>

                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  <Link
                    href={`/viewer?documentId=${note._id}&url=${encodeURIComponent(note.fileUrl)}&title=${encodeURIComponent(note.title)}&type=${note.type}`}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                  >
                    <FileText className="h-4 w-4" />
                    Open note
                  </Link>
                  <a
                    href={note.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-600 dark:border-slate-700 dark:text-slate-200"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                  {isOwner ? (
                    <button
                      type="button"
                      onClick={() => void deleteTeacherNote(note._id)}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-500/20 dark:text-rose-300 dark:hover:bg-rose-500/10"
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
          <div className="mt-6 rounded-[28px] border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            No teacher notes match your current search or filter. Try another stream, subject, or teacher name.
          </div>
        ) : null}
      </section>
    </div>
  );
}
