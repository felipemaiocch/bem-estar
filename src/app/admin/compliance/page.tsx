import { AdminComplianceScreen } from "@/components/screens/admin-section-screens";
import { ensureAdminPagePermission } from "@/lib/admin-permissions";

export default async function AdminCompliancePage() {
  await ensureAdminPagePermission("/admin/compliance");
  return <AdminComplianceScreen />;
}
