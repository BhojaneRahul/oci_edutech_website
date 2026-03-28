import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Eye, FileText, ShieldCheck } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PDFPagePreview } from "@/components/pdf/pdf-page-preview";
import { SafeAvatar } from "@/components/ui/safe-avatar";
import { serverApi } from "@/lib/server-api";

export default async function TeacherProfilePage({
  params
}: {
  params: { teacherId: string };
}) {
  const { teacherId } = params;
  const teacherNotes = await serverApi.getTeacherNotes().catch(() => []);
  const notes = teacherNotes.filter((note) => String(note.uploader?.id ?? note.uploader?.email ?? note._id) === teacherId);
  const teacher = notes[0]?.uploader;

  if (!teacherId) {
    notFound();
  }

  return (
    <DashboardShell fullBleed>
      <section className="bg-[linear-gradient(180deg,#fffdf8_0%,#ffffff_20%,#f8fafc_100%)] px-4 pb-12 pt-4 dark:bg-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 shadow-[0_20px_70px_-40px_rgba(15,23,42,0.22)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
            <div className="border-b border-slate-200/80 px-5 py-5 dark:border-slate-800 sm:px-7">
              <Link href="/teacher-notes" className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600 transition hover:text-amber-500">
                <ArrowLeft className="h-4 w-4" />
                Back to Teacher Notes
              </Link>
            </div>
            <div className="grid gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 shadow-inner dark:border-slate-800 dark:bg-slate-900">
                  <SafeAvatar
                    src={teacher?.profilePhoto ?? null}
                    alt={teacher?.name || "Teacher"}
                    className="h-full w-full object-cover"
                    fallback={(teacher?.name || "T").slice(0, 1).toUpperCase()}
                    fallbackClassName="h-full w-full text-3xl font-semibold text-slate-500"
                  />
                </div>
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified Teacher
                  </div>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                    {teacher?.name || "Teacher profile"}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                    Browse complete lecturer notes uploaded by this verified teacher. Each note is organized for clean reading, quick revision, and dependable subject-wise study support.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Folder summary</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{notes.length}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">uploaded notes available</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  Open any notes to preview the first page, then continue with full reading or download.
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {notes.map((note) => (
              <article
                key={String(note._id)}
                className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_44px_-34px_rgba(15,23,42,0.24)] transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-[0_24px_56px_-34px_rgba(245,158,11,0.2)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-500/20"
              >
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 pb-4 pt-5 dark:border-slate-800">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified Teacher
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                    <SafeAvatar
                      src={teacher?.profilePhoto ?? null}
                      alt={teacher?.name || "Teacher"}
                      className="h-full w-full object-cover"
                      fallback={(teacher?.name || "T").slice(0, 1).toUpperCase()}
                      fallbackClassName="h-full w-full text-sm font-semibold text-slate-500"
                    />
                  </div>
                </div>
                <div className="p-5">
                  <PDFPagePreview url={note.fileUrl} title={note.title} canvasClassName="min-h-[170px] bg-white sm:min-h-[190px]" />
                  <div className="mt-5 space-y-3">
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">{note.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Subject-wise lecturer notes curated for structured reading, quick revision, and dependable classroom-style preparation.
                      </p>
                    </div>
                    <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                      <p>
                        <span className="font-semibold text-slate-900 dark:text-white">Subject:</span> {note.subject}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900 dark:text-white">Stream:</span> {note.stream}
                      </p>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {new Date(note.createdAt).toLocaleDateString()} • {note.viewCount ?? 0} views • {note.downloadCount ?? 0} downloads
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={`/viewer?documentId=${note._id}&url=${encodeURIComponent(note.fileUrl)}&title=${encodeURIComponent(note.title)}&type=${note.type}`}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                    >
                      <Eye className="h-4 w-4" />
                      Open notes
                    </Link>
                    <a
                      href={note.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-600 dark:border-slate-700 dark:text-slate-200"
                    >
                      <Download className="h-4 w-4" />
                      Download notes
                    </a>
                    <Link
                      href={`/viewer?documentId=${note._id}&url=${encodeURIComponent(note.fileUrl)}&title=${encodeURIComponent(note.title)}&type=${note.type}`}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-200"
                    >
                      <FileText className="h-4 w-4" />
                      Quick read
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {!notes.length ? (
            <div className="border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              No notes are available in this teacher folder yet.
            </div>
          ) : null}
        </div>
      </section>
    </DashboardShell>
  );
}
