import type { ReactNode } from "react";

import { ensureRequiredTermsAccepted } from "@/lib/acceptance-gate";

export const dynamic = "force-dynamic";

export default async function ProfissionalLayout({ children }: { children: ReactNode }) {
  await ensureRequiredTermsAccepted("/profissional");

  return children;
}
