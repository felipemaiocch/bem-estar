import type { LibraryItemKind, LibraryReservationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const libraryKindOptions: Array<{
  value: LibraryItemKind;
  label: string;
  description: string;
}> = [
  { value: "BOOK", label: "Livros", description: "Livros físicos do acervo da empresa." },
  { value: "ARTICLE", label: "Artigos", description: "Artigos internos, externos e científicos." },
  { value: "LEGISLATION", label: "Legislações", description: "Normas, leis, manuais regulatórios e políticas." },
  { value: "THESIS", label: "Teses e TCCs", description: "Pesquisas, trabalhos acadêmicos e referências técnicas." },
  { value: "VIDEO", label: "Vídeos", description: "Conteúdos audiovisuais de treinamento e apoio." },
  { value: "MOVIE", label: "Filmes", description: "Filmes e indicações para aprendizagem corporativa." },
  { value: "DOCUMENT", label: "Documentos", description: "Documentos e materiais institucionais." },
  { value: "HANDOUT", label: "Apostilas", description: "Apostilas e materiais de apoio." },
  { value: "COURSE", label: "Cursos", description: "Registros de cursos e capacitações." },
  { value: "LECTURE", label: "Palestras", description: "Palestras, encontros e gravações." },
  { value: "EXTERNAL_SITE", label: "Sites externos", description: "Links úteis e bases externas." },
  { value: "ASSESSMENT", label: "Teste seu conhecimento", description: "Avaliações, quizzes e testes." },
  { value: "TRAINING", label: "Treinamentos", description: "Materiais de treinamento e capacitação da Dr." },
];

export const libraryKindValues = libraryKindOptions.map((kind) => kind.value) as [
  LibraryItemKind,
  ...LibraryItemKind[],
];

export const libraryReservationStatusOptions: Array<{
  value: LibraryReservationStatus;
  label: string;
}> = [
  { value: "RESERVED", label: "Reservado" },
  { value: "BORROWED", label: "Retirado" },
  { value: "RETURNED", label: "Devolvido" },
  { value: "CANCELED", label: "Cancelado" },
  { value: "OVERDUE", label: "Em atraso" },
];

export const libraryReservationStatusValues = libraryReservationStatusOptions.map((status) => status.value) as [
  LibraryReservationStatus,
  ...LibraryReservationStatus[],
];

export function getLibraryKindLabel(kind?: string | null) {
  return libraryKindOptions.find((item) => item.value === kind)?.label ?? "Material";
}

export function getReservationStatusLabel(status?: string | null) {
  return libraryReservationStatusOptions.find((item) => item.value === status)?.label ?? "Reserva";
}

export async function listLibraryForUser(userId: string, options?: { search?: string; kind?: LibraryItemKind | "ALL"; category?: string }) {
  const search = options?.search?.trim();
  const kind = options?.kind && options.kind !== "ALL" ? options.kind : undefined;
  const category = options?.category?.trim();

  const items = await prisma.libraryItem.findMany({
    where: {
      status: "AVAILABLE",
      ...(kind ? { kind } : {}),
      ...(category ? { category } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { author: { contains: search, mode: "insensitive" } },
              { mainAuthor: { contains: search, mode: "insensitive" } },
              { secondaryAuthor: { contains: search, mode: "insensitive" } },
              { entityAuthor: { contains: search, mode: "insensitive" } },
              { secondaryEntity: { contains: search, mode: "insensitive" } },
              { originalTitle: { contains: search, mode: "insensitive" } },
              { translatedTitle: { contains: search, mode: "insensitive" } },
              { publisher: { contains: search, mode: "insensitive" } },
              { isbn: { contains: search, mode: "insensitive" } },
              { category: { contains: search, mode: "insensitive" } },
              { subject: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      reservations: {
        where: {
          status: { in: ["RESERVED", "BORROWED"] },
        },
        select: { id: true },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const myReservations = await prisma.libraryReservation.findMany({
    where: {
      userId,
      status: { in: ["RESERVED", "BORROWED", "OVERDUE"] },
    },
    include: { item: true },
    orderBy: [{ reservedAt: "desc" }],
  });

  const categories = await prisma.libraryItem.findMany({
    where: { status: "AVAILABLE" },
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });

  const topItems = await prisma.libraryItem.findMany({
    where: { status: "AVAILABLE" },
    include: {
      _count: {
        select: { reservations: true },
      },
    },
    orderBy: [{ reservations: { _count: "desc" } }, { title: "asc" }],
    take: 5,
  });

  return {
    items: items.map((item) => ({
      ...item,
      kindLabel: getLibraryKindLabel(item.kind),
      activeReservationsCount: item.reservations.length,
      reservations: undefined,
    })),
    myReservations: myReservations.map((reservation) => ({
      ...reservation,
      statusLabel: getReservationStatusLabel(reservation.status),
      item: {
        ...reservation.item,
        kindLabel: getLibraryKindLabel(reservation.item.kind),
      },
    })),
    categories: categories.map((item) => item.category),
    topItems: topItems.map((item) => ({
      id: item.id,
      title: item.title,
      author: item.author,
      coverUrl: item.coverUrl,
      reservationsCount: item._count.reservations,
    })),
    kindOptions: libraryKindOptions,
  };
}

export async function reserveLibraryItem(userId: string, itemId: string) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.libraryItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        title: true,
        isReservable: true,
        isDigital: true,
        availableCopies: true,
        status: true,
      },
    });

    if (!item || item.status !== "AVAILABLE") {
      throw new Error("Material não encontrado ou indisponível.");
    }

    if (!item.isReservable || item.isDigital) {
      throw new Error("Este material está disponível para consulta e não precisa de reserva.");
    }

    if (item.availableCopies <= 0) {
      throw new Error("Não há exemplares disponíveis para reserva neste momento.");
    }

    const activeReservation = await tx.libraryReservation.findFirst({
      where: {
        userId,
        itemId,
        status: { in: ["RESERVED", "BORROWED", "OVERDUE"] },
      },
      select: { id: true },
    });

    if (activeReservation) {
      throw new Error("Você já possui uma reserva ativa para este material.");
    }

    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + 7);

    const reservation = await tx.libraryReservation.create({
      data: {
        itemId,
        userId,
        status: "RESERVED",
        dueAt,
      },
      include: { item: true },
    });

    await tx.libraryItem.update({
      where: { id: itemId },
      data: {
        availableCopies: { decrement: 1 },
      },
    });

    return reservation;
  });
}

export async function listLibraryAdminData(options?: { search?: string; kind?: LibraryItemKind | "ALL" }) {
  const search = options?.search?.trim();
  const kind = options?.kind && options.kind !== "ALL" ? options.kind : undefined;

  const [items, reservations, statusCounts, totalReservations, returnedCount] = await Promise.all([
    prisma.libraryItem.findMany({
      where: {
        ...(kind ? { kind } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { author: { contains: search, mode: "insensitive" } },
                { mainAuthor: { contains: search, mode: "insensitive" } },
                { originalTitle: { contains: search, mode: "insensitive" } },
                { translatedTitle: { contains: search, mode: "insensitive" } },
                { category: { contains: search, mode: "insensitive" } },
                { subject: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        _count: {
          select: { reservations: true },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    }),
    prisma.libraryReservation.findMany({
      include: {
        item: true,
        user: {
          select: { id: true, name: true, email: true, department: true },
        },
      },
      orderBy: [{ reservedAt: "desc" }],
      take: 80,
    }),
    prisma.libraryReservation.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.libraryReservation.count(),
    prisma.libraryReservation.count({ where: { status: "RETURNED" } }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      kindLabel: getLibraryKindLabel(item.kind),
      reservationsCount: item._count.reservations,
    })),
    reservations: reservations.map((reservation) => ({
      ...reservation,
      statusLabel: getReservationStatusLabel(reservation.status),
      item: {
        ...reservation.item,
        kindLabel: getLibraryKindLabel(reservation.item.kind),
      },
    })),
    report: {
      totalItems: items.length,
      totalReservations,
      activeReservations:
        statusCounts.find((item) => item.status === "RESERVED")?._count.status ?? 0,
      borrowed:
        statusCounts.find((item) => item.status === "BORROWED")?._count.status ?? 0,
      returned: returnedCount,
    },
    kindOptions: libraryKindOptions,
  };
}
