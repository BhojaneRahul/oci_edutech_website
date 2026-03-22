"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { Award, CheckCircle2, Flame, Target, XCircle } from "lucide-react";
import { MockTest, MockTestResult } from "@/lib/types";

export function ResultPage({
  mockTest,
  result
}: {
  mockTest: MockTest;
  result: MockTestResult;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">Result</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          {mockTest.title}
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-500 dark:text-slate-400">
          Your attempt has been submitted successfully. Review your score and continue practicing.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <ResultMetric icon={Target} label="Score" value={`${result.score}/${result.totalQuestions}`} />
          <ResultMetric icon={CheckCircle2} label="Correct" value={String(result.correctAnswers)} />
          <ResultMetric icon={XCircle} label="Wrong" value={String(result.wrongAnswers)} />
          <ResultMetric icon={Award} label="Accuracy" value={`${result.accuracy}%`} />
          <ResultMetric icon={Flame} label="XP Earned" value={`+${result.xpEarned}`} />
        </div>
      </section>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/mock-tests"
          className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 hover:text-slate-950 dark:bg-white dark:text-slate-950 dark:hover:bg-amber-400"
        >
          Back to mock tests
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-amber-400/30 dark:hover:bg-amber-500/5"
        >
          View dashboard
        </Link>
      </div>
    </div>
  );
}

function ResultMetric({
  icon: Icon,
  label,
  value
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <Icon className="h-4 w-4 text-amber-500" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
