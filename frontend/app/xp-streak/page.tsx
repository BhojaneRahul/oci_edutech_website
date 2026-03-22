import { Award, CalendarCheck2, Flame, Sparkles, Trophy } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";

const xpActions = [
  { label: "Daily login", value: "+5 XP" },
  { label: "Open notes", value: "+5 XP" },
  { label: "Read tracked pages", value: "+10 XP" },
  { label: "Bookmark a resource", value: "+3 XP" },
  { label: "Complete a mock test", value: "+50 XP" },
];

const leaderboardRules = [
  "Leaderboard rank is based mainly on total XP earned in the platform.",
  "Daily streaks show how consistently you are learning from one day to the next.",
  "If you miss a day of qualifying activity, your streak may reset.",
  "Level labels such as Beginner, Intermediate, and Expert are shown based on your progress tier.",
];

export default function XPStreakPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-8 px-6 py-10 md:px-8 xl:grid-cols-[minmax(0,1.15fr)_360px] xl:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">XP & Streak Guide</p>
              <h1 className="mt-4 max-w-4xl text-[1.45rem] font-semibold tracking-tight text-slate-900 dark:text-white md:text-[1.9rem]">
                How progress, streaks, levels, and leaderboard ranking work in OCI - EduTech.
              </h1>
              <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-600 dark:text-slate-300 md:text-base">
                OCI - EduTech uses XP, daily streaks, levels, and leaderboards to encourage consistent learning.
                These features are designed to reward real study activity and help students stay motivated.
              </p>
            </div>

            <div className="rounded-[28px] border border-amber-200 bg-[radial-gradient(circle_at_top,#fff1c2_0%,#fff8eb_35%,#ffffff_100%)] p-6 dark:border-amber-500/20 dark:bg-slate-950">
              <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm dark:bg-amber-500 dark:text-slate-950">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white dark:bg-slate-950/10 dark:text-slate-950">
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="mt-4 text-base font-semibold">At a glance</p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-slate-100 dark:text-slate-900/90">
                  <p>Study actions earn XP.</p>
                  <p>Daily consistency builds your streak.</p>
                  <p>More XP improves your leaderboard rank.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">XP rewards</p>
                <h2 className="mt-1 text-[1.2rem] font-semibold text-slate-900 dark:text-white md:text-[1.3rem]">What gives you XP</h2>
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              {xpActions.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950"
                >
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Daily streak</p>
                <h2 className="mt-1 text-[1.2rem] font-semibold text-slate-900 dark:text-white md:text-[1.3rem]">How streak tracking works</h2>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-[0.95rem] font-semibold text-slate-900 dark:text-white">Stay active each day</p>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  When you perform supported learning activity on consecutive days, your streak increases.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-[0.95rem] font-semibold text-slate-900 dark:text-white">Missing a day</p>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  If you miss a qualifying day, your streak may reset back to zero or restart from the next day you become active again.
                </p>
              </div>
              <div className="rounded-3xl bg-amber-50 p-5 dark:bg-amber-500/10">
                <div className="flex items-start gap-3">
                  <CalendarCheck2 className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-300" />
                  <p className="text-sm leading-7 text-slate-700 dark:text-slate-300">
                    Daily streaks are meant to reward consistency, not just one-time usage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Leaderboard & levels</p>
              <h2 className="mt-1 text-[1.2rem] font-semibold text-slate-900 dark:text-white md:text-[1.3rem]">How ranking works</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            {leaderboardRules.map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
