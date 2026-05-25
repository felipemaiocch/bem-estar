import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createDemoSession, redirectForRole } from "@/lib/auth/demo-user";
import { signToken } from "@/lib/auth/jwt";
import { authCookieName, sessionCookieOptions } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
  department: z.enum(["COMERCIAL", "FINANCEIRO", "ATENDIMENTO"]),
  goal: z
    .enum(["WEIGHT_LOSS", "MENTAL_HEALTH", "PERFORMANCE", "HABITS"])
    .optional(),
  desiredWeeklyFrequency: z.number().int().min(1).max(7).optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Dados de cadastro inválidos.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { name, email, password, department, goal, desiredWeeklyFrequency } = parsed.data;
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  if (demoMode) {
    const user = createDemoSession({
      email,
      name,
      requestedRole: "USER",
    });
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

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return NextResponse.json(
      { ok: false, error: "Já existe uma conta com esse email." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "USER",
      department,
      goal,
      desiredWeeklyFrequency,
      currentGoal: goal,
      isActive: false,
      approvalStatus: "PENDING",
    },
  });

  const response = NextResponse.json({
    ok: true,
    mode: "database",
    pendingApproval: true,
    message: "Cadastro enviado para aprovação. Você poderá entrar assim que o administrador liberar seu acesso.",
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      approvalStatus: user.approvalStatus,
    },
  });
  return response;
}
