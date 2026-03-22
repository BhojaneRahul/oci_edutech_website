import { Headphones, Mail, MessageSquareQuote, PhoneCall } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ContactForm } from "@/components/contact/contact-form";

const supportHighlights = [
  {
    title: "Fast support response",
    description: "We review study queries, feature requests, and feedback carefully.",
    icon: Headphones
  },
  {
    title: "Clear communication",
    description: "Share your question once and our team will guide you with the right next step.",
    icon: MessageSquareQuote
  },
  {
    title: "Reach us directly",
    description: "support@ourcreativeinfo.in",
    icon: Mail
  }
];

export default function ContactPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-6 px-6 py-8 md:px-8 xl:grid-cols-[minmax(0,1.25fr)_360px] xl:items-start">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">Contact us</p>
              <h1 className="max-w-3xl text-[2rem] font-semibold tracking-tight text-slate-900 dark:text-white md:text-[2.6rem]">
                We are always here to help with your studies.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">
                Send us your query, support request, feature idea, bug report, or feedback. Our team will review it
                and help you move forward with the right guidance.
              </p>
              <div className="grid gap-4 pt-2 sm:grid-cols-2 xl:grid-cols-3">
                {supportHighlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="mt-4 text-base font-semibold text-slate-900 dark:text-white">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[28px] border border-amber-200 bg-[radial-gradient(circle_at_top,#fff1c2_0%,#fff8eb_35%,#ffffff_100%)] p-6 dark:border-amber-500/20 dark:bg-slate-950">
              <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm dark:bg-amber-500 dark:text-slate-950">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white dark:bg-slate-950/10 dark:text-slate-950">
                  <PhoneCall className="h-5 w-5" />
                </div>
                <p className="mt-4 text-lg font-semibold">Study help support</p>
                <p className="mt-2 text-sm leading-7 text-slate-100 dark:text-slate-900/90">
                  We review academic queries, technical support issues, feedback, and feature requests with care.
                </p>
                <div className="mt-6 space-y-3">
                  <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm dark:bg-slate-950/10">
                    support@ourcreativeinfo.in
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm dark:bg-slate-950/10">
                    Always here to help with your studies
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm dark:bg-slate-950/10">
                    Professional support for OCI learners
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <ContactForm />
      </div>
    </DashboardShell>
  );
}
