"use client";

import { ArrowRight, CheckCircle2, Layers3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNavigation({
  canGoNext,
  isLastQuestion,
  helperText,
  onNext,
  onSubmit,
  onOpenPalette,
  submitDisabled,
  nextDisabled
}: {
  canGoNext: boolean;
  isLastQuestion: boolean;
  helperText: string;
  onNext: () => void;
  onSubmit: () => void;
  onOpenPalette: () => void;
  submitDisabled?: boolean;
  nextDisabled?: boolean;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-18px_32px_-28px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:left-64">
      <div className="px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm text-slate-500 dark:text-slate-400">{helperText}</div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenPalette}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 lg:hidden"
            >
              <Layers3 className="h-5 w-5" />
            </button>

            {!isLastQuestion ? (
              <button
                type="button"
                disabled={!canGoNext || nextDisabled}
                onClick={onNext}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition",
                  canGoNext && !nextDisabled
                    ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                    : "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                )}
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}

            <button
              type="button"
              disabled={submitDisabled}
              onClick={onSubmit}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition",
                !submitDisabled
                  ? "bg-amber-500 text-slate-950"
                  : "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
              )}
            >
              Submit test
              <CheckCircle2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
