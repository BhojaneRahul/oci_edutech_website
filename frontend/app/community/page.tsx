import { CommunityChatClient } from "@/components/community/community-chat-experience";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function CommunityPage() {
  return (
    <DashboardShell fullBleed>
      <CommunityChatClient />
    </DashboardShell>
  );
}
