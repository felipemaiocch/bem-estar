import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import { createAdminUser, listAdminUsers } from "@/lib/admin-operations";

const createAdminUserSchema = z.object({
  name: z.string().min(2).max(160),
  email: z.email(),
  role: z.enum(["USER", "PROFESSIONAL", "ADMIN"]),
  password: z.string().min(6).max(120).optional(),
  company: z.string().max(160).optional(),
  specialty: z.string().max(160).optional(),
  licenseCode: z.string().max(120).optional(),
});

const usersQuerySchema = z.object({
  search: z.string().max(120).optional(),
  role: z.enum(["USER", "PROFESSIONAL", "ADMIN"]).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const parsed = usersQuerySchema.safeParse({
    search: request.nextUrl.searchParams.get("search") ?? undefined,
    role: request.nextUrl.searchParams.get("role") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Filtros inválidos.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const users = await listAdminUsers(parsed.data);

  return NextResponse.json({
    ok: true,
    users,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const body = await request.json();
  const parsed = createAdminUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Dados inválidos para criação de usuário.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const user = await createAdminUser(auth.session.sub, parsed.data);

    return NextResponse.json({
      ok: true,
      user,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível criar usuário.",
      },
      { status: 409 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { ok: false, error: "ID do usuário é obrigatório." },
      { status: 400 },
    );
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Não foi possível excluir o usuário." },
      { status: 500 },
    );
  }
}
