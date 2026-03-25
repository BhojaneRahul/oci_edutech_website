import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";

export function SyllabusGeneratorSection() {
  return (
    <section className="py-3 sm:py-4">
      <div className="flex flex-col gap-4 border-y border-slate-200/80 py-5 dark:border-slate-800/80 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-amber-500 dark:border-slate-800 dark:bg-slate-900 dark:text-amber-300">
            <FileText className="h-5 w-5" />
          </div>

          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-300">
              Syllabus Requests
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-950 dark:text-white sm:text-xl">
              Request recent prepared notes from the latest platform material
            </h3>
            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Upload your syllabus PDF or image, type your request, and send it directly for review so the team can
              prepare fresher study support from verified teacher notes, model questions, and recent uploaded resources.
            </p>
          </div>
        </div>

        <div className="w-full lg:w-auto lg:min-w-[300px]">
          <Link
            href="/syllabus-to-notes"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            Open syllabus request form
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
