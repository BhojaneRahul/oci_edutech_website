"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Award, Crown, Flame, Medal, Star, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import { FullLeaderboardResponse, LeaderboardEntry } from "@/lib/types";
import { resolveMediaUrl } from "@/lib/utils";
import { useAuth } from "../providers/auth-provider";

export function LeaderboardPageClient() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["full-leaderboard-page"],
    queryFn: async () => {
      const response = await api.get<FullLeaderboardResponse>("/gamification/leaderboard");
      return response.data;
    },
    enabled: Boolean(user)
  });

  if (loading || isLoading) {
    return (
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        Loading leaderboard...
      </div>
    );
  }

  if (!user || !data) {
    return (
      <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-8 text-sm text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10">
        Please login to view the leaderboard.
      </div>
    );
  }

  const topThree = data.leaderboard.slice(0, 3);
  const remainingEntries = data.leaderboard.slice(3);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="bg-gradient-to-r from-amber-50 via-white to-orange-50 p-8 dark:from-amber-500/10 dark:via-slate-900 dark:to-orange-500/10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">Leaderboard</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-[2rem] font-semibold tracking-tight text-slate-900 dark:text-white md:text-[2.5rem]">Top learners across OCI - EduTech</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                XP determines ranking. Daily streak shows who is learning consistently over time.
              </p>
            </div>
            {data.currentUserEntry ? (
              <div className="rounded-[24px] border border-amber-200 bg-white/80 px-5 py-4 dark:border-amber-400/30 dark:bg-slate-900/70">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">Your rank</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-slate-900 px-3 text-lg font-semibold text-white dark:bg-white dark:text-slate-900">
                    #{data.currentUserEntry.rank}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{data.currentUserEntry.user.name ?? "Student"}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      🔥 {data.currentUserEntry.streak} day streak • ⭐ {data.currentUserEntry.xp} XP
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {!!topThree.length && (
        <section className="grid gap-5 lg:grid-cols-3">
          {topThree.map((entry, index) => {
            const config = getPodiumConfig(index);
            const isCurrentUser = Number(entry.user.id) === Number(user.id);

            return (
              <article
                key={entry.user.id}
                className={`relative overflow-hidden rounded-[32px] border px-6 py-7 shadow-soft ${
                  config.featured ? "lg:-translate-y-4" : ""
                } ${
                  isCurrentUser
                    ? "border-amber-300 bg-amber-50/70 dark:border-amber-400/40 dark:bg-amber-500/10"
                    : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                }`}
              >
                <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-r ${config.gradient}`} />
                <div className="relative flex flex-col items-center text-center">
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full ${config.badge}`}>
                    {config.icon}
                  </div>
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-slate-700 shadow-sm dark:bg-slate-950 dark:text-slate-200">
                    Rank #{entry.rank}
                  </span>
                  <Avatar src={entry.user.profilePhoto} alt={entry.user.name ?? "Learner"} size="h-24 w-24" className="mt-4" />
                  <p className="mt-5 text-2xl font-semibold text-slate-900 dark:text-white">{entry.user.name ?? "Student"}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                    {getLevelLabel(entry.level)}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
                    <span className="rounded-full bg-white/90 px-3 py-1.5 font-semibold text-slate-700 shadow-sm dark:bg-slate-950 dark:text-slate-200">
                      <Flame className="mr-1 inline h-3.5 w-3.5 text-amber-500" />
                      {entry.streak} day streak
                    </span>
                    <span className="rounded-full bg-slate-900 px-3 py-1.5 font-semibold text-white dark:bg-white dark:text-slate-900">
                      <Star className="mr-1 inline h-3.5 w-3.5 text-amber-400" />
                      {entry.xp} XP
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h2 className="text-[1.75rem] font-semibold">Full ranking list</h2>
        </div>
        <div className="mt-6 space-y-3">
          {remainingEntries.length ? (
            remainingEntries.map((entry) => {
              const isCurrentUser = Number(entry.user.id) === Number(user.id);

              return (
                <div
                  key={entry.user.id}
                  className={`flex flex-col gap-3 rounded-[24px] border px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
                    isCurrentUser
                      ? "border-amber-300 bg-amber-50/70 shadow-sm dark:border-amber-400/40 dark:bg-amber-500/10"
                      : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
                      {entry.rank}
                    </span>
                    <Avatar src={entry.user.profilePhoto} alt={entry.user.name ?? "Learner"} size="h-12 w-12" />
                    <div>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">{entry.user.name ?? "Student"}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        🔥 {entry.streak} day streak • ⭐ {entry.xp} XP
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:text-right">
                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                      {getLevelLabel(entry.level)}
                    </span>
                    {isCurrentUser ? (
                      <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                        You
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-200 p-6 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
              No leaderboard entries yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function getLevelLabel(level: number) {
  if (level >= 8) return "Master";
  if (level >= 5) return "Expert";
  if (level >= 3) return "Intermediate";
  return "Beginner";
}

function getPodiumConfig(index: number) {
  if (index === 0) {
    return {
      featured: true,
      gradient: "from-amber-200 via-yellow-100 to-orange-100",
      badge: "bg-amber-500 text-white shadow-lg shadow-amber-500/25",
      icon: <Crown className="h-5 w-5" />
    };
  }

  if (index === 1) {
    return {
      featured: false,
      gradient: "from-slate-200 via-slate-100 to-slate-50",
      badge: "bg-slate-500 text-white shadow-lg shadow-slate-500/20",
      icon: <Medal className="h-5 w-5" />
    };
  }

  return {
    featured: false,
    gradient: "from-orange-200 via-amber-100 to-orange-50",
    badge: "bg-orange-500 text-white shadow-lg shadow-orange-500/20",
    icon: <Award className="h-5 w-5" />
  };
}

function Avatar({
  src,
  alt,
  size,
  className = ""
}: {
  src?: string | null;
  alt: string;
  size: string;
  className?: string;
}) {
  const resolvedSrc = resolveMediaUrl(src);

  if (resolvedSrc) {
    return (
      <Image
        src={resolvedSrc}
        alt={alt}
        width={96}
        height={96}
        className={`${size} ${className} rounded-full border border-white/70 object-cover shadow-md dark:border-slate-800`}
      />
    );
  }

  return (
    <div className={`${size} ${className} flex items-center justify-center rounded-full border border-white/70 bg-slate-100 text-lg font-semibold text-slate-700 shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200`}>
      {alt.slice(0, 1).toUpperCase()}
    </div>
  );
}
