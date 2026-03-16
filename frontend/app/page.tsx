import { DashboardShell } from "@/components/layout/dashboard-shell";
import { HeroSection } from "@/components/sections/hero-section";
import { SavedDocumentsSection } from "@/components/sections/saved-documents-section";
import { SectionHeading } from "@/components/sections/section-heading";
import { DegreeCard } from "@/components/cards/degree-card";
import { serverApi } from "@/lib/server-api";

export default async function HomePage() {
  const degrees = await serverApi.getDegrees().catch(() => []);

  return (
    <DashboardShell>
      <div className="space-y-10">
        <HeroSection />
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
        <SavedDocumentsSection />
        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <SectionHeading
            eyebrow="App"
            title="Download OCI - EduTech mobile app"
            description="Keep your notes and study materials with you on the go."
          />
          <a
            href="https://play.google.com/store"
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white"
          >
            Playstore Button
          </a>
        </section>
      </div>
    </DashboardShell>
  );
}
