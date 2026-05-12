import { redirect } from "next/navigation";

import { verifyToken } from "@/lib/auth/jwt";
import { getSessionToken } from "@/lib/auth/session";
import { roleRouteMap } from "@/lib/constants";
import { hasAcceptedRequiredTerms } from "@/lib/compliance";
import type { SessionPayload, UserRole } from "@/types";

export async function getCurrentSession() {
  const token = await getSessionToken();

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export function getSafeNextPath(nextPath: string | undefined, role: UserRole) {
  const fallback = roleRouteMap[role];

  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return fallback;
  }

  const allowedPrefixByRole: Record<UserRole, string> = {
    USER: "/usuario",
    PROFESSIONAL: "/profissional",
    ADMIN: "/admin",
  };

  const allowedPrefix = allowedPrefixByRole[role];

  return nextPath.startsWith(allowedPrefix) ? nextPath : fallback;
}

export async function ensureRequiredTermsAccepted(nextPath: string) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/");
  }

  const acceptedTerms = await hasAcceptedRequiredTerms(session.sub);

  if (!acceptedTerms) {
    redirect(`/aceite?next=${encodeURIComponent(nextPath)}`);
  }

  return session as SessionPayload;
}
