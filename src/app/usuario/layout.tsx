import type { ReactNode } from "react";

import { UserShell } from "@/components/layout/user-shell";

export default function UsuarioLayout({ children }: { children: ReactNode }) {
  return <UserShell>{children}</UserShell>;
}
