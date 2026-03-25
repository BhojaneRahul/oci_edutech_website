import Link from "next/link";
import { ArrowUpRight, FileImage, FileText, Sparkles, Wand2 } from "lucide-react";

const miniHighlights = ["PDF or image upload", "AI smart notes", "Questions and revision PDF"];

export function SyllabusGeneratorSection() {
  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="relative p-6 sm:p-7 lg:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,140,0,0.12),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(255,195,0,0.15),_transparent_28%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              <Wand2 className="h-4 w-4" />
              AI Study Builder
            </div>

            <div className="mt-5 max-w-3xl space-y-3">
              <h2 className="text-[1.35rem] font-semibold tracking-tight text-slate-950 sm:text-[1.55rem] lg:text-[1.7rem] dark:text-white">
                Turn one syllabus into smart notes, likely questions, and a ready PDF.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                Upload a syllabus PDF or image and generate a cleaner study pack with extracted units, important
                concepts, revision points, and exam-focused questions.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5">
              {miniHighlights.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-slate-200 bg-white/90 px-3.5 py-2 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-950/90 dark:text-slate-300"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/syllabus-to-notes"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
              >
                Open generator
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Best for notes, unit summary, and question-bank prep
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50/60 p-6 dark:border-slate-800 dark:bg-slate-950/50 lg:border-l lg:border-t-0">
          <div className="space-y-3 rounded-[24px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-[1rem] font-semibold text-slate-950 dark:text-white">What it prepares</h3>
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
              A cleaner document output with units, key ideas, revision points, and likely questions from one syllabus.
            </p>

            <div className="space-y-2">
              <PromoRow icon={FileImage} label="Reads PDF and image uploads" />
              <PromoRow icon={Sparkles} label="Builds smart notes with AI" />
              <PromoRow icon={Wand2} label="Exports a downloadable study PDF" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PromoRow({
  icon: Icon,
  label
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-amber-500 dark:bg-slate-950">
        <Icon className="h-4 w-4" />
      </div>
      <span>{label}</span>
    </div>
  );
}
