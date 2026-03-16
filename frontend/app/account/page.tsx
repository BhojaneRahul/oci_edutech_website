import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AccountPageClient } from "@/components/account/account-page-client";

export default function AccountPage() {
  return (
    <DashboardShell>
      <AccountPageClient />
    </DashboardShell>
  );
}
