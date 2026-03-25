import Link from "next/link";
import { ArrowUpRight, FileImage, FileText, Send } from "lucide-react";

const miniHighlights = [
  "Upload syllabus once",
  "Get latest notes faster",
  "Sent to admin for review"
];

export function SyllabusGeneratorSection() {
  return (
    <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="relative px-6 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,184,77,0.18),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(255,229,180,0.24),_transparent_22%),linear-gradient(135deg,rgba(255,255,255,1)_0%,rgba(255,249,235,0.96)_55%,rgba(255,245,219,0.92)_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.12),_transparent_28%),linear-gradient(135deg,rgba(15,23,42,1)_0%,rgba(15,23,42,0.96)_100%)]" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-700 backdrop-blur dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              <Send className="h-4 w-4" />
              Syllabus Upload
            </div>

            <h2 className="mt-5 max-w-3xl text-[1.45rem] font-semibold leading-tight tracking-tight text-slate-950 sm:text-[1.7rem] lg:text-[1.95rem] dark:text-white">
              Upload one syllabus and let the platform line up the latest prepared notes for you.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Send your syllabus to OCI - EduTech and make it easier for the platform team, verified teachers, and
              active student contributors to review the exact subject needs, refine the request, and prepare better
              study material from the most recent notes, model QPs, and uploaded resources available on the platform.
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              {miniHighlights.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/70 bg-white/90 px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-950/90 dark:text-slate-300"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="w-full max-w-md rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)] backdrop-blur dark:border-slate-700 dark:bg-slate-950/90">
            <div className="flex items-start gap-4">
              <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[0.98rem] font-semibold text-slate-950 dark:text-white">Request recent prepared material</p>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Upload a PDF or image syllabus, add your note request, and send it straight into the review flow so
                  the team can prepare fresher study support faster.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              <PromoRow icon={FileImage} label="Reads PDF and image syllabus files" />
              <PromoRow icon={FileText} label="Helps the team prepare recent notes faster" />
              <PromoRow icon={Send} label="Sends your request to admin review directly" />
            </div>

            <div className="mt-5">
              <Link
                href="/syllabus-to-notes"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
              >
                Open syllabus request form
                <ArrowUpRight className="h-4 w-4" />
              </Link>
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
