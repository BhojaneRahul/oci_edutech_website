import { DashboardShell } from "@/components/layout/dashboard-shell";
import { HeroSection } from "@/components/sections/hero-section";
import { SavedDocumentsSection } from "@/components/sections/saved-documents-section";
import { RecentContentSection } from "@/components/sections/recent-content-section";
import { HomeStatsSection } from "@/components/sections/home-stats-section";
import { SyllabusGeneratorSection } from "@/components/sections/syllabus-generator-section";
import { SectionHeading } from "@/components/sections/section-heading";
import { TestimonialsSection } from "@/components/sections/testimonials-section";
import { DegreeCard } from "@/components/cards/degree-card";
import { serverApi } from "@/lib/server-api";
import { Download, Play, Smartphone, Youtube } from "lucide-react";

export default async function HomePage() {
  const [degrees, documents, projects, mockTests] = await Promise.all([
    serverApi.getDegrees().catch(() => []),
    serverApi.getDocuments().catch(() => []),
    serverApi.getProjects().catch(() => []),
    serverApi.getMockTests().catch(() => [])
  ]);

  return (
    <DashboardShell>
      <div className="space-y-10">
        <HeroSection />
        <SyllabusGeneratorSection />
        <SavedDocumentsSection />
        <RecentContentSection documents={documents} projects={projects} mockTests={mockTests} />
        <section>
          <SectionHeading
            eyebrow="Degrees"
            title="Explore degree streams"
            description="Navigate through curated material for BCA, B.Com, BSc, BA, and BBA."
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {degrees.map((degree) => (
              <DegreeCard key={degree._id} degree={degree} />
            ))}
          </div>
        </section>
        <HomeStatsSection />
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-0 lg:grid-cols-[1.35fr_0.9fr]">
            <div className="relative p-8 sm:p-10 lg:p-12">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,140,0,0.12),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(255,195,0,0.16),_transparent_28%)]" />
              <div className="relative space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                  <Smartphone className="h-4 w-4" />
                  App and community
                </div>

                <div className="max-w-2xl space-y-3">
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
                    Study on the go with the OCI - EduTech mobile experience.
                  </h2>
                  <p className="max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300">
                    Access degree notes, model question papers, saved materials, and community updates from one cleaner
                    learning app across phone and desktop.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <a
                    href="https://play.google.com/store/apps/details?id=com.oci.studyresources"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
                  >
                    <Download className="h-4 w-4" />
                    Download on Play Store
                  </a>
                  <a
                    href="https://www.youtube.com/@ocistudyresources?sub_confirmation=1"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                  >
                    <Youtube className="h-4 w-4" />
                    Subscribe on YouTube
                  </a>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/80">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Access</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">Notes and model QPs</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/80">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Sync</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">Saved PDFs and progress</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/80">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Updates</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">Community and new uploads</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50/70 p-8 dark:border-slate-800 dark:bg-slate-950/60 lg:border-l lg:border-t-0 lg:p-10">
              <div className="mx-auto flex h-full max-w-md flex-col justify-between rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                    <Play className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Learn with notes, tests, and videos</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      Use the app for quick revision and subscribe on YouTube for regular study support and walkthroughs.
                    </p>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <a
                    href="https://play.google.com/store/apps/details?id=com.oci.studyresources"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-800 transition hover:border-amber-200 hover:bg-amber-50 dark:border-slate-800 dark:text-slate-100 dark:hover:border-amber-500/20 dark:hover:bg-amber-500/10"
                  >
                    <span>Get the app</span>
                    <Download className="h-4 w-4" />
                  </a>
                  <a
                    href="https://www.youtube.com/@ocistudyresources?sub_confirmation=1"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-800 transition hover:border-red-200 hover:bg-red-50 dark:border-slate-800 dark:text-slate-100 dark:hover:border-red-500/20 dark:hover:bg-red-500/10"
                  >
                    <span>Subscribe for study updates</span>
                    <Youtube className="h-4 w-4 text-red-500" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
        <TestimonialsSection />
      </div>
    </DashboardShell>
  );
}
