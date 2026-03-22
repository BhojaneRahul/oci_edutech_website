import { LeaderboardPageClient } from "@/components/dashboard/leaderboard-page-client";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function LeaderboardPage() {
  return (
    <DashboardShell>
      <LeaderboardPageClient />
    </DashboardShell>
  );
}
