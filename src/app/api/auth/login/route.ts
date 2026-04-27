import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createDemoSession, redirectForRole } from "@/lib/auth/demo-user";
import { signToken } from "@/lib/auth/jwt";
import { authCookieName, sessionCookieOptions } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  role: z.enum(["USER", "PROFESSIONAL", "ADMIN"]).optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Dados de login inválidos.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { email, password, role } = parsed.data;
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  try {
    if (demoMode) {
      const user = createDemoSession({ email, requestedRole: role });
      const token = await signToken(user);
      const response = NextResponse.json({
        ok: true,
        mode: "demo",
        redirectTo: redirectForRole(user.role),
        user,
      });

      response.cookies.set(authCookieName, token, sessionCookieOptions());
      return response;
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Usuário não encontrado." },
        { status: 404 },
      );
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      return NextResponse.json(
        { ok: false, error: "Senha incorreta." },
        { status: 401 },
      );
    }

    const sessionPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    } as const;

    const token = await signToken(sessionPayload);
    const response = NextResponse.json({
      ok: true,
      mode: "database",
      redirectTo: redirectForRole(user.role),
      user: sessionPayload,
    });

    response.cookies.set(authCookieName, token, sessionCookieOptions());
    return response;
  } catch (error) {
    console.error("Erro interno no login:", error);

    // Se o erro foi de JWT_SECRET não configurado, avise de forma clara
    if (error instanceof Error && error.message === "JWT_SECRET não configurado em produção.") {
      return NextResponse.json(
        { ok: false, error: "Falta a variável JWT_SECRET no Netlify." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Erro interno. Verifique as variáveis de ambiente." },
      { status: 500 }
    );
  }
}
