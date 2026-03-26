import Image from "next/image";
import Link from "next/link";
import { Download, FileText, ShieldCheck } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { serverApi } from "@/lib/server-api";

export default async function TeacherProfilePage({
  params
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const { teacherId } = await params;
  const teacherNotes = await serverApi.getTeacherNotes().catch(() => []);
  const notes = teacherNotes.filter((note) => String(note.uploader?.id ?? note.uploader?.email ?? note._id) === teacherId);
  const teacher = notes[0]?.uploader;

  return (
    <DashboardShell fullBleed>
      <section className="bg-white px-4 pb-10 pt-3 dark:bg-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="border-b border-slate-200 pb-6 dark:border-slate-800">
            <Link href="/teacher-notes" className="text-sm font-medium text-amber-600">
              Back to Teacher Notes
            </Link>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                {teacher?.profilePhoto ? (
                  <Image src={teacher.profilePhoto} alt={teacher.name || "Teacher"} fill sizes="64px" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-500">
                    {(teacher?.name || "T").slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified Teacher
                </div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  {teacher?.name || "Teacher profile"}
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {notes.length} uploaded note{notes.length === 1 ? "" : "s"} available in this folder.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {notes.map((note) => (
              <article
                key={String(note._id)}
                className="border border-slate-200 bg-white p-5 transition hover:border-amber-200 hover:shadow-[0_18px_50px_-34px_rgba(15,23,42,0.22)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-500/20"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified teacher
                </div>
                <h2 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">{note.title}</h2>
                <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <p>
                    <span className="font-semibold text-slate-900 dark:text-white">Subject:</span> {note.subject}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900 dark:text-white">Stream:</span> {note.stream}
                  </p>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
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
