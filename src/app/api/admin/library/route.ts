import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminPermission } from "@/lib/admin-permissions";
import { libraryKindValues, listLibraryAdminData } from "@/lib/library";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  search: z.string().max(120).optional(),
  kind: z.union([z.enum(libraryKindValues), z.literal("ALL")]).optional(),
});

const createItemSchema = z.object({
  title: z.string().min(2).max(180),
  author: z.string().max(160).optional(),
  mainAuthor: z.string().max(160).optional(),
  entityAuthor: z.string().max(180).optional(),
  secondaryAuthor: z.string().max(160).optional(),
  secondaryEntity: z.string().max(180).optional(),
  originalTitle: z.string().max(220).optional(),
  translatedTitle: z.string().max(220).optional(),
  originalLanguage: z.string().max(80).optional(),
  translationLanguage: z.string().max(80).optional(),
  edition: z.string().max(80).optional(),
  publisher: z.string().max(160).optional(),
  publicationPlace: z.string().max(160).optional(),
  year: z.number().int().min(1500).max(2100).optional(),
  isbn: z.string().max(80).optional(),
  category: z.string().min(2).max(120),
  subject: z.string().max(300).optional(),
  kind: z.enum(libraryKindValues),
  description: z.string().max(1000).optional(),
  physicalDescription: z.string().max(500).optional(),
  seriesCollection: z.string().max(180).optional(),
  generalNote: z.string().max(1000).optional(),
  bibliography: z.string().max(2000).optional(),
  summary: z.string().max(4000).optional(),
  coverUrl: z.string().max(1000).optional(),
  materialUrl: z.string().max(1000).optional(),
  location: z.string().max(160).optional(),
  totalCopies: z.number().int().min(0).max(10000).optional(),
  availableCopies: z.number().int().min(0).max(10000).optional(),
  isReservable: z.boolean().optional(),
  isDigital: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAdminPermission(request, "LIBRARY");

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
  const auth = await requireAdminPermission(request, "LIBRARY");

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
      mainAuthor: parsed.data.mainAuthor?.trim() || null,
      entityAuthor: parsed.data.entityAuthor?.trim() || null,
      secondaryAuthor: parsed.data.secondaryAuthor?.trim() || null,
      secondaryEntity: parsed.data.secondaryEntity?.trim() || null,
      originalTitle: parsed.data.originalTitle?.trim() || null,
      translatedTitle: parsed.data.translatedTitle?.trim() || null,
      originalLanguage: parsed.data.originalLanguage?.trim() || null,
      translationLanguage: parsed.data.translationLanguage?.trim() || null,
      edition: parsed.data.edition?.trim() || null,
      publisher: parsed.data.publisher?.trim() || null,
      publicationPlace: parsed.data.publicationPlace?.trim() || null,
      isbn: parsed.data.isbn?.trim() || null,
      subject: parsed.data.subject?.trim() || null,
      description: parsed.data.description?.trim() || null,
      physicalDescription: parsed.data.physicalDescription?.trim() || null,
      seriesCollection: parsed.data.seriesCollection?.trim() || null,
      generalNote: parsed.data.generalNote?.trim() || null,
      bibliography: parsed.data.bibliography?.trim() || null,
      summary: parsed.data.summary?.trim() || null,
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
