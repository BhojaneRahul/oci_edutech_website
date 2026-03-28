import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Eye, FileText } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PDFPagePreview } from "@/components/pdf/pdf-page-preview";
import { serverApi } from "@/lib/server-api";
import { resolveMediaUrl } from "@/lib/utils";
import { SafeAvatar } from "@/components/ui/safe-avatar";

export default async function TeacherProfilePage({
  params
}: {
  params: { teacherId: string };
}) {
  const { teacherId } = params;
  const teacherNotes = await serverApi.getTeacherNotes().catch(() => []);
  const notes = teacherNotes.filter((note) => String(note.uploader?.id ?? note.uploader?.email ?? note._id) === teacherId);
  const teacher = notes[0]?.uploader;
  const totalDownloads = notes.reduce((sum, note) => sum + (note.downloadCount ?? 0), 0);
  const subjectsCovered = new Set(notes.map((note) => note.subject).filter(Boolean)).size;
  const joinedAt =
    teacher && "createdAt" in teacher && typeof teacher.createdAt === "string" ? teacher.createdAt : undefined;
  const joinedLabel = joinedAt ? new Date(joinedAt).toLocaleDateString() : "Recently joined";
  const [collegeNameRaw, universityBoardRaw] = String(teacher?.university ?? "").split("|");
  const collegeName = collegeNameRaw?.trim() || "Not shared yet";
  const universityBoard = universityBoardRaw?.trim() || String(teacher?.university ?? "").trim() || "Not shared yet";
  const accountCourse = String(teacher?.course ?? "").trim() || "Not shared yet";
  const accountSemester = String(teacher?.semester ?? "").trim() || "Not shared yet";
  const accountPhone = String(teacher?.phone ?? "").trim() || "Not shared yet";
  const accountEmail = String(teacher?.email ?? "").trim() || "Not shared yet";

  if (!teacherId) {
    notFound();
  }

  const useHorizontalRail = notes.length > 10;

  return (
    <DashboardShell fullBleed>
      <section className="bg-[linear-gradient(180deg,#fffdf8_0%,#ffffff_20%,#f8fafc_100%)] px-4 pb-12 pt-4 dark:bg-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 shadow-[0_20px_70px_-40px_rgba(15,23,42,0.22)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
            <div className="border-b border-slate-200/80 px-5 py-5 dark:border-slate-800 sm:px-7">
              <Link href="/teacher-notes" className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600 transition hover:text-amber-500">
                <ArrowLeft className="h-4 w-4" />
                Back to Lecturer Notes
              </Link>
            </div>
            <div className="grid gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
              <div className="min-w-0">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <SafeAvatar
                    src={teacher?.profilePhoto}
                    alt={teacher?.name || "Lecturer"}
                    fallback={(teacher?.name || "L").slice(0, 1).toUpperCase()}
                    className="h-20 w-20 rounded-[24px] object-cover shadow-[0_16px_30px_-20px_rgba(15,23,42,0.5)]"
                    fallbackClassName="h-20 w-20 rounded-[24px] bg-amber-100 text-2xl font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                  />
                  <div className="min-w-0">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                      {teacher?.name || "Lecturer profile"}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                      Verified lecturer profile with uploaded notes, academic details, and trusted study support for students.
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/50">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Email</p>
                    <p className="mt-2 text-sm font-medium text-slate-950 dark:text-white">{accountEmail}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/50">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">College Name</p>
                    <p className="mt-2 text-sm font-medium text-slate-950 dark:text-white">{collegeName}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/50">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">University / Board</p>
                    <p className="mt-2 text-sm font-medium text-slate-950 dark:text-white">{universityBoard}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/50">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Course</p>
                    <p className="mt-2 text-sm font-medium text-slate-950 dark:text-white">{accountCourse}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/50">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Semester</p>
                    <p className="mt-2 text-sm font-medium text-slate-950 dark:text-white">{accountSemester}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/50">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Phone</p>
                    <p className="mt-2 text-sm font-medium text-slate-950 dark:text-white">{accountPhone}</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Uploads</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{notes.length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Downloads</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{totalDownloads}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Subjects</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{subjectsCovered}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Joined</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">{joinedLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            {useHorizontalRail ? (
              <>
                <div className="overflow-x-auto overscroll-x-contain pb-2 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                  <div className="flex gap-4">
                    {notes.map((note) => {
                      const mediaUrl = resolveMediaUrl(note.fileUrl) ?? note.fileUrl;

                      return (
                        <article
                          key={String(note._id)}
                          className="w-[84vw] max-w-[320px] shrink-0 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_44px_-34px_rgba(15,23,42,0.24)] transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-[0_24px_56px_-34px_rgba(245,158,11,0.2)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-500/20 md:max-w-[280px]"
                        >
                          <div className="p-4">
                            <PDFPagePreview url={mediaUrl} title={note.title} canvasClassName="min-h-[160px] bg-white" />
                            <div className="mt-4 space-y-2">
                              <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-white">{note.title}</h2>
                              <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                                <p><span className="font-semibold text-slate-900 dark:text-white">Subject:</span> {note.subject}</p>
                                <p><span className="font-semibold text-slate-900 dark:text-white">Stream:</span> {note.stream}</p>
                              </div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">
                                {new Date(note.createdAt).toLocaleDateString()} • {note.viewCount ?? 0} views • {note.downloadCount ?? 0} downloads
                              </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <Link
                                href={`/viewer?documentId=${note._id}&url=${encodeURIComponent(mediaUrl)}&title=${encodeURIComponent(note.title)}&type=${note.type}`}
                                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                              >
                                <Eye className="h-4 w-4" />
                                Open Notes
                              </Link>
                              <a
                                href={mediaUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2.5 text-slate-700 transition hover:border-amber-300 hover:text-amber-600 dark:border-slate-700 dark:text-slate-200"
                                aria-label="Download Notes"
                                title="Download Notes"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                              <Link
                                href={`/viewer?documentId=${note._id}&url=${encodeURIComponent(mediaUrl)}&title=${encodeURIComponent(note.title)}&type=${note.type}`}
                                className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2.5 text-slate-700 transition hover:border-emerald-300 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-200"
                                aria-label="Quick Read"
                                title="Quick Read"
                              >
                                <FileText className="h-4 w-4" />
                              </Link>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {notes.map((note) => {
                  const mediaUrl = resolveMediaUrl(note.fileUrl) ?? note.fileUrl;

                  return (
                    <article
                      key={String(note._id)}
                      className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_44px_-34px_rgba(15,23,42,0.24)] transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-[0_24px_56px_-34px_rgba(245,158,11,0.2)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-500/20"
                    >
                      <div className="p-4">
                        <PDFPagePreview url={mediaUrl} title={note.title} canvasClassName="min-h-[150px] bg-white sm:min-h-[170px]" />
                        <div className="mt-4 space-y-2">
                          <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-white">{note.title}</h2>
                          <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <p><span className="font-semibold text-slate-900 dark:text-white">Subject:</span> {note.subject}</p>
                            <p><span className="font-semibold text-slate-900 dark:text-white">Stream:</span> {note.stream}</p>
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            {new Date(note.createdAt).toLocaleDateString()} • {note.viewCount ?? 0} views • {note.downloadCount ?? 0} downloads
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link
                            href={`/viewer?documentId=${note._id}&url=${encodeURIComponent(mediaUrl)}&title=${encodeURIComponent(note.title)}&type=${note.type}`}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                          >
                            <Eye className="h-4 w-4" />
                            Open Notes
                          </Link>
                          <a
                            href={mediaUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2.5 text-slate-700 transition hover:border-amber-300 hover:text-amber-600 dark:border-slate-700 dark:text-slate-200"
                            aria-label="Download Notes"
                            title="Download Notes"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          <Link
                            href={`/viewer?documentId=${note._id}&url=${encodeURIComponent(mediaUrl)}&title=${encodeURIComponent(note.title)}&type=${note.type}`}
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2.5 text-slate-700 transition hover:border-emerald-300 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-200"
                            aria-label="Quick Read"
                            title="Quick Read"
                          >
                            <FileText className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {!notes.length ? (
            <div className="border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              No notes are available in this lecturer folder yet.
            </div>
          ) : null}
        </div>
      </section>
    </DashboardShell>
  );
}
