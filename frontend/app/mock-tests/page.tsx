import { DashboardShell } from "@/components/layout/dashboard-shell";
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
      <div className="grid gap-5">
        {mockTests.map((test) => (
          <div key={test._id} className="rounded-[28px] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-semibold">{test.title}</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{test.questions.length} questions</p>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
