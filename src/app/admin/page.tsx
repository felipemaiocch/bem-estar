import { AdminOverviewScreen } from "@/components/screens/admin-section-screens";
import { ensureAdminPagePermission } from "@/lib/admin-permissions";

export default async function AdminPage() {
  await ensureAdminPagePermission("/admin");
  return <AdminOverviewScreen />;
}
