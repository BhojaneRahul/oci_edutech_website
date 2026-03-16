import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProtectedPucMaterials } from "@/components/materials/protected-materials";
import { serverApi } from "@/lib/server-api";

export default async function PucGroupPage({ params }: { params: { group: string } }) {
  const { group } = params;
  const documents = await serverApi.getDocumentsByStream(group).catch(() => []);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">PUC</p>
          <h1 className="mt-3 text-4xl font-semibold">{decodeURIComponent(group)}</h1>
        </div>
        <ProtectedPucMaterials documents={documents} />
      </div>
    </DashboardShell>
  );
}
