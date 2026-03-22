"use client";

import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuestionPalette({
  totalQuestions,
  currentIndex,
  unlockedUntil,
  answeredQuestionIds,
  questionIds,
  onSelect,
  className
}: {
  totalQuestions: number;
  currentIndex: number;
  unlockedUntil: number;
  answeredQuestionIds: number[];
  questionIds: number[];
  onSelect: (index: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("h-full bg-transparent px-6 py-6", className)}>
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">Question Palette</p>
      <h3 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">Locked sequence</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Only answered and unlocked questions can be opened. Future questions stay locked until you answer the current one.
      </p>

      <div className="mt-6 grid grid-cols-5 gap-3">
        {Array.from({ length: totalQuestions }).map((_, index) => {
          const questionId = questionIds[index];
          const answered = answeredQuestionIds.includes(questionId);
          const locked = index + 1 > unlockedUntil;
          const current = index === currentIndex;

          return (
            <button
              key={questionId ?? index}
              type="button"
              disabled={locked}
              onClick={() => onSelect(index)}
              className={cn(
                "flex h-12 items-center justify-center rounded-2xl border text-sm font-semibold transition",
                locked
                  ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-700"
                  : current
                    ? "border-amber-400 bg-slate-950 text-white dark:border-amber-400 dark:bg-amber-500 dark:text-slate-950"
                    : answered
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-amber-400/20 dark:hover:bg-amber-500/5"
              )}
            >
              {locked ? <Lock className="h-4 w-4" /> : index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
