import { AdminEventsScreen } from "@/components/screens/admin-section-screens";
import { ensureAdminPagePermission } from "@/lib/admin-permissions";

export default async function AdminEventosPage() {
  await ensureAdminPagePermission("/admin/eventos");
  return <AdminEventsScreen />;
}
