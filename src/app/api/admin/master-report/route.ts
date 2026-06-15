import { NextResponse, type NextRequest } from "next/server";
import type { Department, Prisma } from "@prisma/client";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import { departmentValues, getDepartmentLabel } from "@/lib/departments";
import { prisma } from "@/lib/prisma";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const querySchema = z.object({
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  department: z.union([z.enum(departmentValues), z.literal("ALL"), z.literal("SEM_DEPARTAMENTO")]).optional(),
});

function parseDate(value?: string | null, endOfDay = false) {
  if (!value) return undefined;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function buildPeriod(field: "createdAt" | "completedAt" | "reservedAt" | "checkedInAt" | "startsAt", from?: Date, to?: Date) {
  const range: { gte?: Date; lte?: Date } = {};
  if (from) range.gte = from;
  if (to) range.lte = to;
  return Object.keys(range).length ? { [field]: range } : {};
}

function userDepartmentWhere(department?: Department | "ALL" | "SEM_DEPARTAMENTO") {
  if (!department || department === "ALL") return {};
  return { user: { department: department === "SEM_DEPARTAMENTO" ? null : department } };
}

function departmentWhere(department?: Department | "ALL" | "SEM_DEPARTAMENTO") {
  if (!department || department === "ALL") return {};
  return { department: department === "SEM_DEPARTAMENTO" ? null : department };
}

function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const parsed = querySchema.safeParse({
    from: request.nextUrl.searchParams.get("from") ?? undefined,
    to: request.nextUrl.searchParams.get("to") ?? undefined,
    department: request.nextUrl.searchParams.get("department") ?? "ALL",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Filtros inválidos.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const from = parseDate(parsed.data.from);
  const to = parseDate(parsed.data.to, true);
  const department = parsed.data.department ?? "ALL";

  if (from && to && from > to) {
    return NextResponse.json({ ok: false, error: "Data inicial maior que data final." }, { status: 400 });
  }

  const userWhere: Prisma.UserWhereInput = {
    ...departmentWhere(department),
  };
  const createdAtWhere = buildPeriod("createdAt", from, to);
  const userInPeriodWhere: Prisma.UserWhereInput = { ...userWhere, ...createdAtWhere };
  const relatedUserFilter = userDepartmentWhere(department);

  const [
    usersTotal,
    usersActive,
    usersPending,
    usersInPeriod,
    usersByDepartment,
    professionals,
    professionalSessions,
    sessionStatusCounts,
    eventsTotal,
    publishedEvents,
    upcomingEvents,
    eventAttendanceTotal,
    eventCheckedIn,
    wellnessEntries,
    wellnessUniqueUsers,
    eadCourses,
    eadLessons,
    eadCompletions,
    eadRatings,
    eadResources,
    libraryItems,
    libraryReservations,
    libraryBorrowed,
    libraryOverdue,
    libraryConsultations,
    feedPosts,
    feedPending,
    contentReportsOpen,
    cardsActive,
    notificationsSent,
    notificationsFailed,
    acceptances,
    scoreUsers,
  ] = await Promise.all([
    prisma.user.count({ where: userWhere }),
    prisma.user.count({ where: { ...userWhere, isActive: true } }),
    prisma.user.count({ where: { ...userWhere, approvalStatus: "PENDING" } }),
    prisma.user.count({ where: userInPeriodWhere }),
    prisma.user.groupBy({
      by: ["department"],
      where: userWhere,
      _count: { _all: true },
      orderBy: { _count: { department: "desc" } },
    }),
    prisma.professionalProfile.count({
      where: { user: userWhere },
    }),
    prisma.sessionBooking.count({
      where: { ...buildPeriod("startsAt", from, to), ...relatedUserFilter },
    }),
    prisma.sessionBooking.groupBy({
      by: ["status"],
      where: { ...buildPeriod("startsAt", from, to), ...relatedUserFilter },
      _count: { status: true },
    }),
    prisma.event.count(),
    prisma.event.count({ where: { status: "PUBLISHED" } }),
    prisma.event.count({ where: { status: "PUBLISHED", startsAt: { gte: new Date() } } }),
    prisma.eventAttendance.count({ where: { ...buildPeriod("createdAt", from, to), ...relatedUserFilter } }),
    prisma.eventAttendance.count({ where: { checkedInAt: { not: null }, ...buildPeriod("checkedInAt", from, to), ...relatedUserFilter } }),
    prisma.wellnessEntry.findMany({
      where: { ...buildPeriod("createdAt", from, to), ...relatedUserFilter },
      select: { moodLabel: true, moodScore: true, habitsScore: true, user: { select: { department: true } } },
      take: 5000,
    }),
    prisma.wellnessEntry.findMany({
      where: { ...buildPeriod("createdAt", from, to), ...relatedUserFilter },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.eadCourse.count({ where: department === "ALL" ? undefined : department === "SEM_DEPARTAMENTO" ? undefined : { OR: [{ department }, { allowedDepartments: { has: department } }, { isGlobal: true }] } }),
    prisma.eadLesson.count({
      where: department === "ALL" || department === "SEM_DEPARTAMENTO" ? undefined : { course: { OR: [{ department }, { allowedDepartments: { has: department } }, { isGlobal: true }] } },
    }),
    prisma.eadLessonCompletion.count({
      where: { ...buildPeriod("completedAt", from, to), ...relatedUserFilter },
    }),
    prisma.eadLessonRating.findMany({
      where: { ...buildPeriod("createdAt", from, to), ...relatedUserFilter },
      select: { rating: true },
    }),
    prisma.eadResource.count({ where: department === "ALL" || department === "SEM_DEPARTAMENTO" ? undefined : { OR: [{ department }, { allowedDepartments: { has: department } }, { isGlobal: true }] } }),
    prisma.libraryItem.count(),
    prisma.libraryReservation.count({ where: { ...buildPeriod("reservedAt", from, to), ...relatedUserFilter } }),
    prisma.libraryReservation.count({ where: { status: { in: ["BORROWED", "RETURNED", "OVERDUE"] }, borrowedAt: { not: null }, ...relatedUserFilter } }),
    prisma.libraryReservation.count({ where: { status: "OVERDUE", ...relatedUserFilter } }),
    prisma.libraryConsultation.count({ where: { ...buildPeriod("createdAt", from, to), ...relatedUserFilter } }),
    prisma.feedPost.count({ where: { ...createdAtWhere, author: userWhere } }),
    prisma.feedPost.count({ where: { status: "PENDING", author: userWhere } }),
    prisma.contentReport.count({ where: { status: "OPEN", reporter: userWhere } }),
    prisma.engagementCard.count({ where: { status: { in: ["Ativo", "Agenda aberta", "Confirmado"] } } }),
    prisma.notification.count({ where: { deliveryStatus: "SENT", ...createdAtWhere, user: userWhere } }),
    prisma.notification.count({ where: { deliveryStatus: "FAILED", ...createdAtWhere, user: userWhere } }),
    prisma.userAcceptance.count({ where: { ...createdAtWhere, user: userWhere } }),
    prisma.user.findMany({
      where: userWhere,
      select: { id: true, name: true, email: true, department: true, score: true, drCoins: true },
      orderBy: [{ score: "desc" }, { drCoins: "desc" }],
      take: 10,
    }),
  ]);

  const completedSessions = sessionStatusCounts.find((item) => item.status === "COMPLETED")?._count.status ?? 0;
  const missedSessions = sessionStatusCounts.find((item) => item.status === "MISSED")?._count.status ?? 0;
  const scheduledSessions = sessionStatusCounts.find((item) => item.status === "SCHEDULED")?._count.status ?? 0;
  const confirmedSessions = sessionStatusCounts.find((item) => item.status === "CONFIRMED")?._count.status ?? 0;
  const checkinAlertCount = wellnessEntries.filter((entry) => entry.moodLabel === "Sob pressão" || entry.moodLabel === "Cansado").length;
  const energyValues = wellnessEntries.map((entry) => entry.moodScore).filter((value): value is number => typeof value === "number");
  const avgEnergy = energyValues.length ? Math.round(energyValues.reduce((sum, value) => sum + value, 0) / energyValues.length) : 0;
  const averageRating = eadRatings.length ? Number((eadRatings.reduce((sum, rating) => sum + rating.rating, 0) / eadRatings.length).toFixed(1)) : 0;

  const moodCounts = ["Energizado", "Equilibrado", "Sob pressão", "Cansado"].map((mood) => ({
    mood,
    count: wellnessEntries.filter((entry) => entry.moodLabel === mood).length,
  }));

  const checkinsByDepartment = Object.values(
    wellnessEntries.reduce<Record<string, { department: string; checkins: number; alerts: number }>>((acc, entry) => {
      const key = entry.user.department ?? "SEM_DEPARTAMENTO";
      acc[key] ??= { department: key, checkins: 0, alerts: 0 };
      acc[key].checkins += 1;
      if (entry.moodLabel === "Sob pressão" || entry.moodLabel === "Cansado") acc[key].alerts += 1;
      return acc;
    }, {} as Record<string, { department: string; checkins: number; alerts: number }>),
  ).map((value) => ({
    ...value,
    departmentLabel: getDepartmentLabel(value.department),
    alertRate: percent(value.alerts, value.checkins),
  })).sort((left, right) => right.checkins - left.checkins);

  const usersByDepartmentRows = usersByDepartment.map((item) => ({
    department: item.department ?? "SEM_DEPARTAMENTO",
    departmentLabel: getDepartmentLabel(item.department),
    count: item._count._all,
  }));

  return NextResponse.json({
    ok: true,
    report: {
      generatedAt: new Date().toISOString(),
      period: {
        from: from?.toISOString() ?? null,
        to: to?.toISOString() ?? null,
        department,
        departmentLabel: getDepartmentLabel(department),
      },
      modules: {
        users: {
          total: usersTotal,
          active: usersActive,
          pending: usersPending,
          newInPeriod: usersInPeriod,
          byDepartment: usersByDepartmentRows,
        },
        professionals: {
          total: professionals,
          sessions: professionalSessions,
          scheduled: scheduledSessions,
          confirmed: confirmedSessions,
          completed: completedSessions,
          missed: missedSessions,
          completionRate: percent(completedSessions, professionalSessions),
        },
        events: {
          total: eventsTotal,
          published: publishedEvents,
          upcoming: upcomingEvents,
          participations: eventAttendanceTotal,
          checkins: eventCheckedIn,
          presenceRate: percent(eventCheckedIn, eventAttendanceTotal),
        },
        wellness: {
          checkins: wellnessEntries.length,
          uniqueUsers: wellnessUniqueUsers.length,
          avgEnergy,
          alertCount: checkinAlertCount,
          alertRate: percent(checkinAlertCount, wellnessEntries.length),
          moodCounts,
          byDepartment: checkinsByDepartment,
        },
        ead: {
          courses: eadCourses,
          lessons: eadLessons,
          completions: eadCompletions,
          resources: eadResources,
          ratings: eadRatings.length,
          averageRating,
        },
        library: {
          items: libraryItems,
          reservations: libraryReservations,
          borrowed: libraryBorrowed,
          overdue: libraryOverdue,
          consultations: libraryConsultations,
        },
        content: {
          cardsActive,
          feedPosts,
          feedPending,
          openReports: contentReportsOpen,
        },
        communication: {
          notificationsSent,
          notificationsFailed,
          acceptances,
        },
        gamification: {
          totalScore: scoreUsers.reduce((sum, user) => sum + user.score, 0),
          totalCoins: scoreUsers.reduce((sum, user) => sum + user.drCoins, 0),
          topUsers: scoreUsers.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            department: user.department,
            departmentLabel: getDepartmentLabel(user.department),
            score: user.score,
            drCoins: user.drCoins,
          })),
        },
      },
    },
  });
}
