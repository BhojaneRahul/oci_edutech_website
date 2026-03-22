import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProtectedPucMaterials } from "@/components/materials/protected-materials";
import { serverApi } from "@/lib/server-api";

export default async function PucGroupPage({ params }: { params: { group: string } }) {
  const { group } = params;
  const documents = await serverApi.getDocumentsByStream(group).catch(() => []);

  return (
    <DashboardShell>
      <div className="space-y-4">
        <div className="py-1 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600 sm:text-sm">PUC</p>
          <h1 className="mx-auto mt-2 max-w-3xl text-2xl font-semibold leading-tight text-slate-900 dark:text-white sm:text-[2rem] lg:text-[2.25rem]">
            {decodeURIComponent(group)}
          </h1>
        </div>
        <ProtectedPucMaterials documents={documents} />
      </div>
    </DashboardShell>
  );
}
