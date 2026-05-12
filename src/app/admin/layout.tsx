import type { ReactNode } from "react";

import { ensureRequiredTermsAccepted } from "@/lib/acceptance-gate";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await ensureRequiredTermsAccepted("/admin");

  return children;
}
