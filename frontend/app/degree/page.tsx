import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SectionHeading } from "@/components/sections/section-heading";
import { DegreeCard } from "@/components/cards/degree-card";
import { serverApi } from "@/lib/server-api";

export default async function DegreePage() {
  const degrees = await serverApi.getDegrees().catch(() => []);

  return (
    <DashboardShell>
      <SectionHeading
        eyebrow="Degree"
        title="Choose your stream"
        description="Open each stream to browse organized notes and model question papers."
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {degrees.map((degree) => (
          <DegreeCard key={degree._id} degree={degree} />
        ))}
      </div>
    </DashboardShell>
  );
}
