import bcrypt from "bcryptjs";
import type { EventKind, EventStatus, UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { isDemoMode } from "@/lib/runtime-mode";

export interface AdminUserView {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  company: string | null;
  score: number;
  createdAtIso: string;
}

export interface AdminProfessionalView {
  id: string;
  userId: string;
  name: string;
  email: string;
  specialty: string;
  licenseCode: string | null;
  attendanceRate: number;
  isActive: boolean;
}

export interface AdminEventView {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  kind: EventKind;
  startsAtIso: string;
  endsAtIso: string;
  points: number;
  status: EventStatus;
  maxAttendees: number | null;
}

interface AdminCreateUserInput {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  company?: string;
  specialty?: string;
  licenseCode?: string;
}

interface AdminUpdateUserInput {
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  company?: string;
  score?: number;
}

interface AdminCreateProfessionalInput {
  name: string;
  email: string;
  specialty: string;
  licenseCode?: string;
  password?: string;
}

interface AdminUpdateProfessionalInput {
  specialty?: string;
  licenseCode?: string;
  attendanceRate?: number;
  isActive?: boolean;
  name?: string;
  email?: string;
}

interface AdminCreateEventInput {
  title: string;
  description: string;
  location: string;
  category: string;
  kind: EventKind;
  startsAt: Date;
  endsAt: Date;
  points?: number;
  status?: EventStatus;
  maxAttendees?: number;
  publishedBy?: string;
}

interface AdminUpdateEventInput {
  title?: string;
  description?: string;
  location?: string;
  category?: string;
  kind?: EventKind;
  startsAt?: Date;
  endsAt?: Date;
  points?: number;
  status?: EventStatus;
  maxAttendees?: number;
}

type DemoUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company: string | null;
  score: number;
  isActive: boolean;
  specialty?: string;
  licenseCode?: string | null;
  attendanceRate?: number;
  createdAtIso: string;
};

type DemoEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  kind: EventKind;
  startsAtIso: string;
  endsAtIso: string;
  points: number;
  status: EventStatus;
  maxAttendees: number | null;
};

declare global {
  var semonitoraDemoAdminUsers: DemoUser[] | undefined;
  var semonitoraDemoAdminEvents: DemoEvent[] | undefined;
}

function nowIso() {
  return new Date().toISOString();
}

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function getDemoUsers() {
  if (!global.semonitoraDemoAdminUsers) {
    global.semonitoraDemoAdminUsers = [
      {
        id: "user-felipe",
        name: "Felipe Santos",
        email: "felipe@empresa.com",
        role: "USER",
        company: "Operações",
        score: 1990,
        isActive: true,
        createdAtIso: "2026-04-01T09:00:00.000Z",
      },
      {
        id: "user-larissa",
        name: "Larissa Melo",
        email: "larissa@empresa.com",
        role: "USER",
        company: "RH",
        score: 1890,
        isActive: true,
        createdAtIso: "2026-04-01T09:00:00.000Z",
      },
      {
        id: "user-amanda",
        name: "Amanda Costa",
        email: "amanda@empresa.com",
        role: "USER",
        company: "Produto",
        score: 2430,
        isActive: true,
        createdAtIso: "2026-04-01T09:00:00.000Z",
      },
      {
        id: "professional-camila",
        name: "Camila Rocha",
        email: "camila@empresa.com",
        role: "PROFESSIONAL",
        company: "Saúde e bem-estar",
        score: 0,
        isActive: true,
        specialty: "Nutrição",
        licenseCode: "CRN-001",
        attendanceRate: 0.94,
        createdAtIso: "2026-04-01T09:00:00.000Z",
      },
      {
        id: "admin-paula",
        name: "Paula Admin",
        email: "admin@empresa.com",
        role: "ADMIN",
        company: "Operações",
        score: 0,
        isActive: true,
        createdAtIso: "2026-04-01T09:00:00.000Z",
      },
    ];
  }

  return global.semonitoraDemoAdminUsers;
}

function getDemoEvents() {
  if (!global.semonitoraDemoAdminEvents) {
    global.semonitoraDemoAdminEvents = [
      {
        id: "event-sunset",
        title: "Sunset com liderança",
        description: "Encontro mensal com liderança e cultura.",
        location: "Espaço se.monitora",
        category: "Agenda dr",
        kind: "EVENT",
        startsAtIso: "2026-04-20T18:30:00.000Z",
        endsAtIso: "2026-04-20T20:30:00.000Z",
        points: 120,
        status: "PUBLISHED",
        maxAttendees: 100,
      },
      {
        id: "event-sono",
        title: "Palestra: sono e foco",
        description: "Palestra sobre equilíbrio e recuperação de energia.",
        location: "Auditório 02",
        category: "Cultura",
        kind: "CULTURE",
        startsAtIso: "2026-04-22T10:00:00.000Z",
        endsAtIso: "2026-04-22T11:00:00.000Z",
        points: 90,
        status: "PUBLISHED",
        maxAttendees: 180,
      },
    ];
  }

  return global.semonitoraDemoAdminEvents;
}

function toAdminUserView(user: DemoUser): AdminUserView {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    company: user.company,
    score: user.score,
    createdAtIso: user.createdAtIso,
  };
}

function toAdminProfessionalView(user: DemoUser): AdminProfessionalView {
  return {
    id: `prof-${user.id}`,
    userId: user.id,
    name: user.name,
    email: user.email,
    specialty: user.specialty ?? "Geral",
    licenseCode: user.licenseCode ?? null,
    attendanceRate: user.attendanceRate ?? 0,
    isActive: user.isActive,
  };
}

function toAdminEventView(event: DemoEvent): AdminEventView {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    category: event.category,
    kind: event.kind,
    startsAtIso: event.startsAtIso,
    endsAtIso: event.endsAtIso,
    points: event.points,
    status: event.status,
    maxAttendees: event.maxAttendees,
  };
}

async function writeAuditLog(
  actorId: string,
  action: string,
  entity: string,
  entityId: string,
  metadata?: unknown,
) {
  if (isDemoMode()) {
    return;
  }

  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      entity,
      entityId,
      metadata: metadata as never,
    },
  });
}

export async function listAdminUsers(filters?: { search?: string; role?: UserRole }) {
  if (isDemoMode()) {
    const users = getDemoUsers();
    const search = filters?.search?.toLowerCase().trim();

    return users
      .filter((user) => {
        if (filters?.role && user.role !== filters.role) {
          return false;
        }

        if (!search) {
          return true;
        }

        return (
          user.name.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search) ||
          (user.company ?? "").toLowerCase().includes(search)
        );
      })
      .map(toAdminUserView);
  }

  const users = await prisma.user.findMany({
    where: {
      ...(filters?.role ? { role: filters.role } : {}),
      ...(filters?.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" } },
              { email: { contains: filters.search, mode: "insensitive" } },
              { company: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    company: user.company,
    score: user.score,
    createdAtIso: user.createdAt.toISOString(),
  }));
}

export async function createAdminUser(actorId: string, input: AdminCreateUserInput) {
  const password = input.password?.trim() || "demo1234";

  if (isDemoMode()) {
    const users = getDemoUsers();

    if (users.some((user) => user.email.toLowerCase() === input.email.toLowerCase())) {
      throw new Error("Já existe usuário com este email.");
    }

    const created: DemoUser = {
      id:
        input.role === "PROFESSIONAL"
          ? `professional-${generateId("usr")}`
          : generateId("usr"),
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      role: input.role,
      company: input.company?.trim() || null,
      score: 0,
      isActive: true,
      specialty: input.specialty,
      licenseCode: input.licenseCode ?? null,
      attendanceRate: 0,
      createdAtIso: nowIso(),
    };

    users.unshift(created);
    return toAdminUserView(created);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: input.email.trim().toLowerCase() },
    select: { id: true },
  });

  if (existingUser) {
    throw new Error("Já existe usuário com este email.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const created = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      passwordHash,
      role: input.role,
      company: input.company?.trim() || null,
    },
  });

  if (input.role === "PROFESSIONAL") {
    await prisma.professionalProfile.upsert({
      where: { userId: created.id },
      update: {
        specialty: input.specialty?.trim() || "Geral",
        licenseCode: input.licenseCode?.trim() || null,
      },
      create: {
        userId: created.id,
        specialty: input.specialty?.trim() || "Geral",
        licenseCode: input.licenseCode?.trim() || null,
      },
    });
  }

  await writeAuditLog(actorId, "CREATE", "USER", created.id, { role: created.role });

  return {
    id: created.id,
    name: created.name,
    email: created.email,
    role: created.role,
    isActive: created.isActive,
    company: created.company,
    score: created.score,
    createdAtIso: created.createdAt.toISOString(),
  };
}

export async function updateAdminUser(actorId: string, userId: string, input: AdminUpdateUserInput) {
  if (isDemoMode()) {
    const users = getDemoUsers();
    const target = users.find((user) => user.id === userId);

    if (!target) {
      throw new Error("Usuário não encontrado.");
    }

    if (input.email) {
      const collision = users.find(
        (user) =>
          user.id !== userId &&
          user.email.toLowerCase() === input.email?.trim().toLowerCase(),
      );

      if (collision) {
        throw new Error("Já existe usuário com este email.");
      }
    }

    Object.assign(target, {
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.email ? { email: input.email.trim().toLowerCase() } : {}),
      ...(input.role ? { role: input.role } : {}),
      ...(input.company !== undefined ? { company: input.company?.trim() || null } : {}),
      ...(input.score !== undefined ? { score: input.score } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });

    return toAdminUserView(target);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.email ? { email: input.email.trim().toLowerCase() } : {}),
      ...(input.role ? { role: input.role } : {}),
      ...(input.company !== undefined ? { company: input.company?.trim() || null } : {}),
      ...(input.score !== undefined ? { score: input.score } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });

  if (input.role === "PROFESSIONAL") {
    await prisma.professionalProfile.upsert({
      where: { userId: updated.id },
      update: {},
      create: {
        userId: updated.id,
        specialty: "Geral",
      },
    });
  }

  await writeAuditLog(actorId, "UPDATE", "USER", updated.id, input);

  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    isActive: updated.isActive,
    company: updated.company,
    score: updated.score,
    createdAtIso: updated.createdAt.toISOString(),
  };
}

export async function listAdminProfessionals() {
  if (isDemoMode()) {
    return getDemoUsers()
      .filter((user) => user.role === "PROFESSIONAL")
      .map(toAdminProfessionalView);
  }

  const profiles = await prisma.professionalProfile.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
        },
      },
    },
    orderBy: {
      user: {
        name: "asc",
      },
    },
  });

  return profiles.map((profile) => ({
    id: profile.id,
    userId: profile.user.id,
    name: profile.user.name,
    email: profile.user.email,
    specialty: profile.specialty,
    licenseCode: profile.licenseCode,
    attendanceRate: profile.attendanceRate,
    isActive: profile.user.isActive,
  }));
}

export async function createAdminProfessional(
  actorId: string,
  input: AdminCreateProfessionalInput,
) {
  const createdUser = await createAdminUser(actorId, {
    name: input.name,
    email: input.email,
    role: "PROFESSIONAL",
    password: input.password,
    specialty: input.specialty,
    licenseCode: input.licenseCode,
  });

  if (isDemoMode()) {
    const user = getDemoUsers().find((item) => item.id === createdUser.id);
    if (!user) {
      throw new Error("Profissional não encontrado após criação.");
    }

    return toAdminProfessionalView(user);
  }

  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: createdUser.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
        },
      },
    },
  });

  if (!profile) {
    throw new Error("Perfil profissional não encontrado após criação.");
  }

  return {
    id: profile.id,
    userId: profile.user.id,
    name: profile.user.name,
    email: profile.user.email,
    specialty: profile.specialty,
    licenseCode: profile.licenseCode,
    attendanceRate: profile.attendanceRate,
    isActive: profile.user.isActive,
  };
}

export async function updateAdminProfessional(
  actorId: string,
  profileIdOrUserId: string,
  input: AdminUpdateProfessionalInput,
) {
  if (isDemoMode()) {
    const users = getDemoUsers();
    const target = users.find(
      (user) => user.id === profileIdOrUserId || `prof-${user.id}` === profileIdOrUserId,
    );

    if (!target || target.role !== "PROFESSIONAL") {
      throw new Error("Profissional não encontrado.");
    }

    Object.assign(target, {
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.email ? { email: input.email.trim().toLowerCase() } : {}),
      ...(input.specialty ? { specialty: input.specialty.trim() } : {}),
      ...(input.licenseCode !== undefined
        ? { licenseCode: input.licenseCode?.trim() || null }
        : {}),
      ...(input.attendanceRate !== undefined
        ? { attendanceRate: input.attendanceRate }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });

    return toAdminProfessionalView(target);
  }

  const currentProfile = await prisma.professionalProfile.findFirst({
    where: {
      OR: [{ id: profileIdOrUserId }, { userId: profileIdOrUserId }],
    },
    include: {
      user: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!currentProfile) {
    throw new Error("Profissional não encontrado.");
  }

  const [updatedProfile, updatedUser] = await prisma.$transaction([
    prisma.professionalProfile.update({
      where: { id: currentProfile.id },
      data: {
        ...(input.specialty ? { specialty: input.specialty.trim() } : {}),
        ...(input.licenseCode !== undefined
          ? { licenseCode: input.licenseCode?.trim() || null }
          : {}),
        ...(input.attendanceRate !== undefined
          ? { attendanceRate: input.attendanceRate }
          : {}),
      },
    }),
    prisma.user.update({
      where: { id: currentProfile.user.id },
      data: {
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(input.email ? { email: input.email.trim().toLowerCase() } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    }),
  ]);

  await writeAuditLog(actorId, "UPDATE", "PROFESSIONAL", updatedProfile.id, input);

  return {
    id: updatedProfile.id,
    userId: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    specialty: updatedProfile.specialty,
    licenseCode: updatedProfile.licenseCode,
    attendanceRate: updatedProfile.attendanceRate,
    isActive: updatedUser.isActive,
  };
}

export async function listAdminEvents() {
  if (isDemoMode()) {
    return getDemoEvents().map(toAdminEventView);
  }

  const events = await prisma.event.findMany({
    orderBy: { startsAt: "asc" },
  });

  return events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    category: event.category,
    kind: event.kind,
    startsAtIso: event.startsAt.toISOString(),
    endsAtIso: event.endsAt.toISOString(),
    points: event.points,
    status: event.status,
    maxAttendees: event.maxAttendees,
  }));
}

export async function createAdminEvent(actorId: string, input: AdminCreateEventInput) {
  if (isDemoMode()) {
    const event: DemoEvent = {
      id: generateId("event"),
      title: input.title.trim(),
      description: input.description.trim(),
      location: input.location.trim(),
      category: input.category.trim(),
      kind: input.kind,
      startsAtIso: input.startsAt.toISOString(),
      endsAtIso: input.endsAt.toISOString(),
      points: input.points ?? 0,
      status: input.status ?? "PUBLISHED",
      maxAttendees: input.maxAttendees ?? null,
    };

    getDemoEvents().push(event);
    return toAdminEventView(event);
  }

  const created = await prisma.event.create({
    data: {
      title: input.title.trim(),
      description: input.description.trim(),
      location: input.location.trim(),
      category: input.category.trim(),
      kind: input.kind,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      points: input.points ?? 0,
      status: input.status ?? "PUBLISHED",
      maxAttendees: input.maxAttendees ?? null,
      publishedBy: input.publishedBy,
    },
  });

  await writeAuditLog(actorId, "CREATE", "EVENT", created.id, {
    title: created.title,
    status: created.status,
  });

  return {
    id: created.id,
    title: created.title,
    description: created.description,
    location: created.location,
    category: created.category,
    kind: created.kind,
    startsAtIso: created.startsAt.toISOString(),
    endsAtIso: created.endsAt.toISOString(),
    points: created.points,
    status: created.status,
    maxAttendees: created.maxAttendees,
  };
}

export async function updateAdminEvent(actorId: string, eventId: string, input: AdminUpdateEventInput) {
  if (isDemoMode()) {
    const events = getDemoEvents();
    const target = events.find((event) => event.id === eventId);

    if (!target) {
      throw new Error("Evento não encontrado.");
    }

    Object.assign(target, {
      ...(input.title ? { title: input.title.trim() } : {}),
      ...(input.description ? { description: input.description.trim() } : {}),
      ...(input.location ? { location: input.location.trim() } : {}),
      ...(input.category ? { category: input.category.trim() } : {}),
      ...(input.kind ? { kind: input.kind } : {}),
      ...(input.startsAt ? { startsAtIso: input.startsAt.toISOString() } : {}),
      ...(input.endsAt ? { endsAtIso: input.endsAt.toISOString() } : {}),
      ...(input.points !== undefined ? { points: input.points } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.maxAttendees !== undefined
        ? { maxAttendees: input.maxAttendees }
        : {}),
    });

    return toAdminEventView(target);
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      ...(input.title ? { title: input.title.trim() } : {}),
      ...(input.description ? { description: input.description.trim() } : {}),
      ...(input.location ? { location: input.location.trim() } : {}),
      ...(input.category ? { category: input.category.trim() } : {}),
      ...(input.kind ? { kind: input.kind } : {}),
      ...(input.startsAt ? { startsAt: input.startsAt } : {}),
      ...(input.endsAt ? { endsAt: input.endsAt } : {}),
      ...(input.points !== undefined ? { points: input.points } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.maxAttendees !== undefined
        ? { maxAttendees: input.maxAttendees }
        : {}),
    },
  });

  await writeAuditLog(actorId, "UPDATE", "EVENT", updated.id, input);

  return {
    id: updated.id,
    title: updated.title,
    description: updated.description,
    location: updated.location,
    category: updated.category,
    kind: updated.kind,
    startsAtIso: updated.startsAt.toISOString(),
    endsAtIso: updated.endsAt.toISOString(),
    points: updated.points,
    status: updated.status,
    maxAttendees: updated.maxAttendees,
  };
}
