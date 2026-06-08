import { AdminProfessionalsScreen } from "@/components/screens/admin-section-screens";
import { ensureAdminPagePermission } from "@/lib/admin-permissions";

export default async function AdminProfissionaisPage() {
  await ensureAdminPagePermission("/admin/profissionais");
  return <AdminProfessionalsScreen />;
}
