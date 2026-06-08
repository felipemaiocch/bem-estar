import { AdminReportsScreen } from "@/components/screens/admin-section-screens";
import { ensureAdminPagePermission } from "@/lib/admin-permissions";

export default async function AdminRelatoriosPage() {
  await ensureAdminPagePermission("/admin/relatorios");
  return <AdminReportsScreen />;
}
