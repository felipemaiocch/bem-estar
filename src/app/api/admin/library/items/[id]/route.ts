import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import { libraryKindValues } from "@/lib/library";
import { prisma } from "@/lib/prisma";

const updateItemSchema = z.object({
  title: z.string().min(2).max(180).optional(),
  author: z.string().max(160).nullable().optional(),
  publisher: z.string().max(160).nullable().optional(),
  year: z.number().int().min(1500).max(2100).nullable().optional(),
  isbn: z.string().max(80).nullable().optional(),
  category: z.string().min(2).max(120).optional(),
  kind: z.enum(libraryKindValues).optional(),
  description: z.string().max(1000).nullable().optional(),
  coverUrl: z.string().max(1000).nullable().optional(),
  materialUrl: z.string().max(1000).nullable().optional(),
  location: z.string().max(160).nullable().optional(),
  totalCopies: z.number().int().min(0).max(10000).optional(),
  availableCopies: z.number().int().min(0).max(10000).optional(),
  isReservable: z.boolean().optional(),
  isDigital: z.boolean().optional(),
  status: z.enum(["AVAILABLE", "UNAVAILABLE", "ARCHIVED"]).optional(),
});

function getItemId(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? "";
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const itemId = getItemId(request.nextUrl.pathname);
  const body = await request.json();
  const parsed = updateItemSchema.safeParse(body);

  if (!itemId || !parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Dados inválidos para atualizar material.", issues: parsed.success ? undefined : parsed.error.flatten() },
      { status: 400 },
    );
  }

  const totalCopies = parsed.data.totalCopies;
  const availableCopies =
    totalCopies !== undefined && parsed.data.availableCopies !== undefined
      ? Math.min(parsed.data.availableCopies, totalCopies)
      : parsed.data.availableCopies;

  const item = await prisma.libraryItem.update({
    where: { id: itemId },
    data: {
      ...parsed.data,
      availableCopies,
      author: parsed.data.author?.trim() || parsed.data.author,
      publisher: parsed.data.publisher?.trim() || parsed.data.publisher,
      isbn: parsed.data.isbn?.trim() || parsed.data.isbn,
      description: parsed.data.description?.trim() || parsed.data.description,
      coverUrl: parsed.data.coverUrl?.trim() || parsed.data.coverUrl,
      materialUrl: parsed.data.materialUrl?.trim() || parsed.data.materialUrl,
      location: parsed.data.location?.trim() || parsed.data.location,
    },
  });

  return NextResponse.json({ ok: true, item });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const itemId = getItemId(request.nextUrl.pathname);

  if (!itemId) {
    return NextResponse.json({ ok: false, error: "Material não informado." }, { status: 400 });
  }

  await prisma.libraryItem.update({
    where: { id: itemId },
    data: { status: "ARCHIVED" },
  });

  return NextResponse.json({ ok: true });
}
