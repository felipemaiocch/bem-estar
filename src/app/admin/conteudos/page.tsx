import { AdminCardsScreen } from "@/components/screens/admin-cards-screen";
import { ensureAdminPagePermission } from "@/lib/admin-permissions";

export default async function AdminCardsPage() {
  await ensureAdminPagePermission("/admin/conteudos");
  return <AdminCardsScreen />;
}
