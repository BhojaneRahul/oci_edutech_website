"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Bookmark, BookmarkCheck, ChevronDown, ChevronRight, Download, FileText, FolderOpen, GraduationCap, Loader2, Search, Share2, ShieldCheck, SlidersHorizontal, UploadCloud, X } from "lucide-react";
import { api } from "@/lib/api";
import { CommunityBootstrap, Document } from "@/lib/types";
import { useAuth } from "../providers/auth-provider";
import { PDFPagePreview } from "../pdf/pdf-page-preview";
import { SafeAvatar } from "../ui/safe-avatar";
import { resolveMediaUrl } from "@/lib/utils";

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
  if (note.noteCategory && categoryOptions.includes(note.noteCategory as (typeof categoryOptions)[number])) {
    return note.noteCategory;
  }

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
  const [selectedStreams, setSelectedStreams] = useState<string[]>(["BCA"]);
  const [noteCategory, setNoteCategory] = useState("Full Notes");
  const [editingNoteId, setEditingNoteId] = useState<string | number | null>(null);
  const [activeStream, setActiveStream] = useState("All");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTeacher, setActiveTeacher] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]["value"]>("latest");
  const [isToolbarPinned, setIsToolbarPinned] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [verificationBusy, setVerificationBusy] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [showTeacherFoldersSheet, setShowTeacherFoldersSheet] = useState(false);
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
  const isSidePanelOpen = showUploadForm || showVerificationForm;

  const closeSidePanel = () => {
    setShowUploadForm(false);
    setShowVerificationForm(false);
    setEditingNoteId(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (verificationFileRef.current) {
      verificationFileRef.current.value = "";
    }
  };

  const toggleStream = (value: string) => {
    setSelectedStreams((current) => {
      if (current.includes(value)) {
        if (current.length === 1) {
          return current;
        }
        return current.filter((item) => item !== value);
      }

      return [...current, value];
    });
  };

  const closeTeacherFoldersSheet = () => {
    setShowTeacherFoldersSheet(false);
  };

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
    const handleScroll = () => {
      setIsToolbarPinned(window.scrollY > 140);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!uploadMessage && !verificationMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setUploadMessage("");
      setVerificationMessage("");
    }, 3800);

    return () => window.clearTimeout(timeout);
  }, [uploadMessage, verificationMessage]);

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

  const groupedLecturerNotes = useMemo(() => {
    const grouped = new Map<
      string,
      {
        key: string;
        name: string;
        email: string;
        profilePhoto?: string | null;
        notes: Document[];
      }
    >();

    filteredNotes.forEach((note) => {
      const key = String(note.uploader?.id ?? note.uploader?.email ?? note._id);
      const existing = grouped.get(key);

      if (existing) {
        existing.notes.push(note);
        return;
      }

      grouped.set(key, {
        key,
        name: note.uploader?.name || "Verified lecturer",
        email: note.uploader?.email || "",
        profilePhoto: note.uploader?.profilePhoto ?? null,
        notes: [note]
      });
    });

    return Array.from(grouped.values()).sort((left, right) => left.name.localeCompare(right.name));
  }, [filteredNotes]);

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
        setSelectedStreams(["BCA"]);
        setNoteCategory("Full Notes");
        setSelectedFile(null);
      }
      setShowUploadForm(true);
      return;
    }

    if (isTeacher) {
      setShowUploadForm(false);
      setShowVerificationForm(true);
      return;
    }

    setUploadMessage("Lecturer Notes uploads are available only for verified lecturer accounts.");
  };

  const uploadTeacherNote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanSubject = subject.trim();
    const cleanStreams = selectedStreams.map((value) => value.trim()).filter(Boolean);

    if (!cleanTitle || !cleanSubject || !cleanStreams.length) {
      setUploadMessage("Title, subject, and at least one stream are required.");
      return;
    }

    if (!selectedFile && !editingNoteId) {
      setUploadMessage("Please select a PDF file first.");
      return;
    }

    setBusy(true);
    setUploadMessage("");

    try {
      const formData = new FormData();
      formData.append("title", cleanTitle);
      formData.append("subject", cleanSubject);
      formData.append("noteCategory", noteCategory);
      if (cleanStreams[0]) {
        formData.append("stream", cleanStreams[0]);
      }
      cleanStreams.forEach((selectedStream) => {
        formData.append("streams[]", selectedStream);
        formData.append("streams", selectedStream);
      });
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const response = editingNoteId
        ? await api.put<{ success: true; message: string; document: Document }>(`/documents/teacher-notes/${editingNoteId}`, formData)
        : await api.post<{ success: true; message: string; document: Document }>("/documents/teacher-notes", formData);

      setUploadMessage(response.data.message);
      setTitle("");
      setSubject("");
      setSelectedStreams(["BCA"]);
      setNoteCategory("Full Notes");
      setEditingNoteId(null);
      setSelectedFile(null);
      closeSidePanel();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await queryClient.invalidateQueries({ queryKey: ["teacher-notes"] });
    } catch (error: any) {
      setUploadMessage(
        error?.response?.data?.message ||
          (editingNoteId ? "We could not update the lecturer notes right now." : "We could not upload the lecturer notes right now.")
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
    setSelectedStreams([note.stream]);
    setNoteCategory(getTeacherNoteCategory(note));
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

  const shareLecturerNote = async (note: Document) => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaUrl = resolveMediaUrl(note.fileUrl) ?? note.fileUrl;
    const lecturerName = note.uploader?.name || note.uploader?.email || "Verified lecturer";
    const shareTitle = note.title || "Lecturer Notes";
    const shareText = `${shareTitle} • ${note.subject || "Subject"} • ${lecturerName}`;
    const shareUrl = `${window.location.origin}/viewer?documentId=${encodeURIComponent(String(note._id))}&url=${encodeURIComponent(
      mediaUrl
    )}&title=${encodeURIComponent(shareTitle)}&type=${encodeURIComponent(note.type || "pdf")}`;

    try {
      if (navigator.share) {
        try {
          const response = await fetch(mediaUrl);
          const blob = await response.blob();
          const extension = blob.type?.includes("pdf") ? "pdf" : "file";
          const file = new File([blob], `${shareTitle}.${extension}`, {
            type: blob.type || "application/pdf"
          });

          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({
              title: shareTitle,
              text: shareText,
              files: [file]
            });
            return;
          }
        } catch {
          // Fall back to link-based share.
        }

        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
        return;
      }

      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setUploadMessage("Lecturer notes link copied.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setUploadMessage("Lecturer notes link copied.");
      } catch {
        setUploadMessage("Unable to share lecturer notes right now.");
      }
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

      const response = await api.post<{ success: true; message: string }>("/community/teacher-verification", formData);

      setVerificationMessage(response.data.message);
      closeSidePanel();
      setVerificationFile(null);
      if (verificationFileRef.current) {
        verificationFileRef.current.value = "";
      }
    } catch (error: any) {
      setVerificationMessage(error?.response?.data?.message || "We could not submit lecturer verification right now.");
    } finally {
      setVerificationBusy(false);
    }
  };

  const deleteTeacherNote = async (documentId: string | number) => {
    if (!window.confirm("Delete these lecturer notes permanently?")) {
      return;
    }

    try {
      await api.delete(`/documents/teacher-notes/${documentId}`);
      setUploadMessage("Lecturer notes deleted successfully.");
      await queryClient.invalidateQueries({ queryKey: ["teacher-notes"] });
    } catch (error: any) {
      setUploadMessage(error?.response?.data?.message || "We could not delete these lecturer notes right now.");
    }
  };

  const lecturerRailRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollLecturerRow = (teacherKey: string) => {
    const rail = lecturerRailRefs.current[teacherKey];
    if (!rail) {
      return;
    }

    const amount = Math.max(rail.clientWidth * 0.72, 260);
    rail.scrollBy({ left: amount, behavior: "smooth" });
  };

  const renderLecturerCard = (note: Document) => {
    const isOwner = Number(note.uploader?.id) === Number(user?.id);
    const mediaUrl = resolveMediaUrl(note.fileUrl) ?? note.fileUrl;
    const isSaved = savedDocumentIds.has(String(note._id));
    const lecturerName = note.uploader?.name || note.uploader?.email || "Verified lecturer";

    return (
        <article
          key={note._id}
          className="flex min-h-[208px] min-w-0 flex-col rounded-[22px] border border-slate-200 bg-white p-3.5 shadow-[0_14px_32px_-26px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex min-w-0 gap-3">
            <div className="h-[118px] w-[88px] shrink-0 overflow-hidden rounded-[18px] border border-slate-200 bg-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:border-slate-800 dark:bg-slate-950 sm:h-[126px] sm:w-[94px]">
              <PDFPagePreview
                url={mediaUrl}
                title={note.title}
                className="h-full rounded-none border-0"
                canvasClassName="bg-white p-1.5"
            />
          </div>

            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div className="space-y-1">
                <p className="line-clamp-1 text-[11px] font-semibold leading-5 text-slate-900 dark:text-white">
                  Subject: <span className="font-medium text-slate-600 dark:text-slate-300">{note.subject}</span>
                </p>
                <p className="line-clamp-1 text-[11px] text-slate-500 dark:text-slate-400">
                {note.noteCategory || "Notes"}
              </p>
            </div>

            <p className="mt-1.5 line-clamp-2 text-[13.5px] font-semibold leading-5 text-slate-950 dark:text-white">
              {note.title}
            </p>

            <p className="mt-1.5 line-clamp-1 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-white">Lecturer:</span>{" "}
              {lecturerName}
            </p>

              <p className="mt-2 text-[10px] leading-5 text-slate-400 dark:text-slate-500">
                {new Date(note.createdAt).toLocaleDateString()} • {note.viewCount ?? 0} views • {note.downloadCount ?? 0} downloads
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <Link
                href={`/viewer?documentId=${note._id}&url=${encodeURIComponent(mediaUrl)}&title=${encodeURIComponent(note.title)}&type=${note.type}`}
                className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-slate-950 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
              >
                <FileText className="h-4 w-4" />
                Open Notes
              </Link>
              <div className="flex shrink-0 items-center gap-1.5">
                <a
                  href={mediaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-amber-300 hover:text-amber-600 dark:border-slate-700 dark:text-slate-200"
                  aria-label="Download Notes"
                  title="Download Notes"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => void toggleSavedDocument(note._id)}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
                    isSaved
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "border-slate-200 text-slate-700 hover:border-amber-300 hover:text-amber-600 dark:border-slate-700 dark:text-slate-200"
                  }`}
                  aria-label={isSaved ? "Saved Notes" : "Save Notes"}
                  title={isSaved ? "Saved Notes" : "Save Notes"}
                >
                  {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => void shareLecturerNote(note)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-amber-300 hover:text-amber-600 dark:border-slate-700 dark:text-slate-200"
                  aria-label="Share Notes"
                  title="Share Notes"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {isOwner ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => startEditTeacherNote(note)}
                  className="inline-flex min-w-0 flex-1 items-center justify-center rounded-full border border-slate-200 px-3.5 py-2 text-[11px] font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-600 dark:border-slate-700 dark:text-slate-200"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void deleteTeacherNote(note._id)}
                  className="inline-flex min-w-0 flex-1 items-center justify-center rounded-full border border-rose-200 px-3.5 py-2 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-500/20 dark:text-rose-300 dark:hover:bg-rose-500/10"
                >
                  Delete
                </button>
              </div>
            ) : null}
        </div>
      </article>
    );
  };

  return (
    <div className="min-w-0 overflow-x-hidden">
      <section className="min-w-0 bg-white dark:bg-slate-950">
        <div className="space-y-5 px-4 pb-28 pt-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              Checking your lecturer access...
            </div>
          ) : null}

          {(uploadMessage || verificationMessage) ? (
            <div className="pointer-events-none fixed left-1/2 top-[96px] z-[70] flex w-[min(440px,calc(100vw-24px))] -translate-x-1/2 flex-col gap-3 sm:left-auto sm:right-6 sm:top-[100px] sm:translate-x-0 lg:top-[104px]">
              {uploadMessage ? (
                <div className="pointer-events-auto rounded-2xl border border-amber-200 bg-white/95 px-4 py-3 text-sm text-amber-700 shadow-[0_22px_50px_-30px_rgba(15,23,42,0.45)] backdrop-blur dark:border-amber-500/20 dark:bg-slate-950/95 dark:text-amber-200">
                  {uploadMessage}
                </div>
              ) : null}
              {verificationMessage ? (
                <div className="pointer-events-auto rounded-2xl border border-sky-200 bg-white/95 px-4 py-3 text-sm text-sky-700 shadow-[0_22px_50px_-30px_rgba(15,23,42,0.45)] backdrop-blur dark:border-sky-500/20 dark:bg-slate-950/95 dark:text-sky-200">
                  {verificationMessage}
                </div>
              ) : null}
            </div>
          ) : null}

          <div
            className={`sticky top-[88px] z-20 -mx-4 bg-white/95 px-4 pt-4 backdrop-blur transition-all duration-300 dark:bg-slate-950/95 sm:top-[84px] sm:-mx-6 sm:px-6 lg:top-[72px] xl:-mx-8 xl:px-8 ${
              isToolbarPinned ? "shadow-[0_14px_35px_-26px_rgba(15,23,42,0.28)]" : ""
            }`}
          >
            <div className="flex flex-col gap-4 pb-7">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search lecturer notes, subjects, or lecturer names"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-14 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none transition focus:border-amber-400 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-950 dark:placeholder:text-slate-500 lg:pr-4"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 lg:hidden">
                    <label className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                      <select
                        value={sortBy}
                        onChange={(event) => setSortBy(event.target.value as (typeof sortOptions)[number]["value"])}
                        className="absolute inset-0 appearance-none opacity-0"
                        aria-label="Sort lecturer notes"
                      >
                        {sortOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
                <label className="relative hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex">
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
              <div
                className="relative z-10 overflow-x-auto overscroll-x-contain px-1 pb-2 pt-1 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                <div className="flex min-w-max gap-2 lg:min-w-0 lg:justify-center">
                  {categoryOptions.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setActiveCategory(chip)}
                      className={`rounded-full px-4 py-2 text-sm font-medium shadow-[0_12px_30px_-24px_rgba(15,23,42,0.35)] transition ${
                        activeCategory === chip
                          ? "bg-slate-950 text-white dark:bg-emerald-500 dark:text-slate-950"
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

            {groupedLecturerNotes.length ? (
              <div className="relative z-0 space-y-6 pt-12 sm:space-y-7 sm:pt-11 lg:space-y-8 lg:pt-10">
                {groupedLecturerNotes.map((teacherGroup) => (
                  <section
                    key={teacherGroup.key}
                    className="space-y-3 scroll-mt-56 sm:scroll-mt-60 lg:scroll-mt-64"
                  >
                    <div className="flex items-center justify-between gap-4 px-1">
                      <button
                        type="button"
                        onClick={() => setActiveTeacher(teacherGroup.key)}
                        className="flex min-w-0 items-center gap-3 text-left transition hover:text-emerald-700 dark:text-slate-100 dark:hover:text-emerald-300"
                      >
                        <SafeAvatar
                          src={teacherGroup.profilePhoto}
                          alt={teacherGroup.name}
                          fallback={teacherGroup.name?.charAt(0)?.toUpperCase() || "L"}
                          className="h-11 w-11 rounded-2xl bg-slate-50 object-contain p-0.5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
                          fallbackClassName="h-11 w-11 rounded-2xl bg-slate-100 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-[17px] font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">
                            {teacherGroup.name}
                          </span>
                          <span className="mt-0.5 block text-[12px] text-slate-500 dark:text-slate-400">
                            {teacherGroup.notes.length} notes
                          </span>
                        </span>
                      </button>

                      <Link
                        href={`/teacher-notes/teacher/${teacherGroup.key}`}
                        className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-amber-300 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        Open Folder
                      </Link>
                    </div>

                    <div className="relative">
                      <div
                        ref={(node) => {
                          lecturerRailRefs.current[teacherGroup.key] = node;
                        }}
                        className="overflow-x-auto overscroll-x-contain pb-2 [&::-webkit-scrollbar]:hidden"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                      >
                        <div className="flex min-w-max gap-4">
                        {teacherGroup.notes.map((note) => (
                          <div
                            key={String(note._id)}
                            className="w-[92vw] max-w-[404px] min-w-[92vw] snap-start sm:w-[372px] sm:min-w-[372px] lg:w-[364px] lg:min-w-[364px] xl:w-[352px] xl:min-w-[352px] 2xl:w-[340px] 2xl:min-w-[340px]"
                          >
                            {renderLecturerCard(note)}
                          </div>
                        ))}
                        </div>
                      </div>

                      {teacherGroup.notes.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => scrollLecturerRow(teacherGroup.key)}
                          className="absolute right-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-600 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.4)] backdrop-blur transition hover:text-amber-700 lg:inline-flex"
                          aria-label={`Scroll ${teacherGroup.name} notes`}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      ) : null}
                    </div>
                  </section>
                ))}
              </div>
            ) : null}

          {!filteredNotes.length ? (
            <div className="mt-8 flex min-h-[220px] items-center justify-center rounded-[24px] border border-dashed border-slate-200/80 bg-slate-50/40 px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900/40">
              <div className="mx-auto max-w-md space-y-2">
                <p className="text-base font-semibold text-slate-800 dark:text-slate-100">No lecturer notes found</p>
                <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
                  Try another subject, lecturer name, or filter to see more approved notes.
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
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setShowTeacherFoldersSheet(true);
                    } else {
                      setActiveTeacher("All");
                    }
                  }}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
                    activeTeacher === "All"
                      ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                      : "border-transparent bg-transparent text-slate-600 hover:border-amber-200 hover:bg-amber-50/70 hover:text-amber-700 dark:text-slate-300"
                  }`}
                >
                  <FolderOpen className="h-4 w-4" />
                  All lecturer folders
                </button>

                <div className="hidden items-center gap-3 lg:flex">
                  {teacherFolders.map((teacher) => (
                    <div
                      key={teacher.key}
                      className={`inline-flex items-center gap-3 px-1 py-1 text-left text-sm transition ${
                        activeTeacher === teacher.key
                          ? "text-emerald-800 dark:text-emerald-200"
                          : "text-slate-700 hover:text-emerald-700 dark:text-slate-200"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveTeacher(teacher.key)}
                        className="inline-flex items-center gap-2 text-left"
                      >
                        <span className="flex flex-col">
                          <span className="font-semibold">{teacher.name}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{teacher.noteCount} notes</span>
                        </span>
                      </button>
                      <Link
                        href={`/teacher-notes/teacher/${teacher.key}`}
                        className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-amber-300 hover:text-amber-700 dark:border-slate-700 dark:text-slate-300"
                      >
                        Open Folder
                      </Link>
                    </div>
                  ))}
                </div>
                {isTeacher ? (
                  <button
                    type="button"
                    onClick={openUploadFlow}
                    disabled={hasPendingVerification}
                    className="ml-1 inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                  >
                    {isVerifiedTeacher ? <UploadCloud className="h-4 w-4" /> : <BadgeCheck className="h-4 w-4" />}
                    {isVerifiedTeacher ? "Upload Lecturer Notes" : hasPendingVerification ? "Verification pending" : "Verify to upload"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="h-28 md:h-32" />
        </div>
      </section>

      {showTeacherFoldersSheet ? (
        <div className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] lg:hidden">
          <button
            type="button"
            aria-label="Close teacher folders"
            className="absolute inset-0"
            onClick={closeTeacherFoldersSheet}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[30px] border-t border-slate-200 bg-white px-4 pb-6 pt-4 shadow-[0_-24px_80px_-28px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-950">
            <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-300">Lecturer folders</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">Browse all folders</h3>
              </div>
              <button
                type="button"
                onClick={closeTeacherFoldersSheet}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTeacher("All");
                  closeTeacherFoldersSheet();
                }}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                  activeTeacher === "All"
                    ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                    : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                }`}
              >
                <FolderOpen className="h-4 w-4 shrink-0" />
                <span>All folders</span>
              </button>

              {teacherFolders.map((teacher) => (
                <div
                  key={teacher.key}
                  className={`rounded-2xl border px-3 py-3 transition ${
                    activeTeacher === teacher.key
                      ? "border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                      : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTeacher(teacher.key);
                      closeTeacherFoldersSheet();
                    }}
                    className="w-full text-left"
                  >
                    <div className="mb-2 min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{teacher.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{teacher.noteCount} notes</p>
                    </div>
                  </button>
                  <Link
                    href={`/teacher-notes/teacher/${teacher.key}`}
                    className="inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                    onClick={closeTeacherFoldersSheet}
                  >
                    Open Folder
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {isSidePanelOpen ? (
        <div className="fixed inset-x-0 bottom-0 top-[78px] z-40 sm:top-[82px] lg:top-[86px]">
          <button
            type="button"
            aria-label="Close lecturer notes panel"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
            onClick={closeSidePanel}
          />
          <aside className="absolute inset-y-0 right-0 flex w-full justify-end">
            <div className="h-full w-full max-w-2xl overflow-y-auto border-l border-slate-200 bg-white shadow-[0_24px_80px_-28px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-950">
              <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-300">
                      {showUploadForm ? "Upload notes" : "Lecturer verification"}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {showUploadForm
                        ? editingNoteId
                          ? "Update the uploaded PDF details, category, and streams in one clean sheet."
                          : "Add one complete PDF with the right category and streams so students can open, save, and download it easily."
                        : "Submit your academic details once. After admin approval, uploads unlock automatically everywhere."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeSidePanel}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-6 px-4 py-5 sm:px-6">
                {showVerificationForm && isTeacher && !isVerifiedTeacher ? (
                  <form onSubmit={submitTeacherVerification} className="space-y-5">
                    <section className="rounded-[28px] border border-slate-200 bg-slate-50/55 p-5 dark:border-slate-800 dark:bg-slate-900/40">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                          <BadgeCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Academic profile</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">This is used once for lecturer verification and unlocks uploads after approval.</p>
                        </div>
                      </div>
                      <div className="grid gap-4 lg:grid-cols-2">
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
                            onChange={(event) => setVerificationForm((current) => ({ ...current, subjectExpertise: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400 dark:border-slate-800 dark:bg-slate-950"
                            placeholder="Commerce, Mathematics, Physics..."
                          />
                        </label>
                      </div>
                    </section>

                    <section className="rounded-[28px] border border-dashed border-slate-200 bg-white p-5 transition hover:border-amber-300 dark:border-slate-800 dark:bg-slate-950">
                      <label className="block cursor-pointer">
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
                              JPG, PNG, WEBP, or PDF. This file is reviewed by admin and stays private.
                            </p>
                          </div>
                        </div>
                      </label>
                    </section>

                    <div className="flex flex-wrap gap-3 pt-1">
                      <button
                        type="submit"
                        disabled={verificationBusy}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                      >
                        {verificationBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                        {verificationBusy ? "Submitting verification..." : "Submit lecturer verification"}
                      </button>
                      <button
                        type="button"
                        onClick={closeSidePanel}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : null}

                {showUploadForm && isVerifiedTeacher ? (
                  <form onSubmit={uploadTeacherNote} className="space-y-5">
                    <section className="rounded-[28px] border border-slate-200 bg-slate-50/55 p-5 dark:border-slate-800 dark:bg-slate-900/40">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Note details</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Add a clean title, subject, and streams so students can find the notes quickly.</p>
                        </div>
                      </div>
                      <div className="grid gap-4 lg:grid-cols-2">
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

                      </div>
                      <div className="mt-4 space-y-2">
                        <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">Streams</span>
                        <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">Choose one or more streams if this same PDF is useful across multiple courses.</p>
                        <div className="flex flex-wrap gap-2">
                          {streamOptions.map((option) => {
                            const active = selectedStreams.includes(option);
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => toggleStream(option)}
                                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                                  active
                                    ? "bg-slate-950 text-white dark:bg-amber-500 dark:text-slate-950"
                                    : "border border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                                }`}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </section>

                    <section className="rounded-[28px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Choose note category</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Students use these same chips in the library, so pick the category that matches this PDF best.</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {categoryOptions
                          .filter((option) => option !== "All")
                          .map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setNoteCategory(option)}
                              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                                noteCategory === option
                                  ? "bg-slate-950 text-white dark:bg-amber-500 dark:text-slate-950"
                                  : "border border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                      </div>
                    </section>

                    <section className="rounded-[28px] border border-dashed border-slate-200 bg-white p-5 transition hover:border-amber-300 dark:border-slate-800 dark:bg-slate-950">
                      <label className="block cursor-pointer">
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
                              {selectedFile ? selectedFile.name : editingNoteId ? "Replace lecturer notes PDF (optional)" : "Choose full notes PDF"}
                            </p>
                            <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
                              Upload one complete lecturer notes PDF for students to open, save, and download.
                            </p>
                          </div>
                        </div>
                      </label>
                    </section>

                    <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                    {busy ? (editingNoteId ? "Saving lecturer notes..." : "Uploading lecturer notes...") : editingNoteId ? "Save lecturer notes" : "Upload lecturer notes"}
                  </button>
                      <button
                        type="button"
                        onClick={closeSidePanel}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
