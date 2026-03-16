import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProtectedDegreeMaterials } from "@/components/materials/protected-materials";
import { serverApi } from "@/lib/server-api";

export default async function DegreeDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const data = await serverApi.getDegreeDetail(id).catch(() => null);

  if (!data) {
    return (
      <DashboardShell>
        <p>Degree not found.</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">{data.degree.name}</p>
          <h1 className="mt-3 text-4xl font-semibold">{data.degree.description}</h1>
        </div>
        <ProtectedDegreeMaterials data={data} />
      </div>
    </DashboardShell>
  );
}
