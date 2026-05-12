import { NextResponse, type NextRequest } from "next/server";

import { verifyToken } from "@/lib/auth/jwt";
import { authCookieName } from "@/lib/auth/session";
import { hasAcceptedRequiredTerms } from "@/lib/compliance";
import type { SessionPayload, UserRole } from "@/types";

interface SessionResult {
  session: SessionPayload;
  response?: never;
}

interface SessionErrorResult {
  session?: never;
  response: NextResponse;
}

interface RequireSessionOptions {
  requireAcceptedTerms?: boolean;
}

export async function requireSession(
  request: NextRequest,
  allowedRoles?: UserRole | UserRole[],
  options?: RequireSessionOptions,
): Promise<SessionResult | SessionErrorResult> {
  const token = request.cookies.get(authCookieName)?.value;

  if (!token) {
    return {
      response: NextResponse.json(
        { ok: false, error: "Não autenticado." },
        { status: 401 },
      ),
    };
  }

  const session = await verifyToken(token);

  if (!session) {
    return {
      response: NextResponse.json(
        { ok: false, error: "Sessão inválida." },
        { status: 401 },
      ),
    };
  }

  const roleList = Array.isArray(allowedRoles)
    ? allowedRoles
    : allowedRoles
      ? [allowedRoles]
      : [];

  if (roleList.length > 0 && !roleList.includes(session.role)) {
    return {
      response: NextResponse.json(
        { ok: false, error: "Acesso negado." },
        { status: 403 },
      ),
    };
  }

  if (options?.requireAcceptedTerms !== false) {
    const acceptedTerms = await hasAcceptedRequiredTerms(session.sub);

    if (!acceptedTerms) {
      return {
        response: NextResponse.json(
          {
            ok: false,
            error: "Aceite obrigatório pendente.",
            requiresAcceptance: true,
            redirectTo: "/aceite",
          },
          { status: 428 },
        ),
      };
    }
  }

  return { session };
}
