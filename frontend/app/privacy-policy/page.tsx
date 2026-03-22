import {
  BellRing,
  BookOpenText,
  Database,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";

const collectionItems = [
  {
    title: "Account information",
    description:
      "When you sign in with Google or email, we may collect your name, email address, profile photo, and any academic profile details you provide such as university, board, course, semester, or phone number.",
    icon: UserRound,
  },
  {
    title: "Usage and activity data",
    description:
      "We collect app usage information such as pages viewed, saved resources, streak activity, XP progress, leaderboard rank, mock test activity, and interactions that help us improve the platform.",
    icon: Sparkles,
  },
  {
    title: "Saved content and study actions",
    description:
      "When you save PDFs, bookmark resources, upload files in community chat, or join communities, those actions are linked to your account so the experience can stay personalized and consistent.",
    icon: BookOpenText,
  },
];

const useItems = [
  "To create and manage your account access.",
  "To personalize your experience, including greetings, saved content, streaks, XP, and leaderboard placement.",
  "To enable viewing, saving, downloading, and organizing educational content.",
  "To deliver community features such as messaging, replies, reactions, mentions, reporting, and moderation.",
  "To send in-app and browser notifications about uploads, tests, projects, and community updates when permitted.",
  "To monitor app quality, detect misuse, and improve product performance and reliability.",
];

const privacySections = [
  {
    label: "Streak, XP & Leaderboard",
    title: "How streaks and XP work",
    description:
      "OCI - EduTech includes a streak, XP, and leaderboard system to motivate consistent learning. These values are stored securely in our systems and are used only to power your progress experience inside the platform.",
    bullets: [
      "XP is earned from supported actions such as opening notes, reading pages, bookmarking resources, logging in daily, and completing mock tests.",
      "Daily streaks increase when you stay active on consecutive days. If you miss a day, your streak may reset.",
      "Leaderboard positions are calculated from XP and related progress data.",
      "This information is not sold to third parties and is used only for learning motivation, ranking, and progress visibility inside OCI - EduTech.",
      "If you request account deletion, your account-linked XP, streak, and leaderboard data will be removed from our active systems subject to applicable technical and legal retention requirements.",
    ],
    icon: Sparkles,
  },
  {
    label: "Community & Chat",
    title: "How community data is handled",
    description:
      "Our web app includes community and chat features where students and teachers can interact through messages, replies, reactions, mentions, and limited file sharing.",
    bullets: [
      "We store message content, sender details needed to identify the message, timestamps, reactions, replies, reports, and related moderation data.",
      "Uploaded chat files may include PDFs, DOC files, PPT files, and images where allowed by the platform.",
      "Community messages and uploaded chat files may be subject to automatic expiry, moderation review, and community safety controls.",
      "We do not collect your device contacts, private media outside your uploaded content, or phone contacts for community messaging.",
      "Users can report messages or users that violate community rules. Moderators may review and act on those reports.",
    ],
    icon: MessageCircle,
  },
  {
    label: "Ads & Third Parties",
    title: "Third-party services and advertising",
    description:
      "We may use third-party services to operate and improve the app, and we may show advertisements in the future.",
    bullets: [
      "Third-party providers may process limited technical or browser data needed to deliver their services.",
      "If ads are displayed, advertising providers may use device or browser information in accordance with their own privacy policies and applicable laws.",
      "External links and third-party sites are controlled by their respective operators, not by OCI - EduTech.",
    ],
    icon: BellRing,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-8 px-6 py-10 md:px-8 xl:grid-cols-[minmax(0,1.2fr)_360px] xl:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">Privacy Policy</p>
              <h1 className="mt-4 max-w-4xl text-[1.45rem] font-semibold tracking-tight text-slate-900 dark:text-white md:text-[1.9rem]">
                How OCI - EduTech collects, uses, and protects your information.
              </h1>
              <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-600 dark:text-slate-300 md:text-base">
                OCI - Study Resources, also referred to as OCI - EduTech, is committed to protecting your privacy.
                This Privacy Policy explains what information we collect, how we use it, and how we safeguard it when you use our web app and related services.
              </p>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 dark:text-slate-300 md:text-base">
                By using OCI - EduTech, you agree to the collection and use of information in accordance with this policy.
              </p>
            </div>

            <div className="rounded-[28px] border border-amber-200 bg-[radial-gradient(circle_at_top,#fff1c2_0%,#fff8eb_35%,#ffffff_100%)] p-6 dark:border-amber-500/20 dark:bg-slate-950">
              <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm dark:bg-amber-500 dark:text-slate-950">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white dark:bg-slate-950/10 dark:text-slate-950">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <p className="mt-4 text-base font-semibold">Privacy at a glance</p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-slate-100 dark:text-slate-900/90">
                  <p>We do not sell your personal data.</p>
                  <p>We use your data to run your account, resources, notifications, progress features, and community tools.</p>
                  <p>You can request account and data deletion by contacting support@ourcreativeinfo.in.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {collectionItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-base font-semibold text-slate-900 dark:text-white">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.description}</p>
              </div>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">How we use information</p>
                <h2 className="mt-1 text-[1.2rem] font-semibold text-slate-900 dark:text-white md:text-[1.3rem]">What your data helps us do</h2>
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              {useItems.map((item) => (
                <div
                  key={item}
                  className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Your control</p>
            <h2 className="mt-2 text-[1.2rem] font-semibold text-slate-900 dark:text-white md:text-[1.3rem]">Retention, deletion, and security</h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-[0.95rem] font-semibold text-slate-900 dark:text-white">Data security</p>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  We use reasonable administrative, technical, and organizational safeguards to protect your account information, educational activity data, and community data.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-[0.95rem] font-semibold text-slate-900 dark:text-white">Notifications</p>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  We may use in-app notifications and browser notifications, where permission is granted, to inform you about uploads, competitions, community activity, and new study resources.
                </p>
              </div>
              <div className="rounded-3xl bg-amber-50 p-5 dark:bg-amber-500/10">
                <div className="flex items-start gap-3">
                  <Trash2 className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-300" />
                  <div>
                    <p className="text-[0.95rem] font-semibold text-slate-900 dark:text-white">Data deletion requests</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      You may request data deletion by emailing <span className="font-semibold text-amber-700 dark:text-amber-300">support@ourcreativeinfo.in</span>.
                      When your account is deleted, associated user data will be removed from active systems, subject to necessary security or legal retention for security, fraud prevention, or legal compliance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6">
          {privacySections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.title}
                className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-start gap-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">{section.label}</p>
                    <h2 className="mt-2 text-[1.2rem] font-semibold text-slate-900 dark:text-white md:text-[1.3rem]">{section.title}</h2>
                    <p className="mt-3 max-w-4xl text-sm leading-8 text-slate-600 dark:text-slate-300 md:text-base">
                      {section.description}
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid gap-3">
                  {section.bullets.map((item) => (
                    <div
                      key={item}
                      className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Contact us</p>
          <h2 className="mt-2 text-[1.2rem] font-semibold text-slate-900 dark:text-white md:text-[1.3rem]">Questions about privacy?</h2>
          <p className="mt-4 text-sm leading-8 text-slate-600 dark:text-slate-300 md:text-base">
            If you have questions about this Privacy Policy, or if you want to request data deletion or account support,
            contact us at <span className="font-semibold text-amber-700 dark:text-amber-300">support@ourcreativeinfo.in</span>.
          </p>
        </section>
      </div>
    </DashboardShell>
  );
}
