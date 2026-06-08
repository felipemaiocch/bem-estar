import { AdminUsersScreen } from "@/components/screens/admin-section-screens";
import { ensureAdminPagePermission } from "@/lib/admin-permissions";

export default async function AdminUsuariosPage() {
  await ensureAdminPagePermission("/admin/usuarios");
  return <AdminUsersScreen />;
}
