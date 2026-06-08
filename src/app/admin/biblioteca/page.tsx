import { AdminLibraryScreen } from "@/components/screens/admin-library-screen";
import { ensureAdminPagePermission } from "@/lib/admin-permissions";

export default async function AdminBibliotecaPage() {
  await ensureAdminPagePermission("/admin/biblioteca");
  return <AdminLibraryScreen />;
}
