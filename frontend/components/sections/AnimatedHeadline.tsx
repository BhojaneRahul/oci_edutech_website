"use client";

import { useEffect, useState } from "react";

const WORDS = ["Degree Notes", "Model Que Papers", "Mock Tests", "Projects"];

export function AnimatedHeadline() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let timeoutId: number | undefined;
    const interval = window.setInterval(() => {
      setVisible(false);

      timeoutId = window.setTimeout(() => {
        setCurrentIndex((value) => (value + 1) % WORDS.length);
        setVisible(true);
      }, 500);
    }, 2500);

    return () => {
      window.clearInterval(interval);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <div className="space-y-2.5">
      <p className="text-base font-semibold text-slate-700 md:text-lg dark:text-slate-200">Your hub for Study Materials &amp;</p>
      <div className="relative mx-auto flex min-h-[3.5rem] w-full max-w-3xl items-center justify-center overflow-hidden sm:min-h-[4rem] md:min-h-[4.5rem] lg:min-h-[5rem]">
        <span
          className={`absolute left-0 right-0 top-1/2 block -translate-y-1/2 bg-gradient-to-r from-[#FF8C00] via-[#FFB347] to-[#FFC300] bg-clip-text px-1 pb-1 text-[2rem] font-bold leading-[1.22] text-transparent transition-all duration-500 sm:text-[2.35rem] md:text-[2.75rem] lg:text-[3.15rem] ${
            visible ? "translate-y-[-50%] opacity-100" : "translate-y-[calc(-50%-12px)] opacity-0"
          }`}
        >
          {WORDS[currentIndex]}
        </span>
      </div>
    </div>
  );
}
