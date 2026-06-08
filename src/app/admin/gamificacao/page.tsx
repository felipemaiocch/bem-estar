import { AdminGamificationScreen } from "@/components/screens/admin-gamification-screen";
import { ensureAdminPagePermission } from "@/lib/admin-permissions";

export default async function AdminGamificacaoPage() {
  await ensureAdminPagePermission("/admin/gamificacao");
  return <AdminGamificationScreen />;
}
