"use client";

import { Clock3, FileQuestion, LockKeyhole, TimerReset, Zap } from "lucide-react";
import { MockTest } from "@/lib/types";

export function RulesScreen({
  mockTest,
  onStart,
  loading,
  resume
}: {
  mockTest: MockTest;
  onStart: () => void;
  loading?: boolean;
  resume?: boolean;
}) {
  const rules = [
    { icon: FileQuestion, label: `${mockTest.totalQuestions} questions` },
    { icon: Clock3, label: `${mockTest.durationMinutes} minute timer` },
    { icon: LockKeyhole, label: "Sequential answering only" },
    { icon: TimerReset, label: "No skipping or jumping ahead" },
    { icon: Zap, label: "Auto submit when time ends" }
  ];

  return (
    <div className="space-y-0 pb-28">
      <section className="bg-white px-5 py-8 dark:bg-slate-900 sm:px-8 sm:py-10 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_transparent_48%)] px-6 py-8 text-center shadow-soft dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.12),_rgba(15,23,42,0.92)_58%)] sm:px-10 sm:py-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">Rules Screen</p>
          <h1 className="mt-4 text-[2rem] font-semibold tracking-tight text-slate-900 dark:text-white sm:text-[2.4rem] lg:text-[2.9rem]">
            {mockTest.title}
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
            {mockTest.description}
          </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {rules.map((rule) => (
              <div
                key={rule.label}
                className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-5 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                  <rule.icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-semibold leading-6 text-slate-900 dark:text-white">{rule.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-2 dark:bg-slate-900 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl rounded-[32px] border border-slate-200 bg-slate-50/60 px-6 py-8 shadow-soft dark:border-slate-800 dark:bg-slate-950/70 sm:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">Before You Start</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
              Answer one question at a time. The next question unlocks only after the current one is answered.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
              You can review already unlocked questions, but locked questions remain unavailable until they are reached.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
              The countdown timer begins only after you press start. If time ends, the test submits automatically.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
              Starting gives XP, exiting early applies a one-time penalty, and final XP depends on your score.
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
            {resume ? "An active attempt was found. You can continue from your current question." : "You are about to enter strict exam mode."}
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-18px_32px_-28px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:left-64 sm:px-6">
        <button
          type="button"
          disabled={loading}
          onClick={onStart}
          className="mx-auto flex w-full max-w-[1600px] items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-slate-950 dark:hover:bg-amber-400"
        >
          {loading ? "Preparing test..." : resume ? "Continue Test" : "Start Test"}
        </button>
      </div>
    </div>
  );
}
