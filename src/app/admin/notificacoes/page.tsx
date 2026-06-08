import { AdminNotificationsScreen } from "@/components/screens/admin-section-screens";
import { ensureAdminPagePermission } from "@/lib/admin-permissions";

export default async function AdminNotificacoesPage() {
  await ensureAdminPagePermission("/admin/notificacoes");
  return <AdminNotificationsScreen />;
}
