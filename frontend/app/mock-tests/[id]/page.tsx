import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MockTestPageClient } from "@/components/mock-tests/mock-test-page-client";
import { serverApi } from "@/lib/server-api";

export default async function MockTestDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const response = await serverApi.getMockTestDetail(id).catch(() => null);

  if (!response?.mockTest) {
    notFound();
  }

  return (
    <DashboardShell fullBleed contentClassName="pb-0 pt-20">
      <MockTestPageClient initialMockTest={response.mockTest} initialAttempt={response.activeAttempt} />
    </DashboardShell>
  );
}
