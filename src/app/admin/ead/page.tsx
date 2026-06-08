import { AdminEadScreen } from "@/components/screens/admin-ead-screen";
import { ensureAdminPagePermission } from "@/lib/admin-permissions";

export default async function AdminEadPage() {
  await ensureAdminPagePermission("/admin/ead");
  return <AdminEadScreen />;
}
