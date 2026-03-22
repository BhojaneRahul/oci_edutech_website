import {
  AlertTriangle,
  Ban,
  Eye,
  FileWarning,
  Gavel,
  Shield,
  Siren,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";

const legalSections = [
  {
    label: "Ownership of content",
    title: "OCI materials remain the property of OCI",
    icon: Shield,
    paragraphs: [
      "All content inside OCI Study Resources / OCI - EduTech, including study materials, notes, mock tests, PDFs, videos, projects, question papers, images, and related digital material, is owned by OCI (Our Creative Info) unless clearly stated otherwise.",
      "These materials are protected by applicable intellectual property and copyright laws. No individual, institution, or third party may reproduce, redistribute, modify, republish, or commercially exploit OCI content without written permission.",
    ],
  },
  {
    label: "Authorized use",
    title: "Use is limited to personal learning",
    icon: Eye,
    paragraphs: [
      "OCI content is provided only for personal and educational use within the platform. Access is granted as a limited, revocable right to view and use the material for learning purposes.",
      "You may not rebrand, upload, publish, forward, sell, or share OCI materials outside the platform without authorization. Violations may result in account suspension, account termination, or additional legal action.",
    ],
  },
  {
    label: "Recording policy",
    title: "Screenshots and recordings are restricted",
    icon: Ban,
    paragraphs: [
      "Capturing OCI content through screenshots, screen recording, photography, or other copying methods is prohibited except for limited personal study use that does not reproduce full protected pages or enable public redistribution.",
      "Any attempt to capture or distribute protected material at scale, or to bypass technical protections, may be treated as unauthorized use.",
    ],
  },
  {
    label: "Technical protection",
    title: "OCI may use technical safeguards",
    icon: FileWarning,
    paragraphs: [
      "OCI may use watermarking, usage monitoring, access controls, content tracing markers, viewer restrictions, and other technical safeguards to protect materials and investigate misuse.",
      "Attempts to bypass or interfere with these protections may result in immediate suspension, device restrictions, account removal, or other enforcement action.",
    ],
  },
  {
    label: "Legal consequences",
    title: "Misuse may lead to enforcement action",
    icon: Gavel,
    paragraphs: [
      "Unauthorized sharing or duplication of OCI materials may lead to account termination, device restrictions, takedown requests, civil claims, and other legal remedies available under applicable law, including Indian copyright law where relevant.",
      "Where appropriate, OCI may seek compensation, injunctions, or other relief based on the nature and scale of the misuse. Any penalty or enforcement outcome will depend on facts, law, and jurisdiction.",
    ],
  },
  {
    label: "External links and liability",
    title: "Use external resources at your own discretion",
    icon: AlertTriangle,
    paragraphs: [
      "OCI may contain references or links to third-party websites or resources. We do not control third-party content and are not responsible for its availability, accuracy, or policies.",
      "All OCI content is provided on an 'as is' and 'as available' basis. OCI does not guarantee uninterrupted access or the complete absence of errors. Users remain responsible for how they use educational content and decisions made from it.",
    ],
  },
];

export default function LegalDisclaimerPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-8 px-6 py-10 md:px-8 xl:grid-cols-[minmax(0,1.2fr)_360px] xl:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">Legal Disclaimer</p>
              <h1 className="mt-4 max-w-4xl text-[1.45rem] font-semibold tracking-tight text-slate-900 dark:text-white md:text-[1.9rem]">
                Respect knowledge. Protect learning. Use OCI content responsibly.
              </h1>
              <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-600 dark:text-slate-300 md:text-base">
                All content made available inside OCI Study Resources / OCI - EduTech is intended for educational use within the platform.
                This page explains your rights, responsibilities, and the restrictions that apply when using OCI material.
              </p>
            </div>

            <div className="rounded-[28px] border border-amber-200 bg-[radial-gradient(circle_at_top,#fff1c2_0%,#fff8eb_35%,#ffffff_100%)] p-6 dark:border-amber-500/20 dark:bg-slate-950">
              <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm dark:bg-amber-500 dark:text-slate-950">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white dark:bg-slate-950/10 dark:text-slate-950">
                  <Siren className="h-5 w-5" />
                </div>
                <p className="mt-4 text-base font-semibold">Important notice</p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-slate-100 dark:text-slate-900/90">
                  <p>Do not redistribute OCI content.</p>
                  <p>Do not upload OCI files elsewhere without permission.</p>
                  <p>Report misuse quickly at support@ourcreativeinfo.in.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6">
          {legalSections.map((section) => {
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
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-8 text-slate-600 dark:text-slate-300 md:text-base">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">User responsibilities</p>
            <h2 className="mt-2 text-[1.2rem] font-semibold text-slate-900 dark:text-white md:text-[1.3rem]">What users agree to do</h2>
            <div className="mt-6 grid gap-3">
              {[
                "Use OCI content only for personal study and educational purposes.",
                "Do not share private information, exam leaks, harmful files, or abusive content through the platform.",
                "Report misuse, piracy, or abuse promptly when you see it.",
                "Respect community rules, moderation, and platform safeguards.",
              ].map((item) => (
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
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Contact & reporting misuse</p>
            <h2 className="mt-2 text-[1.2rem] font-semibold text-slate-900 dark:text-white md:text-[1.3rem]">Need to report unauthorized use?</h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Email</p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">support@ourcreativeinfo.in</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">WhatsApp / Call</p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">+91 8494908367</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Website</p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">www.ourcreativeinfo.in</p>
              </div>
              <div className="rounded-3xl bg-amber-50 p-5 dark:bg-amber-500/10">
                <p className="text-sm leading-7 text-slate-700 dark:text-slate-300">
                  OCI reviews misuse reports as quickly as reasonably possible. Unauthorized duplication or distribution of OCI materials is a serious policy violation.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
