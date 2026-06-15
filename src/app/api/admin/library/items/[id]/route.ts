import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminPermission } from "@/lib/admin-permissions";
import { libraryKindValues } from "@/lib/library";
import { prisma } from "@/lib/prisma";

const updateItemSchema = z.object({
  title: z.string().min(2).max(180).optional(),
  author: z.string().max(160).nullable().optional(),
  mainAuthor: z.string().max(160).nullable().optional(),
  entityAuthor: z.string().max(180).nullable().optional(),
  secondaryAuthor: z.string().max(160).nullable().optional(),
  secondaryEntity: z.string().max(180).nullable().optional(),
  originalTitle: z.string().max(220).nullable().optional(),
  translatedTitle: z.string().max(220).nullable().optional(),
  originalLanguage: z.string().max(80).nullable().optional(),
  translationLanguage: z.string().max(80).nullable().optional(),
  edition: z.string().max(80).nullable().optional(),
  publisher: z.string().max(160).nullable().optional(),
  publicationPlace: z.string().max(160).nullable().optional(),
  year: z.number().int().min(1500).max(2100).nullable().optional(),
  isbn: z.string().max(80).nullable().optional(),
  issn: z.string().max(80).nullable().optional(),
  category: z.string().min(2).max(120).optional(),
  subject: z.string().max(300).nullable().optional(),
  kind: z.enum(libraryKindValues).optional(),
  description: z.string().max(1000).nullable().optional(),
  physicalDescription: z.string().max(500).nullable().optional(),
  seriesCollection: z.string().max(180).nullable().optional(),
  generalNote: z.string().max(1000).nullable().optional(),
  bibliography: z.string().max(2000).nullable().optional(),
  summary: z.string().max(4000).nullable().optional(),
  coverUrl: z.string().max(1000).nullable().optional(),
  materialUrl: z.string().max(1000).nullable().optional(),
  location: z.string().max(160).nullable().optional(),
  callNumber: z.string().max(160).nullable().optional(),
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
  const auth = await requireAdminPermission(request, "LIBRARY");

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
      mainAuthor: parsed.data.mainAuthor?.trim() || parsed.data.mainAuthor,
      entityAuthor: parsed.data.entityAuthor?.trim() || parsed.data.entityAuthor,
      secondaryAuthor: parsed.data.secondaryAuthor?.trim() || parsed.data.secondaryAuthor,
      secondaryEntity: parsed.data.secondaryEntity?.trim() || parsed.data.secondaryEntity,
      originalTitle: parsed.data.originalTitle?.trim() || parsed.data.originalTitle,
      translatedTitle: parsed.data.translatedTitle?.trim() || parsed.data.translatedTitle,
      originalLanguage: parsed.data.originalLanguage?.trim() || parsed.data.originalLanguage,
      translationLanguage: parsed.data.translationLanguage?.trim() || parsed.data.translationLanguage,
      edition: parsed.data.edition?.trim() || parsed.data.edition,
      publisher: parsed.data.publisher?.trim() || parsed.data.publisher,
      publicationPlace: parsed.data.publicationPlace?.trim() || parsed.data.publicationPlace,
      isbn: parsed.data.isbn?.trim() || parsed.data.isbn,
      issn: parsed.data.issn?.trim() || parsed.data.issn,
      subject: parsed.data.subject?.trim() || parsed.data.subject,
      description: parsed.data.description?.trim() || parsed.data.description,
      physicalDescription: parsed.data.physicalDescription?.trim() || parsed.data.physicalDescription,
      seriesCollection: parsed.data.seriesCollection?.trim() || parsed.data.seriesCollection,
      generalNote: parsed.data.generalNote?.trim() || parsed.data.generalNote,
      bibliography: parsed.data.bibliography?.trim() || parsed.data.bibliography,
      summary: parsed.data.summary?.trim() || parsed.data.summary,
      coverUrl: parsed.data.coverUrl?.trim() || parsed.data.coverUrl,
      materialUrl: parsed.data.materialUrl?.trim() || parsed.data.materialUrl,
      location: parsed.data.location?.trim() || parsed.data.location,
      callNumber: parsed.data.callNumber?.trim() || parsed.data.callNumber,
    },
  });

  return NextResponse.json({ ok: true, item });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminPermission(request, "LIBRARY");

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
