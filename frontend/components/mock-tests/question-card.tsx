"use client";

import { Loader2 } from "lucide-react";
import { MockTestQuestion } from "@/lib/types";
import { OptionItem } from "./option-item";

export function QuestionCard({
  question,
  selectedOption,
  onSelect,
  saving
}: {
  question: MockTestQuestion;
  selectedOption?: string;
  onSelect: (option: "A" | "B" | "C" | "D") => void;
  saving?: boolean;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">
            Question {question.orderIndex}
          </p>
          <h2 className="mt-4 text-xl font-semibold leading-8 text-slate-900 dark:text-white sm:text-2xl">
            {question.questionText}
          </h2>
        </div>
        {saving ? <Loader2 className="mt-1 h-5 w-5 animate-spin text-amber-500" /> : null}
      </div>

      <div className="mt-8 space-y-4">
        {question.options.map((option) => (
          <OptionItem
            key={option.key}
            optionKey={option.key}
            value={option.value}
            selected={selectedOption === option.key}
            onSelect={() => onSelect(option.key)}
            disabled={saving}
          />
        ))}
      </div>
    </section>
  );
}
