import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ViewerClient } from "@/components/pdf/viewer-client";

export default function ViewerPage({
  searchParams
}: {
  searchParams: { documentId?: string; url?: string; title?: string; type?: "notes" | "model_qp" };
}) {
  const documentId = searchParams.documentId ? Number(searchParams.documentId) : undefined;
  const url = searchParams.url ?? "";
  const title = searchParams.title ?? "Document";
  const type = searchParams.type ?? "notes";

  return (
    <DashboardShell fullBleed contentClassName="px-0 pb-0 pt-20">
      <ViewerClient documentId={documentId} url={url} title={title} type={type} />
    </DashboardShell>
  );
}
