"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Award, ArrowRight, Bookmark, Crown, Flame, Medal, Sparkles, Star, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import { FullLeaderboardResponse, GamificationDashboard, LeaderboardEntry } from "@/lib/types";
import { resolveMediaUrl } from "@/lib/utils";
import { useAuth } from "../providers/auth-provider";

export function UserDashboardClient() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["gamification-dashboard"],
    queryFn: async () => {
      const response = await api.get<GamificationDashboard>("/gamification/dashboard");
      return response.data;
    },
    enabled: Boolean(user)
  });
  const { data: leaderboardData } = useQuery({
    queryKey: ["full-leaderboard"],
    queryFn: async () => {
      const response = await api.get<FullLeaderboardResponse>("/gamification/leaderboard");
      return response.data;
    },
    enabled: Boolean(user)
  });

  if (loading || isLoading) {
    return (
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        Loading dashboard...
      </div>
    );
  }

  if (!user || !data) {
    return (
      <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-8 text-sm text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10">
        Please login to view your study dashboard.
      </div>
    );
  }

  const topTen = data.leaderboard.slice(0, 10);
  const topThree = topTen.slice(0, 3);
  const remainingLeaders = topTen.slice(3);
  const currentUserEntry =
    leaderboardData?.currentUserEntry ??
    topTen.find((entry) => Number(entry.user.id) === Number(user.id)) ??
    null;
  const greeting = getGreeting();
  const podiumEntries = getPodiumEntries(topThree);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="relative bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.14),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(249,115,22,0.08),_transparent_24%)] p-6 dark:bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.08),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(249,115,22,0.06),_transparent_24%)] sm:p-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_420px] xl:items-start">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600 sm:text-sm">Dashboard</p>
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <span className="rounded-full bg-amber-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 sm:text-xs">
                  {greeting}
                </span>
                {currentUserEntry ? (
                  <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 sm:text-xs">
                    <Trophy className="mr-1 inline h-3.5 w-3.5 text-amber-500" />
                    Rank #{currentUserEntry.rank} this week
                  </span>
                ) : null}
              </div>
              <h1 className="mt-4 max-w-2xl text-[1.22rem] font-semibold leading-[1.14] tracking-tight text-slate-900 dark:text-white sm:text-[1.35rem] lg:text-[1.5rem]">
                Welcome back, {user.name}
              </h1>
              <p className="mt-4 max-w-2xl text-[13px] leading-7 text-slate-500 dark:text-slate-400 sm:text-sm">
                Stay on top of your study momentum, climb the leaderboard, and keep your reading streak active in one focused space.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                  <Sparkles className="mr-1 inline h-3.5 w-3.5 text-amber-500" />
                  Keep your streak alive today
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                  <Award className="mr-1 inline h-3.5 w-3.5 text-amber-500" />
                  Earn XP from notes and tests
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <MetricCard icon={Award} label="Total XP" value={String(data.xp)} accent="amber" />
              <MetricCard icon={Sparkles} label="Level" value={getLevelLabel(data.level)} accent="violet" />
              <MetricCard icon={Flame} label="Daily Streak" value={`${data.streak.current} days`} accent="orange" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 bg-gradient-to-r from-white via-amber-50/50 to-orange-50/60 px-8 py-7 dark:border-slate-800 dark:from-slate-900 dark:via-amber-500/5 dark:to-orange-500/5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-amber-500" />
                <h2 className="text-[1.55rem] font-semibold tracking-tight">Leaderboard</h2>
              </div>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Top learners are ranked by XP. Daily streak shows who is learning consistently.
                </p>
              </div>
              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-600 dark:border-slate-800 dark:text-slate-200 dark:hover:border-amber-400/40 dark:hover:text-amber-300"
              >
                View full list
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            </div>

            {currentUserEntry ? (
              <div className="mx-8 mt-6 rounded-[24px] border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-orange-50 px-4 py-4 shadow-sm dark:border-amber-400/30 dark:from-amber-500/10 dark:via-slate-900 dark:to-orange-500/10">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-600">Your position</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={currentUserEntry.user.profilePhoto} alt={currentUserEntry.user.name ?? "Learner"} size="h-12 w-12" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{currentUserEntry.user.name ?? "Student"}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        🔥 {currentUserEntry.streak} day streak • ⭐ {currentUserEntry.xp} XP
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">
                    #{currentUserEntry.rank}
                  </span>
                </div>
              </div>
            ) : null}

            {!!podiumEntries.length && (
              <div className="mx-8 mt-6 overflow-hidden rounded-[30px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-amber-50/40 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-amber-500/5">
                <div className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Top 3 rankers</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Best XP performers with the strongest active streaks.</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                      Weekly spotlight
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 p-4 md:grid-cols-3 md:items-stretch md:p-5">
                  {podiumEntries.map(({ entry, originalIndex }) => {
                    const config = getPodiumConfig(originalIndex);
                    const isCurrentUser = Number(entry.user.id) === Number(user.id);

                    return (
                      <div
                        key={entry.user.id}
                        className={`relative overflow-hidden rounded-[24px] border bg-white shadow-sm transition dark:bg-slate-950 ${
                          config.featured ? "md:-translate-y-3 md:shadow-md" : ""
                        } ${
                          isCurrentUser
                            ? "border-amber-300 ring-1 ring-amber-200 dark:border-amber-400/40 dark:ring-amber-400/20"
                            : "border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${config.gradient} opacity-95`} />
                        <div className="relative px-4 pb-4 pt-4 text-center">
                          <div className="flex items-center justify-between">
                            <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold tracking-[0.16em] text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
                              #{entry.rank}
                            </span>
                            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${config.badge}`}>
                              {config.icon}
                            </span>
                          </div>
                          <div className="mt-4 flex justify-center">
                            <Avatar src={entry.user.profilePhoto} alt={entry.user.name ?? "Learner"} size={config.featured ? "h-16 w-16" : "h-14 w-14"} />
                          </div>
                          <p className="mt-3 line-clamp-2 text-[1.15rem] font-semibold leading-7 text-slate-900 dark:text-white">
                            {entry.user.name ?? "Student"}
                          </p>
                          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                            {getLevelLabel(entry.level)}
                          </p>
                          <div className="mt-4 space-y-2 text-sm">
                            <div className="rounded-2xl bg-slate-50 px-3 py-2 font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                              🔥 {entry.streak} day streak
                            </div>
                            <div className="rounded-2xl bg-slate-900 px-3 py-2 font-semibold text-white dark:bg-white dark:text-slate-900">
                              ⭐ {entry.xp} XP
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mx-8 mb-8 mt-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Top 10 this week</p>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">XP ranked • streak highlighted</span>
              </div>
              <div className="space-y-3">
              {remainingLeaders.map((entry) => {
                const isCurrentUser = Number(entry.user.id) === Number(user.id);

                return (
                  <div
                    key={entry.user.id}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                      isCurrentUser
                        ? "border-amber-300 bg-amber-50/60 dark:border-amber-400/40 dark:bg-amber-500/10"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                        {entry.rank}
                      </span>
                      <Avatar src={entry.user.profilePhoto} alt={entry.user.name ?? "Learner"} size="h-11 w-11" />
                      <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{entry.user.name ?? "Student"}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          🔥 {entry.streak} day streak • ⭐ {entry.xp} XP
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                      {getLevelLabel(entry.level)}
                    </span>
                  </div>
                );
              })}
              </div>
            </div>
          </section>

        <div className="space-y-5">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">Study Progress</p>
                <h2 className="mt-2 text-2xl font-semibold">Continue reading</h2>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                Longest streak {data.streak.longest} days
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {data.progress.length ? (
                data.progress.map((item) => (
                  <Link
                    key={item.id}
                    href={`/viewer?documentId=${item.documentId}&url=${encodeURIComponent(item.fileUrl)}&title=${encodeURIComponent(item.title)}&type=${item.type}`}
                    className="block rounded-[24px] border border-slate-200 bg-slate-50 p-5 transition hover:border-amber-300 hover:bg-amber-50/50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-amber-400/30 dark:hover:bg-amber-500/5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {item.subject} • {item.currentPage} of {item.totalPages} pages
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-amber-600">{item.percentage}%</span>
                    </div>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary" style={{ width: `${item.percentage}%` }} />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-200 p-6 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  Open a note to start tracking page progress and XP automatically.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <Bookmark className="h-5 w-5 text-amber-500" />
              <h2 className="text-2xl font-semibold">AI Note Recommendations</h2>
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Curated from your course, viewed notes, and bookmarks.
            </p>
            <div className="mt-6 space-y-3">
              {data.recommendations.length ? (
                data.recommendations.map((document) => (
                  <Link
                    key={document._id}
                    href={`/viewer?documentId=${document._id}&url=${encodeURIComponent(document.fileUrl)}&title=${encodeURIComponent(document.title)}&type=${document.type}`}
                    className="block rounded-2xl border border-slate-200 px-4 py-4 transition hover:border-amber-300 hover:bg-amber-50/50 dark:border-slate-800 dark:hover:border-amber-400/30 dark:hover:bg-amber-500/5"
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{document.title}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {document.subject} • {document.stream}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  Start reading and saving notes to unlock recommendations.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
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

function getPodiumEntries(entries: LeaderboardEntry[]) {
  const order = [1, 0, 2];
  return order
    .map((index) => ({ entry: entries[index], originalIndex: index }))
    .filter((item): item is { entry: LeaderboardEntry; originalIndex: number } => Boolean(item.entry));
}

function Avatar({
  src,
  alt,
  size
}: {
  src?: string | null;
  alt: string;
  size: string;
}) {
  const resolvedSrc = resolveMediaUrl(src);

  if (resolvedSrc) {
    return (
      <Image
        src={resolvedSrc}
        alt={alt}
        width={96}
        height={96}
        className={`${size} rounded-full border border-white/70 object-cover shadow-md dark:border-slate-800`}
      />
    );
  }

  return (
    <div className={`${size} flex items-center justify-center rounded-full border border-white/70 bg-slate-100 text-lg font-semibold text-slate-700 shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200`}>
      {alt.slice(0, 1).toUpperCase()}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  accent
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: "amber" | "violet" | "orange";
}) {
  const accentStyles = {
    amber: "from-amber-50 to-white dark:from-amber-500/10 dark:to-slate-950",
    violet: "from-violet-50 to-white dark:from-violet-500/10 dark:to-slate-950",
    orange: "from-orange-50 to-white dark:from-orange-500/10 dark:to-slate-950"
  };

  return (
    <div className={`rounded-[22px] border border-slate-200 bg-gradient-to-r px-4 py-3.5 shadow-sm ${accentStyles[accent]} dark:border-slate-800 sm:px-5`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/90 shadow-sm dark:bg-slate-900">
            <Icon className="h-4 w-4 text-amber-500" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {label}
            </p>
            <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500 sm:text-[11px]">
              {label === "Total XP" ? "Overall progress" : label === "Level" ? "Current skill tier" : "Current active run"}
            </p>
          </div>
        </div>
        <div className="shrink-0 rounded-full bg-slate-900 px-3.5 py-2 text-right text-[1rem] font-semibold leading-none text-white dark:bg-white dark:text-slate-900 sm:text-[1.1rem]">
          {value}
        </div>
      </div>
    </div>
  );
}
