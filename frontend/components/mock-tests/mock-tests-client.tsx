"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { ArrowRight, Clock3, FileQuestion, GraduationCap } from "lucide-react";
import { MockTest } from "@/lib/types";

export function MockTestsClient({ tests }: { tests: MockTest[] }) {
  return (
    <div className="space-y-6">
      {tests.length ? (
        <section className="grid gap-5 xl:grid-cols-2">
          {tests.map((test) => (
            <article
              key={test._id}
              className="group rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-500/30"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                  <FileQuestion className="h-7 w-7" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      {test.difficulty}
                    </span>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                      {test.subject}
                    </span>
                  </div>

                  <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                    {test.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">{test.description}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <MetricTile icon={FileQuestion} label="Questions" value={String(test.totalQuestions)} />
                <MetricTile icon={Clock3} label="Duration" value={`${test.durationMinutes} min`} />
                <MetricTile icon={GraduationCap} label="Stream" value={test.stream} />
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{test.degree?.name ?? test.stream}</span>
                  {" • "}
                  Sequential locked mode
                </div>

                <Link
                  href={`/mock-tests/${test._id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 dark:bg-white dark:text-slate-950 dark:hover:bg-amber-400"
                >
                  Start test
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No mock tests are available yet. Add a test from the admin panel to start practicing.
        </section>
      )}
    </div>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <Icon className="h-4 w-4 text-amber-500" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">{label}</span>
      </div>
      <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
