import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MockTestsClient } from "@/components/mock-tests/mock-tests-client";
import { SectionHeading } from "@/components/sections/section-heading";
import { serverApi } from "@/lib/server-api";

export default async function MockTestsPage() {
  const mockTests = await serverApi.getMockTests().catch(() => []);

  return (
    <DashboardShell>
      <SectionHeading
        eyebrow="Practice"
        title="Mock tests"
        description="Sharpen your preparation with quick practice tests across degree programs."
      />
      <MockTestsClient tests={mockTests} />
    </DashboardShell>
  );
}
