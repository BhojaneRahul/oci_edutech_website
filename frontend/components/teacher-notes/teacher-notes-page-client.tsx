"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BookMarked,
  Download,
  FileText,
  GraduationCap,
  Search,
  Loader2,
  ShieldCheck,
  SlidersHorizontal,
  UploadCloud
} from "lucide-react";
import { api } from "@/lib/api";
import { Document } from "@/lib/types";
import { useAuth } from "../providers/auth-provider";
import { FormSelect } from "../ui/form-select";

const streamOptions = ["BCA", "B.Com", "BSc", "BA", "BBA", "1st PUC", "2nd PUC"];

export function TeacherNotesPageClient({ initialNotes }: { initialNotes: Document[] }) {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [stream, setStream] = useState("BCA");
  const [activeStream, setActiveStream] = useState("All");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: teacherNotes = [] } = useQuery({
    queryKey: ["teacher-notes"],
    queryFn: async () => {
      const response = await api.get<Document[]>("/documents/teacher-notes");
      return response.data;
    },
    initialData: initialNotes
  });

  const isVerifiedTeacher = user?.role === "teacher" && user?.verifiedTeacher;

  const myNotesCount = useMemo(
    () => teacherNotes.filter((note) => Number(note.uploader?.id) === Number(user?.id)).length,
    [teacherNotes, user?.id]
  );

  const streamChips = useMemo(() => {
    const uniqueStreams = Array.from(new Set(teacherNotes.map((note) => note.stream))).filter(Boolean);
    return ["All", ...uniqueStreams];
  }, [teacherNotes]);

  const highlightedSubjects = useMemo(() => {
    const counts = teacherNotes.reduce<Record<string, number>>((accumulator, note) => {
      accumulator[note.subject] = (accumulator[note.subject] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(counts)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
      .map(([subjectName]) => subjectName);
  }, [teacherNotes]);

  const filteredNotes = useMemo(() => {
    return teacherNotes.filter((note) => {
      const matchesStream = activeStream === "All" ? true : note.stream === activeStream;
      const query = search.trim().toLowerCase();
      const matchesSearch = !query
        ? true
        : [note.title, note.subject, note.stream, note.uploader?.name, note.uploader?.email]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));

      return matchesStream && matchesSearch;
    });
  }, [activeStream, search, teacherNotes]);

  const uploadTeacherNote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setMessage("Please select a PDF file first.");
      return;
    }

    setBusy(true);
    setMessage("");

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

      setMessage(response.data.message);
      setTitle("");
      setSubject("");
      setStream("BCA");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await queryClient.invalidateQueries({ queryKey: ["teacher-notes"] });
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "We could not upload the teacher note right now.");
    } finally {
      setBusy(false);
    }
  };

  const deleteTeacherNote = async (documentId: string | number) => {
    if (!window.confirm("Delete this teacher note permanently?")) {
      return;
    }

    try {
      await api.delete(`/documents/teacher-notes/${documentId}`);
      setMessage("Teacher note deleted successfully.");
      await queryClient.invalidateQueries({ queryKey: ["teacher-notes"] });
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "We could not delete this teacher note right now.");
    }
  };

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="relative px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,191,0,0.16),_transparent_30%),radial-gradient(circle_at_center_right,_rgba(255,135,0,0.14),_transparent_26%)]" />
          <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_360px]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                <ShieldCheck className="h-4 w-4" />
                Teacher Notes
              </div>

              <div className="max-w-3xl space-y-4">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl xl:text-[2.8rem] dark:text-white">
                  Verified teachers publish the full notes. Students get a cleaner, trusted note library.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">
                  This space is reserved for complete subject notes uploaded only by approved verified teachers. Students can
                  quickly browse trusted PDFs, filter by stream, open the latest full notes, and study from one cleaner
                  library without mixing them with general uploads.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <StatPill label="Published notes" value={teacherNotes.length} />
                <StatPill label="Your uploads" value={myNotesCount} />
                <StatPill label="Teacher access" value={isVerifiedTeacher ? "Unlocked" : "Verification required"} />
              </div>

              <div className="flex flex-wrap gap-3">
                {highlightedSubjects.length ? highlightedSubjects.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-950/90 dark:text-slate-200"
                  >
                    {item}
                  </span>
                )) : (
                  <span className="rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-950/90 dark:text-slate-200">
                    Full complete notes
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-white/90 p-6 shadow-[0_22px_55px_-36px_rgba(15,23,42,0.38)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
              <div className="flex items-start gap-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                  <BookMarked className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-slate-950 dark:text-white">How teacher verification works</h2>
                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                    Teachers sign up normally, choose the teacher role, and then complete verification using their college ID
                    card. Once admin approves the request, teacher-note upload access is unlocked automatically.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  "Signup as Teacher",
                  "Submit college ID verification",
                  "Get admin approval",
                  "Upload full notes here"
                ].map((step, index) => (
                  <div key={step} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{step}</span>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white dark:bg-amber-500 dark:text-slate-950">
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>

              {!isVerifiedTeacher ? (
                <Link
                  href="/community"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                >
                  Start teacher verification
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-600">Upload teacher notes</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">Verified teachers can publish full notes</h2>
              <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                Upload a complete subject PDF with a clean title, stream, and subject name so students can find it
                quickly. This upload space is only enabled for approved verified teachers.
            </p>

            {message ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                {message}
              </div>
            ) : null}

            {loading ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                Checking your teacher access...
              </div>
            ) : isVerifiedTeacher ? (
              <form className="mt-5 space-y-4" onSubmit={uploadTeacherNote}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">Note title</span>
                  <input
                    required
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-amber-400 dark:border-slate-800"
                    placeholder="Full Corporate Accounting Notes"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">Subject</span>
                  <input
                    required
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-amber-400 dark:border-slate-800"
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

                <label className="block cursor-pointer rounded-[28px] border border-dashed border-slate-200 bg-slate-50/80 p-5 transition hover:border-amber-300 dark:border-slate-800 dark:bg-slate-950/80">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                  />
                  <div className="flex items-start gap-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {selectedFile ? selectedFile.name : "Choose full notes PDF"}
                      </p>
                      <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">
                        Upload one complete PDF note file. Large study PDFs are supported.
                      </p>
                    </div>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                  {busy ? "Uploading teacher note..." : "Upload full teacher note"}
                </button>
              </form>
            ) : (
              <div className="mt-5 rounded-[28px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-slate-800">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">Read-only access for students</p>
                    <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                      Only approved verified teachers can upload here. If you registered as a teacher, finish your
                      college ID verification first. Students can still browse and open every published teacher note
                      below.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-600">Library</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Latest teacher notes</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Search by title, subject, or teacher and filter notes quickly by stream.
                </p>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{filteredNotes.length} notes in view</p>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search teacher notes, subjects, or teacher names"
                  className="w-full rounded-2xl border border-slate-200 bg-transparent px-11 py-3 text-sm outline-none transition focus:border-amber-400 dark:border-slate-800"
                />
              </label>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 dark:border-slate-800 dark:text-slate-300">
                <SlidersHorizontal className="h-4 w-4 text-amber-500" />
                Teacher uploads only
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
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
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
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
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              No teacher notes match your current search or filter. Try another stream, subject, or teacher name.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
