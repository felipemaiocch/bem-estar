import { NextResponse, type NextRequest } from "next/server";

import { verifyToken } from "@/lib/auth/jwt";
import { authCookieName } from "@/lib/auth/session";
import type { UserRole } from "@/types";

interface ProtectedRoute {
  prefix: string;
  role: UserRole;
  api: boolean;
}

const protectedRoutes: ProtectedRoute[] = [
  { prefix: "/admin", role: "ADMIN", api: false },
  { prefix: "/profissional", role: "PROFESSIONAL", api: false },
  { prefix: "/usuario", role: "USER", api: false },
  { prefix: "/api/admin", role: "ADMIN", api: true },
  { prefix: "/api/professional", role: "PROFESSIONAL", api: true },
  { prefix: "/api/profissional", role: "PROFESSIONAL", api: true },
  { prefix: "/api/user", role: "USER", api: true },
  { prefix: "/api/usuario", role: "USER", api: true },
];

function getProtectedRoute(pathname: string) {
  return protectedRoutes.find((route) => pathname.startsWith(route.prefix)) ?? null;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const protectedRoute = getProtectedRoute(pathname);

  if (!protectedRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(authCookieName)?.value;

  if (!token) {
    if (protectedRoute.api) {
      return NextResponse.json(
        { ok: false, error: "Não autenticado." },
        { status: 401 },
      );
    }

    return NextResponse.redirect(new URL("/", request.url));
  }

  const session = await verifyToken(token);

  if (!session) {
    if (protectedRoute.api) {
      return NextResponse.json(
        { ok: false, error: "Sessão inválida." },
        { status: 401 },
      );
    }

    return NextResponse.redirect(new URL("/", request.url));
  }

  if (session.role !== protectedRoute.role) {
    if (protectedRoute.api) {
      return NextResponse.json(
        { ok: false, error: "Acesso negado para este recurso." },
        { status: 403 },
      );
    }

    return NextResponse.redirect(new URL("/403", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/usuario/:path*",
    "/profissional/:path*",
    "/admin/:path*",
    "/api/usuario/:path*",
    "/api/user/:path*",
    "/api/profissional/:path*",
    "/api/professional/:path*",
    "/api/admin/:path*",
  ],
};
