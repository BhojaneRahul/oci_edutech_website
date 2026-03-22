"use client";

import { CheckCircle2 } from "lucide-react";
import { MockTest } from "@/lib/types";
import { Timer } from "./timer";

export function TestHeader({
  mockTest,
  currentQuestion,
  totalQuestions,
  startedAt,
  onExpire,
  onSubmit,
  submitting
}: {
  mockTest: MockTest;
  currentQuestion: number;
  totalQuestions: number;
  startedAt?: string | null;
  onExpire: () => void;
  onSubmit: () => void;
  submitting?: boolean;
}) {
  return (
    <header className="fixed inset-x-0 top-20 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:left-64">
      <div className="px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-slate-900 dark:text-white">{mockTest.title}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Question {currentQuestion} of {totalQuestions}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:justify-end">
            <Timer
              startedAt={startedAt}
              durationMinutes={mockTest.durationMinutes}
              isRunning={Boolean(startedAt)}
              onExpire={onExpire}
            />
            <button
              type="button"
              disabled={submitting}
              onClick={onSubmit}
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-70"
            >
              <CheckCircle2 className="h-4 w-4" />
              Submit
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
