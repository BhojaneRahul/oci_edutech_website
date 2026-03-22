"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

type Option = {
  label: string;
  value: string;
  description?: string;
};

export function FormSelect({
  value,
  defaultValue,
  onChange,
  options,
  placeholder,
  name,
  required = false,
  className = ""
}: {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: Option[];
  placeholder?: string;
  name?: string;
  required?: boolean;
  className?: string;
}) {
  const generatedId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const selectedValue = isControlled ? value ?? "" : internalValue;

  useEffect(() => {
    if (!isControlled) {
      setInternalValue(defaultValue ?? "");
    }
  }, [defaultValue, isControlled]);

  useEffect(() => {
    function handlePointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointer);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointer);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === selectedValue),
    [options, selectedValue]
  );

  const selectOption = (nextValue: string) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onChange?.(nextValue);
    setOpen(false);
  };

  const buttonLabel = selectedOption?.label ?? placeholder ?? "Select an option";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {name ? <input type="hidden" name={name} value={selectedValue} required={required} /> : null}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${generatedId}-listbox`}
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium outline-none transition ${
          open
            ? "border-amber-300 bg-amber-50/70 shadow-[0_14px_28px_-20px_rgba(251,191,36,0.5)] ring-4 ring-amber-100/80 dark:bg-amber-500/10 dark:ring-amber-500/10"
            : "border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/30 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-amber-500/30 dark:hover:bg-slate-900"
        } ${selectedOption ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}
      >
        <span className="min-w-0 truncate">{buttonLabel}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180 text-amber-500" : ""}`} />
      </button>

      {open ? (
        <div
          id={`${generatedId}-listbox`}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.55rem)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.22)] dark:border-slate-800 dark:bg-slate-950"
        >
          <div className="clean-scroll max-h-64 overflow-y-auto pr-1">
            {options.map((option) => {
              const selected = option.value === selectedValue;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => selectOption(option.value)}
                  className={`flex w-full items-start justify-between gap-3 rounded-xl px-3 py-3 text-left transition ${
                    selected
                      ? "bg-gradient-to-r from-amber-400 via-amber-300 to-orange-300 text-slate-950 shadow-[0_14px_28px_-18px_rgba(251,191,36,0.45)]"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{option.label}</span>
                    {option.description ? (
                      <span className={`mt-1 block text-xs ${selected ? "text-slate-800/70" : "text-slate-400 dark:text-slate-500"}`}>
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                  {selected ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
