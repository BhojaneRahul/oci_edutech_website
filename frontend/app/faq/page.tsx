import Link from "next/link";
import { ChevronRight, HelpCircle, MessageCircleQuestion } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";

const faqItems = [
  {
    question: "How do I sign in to OCI - EduTech?",
    answer:
      "You can sign in using Google or email, depending on the authentication methods enabled on the platform. Your account gives you access to saved resources, mock tests, community features, and personalized study tools.",
  },
  {
    question: "How do saved PDFs work?",
    answer:
      "When you save a supported note or model question paper, that resource is linked to your account so you can access it again later from your saved section. Downloaded files may also remain on your own device depending on your actions.",
  },
  {
    question: "How do mock tests work?",
    answer:
      "Mock tests run in a structured exam flow. You start from a rules screen, answer questions in order, and submit at the end or when the timer finishes. Some tests may lock future questions until the current question is answered.",
  },
  {
    question: "How do XP and streaks work?",
    answer:
      "OCI - EduTech rewards learning activity through XP and streaks. XP can increase when you log in daily, open notes, read pages, bookmark materials, and complete mock tests. A streak increases when you stay active on consecutive days. Missing a day may reset it. Leaderboard positions are based mainly on XP.",
  },
  {
    question: "Why can I not download every document?",
    answer:
      "Some resources are view-only for protection or licensing reasons, while others such as certain model question papers may support direct download. Access may also depend on login status and content settings chosen by the admin.",
  },
  {
    question: "How does community chat work?",
    answer:
      "Community chat allows users to send messages, reply, react, mention other users, upload limited file types, mute the community, report messages, clear personal history, and leave the community when needed.",
  },
  {
    question: "Do community messages and files stay forever?",
    answer:
      "No. Community messages and uploaded files may expire automatically after a limited period, depending on platform rules. Current community uploads are designed for temporary learning conversations rather than permanent storage.",
  },
  {
    question: "Can I report messages or users?",
    answer:
      "Yes. You can report messages or users for spam, abuse, inappropriate content, or other rule violations. Reported content may be reviewed by moderators or admins and may result in warnings, deletions, or restrictions.",
  },
  {
    question: "How do notifications work?",
    answer:
      "OCI uses in-app notifications and, where supported and permitted, browser notifications to inform you about uploads, mock tests, projects, and other updates. Community unread counts may appear separately inside the app for a cleaner experience.",
  },
  {
    question: "How do I request account or data deletion?",
    answer:
      "You can request deletion by contacting support@ourcreativeinfo.in. Once your request is verified and processed, account-linked data will be removed from active systems subject to necessary security or legal retention requirements.",
  },
];

export default function FAQPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-8 px-6 py-10 md:px-8 xl:grid-cols-[minmax(0,1.15fr)_360px] xl:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">FAQ</p>
              <h1 className="mt-4 max-w-4xl text-[1.45rem] font-semibold tracking-tight text-slate-900 dark:text-white md:text-[1.9rem]">
                Common questions about OCI - EduTech, privacy, content, and community.
              </h1>
              <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-600 dark:text-slate-300 md:text-base">
                This page answers the most common questions about account access, saved PDFs, mock tests, XP, streaks, notifications, community chat, and data deletion.
              </p>
            </div>

            <div className="rounded-[28px] border border-amber-200 bg-[radial-gradient(circle_at_top,#fff1c2_0%,#fff8eb_35%,#ffffff_100%)] p-6 dark:border-amber-500/20 dark:bg-slate-950">
              <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm dark:bg-amber-500 dark:text-slate-950">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white dark:bg-slate-950/10 dark:text-slate-950">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <p className="mt-4 text-base font-semibold">Need direct support?</p>
                <p className="mt-2 text-sm leading-7 text-slate-100 dark:text-slate-900/90">
                  If you do not find your answer here, contact support@ourcreativeinfo.in and our team will help you.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          {faqItems.map((item, index) => (
            <div
              key={item.question}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start gap-4">
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-sm font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  {index + 1}
                </div>
                <div>
                  <h2 className="text-[1rem] font-semibold text-slate-900 dark:text-white md:text-[1.05rem]">{item.question}</h2>
                  <p className="mt-3 text-sm leading-8 text-slate-600 dark:text-slate-300 md:text-base">{item.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                <MessageCircleQuestion className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Need more help?</p>
                <h2 className="mt-1 text-[1.2rem] font-semibold text-slate-900 dark:text-white md:text-[1.3rem]">Contact support directly</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  We are happy to help with account issues, content questions, privacy concerns, and platform support.
                </p>
              </div>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-amber-400/40 dark:hover:text-amber-300"
            >
              Contact support
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
