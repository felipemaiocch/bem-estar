import type { ReactNode } from "react";

import { UserShell } from "@/components/layout/user-shell";
import { ensureRequiredTermsAccepted } from "@/lib/acceptance-gate";

export const dynamic = "force-dynamic";

export default async function UsuarioLayout({ children }: { children: ReactNode }) {
  await ensureRequiredTermsAccepted("/usuario");

  return <UserShell>{children}</UserShell>;
}
