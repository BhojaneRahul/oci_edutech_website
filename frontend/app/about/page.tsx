import { BookOpenText, GraduationCap, Lightbulb, Sparkles, Target, Trophy } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";

const resources = [
  {
    title: "Mock tests & practice quizzes",
    description: "Timed practice sessions that help learners build confidence before exams.",
    icon: Sparkles
  },
  {
    title: "Project guides & tutorials",
    description: "Clear practical references to support projects, lab work, and assignments.",
    icon: Trophy
  },
  {
    title: "PDF study materials",
    description: "Notes, model question papers, and subject-wise materials in one organized place.",
    icon: BookOpenText
  }
];

export default function AboutPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-8 px-6 py-10 md:px-8 lg:grid-cols-[minmax(0,1.2fr)_360px] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">About OCI - EduTech</p>
              <h1 className="mt-4 max-w-3xl text-[2rem] font-semibold tracking-tight text-slate-900 dark:text-white md:text-[2.6rem]">
                Built to make studying clearer, faster, and more motivating.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">
                Welcome to OCI - Study Resources, dedicated to fostering a culture of learning, exploration, and growth.
                Our platform empowers students, educators, and lifelong learners with organized academic tools that support
                excellence and personal development.
              </p>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">
                We share creative learning resources through comprehensive notes, question-and-answer sets for degree and PUC
                students, interactive mock tests, competitions, and study activities designed to make learning engaging and effective.
              </p>
            </div>

            <div className="rounded-[28px] border border-amber-200 bg-[radial-gradient(circle_at_top,#fff1c2_0%,#fff8eb_35%,#ffffff_100%)] p-6 dark:border-amber-500/20 dark:bg-slate-950">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-3xl bg-white/90 p-5 shadow-sm dark:bg-slate-900">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                    <Target className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Our Mission</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    Simplify learning and make quality educational resources easy to access for every student.
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm dark:bg-amber-500">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
                    <Lightbulb className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-lg font-semibold">Our Vision</p>
                  <p className="mt-2 text-sm leading-7 text-slate-100">
                    Empower learners worldwide with knowledge, creativity, and academic excellence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">What we provide</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">Resources that support real progress</h2>
              </div>
            </div>
            <div className="mt-6 grid gap-4">
              {resources.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-start gap-4">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm dark:bg-slate-900 dark:text-amber-300">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-slate-900 dark:text-white">{item.title}</p>
                        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Why learners stay with OCI</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Built with consistency, support, and long-term value</h2>
            <div className="mt-6 space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-lg font-semibold text-slate-900 dark:text-white">Since 2021 and growing</p>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  We continue serving learners through 2026 and beyond, improving the platform with better study tools and cleaner access to content.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-lg font-semibold text-slate-900 dark:text-white">High-quality learning focus</p>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Our team is passionate about helping students succeed with accurate, practical, and easy-to-use study resources.
                </p>
              </div>
              <div className="rounded-3xl bg-amber-50 p-5 dark:bg-amber-500/10">
                <p className="text-lg font-semibold text-slate-900 dark:text-white">Support</p>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  For any queries, suggestions, or feedback, contact us at <span className="font-semibold text-amber-600">support@ourcreativeinfo.in</span>.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
