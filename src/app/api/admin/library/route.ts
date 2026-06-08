import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import { libraryKindValues, listLibraryAdminData } from "@/lib/library";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  search: z.string().max(120).optional(),
  kind: z.union([z.enum(libraryKindValues), z.literal("ALL")]).optional(),
});

const createItemSchema = z.object({
  title: z.string().min(2).max(180),
  author: z.string().max(160).optional(),
  publisher: z.string().max(160).optional(),
  year: z.number().int().min(1500).max(2100).optional(),
  isbn: z.string().max(80).optional(),
  category: z.string().min(2).max(120),
  kind: z.enum(libraryKindValues),
  description: z.string().max(1000).optional(),
  coverUrl: z.string().max(1000).optional(),
  materialUrl: z.string().max(1000).optional(),
  location: z.string().max(160).optional(),
  totalCopies: z.number().int().min(0).max(10000).optional(),
  availableCopies: z.number().int().min(0).max(10000).optional(),
  isReservable: z.boolean().optional(),
  isDigital: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const parsed = querySchema.safeParse({
    search: request.nextUrl.searchParams.get("search") ?? undefined,
    kind: request.nextUrl.searchParams.get("kind") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Filtros inválidos.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = await listLibraryAdminData(parsed.data);

  return NextResponse.json({
    ok: true,
    ...data,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const body = await request.json();
  const parsed = createItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Dados inválidos para catalogar material.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const totalCopies = parsed.data.isDigital ? 0 : parsed.data.totalCopies ?? 1;
  const availableCopies = parsed.data.isDigital
    ? 0
    : Math.min(parsed.data.availableCopies ?? totalCopies, totalCopies);

  const item = await prisma.libraryItem.create({
    data: {
      ...parsed.data,
      author: parsed.data.author?.trim() || null,
      publisher: parsed.data.publisher?.trim() || null,
      isbn: parsed.data.isbn?.trim() || null,
      description: parsed.data.description?.trim() || null,
      coverUrl: parsed.data.coverUrl?.trim() || null,
      materialUrl: parsed.data.materialUrl?.trim() || null,
      location: parsed.data.location?.trim() || null,
      totalCopies,
      availableCopies,
      isReservable: parsed.data.isDigital ? false : parsed.data.isReservable ?? true,
      isDigital: parsed.data.isDigital ?? false,
      createdById: auth.session.sub,
    },
  });

  return NextResponse.json({
    ok: true,
    item,
  });
}
