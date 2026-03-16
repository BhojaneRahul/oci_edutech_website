import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ContactForm } from "@/components/contact/contact-form";

export default function ContactPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <section className="rounded-[32px] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-4xl font-semibold">Contact Us</h1>
          <p className="mt-4 text-slate-600 dark:text-slate-300">
            We are always here to help with your studies. Send us your query, support request, feature idea, or feedback and our team will review it.
          </p>
        </section>
        <ContactForm />
      </div>
    </DashboardShell>
  );
}
