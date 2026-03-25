import Link from "next/link";
import { ArrowUpRight, ShieldCheck, BookText } from "lucide-react";

export function TeacherNotesPromoSection() {
  return (
    <section className="border-y border-slate-200/80 bg-transparent py-5 dark:border-slate-800/80 sm:py-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            <BookText className="h-7 w-7" />
          </div>

          <div className="max-w-3xl pt-1">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-950 dark:text-white">
              Verified Teacher Notes
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200 sm:text-[0.95rem]">
              Browse full complete notes uploaded only by approved verified teachers. Students get a cleaner trusted
              note library, while teachers can publish subject-wise PDFs after their college ID verification is approved.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[320px]">
          <Link
            href="/teacher-notes"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            Open teacher notes
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <div className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Teacher uploads unlock after verification
          </div>
        </div>
      </div>
    </section>
  );
}
