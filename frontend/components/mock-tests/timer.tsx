"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export function Timer({
  startedAt,
  durationMinutes,
  isRunning,
  onExpire
}: {
  startedAt?: string | null;
  durationMinutes: number;
  isRunning: boolean;
  onExpire: () => void;
}) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    calculateRemainingSeconds(startedAt, durationMinutes)
  );
  const expiredRef = useRef(false);

  useEffect(() => {
    setRemainingSeconds(calculateRemainingSeconds(startedAt, durationMinutes));
    expiredRef.current = false;
  }, [startedAt, durationMinutes]);

  useEffect(() => {
    if (!isRunning || !startedAt) {
      return;
    }

    const tick = () => {
      const next = calculateRemainingSeconds(startedAt, durationMinutes);
      setRemainingSeconds(next);

      if (next <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire();
      }
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [durationMinutes, isRunning, onExpire, startedAt]);

  const displayValue = useMemo(() => {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [remainingSeconds]);

  return (
    <span className="inline-flex min-w-[88px] items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
      {displayValue}
    </span>
  );
}

function calculateRemainingSeconds(startedAt?: string | null, durationMinutes = 0) {
  if (!startedAt) {
    return Math.max(0, durationMinutes * 60);
  }

  const end = new Date(startedAt).getTime() + durationMinutes * 60 * 1000;
  return Math.max(0, Math.floor((end - Date.now()) / 1000));
}
