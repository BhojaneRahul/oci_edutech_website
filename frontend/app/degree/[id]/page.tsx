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
      <div className="space-y-4">
        <div className="py-1 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600 sm:text-sm">
            {data.degree.name}
          </p>
          <h1 className="mx-auto mt-2 max-w-3xl text-2xl font-semibold leading-tight text-slate-900 dark:text-white sm:text-[2rem] lg:text-[2.25rem]">
            {data.degree.description}
          </h1>
        </div>
        <ProtectedDegreeMaterials data={data} />
      </div>
    </DashboardShell>
  );
}
