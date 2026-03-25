import Link from "next/link";
import { ArrowUpRight, BadgeCheck, FileText, Sparkles, Wand2 } from "lucide-react";

export function SyllabusGeneratorSection() {
  return (
    <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-0 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="relative p-7 sm:p-9 lg:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,140,0,0.14),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(255,195,0,0.18),_transparent_30%)]" />
          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              <Wand2 className="h-4 w-4" />
              AI Study Builder
            </div>

            <div className="max-w-2xl space-y-3">
              <h2 className="text-[1.9rem] font-semibold tracking-tight text-slate-950 sm:text-[2.2rem] dark:text-white">
                Turn your syllabus into smart notes, unit insights, and a ready PDF.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                Upload a syllabus copy, choose the output you need, and generate a cleaner study-ready structure with
                topics, concepts, keywords, and revision support in one guided workflow.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <FeatureCard
                icon={FileText}
                title="Upload syllabus"
                description="Start with your PDF syllabus or outline for the subject."
              />
              <FeatureCard
                icon={Sparkles}
                title="Generate smart notes"
                description="Get topic flow, concepts, key terms, and revision pointers."
              />
              <FeatureCard
                icon={BadgeCheck}
                title="View and export"
                description="Open the structured output and keep it ready for download."
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/syllabus-to-notes"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
              >
                Open Generator
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <div className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                Best for syllabus-to-notes, unit summary, and question-bank prep
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50/70 p-7 dark:border-slate-800 dark:bg-slate-950/60 xl:border-l xl:border-t-0 xl:p-8">
          <div className="mx-auto flex h-full max-w-md flex-col justify-between rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">What the generator can prepare</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Build a polished study pack from one syllabus source and shape it for revision, exam prep, or
                  structured learning.
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-3">
              <OutputChip label="Smart notes PDF" />
              <OutputChip label="Unit-wise concepts" />
              <OutputChip label="Important keywords" />
              <OutputChip label="Likely exam questions" />
              <OutputChip label="Revision-ready summary" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/80">
      <Icon className="h-5 w-5 text-amber-500" />
      <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
      <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}

function OutputChip({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:text-slate-200">
      {label}
    </div>
  );
}
