import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";

export function SyllabusGeneratorSection() {
  return (
    <section className="overflow-hidden rounded-[32px] border border-amber-100 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="relative p-5 sm:p-6 lg:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,244,194,0.92)_0%,rgba(255,225,165,0.92)_35%,rgba(255,205,177,0.95)_100%)] dark:bg-[linear-gradient(90deg,rgba(71,45,8,0.9)_0%,rgba(124,45,18,0.78)_100%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border-4 border-white bg-white text-amber-500 shadow-[0_14px_34px_-24px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900 dark:text-amber-300">
              <FileText className="h-7 w-7" />
            </div>

            <div className="max-w-2xl pt-1">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-950 dark:text-white">
                Request Recent Prepared Material
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200 sm:text-[0.95rem]">
                Upload a PDF or image syllabus, add your note request, and send it straight into the review flow so the
                team can prepare fresher study support faster. The request reaches the platform for review, helps match
                the latest available study material, and makes it easier to prepare better notes for your exact subject
                needs.
              </p>
            </div>
          </div>

          <div className="w-full lg:w-auto lg:min-w-[320px]">
            <Link
              href="/syllabus-to-notes"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-950 dark:hover:bg-black"
            >
              Open syllabus request form
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
