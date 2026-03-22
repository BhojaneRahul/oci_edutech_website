"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export function OptionItem({
  optionKey,
  value,
  selected,
  disabled,
  onSelect
}: {
  optionKey: string;
  value: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-4 rounded-2xl border px-4 py-4 text-left transition",
        selected
          ? "border-amber-400 bg-amber-50 text-slate-950 shadow-sm dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50/40 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-amber-400/20 dark:hover:bg-amber-500/5",
        disabled && "cursor-not-allowed opacity-70"
      )}
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        {optionKey}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-7">{value}</p>
      </div>
      <span className="pt-1">
        {selected ? <CheckCircle2 className="h-5 w-5 text-amber-500" /> : <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" />}
      </span>
    </button>
  );
}
