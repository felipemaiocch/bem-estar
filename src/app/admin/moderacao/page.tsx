import { AdminModerationScreen } from "@/components/screens/admin-section-screens";
import { ensureAdminPagePermission } from "@/lib/admin-permissions";

export default async function AdminModeracaoPage() {
  await ensureAdminPagePermission("/admin/moderacao");
  return <AdminModerationScreen />;
}
