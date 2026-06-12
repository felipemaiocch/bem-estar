import type { LibraryItemKind, LibraryReservationStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const libraryKindOptions: Array<{
  value: LibraryItemKind;
  label: string;
  description: string;
}> = [
  { value: "SCIENTIFIC_ARTICLE", label: "Artigo científico", description: "Artigos científicos catalogados no repositório." },
  { value: "ARTICLE", label: "Artigos", description: "Artigos internos, externos e científicos." },
  { value: "HANDOUT", label: "Apostilas", description: "Apostilas e materiais de apoio." },
  { value: "BOOK_CHAPTER", label: "Capítulo de livro", description: "Capítulos avulsos e partes de obras." },
  { value: "COURSE", label: "Cursos", description: "Registros de cursos e capacitações." },
  { value: "DOCUMENT", label: "Documentos", description: "Documentos e materiais institucionais." },
  { value: "MOVIE", label: "Filmes", description: "Filmes e indicações para aprendizagem corporativa." },
  { value: "BOOK", label: "Livro físico", description: "Livros físicos do acervo da empresa." },
  { value: "PHYSICAL_BOOK", label: "Livro físico", description: "Livros físicos do acervo da empresa." },
  { value: "DIGITAL_BOOK", label: "Livro digital/virtual", description: "Livros digitais e materiais virtuais." },
  { value: "MANUAL", label: "Manual", description: "Manuais técnicos, operacionais e institucionais." },
  { value: "LEARNING_OBJECT", label: "Objeto de aprendizagem", description: "Vídeos educativos, podcasts, slides, infográficos, questionários e tutoriais." },
  { value: "LECTURE", label: "Palestras", description: "Palestras, encontros e gravações." },
  { value: "TECHNICAL_INSTITUTIONAL_PRODUCTION", label: "Produção técnica e institucional", description: "Produções técnicas, relatórios institucionais e materiais oficiais." },
  { value: "LEGISLATION", label: "Legislações", description: "Normas, leis, manuais regulatórios e políticas." },
  { value: "EXTERNAL_SITE", label: "Sites externos", description: "Links úteis e bases externas." },
  { value: "ASSESSMENT", label: "Teste seu conhecimento", description: "Avaliações, quizzes e testes." },
  { value: "THESIS", label: "Teses e TCCs", description: "Pesquisas, trabalhos acadêmicos e referências técnicas." },
  { value: "TRAINING", label: "Treinamentos", description: "Materiais de treinamento e capacitação da Dr." },
  { value: "VIDEO", label: "Vídeos", description: "Conteúdos audiovisuais de treinamento e apoio." },
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
  { value: "BORROWED", label: "Emprestado" },
  { value: "RETURNED", label: "Devolvido" },
  { value: "CANCELED", label: "Cancelado" },
  { value: "OVERDUE", label: "Em atraso" },
];

const activeLoanStatuses: LibraryReservationStatus[] = ["RESERVED", "BORROWED", "OVERDUE"];
const loanStatuses: LibraryReservationStatus[] = ["BORROWED", "RETURNED", "OVERDUE"];

export const libraryReservationStatusValues = libraryReservationStatusOptions.map((status) => status.value) as [
  LibraryReservationStatus,
  ...LibraryReservationStatus[],
];

export type LibraryReportFilters = {
  from?: Date;
  to?: Date;
};

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
              { issn: { contains: search, mode: "insensitive" } },
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

export async function registerLibraryConsultation(userId: string, itemId: string) {
  const item = await prisma.libraryItem.findFirst({
    where: {
      id: itemId,
      status: "AVAILABLE",
    },
    select: { id: true },
  });

  if (!item) {
    throw new Error("Documento não encontrado.");
  }

  await prisma.libraryItem.update({
    where: { id: itemId },
    data: { consultationCount: { increment: 1 } },
  });

  await prisma.libraryConsultation.create({
    data: {
      itemId,
      userId,
    },
  });

  return { itemId, userId };
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

    const activeReservationCount = await tx.libraryReservation.count({
      where: {
        userId,
        status: { in: activeLoanStatuses },
        item: { isDigital: false },
      },
    });

    if (activeReservationCount >= 2) {
      throw new Error("Cada leitor pode manter até 2 reservas ou empréstimos físicos ativos.");
    }

    const copy = await tx.libraryCopy.findFirst({
      where: {
        itemId,
        status: "AVAILABLE",
      },
      orderBy: { code: "asc" },
      select: { id: true },
    });

    if (item.availableCopies <= 0 || !copy) {
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
        copyId: copy.id,
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

    await tx.libraryCopy.update({
      where: { id: copy.id },
      data: { status: "RESERVED" },
    });

    return reservation;
  });
}

export async function borrowLibraryReservation(reservationId: string, notes?: string) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.libraryReservation.findUnique({
      where: { id: reservationId },
      include: { item: true },
    });

    if (!reservation) throw new Error("Reserva não encontrada.");
    if (!["RESERVED", "OVERDUE"].includes(reservation.status)) {
      throw new Error("Apenas reservas pendentes podem virar empréstimo.");
    }

    const activeBorrowedCount = await tx.libraryReservation.count({
      where: {
        userId: reservation.userId,
        status: { in: ["BORROWED", "OVERDUE"] },
        item: { isDigital: false },
      },
    });

    if (activeBorrowedCount >= 2) {
      throw new Error("Cada leitor pode manter até 2 empréstimos físicos ativos.");
    }

    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + 7);

    const updated = await tx.libraryReservation.update({
      where: { id: reservationId },
      data: {
        status: "BORROWED",
        borrowedAt: new Date(),
        dueAt,
        notes: notes?.trim() || undefined,
      },
      include: {
        item: true,
        user: { select: { id: true, name: true, email: true, department: true } },
      },
    });

    if (reservation.copyId) {
      await tx.libraryCopy.update({
        where: { id: reservation.copyId },
        data: { status: "BORROWED" },
      });
    }

    return updated;
  });
}

export async function renewLibraryReservation(reservationId: string) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.libraryReservation.findUnique({
      where: { id: reservationId },
      select: {
        id: true,
        itemId: true,
        status: true,
        renewedCount: true,
        dueAt: true,
      },
    });

    if (!reservation) throw new Error("Empréstimo não encontrado.");
    if (reservation.status !== "BORROWED") {
      throw new Error("Somente empréstimos ativos podem ser renovados.");
    }
    if (reservation.renewedCount >= 2) {
      throw new Error("Este título já atingiu o limite de 2 renovações.");
    }
    if (reservation.dueAt && reservation.dueAt < new Date()) {
      throw new Error("Empréstimos em atraso não podem ser renovados.");
    }

    const hasWaitingReservation = await tx.libraryReservation.findFirst({
      where: {
        itemId: reservation.itemId,
        status: "RESERVED",
        id: { not: reservation.id },
      },
      select: { id: true },
    });

    if (hasWaitingReservation) {
      throw new Error("Não é possível renovar porque existe outra reserva para este título.");
    }

    const baseDate = reservation.dueAt && reservation.dueAt > new Date() ? reservation.dueAt : new Date();
    const dueAt = new Date(baseDate);
    dueAt.setDate(dueAt.getDate() + 7);

    return tx.libraryReservation.update({
      where: { id: reservationId },
      data: {
        dueAt,
        renewedCount: { increment: 1 },
      },
      include: {
        item: true,
        user: { select: { id: true, name: true, email: true, department: true } },
      },
    });
  });
}

export async function returnLibraryReservation(reservationId: string, notes?: string) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.libraryReservation.findUnique({
      where: { id: reservationId },
      select: { id: true, itemId: true, copyId: true, status: true },
    });

    if (!reservation) throw new Error("Empréstimo não encontrado.");
    if (!["RESERVED", "BORROWED", "OVERDUE"].includes(reservation.status)) {
      throw new Error("Esta movimentação já foi encerrada.");
    }

    const updated = await tx.libraryReservation.update({
      where: { id: reservationId },
      data: {
        status: "RETURNED",
        returnedAt: new Date(),
        notes: notes?.trim() || undefined,
      },
      include: {
        item: true,
        user: { select: { id: true, name: true, email: true, department: true } },
      },
    });

    await tx.libraryItem.update({
      where: { id: reservation.itemId },
      data: { availableCopies: { increment: 1 } },
    });

    if (reservation.copyId) {
      await tx.libraryCopy.update({
        where: { id: reservation.copyId },
        data: { status: "AVAILABLE" },
      });
    }

    return updated;
  });
}

export async function cancelLibraryReservation(reservationId: string, notes?: string) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.libraryReservation.findUnique({
      where: { id: reservationId },
      select: { id: true, itemId: true, copyId: true, status: true },
    });

    if (!reservation) throw new Error("Reserva não encontrada.");
    if (!["RESERVED", "BORROWED", "OVERDUE"].includes(reservation.status)) {
      throw new Error("Esta movimentação já foi encerrada.");
    }

    const updated = await tx.libraryReservation.update({
      where: { id: reservationId },
      data: {
        status: "CANCELED",
        notes: notes?.trim() || undefined,
      },
      include: {
        item: true,
        user: { select: { id: true, name: true, email: true, department: true } },
      },
    });

    await tx.libraryItem.update({
      where: { id: reservation.itemId },
      data: { availableCopies: { increment: 1 } },
    });

    if (reservation.copyId) {
      await tx.libraryCopy.update({
        where: { id: reservation.copyId },
        data: { status: "AVAILABLE" },
      });
    }

    return updated;
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
                { isbn: { contains: search, mode: "insensitive" } },
                { issn: { contains: search, mode: "insensitive" } },
                { category: { contains: search, mode: "insensitive" } },
                { subject: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        copies: {
          orderBy: { code: "asc" },
        },
        contributors: {
          orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
        },
        _count: {
          select: { reservations: true },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    }),
    prisma.libraryReservation.findMany({
      include: {
        item: true,
        copy: true,
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
      copies: item.copies,
      contributors: item.contributors,
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

function buildPeriodWhere(field: "createdAt" | "reservedAt" | "borrowedAt" | "returnedAt", filters?: LibraryReportFilters) {
  const range: { gte?: Date; lte?: Date } = {};

  if (filters?.from) range.gte = filters.from;
  if (filters?.to) range.lte = filters.to;

  return Object.keys(range).length ? { [field]: range } : {};
}

function buildOptionalPeriodWhere(field: "createdAt" | "reservedAt" | "borrowedAt" | "returnedAt", filters?: LibraryReportFilters) {
  const where = buildPeriodWhere(field, filters);
  return Object.keys(where).length ? where : undefined;
}

function mapKindCounts(items: Array<{ kind: LibraryItemKind; _count: { kind: number } }>) {
  return items.map((item) => ({
    kind: item.kind,
    label: getLibraryKindLabel(item.kind),
    count: item._count.kind,
  }));
}

export async function getLibraryReport(filters?: LibraryReportFilters) {
  const createdWhere = buildPeriodWhere("createdAt", filters);
  const reservedWhere = buildPeriodWhere("reservedAt", filters);
  const borrowedWhere = buildPeriodWhere("borrowedAt", filters);
  const returnedWhere = buildPeriodWhere("returnedAt", filters);

  const [
    itemsAdded,
    totalItems,
    activeItems,
    consultationCount,
    reservationStatusCounts,
    reservationsInPeriod,
    borrowedInPeriod,
    returnedInPeriod,
    renewedInPeriod,
    uniqueUsers,
    topReservedItems,
    topBorrowedItems,
    kindCounts,
    categoryCounts,
    loansByDepartment,
    readerReservations,
    recentItems,
    recentReservations,
  ] = await Promise.all([
    prisma.libraryItem.count({ where: createdWhere }),
    prisma.libraryItem.count(),
    prisma.libraryItem.count({ where: { status: "AVAILABLE" } }),
    prisma.libraryConsultation.count({
      where: buildOptionalPeriodWhere("createdAt", filters),
    }),
    prisma.libraryReservation.groupBy({
      by: ["status"],
      where: reservedWhere,
      _count: { status: true },
    }),
    prisma.libraryReservation.count({ where: reservedWhere }),
    prisma.libraryReservation.count({
      where: {
        status: { in: ["BORROWED", "RETURNED", "OVERDUE"] },
        borrowedAt: { not: null },
        ...borrowedWhere,
      },
    }),
    prisma.libraryReservation.count({
      where: {
        status: "RETURNED",
        returnedAt: { not: null },
        ...returnedWhere,
      },
    }),
    prisma.libraryReservation.count({
      where: {
        renewedCount: { gt: 0 },
        ...borrowedWhere,
      },
    }),
    prisma.libraryReservation.findMany({
      where: reservedWhere,
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.libraryItem.findMany({
      include: {
        _count: {
          select: {
            reservations: {
              where: reservedWhere as Prisma.LibraryReservationWhereInput,
            },
          },
        },
      },
      orderBy: [{ reservations: { _count: "desc" } }, { title: "asc" }],
      take: 8,
    }),
    prisma.libraryItem.findMany({
      include: {
        _count: {
          select: {
            reservations: {
              where: {
                status: { in: ["BORROWED", "RETURNED", "OVERDUE"] },
                borrowedAt: { not: null },
                ...(borrowedWhere as Prisma.LibraryReservationWhereInput),
              },
            },
          },
        },
      },
      orderBy: [{ reservations: { _count: "desc" } }, { title: "asc" }],
      take: 8,
    }),
    prisma.libraryItem.groupBy({
      by: ["kind"],
      where: createdWhere,
      _count: { kind: true },
      orderBy: { _count: { kind: "desc" } },
    }),
    prisma.libraryItem.groupBy({
      by: ["category"],
      where: createdWhere,
      _count: { category: true },
      orderBy: { _count: { category: "desc" } },
      take: 8,
    }),
    prisma.libraryReservation.findMany({
      where: {
        status: { in: loanStatuses },
        borrowedAt: { not: null },
        ...borrowedWhere,
      },
      select: {
        user: { select: { department: true } },
      },
    }),
    prisma.libraryReservation.findMany({
      where: reservedWhere,
      include: {
        item: {
          select: { title: true },
        },
        user: {
          select: { id: true, name: true, email: true, department: true },
        },
      },
      orderBy: { reservedAt: "desc" },
      take: 500,
    }),
    prisma.libraryItem.findMany({
      where: createdWhere,
      include: {
        creator: {
          select: { name: true, email: true },
        },
        _count: {
          select: { reservations: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.libraryReservation.findMany({
      where: reservedWhere,
      include: {
        item: true,
        user: {
          select: { name: true, email: true, department: true },
        },
      },
      orderBy: { reservedAt: "desc" },
      take: 20,
    }),
  ]);

  const byStatus = Object.fromEntries(
    libraryReservationStatusOptions.map((status) => [
      status.value,
      reservationStatusCounts.find((item) => item.status === status.value)?._count.status ?? 0,
    ]),
  ) as Record<LibraryReservationStatus, number>;

  return {
    generatedAt: new Date().toISOString(),
    period: {
      from: filters?.from?.toISOString() ?? null,
      to: filters?.to?.toISOString() ?? null,
    },
    metrics: {
      totalItems,
      activeItems,
      itemsAdded,
      consultationCount,
      reservationsInPeriod,
      uniqueUsers: uniqueUsers.length,
      borrowedInPeriod,
      returnedInPeriod,
      renewedInPeriod,
      reserved: byStatus.RESERVED,
      borrowed: byStatus.BORROWED,
      returned: byStatus.RETURNED,
      canceled: byStatus.CANCELED,
      overdue: byStatus.OVERDUE,
    },
    topReservedItems: topReservedItems
      .filter((item) => item._count.reservations > 0)
      .map((item) => ({
        id: item.id,
        title: item.title,
        author: item.mainAuthor ?? item.author,
        category: item.category,
        kindLabel: getLibraryKindLabel(item.kind),
        reservationsCount: item._count.reservations,
      })),
    topBorrowedItems: topBorrowedItems
      .filter((item) => item._count.reservations > 0)
      .map((item) => ({
        id: item.id,
        title: item.title,
        author: item.mainAuthor ?? item.author,
        category: item.category,
        kindLabel: getLibraryKindLabel(item.kind),
        borrowedCount: item._count.reservations,
      })),
    kindCounts: mapKindCounts(kindCounts),
    categoryCounts: categoryCounts.map((item) => ({
      category: item.category,
      count: item._count.category,
    })),
    loansByDepartment: Object.entries(
      loansByDepartment.reduce<Record<string, number>>((acc, reservation) => {
        const key = reservation.user.department ?? "SEM_DEPARTAMENTO";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
    )
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count),
    readerHistory: Object.values(
      readerReservations.reduce<Record<string, {
        id: string;
        name: string;
        email: string;
        department: string | null;
        reservations: number;
        borrowed: number;
        returned: number;
        overdue: number;
        canceled: number;
        lastItemTitle: string | null;
        lastReservedAt: string | null;
      }>>((acc, reservation) => {
        const reader = acc[reservation.user.id] ?? {
          id: reservation.user.id,
          name: reservation.user.name,
          email: reservation.user.email,
          department: reservation.user.department,
          reservations: 0,
          borrowed: 0,
          returned: 0,
          overdue: 0,
          canceled: 0,
          lastItemTitle: null,
          lastReservedAt: null,
        };

        reader.reservations += 1;
        if (reservation.status === "BORROWED") reader.borrowed += 1;
        if (reservation.status === "RETURNED") reader.returned += 1;
        if (reservation.status === "OVERDUE") reader.overdue += 1;
        if (reservation.status === "CANCELED") reader.canceled += 1;
        if (!reader.lastReservedAt || reservation.reservedAt > new Date(reader.lastReservedAt)) {
          reader.lastItemTitle = reservation.item.title;
          reader.lastReservedAt = reservation.reservedAt.toISOString();
        }

        acc[reservation.user.id] = reader;
        return acc;
      }, {}),
    ).sort((a, b) => b.reservations - a.reservations),
    recentItems: recentItems.map((item) => ({
      id: item.id,
      title: item.title,
      author: item.mainAuthor ?? item.author,
      category: item.category,
      kindLabel: getLibraryKindLabel(item.kind),
      createdAt: item.createdAt.toISOString(),
      creatorName: item.creator?.name ?? null,
      reservationsCount: item._count.reservations,
    })),
    recentReservations: recentReservations.map((reservation) => ({
      id: reservation.id,
      status: reservation.status,
      statusLabel: getReservationStatusLabel(reservation.status),
      reservedAt: reservation.reservedAt.toISOString(),
      borrowedAt: reservation.borrowedAt?.toISOString() ?? null,
      returnedAt: reservation.returnedAt?.toISOString() ?? null,
      itemTitle: reservation.item.title,
      userName: reservation.user.name,
      userEmail: reservation.user.email,
      userDepartment: reservation.user.department,
    })),
  };
}
