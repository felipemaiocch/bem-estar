import bcrypt from "bcryptjs";
import type { BookingStatus, SessionBooking } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type SessionIdentity = {
  sub: string;
  email: string;
};

export type AgendaAction = "reserve" | "waitlist";

export interface AgendaDateInput {
  day: number;
  month: number;
  year: number;
}

export interface AgendaSlotResponse {
  slotId: string;
  time: string;
  specialist: string;
  specialty: string;
  focus: string;
  mode: "online" | "presencial";
  location: string;
  status: "available" | "occupied" | "waitlist";
  mineStatus?: "booked" | "waitlist";
}

export interface AgendaDayContent {
  slots: AgendaSlotResponse[];
  events: any[];
  cards: any[];
}

interface AgendaSlotTemplate {
  id: string;
  time: string;
  specialist: string;
  specialty: string;
  focus: string;
  mode: "online" | "presencial";
  location: string;
  meetingUrl?: string;
  profile: {
    email: string;
    specialty: string;
  };
}

interface BookingResult {
  message: string;
}

export interface UserAgendaBookingView {
  id: string;
  startsAtIso: string;
  endsAtIso: string;
  specialist: string;
  specialty: string;
  focus: string;
  mode: "online" | "presencial";
  location: string;
  meetingUrl?: string;
  status: BookingStatus;
  waitlistPosition?: number | null;
}

type BookingWithUser = SessionBooking & { userId: string };

const activeStatuses: BookingStatus[] = ["SCHEDULED", "CONFIRMED", "WAITLIST"];
const confirmedStatuses: BookingStatus[] = ["SCHEDULED", "CONFIRMED"];

const agendaSlotTemplates: AgendaSlotTemplate[] = [
  {
    id: "camila-0830",
    time: "08:30",
    specialist: "Camila Rocha",
    specialty: "Nutricionista",
    focus: "Nutrição esportiva",
    mode: "presencial",
    location: "Sala Nutrição 01",
    profile: {
      email: "camila.rocha@semonitora.local",
      specialty: "Nutrição",
    },
  },
  {
    id: "paula-1000",
    time: "10:00",
    specialist: "Dra. Paula Mendes",
    specialty: "Psicólogo",
    focus: "Burnout e ansiedade",
    mode: "online",
    location: "Teleconsulta se.monitora",
    meetingUrl: "https://meet.google.com/new",
    profile: {
      email: "paula.mendes@semonitora.local",
      specialty: "Psicologia",
    },
  },
  {
    id: "diego-1130",
    time: "11:30",
    specialist: "Diego Prado",
    specialty: "Educador físico",
    focus: "Postura no trabalho",
    mode: "presencial",
    location: "Studio Movimento",
    profile: {
      email: "diego.prado@semonitora.local",
      specialty: "Educação física",
    },
  },
  {
    id: "paula-1400",
    time: "14:00",
    specialist: "Dra. Paula Mendes",
    specialty: "Psicólogo",
    focus: "Sono e estresse",
    mode: "presencial",
    location: "Sala Psicologia 02",
    profile: {
      email: "paula.mendes@semonitora.local",
      specialty: "Psicologia",
    },
  },
  {
    id: "camila-1630",
    time: "16:30",
    specialist: "Camila Rocha",
    specialty: "Nutricionista",
    focus: "Emagrecimento saudável",
    mode: "presencial",
    location: "Sala Nutrição 01",
    profile: {
      email: "camila.rocha@semonitora.local",
      specialty: "Nutrição",
    },
  },
];

type DemoBooking = {
  id: string;
  userSub: string;
  slotId: string;
  startsAtMs: number;
  endsAtMs: number;
  status: BookingStatus;
  waitlistPosition?: number;
  notes?: string;
  cancellationReason?: string;
  cancelledAtMs?: number;
  completedAtMs?: number;
};

declare global {
  var semonitoraDemoAgendaBookings: DemoBooking[] | undefined;
  var semonitoraAgendaProfessionalMap: Record<string, string> | undefined;
  var semonitoraAgendaSeedHash: string | undefined;
}

function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.DATABASE_URL;
}

function getDemoBookingsStore() {
  if (!global.semonitoraDemoAgendaBookings) {
    global.semonitoraDemoAgendaBookings = [];
  }

  return global.semonitoraDemoAgendaBookings;
}

function getDemoUserName(userSub: string) {
  switch (userSub) {
    case "user-felipe":
      return "Felipe Santos";
    case "user-larissa":
      return "Larissa Melo";
    case "user-amanda":
      return "Amanda Costa";
    default:
      return "Usuário";
  }
}

function normalizeFilter(filter?: string) {
  return (filter ?? "Todos").trim().toLowerCase();
}

function normalizeFocusFilter(filter?: string) {
  return (filter ?? "Todos focos").trim().toLowerCase();
}

function slotMatchesFilter(slot: AgendaSlotTemplate, filter?: string, focusFilter?: string) {
  const normalizedFilter = normalizeFilter(filter);
  const normalizedFocusFilter = normalizeFocusFilter(focusFilter);

  const matchesSpecialty =
    !normalizedFilter ||
    normalizedFilter === "todos" ||
    slot.specialty.toLowerCase().includes(normalizedFilter);

  const matchesFocus =
    !normalizedFocusFilter ||
    normalizedFocusFilter === "todos focos" ||
    slot.focus.toLowerCase().includes(normalizedFocusFilter);

  if (!matchesSpecialty || !matchesFocus) {
    return false;
  }

  return true;
}

function getSlotTemplate(slotId: string) {
  return agendaSlotTemplates.find((item) => item.id === slotId) ?? null;
}

function buildSlotWindow(date: AgendaDateInput, time: string) {
  const [hours, minutes] = time.split(":").map((value) => Number(value));
  const startsAt = new Date(date.year, date.month - 1, date.day, hours, minutes, 0, 0);
  const endsAt = new Date(startsAt);
  endsAt.setMinutes(endsAt.getMinutes() + 60);
  return { startsAt, endsAt };
}

function buildDayRange(date: AgendaDateInput) {
  const start = new Date(date.year, date.month - 1, date.day, 0, 0, 0, 0);
  const end = new Date(date.year, date.month - 1, date.day + 1, 0, 0, 0, 0);
  return { start, end };
}

function buildAgendaSlots(
  options: {
    date: AgendaDateInput;
    filter?: string;
    focusFilter?: string;
    session: SessionIdentity;
    getBookingsForSlot: (slot: AgendaSlotTemplate, startsAt: Date) => BookingWithUser[];
  },
) {
  return agendaSlotTemplates
    .filter((slot) => slotMatchesFilter(slot, options.filter, options.focusFilter))
    .map((slot) => {
      const { startsAt } = buildSlotWindow(options.date, slot.time);
      const slotBookings = options.getBookingsForSlot(slot, startsAt);

      const hasConfirmed = slotBookings.some((booking) =>
        confirmedStatuses.includes(booking.status),
      );
      const mineBooked = slotBookings.some(
        (booking) =>
          booking.userId === options.session.sub &&
          confirmedStatuses.includes(booking.status),
      );
      const mineWaitlist = slotBookings.some(
        (booking) => booking.userId === options.session.sub && booking.status === "WAITLIST",
      );

      return {
        slotId: slot.id,
        time: slot.time,
        specialist: slot.specialist,
        specialty: slot.specialty,
        focus: slot.focus,
        mode: slot.mode,
        location: slot.location,
        status: hasConfirmed
          ? mineWaitlist
            ? ("waitlist" as const)
            : ("occupied" as const)
          : ("available" as const),
        mineStatus: mineBooked
          ? ("booked" as const)
          : mineWaitlist
            ? ("waitlist" as const)
            : undefined,
      } satisfies AgendaSlotResponse;
    });
}

function toBookingWithUser(
  booking: SessionBooking,
  userId: string,
): BookingWithUser {
  return { ...booking, userId };
}

async function getSeedHash() {
  if (!global.semonitoraAgendaSeedHash) {
    global.semonitoraAgendaSeedHash = await bcrypt.hash("semonitora-internal", 10);
  }

  return global.semonitoraAgendaSeedHash;
}

async function ensureAgendaProfessionals() {
  if (global.semonitoraAgendaProfessionalMap) {
    return global.semonitoraAgendaProfessionalMap;
  }

  const passwordHash = await getSeedHash();
  const professionalMap: Record<string, string> = {};

  for (const slot of agendaSlotTemplates) {
    const existingProfileId = professionalMap[slot.profile.email];
    if (existingProfileId) {
      continue;
    }

    const user = await prisma.user.upsert({
      where: { email: slot.profile.email },
      update: {
        name: slot.specialist,
        role: "PROFESSIONAL",
      },
      create: {
        name: slot.specialist,
        email: slot.profile.email,
        passwordHash,
        role: "PROFESSIONAL",
      },
    });

    const profile = await prisma.professionalProfile.upsert({
      where: { userId: user.id },
      update: {
        specialty: slot.profile.specialty,
      },
      create: {
        userId: user.id,
        specialty: slot.profile.specialty,
      },
    });

    professionalMap[slot.profile.email] = profile.id;
  }

  global.semonitoraAgendaProfessionalMap = professionalMap;
  return professionalMap;
}

async function ensureUserExists(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  return Boolean(user);
}

export async function listAgendaSlots(options: {
  date: AgendaDateInput;
  filter?: string;
  focusFilter?: string;
  session: SessionIdentity;
}): Promise<AgendaDayContent> {
  const { start, end } = buildDayRange(options.date);
  const dateStr = `${options.date.year}-${String(options.date.month).padStart(2, '0')}-${String(options.date.day).padStart(2, '0')}`;

  // Fetch company events for the day
  const companyEvents = await prisma.event.findMany({
    where: { 
        status: "PUBLISHED", 
        startsAt: { gte: start, lt: end } 
    }
  });

  // Fetch engagement cards (CMS) for the day
  const engagementCards = await prisma.engagementCard.findMany({
    where: {
        date: dateStr
    }
  });

  if (isDemoMode()) {
    const demoBookings = getDemoBookingsStore();

    const slots = buildAgendaSlots({
      date: options.date,
      filter: options.filter,
      focusFilter: options.focusFilter,
      session: options.session,
      getBookingsForSlot: (slot, startsAt) =>
        demoBookings
          .filter(
            (booking) =>
              booking.slotId === slot.id &&
              booking.startsAtMs === startsAt.getTime() &&
              activeStatuses.includes(booking.status),
          )
          .map((booking) =>
            toBookingWithUser(
              {
                id: booking.id,
                userId: booking.userSub,
                professionalId: "demo-professional",
                startsAt: new Date(booking.startsAtMs),
                endsAt: new Date(booking.endsAtMs),
                specialty: slot.specialty,
                status: booking.status,
                notes: null,
                waitlistPosition: booking.waitlistPosition ?? null,
                cancellationReason: null,
                cancelledAt: null,
                completedAt: null,
                pointsAwarded: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              booking.userSub,
            ),
          ),
    });

    return {
        slots,
        events: companyEvents,
        cards: engagementCards
    };
  }

  const userExists = await ensureUserExists(options.session.sub);
  if (!userExists) return [];

  // Fetch ALL active professionals from DB
  const professionals = await prisma.professionalProfile.findMany({
    where: { user: { isActive: true, role: "PROFESSIONAL" } },
    include: { user: { select: { id: true, name: true } } },
  });

  if (professionals.length === 0) return [];

  const { start, end } = buildDayRange(options.date);

  // Fetch ALL existing bookings for that day among all professionals
  const existingBookings = await prisma.sessionBooking.findMany({
    where: {
      professionalId: { in: professionals.map(p => p.id) },
      startsAt: { gte: start, lt: end },
      status: { in: activeStatuses },
    },
  });

  // Virtual time slots for every professional
  const virtualTimes = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
  const normalizedFilter = (options.filter ?? "Todos").trim().toLowerCase();
  const normalizedFocus = (options.focusFilter ?? "Todos focos").trim().toLowerCase();

  const slots: AgendaSlotResponse[] = [];

  for (const prof of professionals) {
    // Filter by specialty if requested
    if (normalizedFilter !== "todos" && !prof.specialty.toLowerCase().includes(normalizedFilter)) {
      continue;
    }
    if (normalizedFocus !== "todos focos" && !prof.specialty.toLowerCase().includes(normalizedFocus)) {
      continue;
    }

    for (const time of virtualTimes) {
      const { startsAt } = buildSlotWindow(options.date, time);
      // Skip past slots
      if (startsAt <= new Date()) continue;

      const slotId = `${prof.id}::${time}`;
      const slotBookings = existingBookings.filter(
        b => b.professionalId === prof.id && b.startsAt.getTime() === startsAt.getTime()
      );

      const hasConfirmed = slotBookings.some(b => confirmedStatuses.includes(b.status));
      const mineBooked = slotBookings.some(
        b => b.userId === options.session.sub && confirmedStatuses.includes(b.status)
      );
      const mineWaitlist = slotBookings.some(
        b => b.userId === options.session.sub && b.status === "WAITLIST"
      );

      slots.push({
        slotId,
        time,
        specialist: prof.user.name,
        specialty: prof.specialty,
        focus: prof.specialty,
        mode: "presencial",
        location: "Espaço Bem-estar",
        status: hasConfirmed ? "occupied" : "available",
        mineStatus: mineBooked ? "booked" : mineWaitlist ? "waitlist" : undefined,
      });
    }
  }

  return {
    slots,
    events: companyEvents,
    cards: engagementCards
  };
}


function getSlotForBooking(options: {
  professionalId: string;
  startsAt: Date;
  specialty?: string;
  professionalMap?: Record<string, string>;
}) {
  const bookingTime = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(options.startsAt);

  const reverseMap = Object.fromEntries(
    Object.entries(options.professionalMap ?? {}).map(([email, id]) => [id, email]),
  );
  const professionalEmail = reverseMap[options.professionalId];

  const exact =
    agendaSlotTemplates.find(
      (slot) =>
        slot.time === bookingTime &&
        (professionalEmail ? slot.profile.email === professionalEmail : true),
    ) ?? null;

  if (exact) {
    return exact;
  }

  const byProfessional = agendaSlotTemplates.find((slot) =>
    professionalEmail ? slot.profile.email === professionalEmail : false,
  );

  if (byProfessional) {
    return byProfessional;
  }

  const bySpecialty = agendaSlotTemplates.find(
    (slot) => slot.specialty === options.specialty,
  );

  return bySpecialty ?? null;
}

export async function listUserAgendaBookings(options: {
  session: SessionIdentity;
  onlyUpcoming?: boolean;
}) {
  if (isDemoMode()) {
    const now = Date.now();

    return getDemoBookingsStore()
      .filter((booking) => booking.userSub === options.session.sub)
      .filter((booking) => {
        if (!options.onlyUpcoming) {
          return true;
        }

        return booking.startsAtMs >= now;
      })
      .sort((left, right) => left.startsAtMs - right.startsAtMs)
      .map((booking) => {
        const slot = getSlotTemplate(booking.slotId);

        return {
          id: booking.id,
          startsAtIso: new Date(booking.startsAtMs).toISOString(),
          endsAtIso: new Date(booking.endsAtMs).toISOString(),
          specialist: slot?.specialist ?? "Especialista se.monitora",
          specialty: slot?.specialty ?? "Atendimento",
          focus: slot?.focus ?? "Acompanhamento geral",
          mode: slot?.mode ?? "presencial",
          location: slot?.location ?? "Espaço se.monitora",
          meetingUrl: slot?.meetingUrl,
          status: booking.status,
          waitlistPosition: booking.waitlistPosition ?? null,
        } satisfies UserAgendaBookingView;
      });
  }

  const userExists = await ensureUserExists(options.session.sub);

  if (!userExists) {
    return [];
  }

  const professionalMap = await ensureAgendaProfessionals();

  const bookings = await prisma.sessionBooking.findMany({
    where: {
      userId: options.session.sub,
      ...(options.onlyUpcoming
        ? {
            startsAt: {
              gte: new Date(),
            },
          }
        : {}),
      status: {
        in: activeStatuses,
      },
    },
    include: {
      professional: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      startsAt: "asc",
    },
    take: 20,
  });

  return bookings.map((booking) => {
    const slot = getSlotForBooking({
      professionalId: booking.professionalId,
      startsAt: booking.startsAt,
      specialty: booking.specialty,
      professionalMap,
    });

    return {
      id: booking.id,
      startsAtIso: booking.startsAt.toISOString(),
      endsAtIso: booking.endsAt.toISOString(),
      specialist: booking.professional.user.name,
      specialty: booking.specialty,
      focus: slot?.focus ?? "Acompanhamento geral",
      mode: slot?.mode ?? "presencial",
      location: slot?.location ?? "Espaço se.monitora",
      meetingUrl: slot?.meetingUrl,
      status: booking.status,
      waitlistPosition: booking.waitlistPosition ?? null,
    } satisfies UserAgendaBookingView;
  });
}

export async function createAgendaBooking(options: {
  action: AgendaAction;
  date: AgendaDateInput;
  slotId: string;
  session: SessionIdentity;
}): Promise<BookingResult> {
  // slotId format for dynamic slots: "<professionalProfileId>::<HH:mm>"
  // Legacy demo slotId format (no "::") also handled in demo mode
  const isDynamicSlot = options.slotId.includes("::");

  if (!isDemoMode() && isDynamicSlot) {
    const [professionalId, time] = options.slotId.split("::") as [string, string];
    const { startsAt, endsAt } = buildSlotWindow(options.date, time);

    const userExists = await ensureUserExists(options.session.sub);
    if (!userExists) throw new Error("Usuário não encontrado.");

    const professional = await prisma.professionalProfile.findUnique({
      where: { id: professionalId },
      include: { user: { select: { name: true } } },
    });
    if (!professional) throw new Error("Profissional não encontrado.");

    // Check user conflict
    const existing = await prisma.sessionBooking.findFirst({
      where: { userId: options.session.sub, professionalId, startsAt, status: { in: activeStatuses } },
    });
    if (existing) return { message: "Você já está neste horário." };

    const conflict = await prisma.sessionBooking.findFirst({
      where: { userId: options.session.sub, status: { in: confirmedStatuses }, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
    });
    if (conflict) throw new Error("Você já possui uma sessão neste horário.");

    const occupied = await prisma.sessionBooking.findFirst({
      where: { professionalId, startsAt, status: { in: confirmedStatuses } },
    });

    if (options.action === "reserve") {
      if (occupied) throw new Error("Horário ocupado. Entre na fila de espera.");
      await prisma.sessionBooking.create({
        data: { userId: options.session.sub, professionalId, startsAt, endsAt, specialty: professional.specialty, status: "SCHEDULED" },
      });
      return { message: "Sessão reservada com sucesso." };
    }

    // waitlist
    if (!occupied) {
      await prisma.sessionBooking.create({
        data: { userId: options.session.sub, professionalId, startsAt, endsAt, specialty: professional.specialty, status: "SCHEDULED" },
      });
      return { message: "Sessão reservada com sucesso." };
    }

    const waitlistCount = await prisma.sessionBooking.count({ where: { professionalId, startsAt, status: "WAITLIST" } });
    const waitlistPosition = waitlistCount + 1;
    await prisma.sessionBooking.create({
      data: { userId: options.session.sub, professionalId, startsAt, endsAt, specialty: professional.specialty, status: "WAITLIST", waitlistPosition },
    });
    return { message: `Você entrou na fila de espera (#${waitlistPosition}).` };
  }

  // --- LEGACY DEMO-MODE PATH (original code) ---
  const slot = getSlotTemplate(options.slotId);

  if (!slot) {
    throw new Error("Horário não encontrado.");
  }

  const { startsAt, endsAt } = buildSlotWindow(options.date, slot.time);

  if (isDemoMode()) {
    const demoBookings = getDemoBookingsStore();
    const slotBookings = demoBookings.filter(
      (booking) =>
        booking.slotId === slot.id &&
        booking.startsAtMs === startsAt.getTime() &&
        activeStatuses.includes(booking.status),
    );

    const alreadyJoined = slotBookings.some(
      (booking) => booking.userSub === options.session.sub,
    );

    if (alreadyJoined) {
      return { message: "Você já está neste horário." };
    }

    const hasConfirmed = slotBookings.some((booking) =>
      confirmedStatuses.includes(booking.status),
    );

    const hasConflict = demoBookings.some(
      (booking) =>
        booking.userSub === options.session.sub &&
        confirmedStatuses.includes(booking.status) &&
        booking.startsAtMs < endsAt.getTime() &&
        booking.endsAtMs > startsAt.getTime(),
    );

    if (hasConflict) {
      throw new Error("Você já possui uma sessão neste horário.");
    }

    if (options.action === "reserve" && hasConfirmed) {
      throw new Error("Horário ocupado. Entre na fila de espera.");
    }

    if (options.action === "waitlist" && !hasConfirmed) {
      demoBookings.push({
        id: `demo-booking-${Date.now()}`,
        userSub: options.session.sub,
        slotId: slot.id,
        startsAtMs: startsAt.getTime(),
        endsAtMs: endsAt.getTime(),
        status: "SCHEDULED",
      });

      return { message: "Sessão reservada com sucesso." };
    }

    if (options.action === "waitlist") {
      const waitlistPosition =
        slotBookings.filter((booking) => booking.status === "WAITLIST").length + 1;

      demoBookings.push({
        id: `demo-waitlist-${Date.now()}`,
        userSub: options.session.sub,
        slotId: slot.id,
        startsAtMs: startsAt.getTime(),
        endsAtMs: endsAt.getTime(),
        status: "WAITLIST",
        waitlistPosition,
      });

      return { message: `Você entrou na fila de espera (#${waitlistPosition}).` };
    }

    demoBookings.push({
      id: `demo-booking-${Date.now()}`,
      userSub: options.session.sub,
      slotId: slot.id,
      startsAtMs: startsAt.getTime(),
      endsAtMs: endsAt.getTime(),
      status: "SCHEDULED",
    });

    return { message: "Sessão reservada com sucesso." };
  }

  const userExists = await ensureUserExists(options.session.sub);

  if (!userExists) {
    throw new Error("Usuário não encontrado para criar reserva.");
  }

  const professionalMap = await ensureAgendaProfessionals();
  const professionalId = professionalMap[slot.profile.email];

  if (!professionalId) {
    throw new Error("Profissional não encontrado.");
  }

  const existingUserBooking = await prisma.sessionBooking.findFirst({
    where: {
      userId: options.session.sub,
      professionalId,
      startsAt,
      status: { in: activeStatuses },
    },
  });

  if (existingUserBooking) {
    return { message: "Você já está neste horário." };
  }

  const conflictingBooking = await prisma.sessionBooking.findFirst({
    where: {
      userId: options.session.sub,
      status: { in: confirmedStatuses },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  });

  if (conflictingBooking) {
    throw new Error("Você já possui uma sessão neste horário.");
  }

  const occupiedBooking = await prisma.sessionBooking.findFirst({
    where: { professionalId, startsAt, status: { in: confirmedStatuses } },
  });

  if (options.action === "reserve") {
    if (occupiedBooking) {
      throw new Error("Horário ocupado. Entre na fila de espera.");
    }

    await prisma.sessionBooking.create({
      data: { userId: options.session.sub, professionalId, startsAt, endsAt, specialty: slot.specialty, status: "SCHEDULED" },
    });

    return { message: "Sessão reservada com sucesso." };
  }

  if (!occupiedBooking) {
    await prisma.sessionBooking.create({
      data: { userId: options.session.sub, professionalId, startsAt, endsAt, specialty: slot.specialty, status: "SCHEDULED" },
    });

    return { message: "Sessão reservada com sucesso." };
  }

  const waitlistCount = await prisma.sessionBooking.count({
    where: { professionalId, startsAt, status: "WAITLIST" },
  });

  const waitlistPosition = waitlistCount + 1;

  await prisma.sessionBooking.create({
    data: { userId: options.session.sub, professionalId, startsAt, endsAt, specialty: slot.specialty, status: "WAITLIST", waitlistPosition },
  });

  return { message: `Você entrou na fila de espera (#${waitlistPosition}).` };
}

export interface ProfessionalBookingView {
  id: string;
  patientName: string;
  startsAtIso: string;
  endsAtIso: string;
  specialty: string;
  status: BookingStatus;
  notes?: string | null;
  cancellationReason?: string | null;
  waitlistPosition?: number | null;
}

async function ensureProfessionalProfileByUserId(userId: string) {
  const existingProfile = await prisma.professionalProfile.findUnique({
    where: { userId },
    select: {
      id: true,
    },
  });

  if (existingProfile) {
    return existingProfile.id;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) {
    throw new Error("Profissional não encontrado.");
  }

  if (user.role !== "PROFESSIONAL") {
    throw new Error("Somente perfis profissionais podem acessar agenda clínica.");
  }

  const created = await prisma.professionalProfile.create({
    data: {
      userId: user.id,
      specialty: "Geral",
    },
    select: { id: true },
  });

  return created.id;
}

function maybePromoteDemoWaitlist(
  demoBookings: DemoBooking[],
  slotId: string,
  startsAtMs: number,
) {
  const waitlisted = demoBookings
    .filter(
      (booking) =>
        booking.slotId === slotId &&
        booking.startsAtMs === startsAtMs &&
        booking.status === "WAITLIST",
    )
    .sort(
      (left, right) =>
        (left.waitlistPosition ?? Number.MAX_SAFE_INTEGER) -
        (right.waitlistPosition ?? Number.MAX_SAFE_INTEGER),
    );

  const first = waitlisted[0];

  if (!first) {
    return;
  }

  first.status = "SCHEDULED";
  first.waitlistPosition = undefined;

  waitlisted.slice(1).forEach((booking, index) => {
    booking.waitlistPosition = index + 1;
  });
}

export async function listProfessionalBookings(options: {
  session: SessionIdentity;
  date?: AgendaDateInput;
}) {
  if (isDemoMode()) {
    const demoBookings = getDemoBookingsStore();
    const dayRange = options.date ? buildDayRange(options.date) : null;

    return demoBookings
      .filter((booking) => {
        if (!dayRange) {
          return true;
        }

        return (
          booking.startsAtMs >= dayRange.start.getTime() &&
          booking.startsAtMs < dayRange.end.getTime()
        );
      })
      .sort((left, right) => left.startsAtMs - right.startsAtMs)
      .map((booking) => {
        const slot = getSlotTemplate(booking.slotId);
        const specialty = slot?.specialty ?? "Atendimento";

        return {
          id: booking.id,
          patientName: getDemoUserName(booking.userSub),
          startsAtIso: new Date(booking.startsAtMs).toISOString(),
          endsAtIso: new Date(booking.endsAtMs).toISOString(),
          specialty,
          status: booking.status,
          notes: booking.notes ?? null,
          cancellationReason: booking.cancellationReason ?? null,
          waitlistPosition: booking.waitlistPosition ?? null,
        } satisfies ProfessionalBookingView;
      });
  }

  const professionalId = await ensureProfessionalProfileByUserId(options.session.sub);

  const dayRange = options.date ? buildDayRange(options.date) : null;

  const bookings = await prisma.sessionBooking.findMany({
    where: {
      professionalId,
      ...(dayRange
        ? {
            startsAt: {
              gte: dayRange.start,
              lt: dayRange.end,
            },
          }
        : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      startsAt: "asc",
    },
  });

  return bookings.map((booking) => ({
    id: booking.id,
    patientName: booking.user.name,
    startsAtIso: booking.startsAt.toISOString(),
    endsAtIso: booking.endsAt.toISOString(),
    specialty: booking.specialty,
    status: booking.status,
    notes: booking.notes ?? null,
    cancellationReason: booking.cancellationReason ?? null,
    waitlistPosition: booking.waitlistPosition ?? null,
  }));
}

export async function updateProfessionalBooking(options: {
  session: SessionIdentity;
  bookingId: string;
  status: BookingStatus;
  notes?: string;
  cancellationReason?: string;
}) {
  if (isDemoMode()) {
    const demoBookings = getDemoBookingsStore();
    const booking = demoBookings.find((item) => item.id === options.bookingId);

    if (!booking) {
      throw new Error("Agendamento não encontrado.");
    }

    booking.status = options.status;
    booking.notes = options.notes?.trim() || booking.notes;

    if (options.status === "CANCELED") {
      booking.cancellationReason = options.cancellationReason?.trim() || undefined;
      booking.cancelledAtMs = Date.now();
      maybePromoteDemoWaitlist(demoBookings, booking.slotId, booking.startsAtMs);
    }

    if (options.status === "COMPLETED") {
      booking.completedAtMs = Date.now();
    }

    const slot = getSlotTemplate(booking.slotId);
    const specialty = slot?.specialty ?? "Atendimento";

    return {
      id: booking.id,
      patientName: getDemoUserName(booking.userSub),
      startsAtIso: new Date(booking.startsAtMs).toISOString(),
      endsAtIso: new Date(booking.endsAtMs).toISOString(),
      specialty,
      status: booking.status,
      notes: booking.notes ?? null,
      cancellationReason: booking.cancellationReason ?? null,
      waitlistPosition: booking.waitlistPosition ?? null,
    } satisfies ProfessionalBookingView;
  }

  const professionalId = await ensureProfessionalProfileByUserId(options.session.sub);

  const booking = await prisma.sessionBooking.findUnique({
    where: { id: options.bookingId },
    select: {
      id: true,
      professionalId: true,
      startsAt: true,
    },
  });

  if (!booking || booking.professionalId !== professionalId) {
    throw new Error("Agendamento não encontrado para este profissional.");
  }

  const updated = await prisma.sessionBooking.update({
    where: { id: options.bookingId },
    data: {
      status: options.status,
      notes: options.notes?.trim() || undefined,
      ...(options.status === "CANCELED"
        ? {
            cancellationReason: options.cancellationReason?.trim() || null,
            cancelledAt: new Date(),
          }
        : {}),
      ...(options.status === "COMPLETED"
        ? {
            completedAt: new Date(),
          }
        : {}),
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  if (options.status === "CANCELED") {
    const firstWaitlisted = await prisma.sessionBooking.findFirst({
      where: {
        professionalId,
        startsAt: booking.startsAt,
        status: "WAITLIST",
      },
      orderBy: {
        waitlistPosition: "asc",
      },
    });

    if (firstWaitlisted) {
      const slot = getSlotForBooking({
        professionalId,
        startsAt: booking.startsAt,
      });

      await prisma.$transaction([
        prisma.sessionBooking.update({
          where: { id: firstWaitlisted.id },
          data: {
            status: "SCHEDULED",
            waitlistPosition: null,
          },
        }),
        prisma.sessionBooking.updateMany({
          where: {
            professionalId,
            startsAt: booking.startsAt,
            status: "WAITLIST",
            waitlistPosition: {
              gt: firstWaitlisted.waitlistPosition ?? 0,
            },
          },
          data: {
            waitlistPosition: {
              decrement: 1,
            },
          },
        }),
        prisma.notification.create({
          data: {
            userId: firstWaitlisted.userId,
            title: "Vaga liberada",
            message: `Você saiu da fila e confirmou seu horário de ${slot?.specialty ?? "atendimento"} às ${new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(booking.startsAt)}.`,
            type: "SLOT_RELEASED",
            channel: "IN_APP",
            deliveryStatus: "SENT",
            sentAt: new Date(),
          },
        }),
      ]);
    }
  }

  return {
    id: updated.id,
    patientName: updated.user.name,
    startsAtIso: updated.startsAt.toISOString(),
    endsAtIso: updated.endsAt.toISOString(),
    specialty: updated.specialty,
    status: updated.status,
    notes: updated.notes ?? null,
    cancellationReason: updated.cancellationReason ?? null,
    waitlistPosition: updated.waitlistPosition ?? null,
  } satisfies ProfessionalBookingView;
}
