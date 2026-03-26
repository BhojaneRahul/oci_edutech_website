import Link from "next/link";
import { ArrowUpRight, ShieldCheck, BookText } from "lucide-react";

export function TeacherNotesPromoSection() {
  return (
    <section className="py-3 sm:py-4">
      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,rgba(237,255,247,0.96),rgba(255,248,237,0.96)_48%,rgba(255,229,214,0.98))] px-6 py-6 shadow-[0_26px_70px_-45px_rgba(15,23,42,0.3)] dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.18),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(15,23,42,0.94))] sm:px-8 sm:py-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-[24px] border border-white/80 bg-white/80 text-emerald-600 shadow-[0_18px_45px_-28px_rgba(16,185,129,0.4)] backdrop-blur dark:border-white/10 dark:bg-slate-900/80 dark:text-emerald-300 lg:inline-flex">
              <BookText className="h-7 w-7" />
            </div>

            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
                Verified Teacher Notes
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[1.35rem]">
                Learn from complete notes by approved, verified teachers.
              </h3>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700 dark:text-slate-200 sm:text-[0.94rem]">
                A trusted notes library with subject-wise PDFs from verified teachers—reliable study material in one
                place.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[280px] lg:items-end">
            <Link
              href="/teacher-notes"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_22px_46px_-26px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 lg:w-[260px]"
            >
              Open teacher notes
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <div className="inline-flex items-center justify-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2.5 text-xs font-medium text-slate-700 backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Verified Teacher Notes
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
