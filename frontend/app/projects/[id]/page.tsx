import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProjectDetailClient } from "@/components/projects/project-detail-client";
import { serverApi } from "@/lib/server-api";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await serverApi.getProjectById(id).catch(() => null);

  if (!project) {
    notFound();
  }

  return (
    <DashboardShell>
      <ProjectDetailClient project={project} />
    </DashboardShell>
  );
}
