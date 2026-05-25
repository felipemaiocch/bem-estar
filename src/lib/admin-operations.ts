import bcrypt from "bcryptjs";
import type {
  Department,
  EventKind,
  EventStatus,
  GroupKind,
  UserApprovalStatus,
  UserRole,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { isDemoMode } from "@/lib/runtime-mode";

export interface AdminUserView {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  approvalStatus: UserApprovalStatus;
  approvedAtIso: string | null;
  rejectedAtIso: string | null;
  company: string | null;
  department: Department | null;
  drCoins: number;
  score: number;
  createdAtIso: string;
  groupIds: string[];
  groupNames: string[];
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
  responsibleName: string | null;
  accessGroupId: string | null;
  accessGroupName: string | null;
}

export interface AdminGroupView {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  kind: GroupKind;
  isRestricted: boolean;
  isActive: boolean;
  memberCount: number;
}

interface AdminCreateUserInput {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  company?: string;
  department?: Department;
  specialty?: string;
  licenseCode?: string;
  groupIds?: string[];
}

interface AdminUpdateUserInput {
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  approvalStatus?: UserApprovalStatus;
  approvalNote?: string;
  company?: string;
  department?: Department | null;
  score?: number;
  groupIds?: string[];
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
  responsibleName?: string;
  accessGroupId?: string | null;
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
  responsibleName?: string;
  accessGroupId?: string | null;
}

interface AdminCreateGroupInput {
  name: string;
  slug?: string;
  description?: string;
  kind?: GroupKind;
  isRestricted?: boolean;
}

interface AdminUpdateGroupInput {
  name?: string;
  slug?: string;
  description?: string | null;
  kind?: GroupKind;
  isRestricted?: boolean;
  isActive?: boolean;
}

type DemoUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company: string | null;
  department?: Department | null;
  drCoins?: number;
  score: number;
  isActive: boolean;
  approvalStatus: UserApprovalStatus;
  approvedAtIso?: string | null;
  rejectedAtIso?: string | null;
  approvalNote?: string | null;
  groupIds?: string[];
  specialty?: string;
  licenseCode?: string | null;
  attendanceRate?: number;
  createdAtIso: string;
};

type DemoGroup = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  kind: GroupKind;
  isRestricted: boolean;
  isActive: boolean;
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
  responsibleName?: string | null;
  accessGroupId?: string | null;
};

declare global {
  var semonitoraDemoAdminUsers: DemoUser[] | undefined;
  var semonitoraDemoAdminEvents: DemoEvent[] | undefined;
  var semonitoraDemoAccessGroups: DemoGroup[] | undefined;
}

function nowIso() {
  return new Date().toISOString();
}

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueStrings(values: string[] = []) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getDemoGroups() {
  if (!global.semonitoraDemoAccessGroups) {
    global.semonitoraDemoAccessGroups = [
      {
        id: "group-ingles",
        name: "Turma de inglês",
        slug: "turma-de-ingles",
        description: "Grupo fechado para alunos da turma de inglês.",
        kind: "CLASS",
        isRestricted: true,
        isActive: true,
      },
      {
        id: "group-maisa",
        name: "Turma da Maísa",
        slug: "turma-da-maisa",
        description: "Participantes selecionados para as ações da Maísa.",
        kind: "COHORT",
        isRestricted: true,
        isActive: true,
      },
      {
        id: "group-clube-livro",
        name: "Clube do livro",
        slug: "clube-do-livro",
        description: "Grupo do clube do livro.",
        kind: "CLASS",
        isRestricted: true,
        isActive: true,
      },
    ];
  }

  return global.semonitoraDemoAccessGroups;
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
        department: "ATENDIMENTO",
        drCoins: 0,
        score: 1990,
        isActive: true,
        approvalStatus: "APPROVED",
        approvedAtIso: "2026-04-01T09:00:00.000Z",
        groupIds: ["group-maisa"],
        createdAtIso: "2026-04-01T09:00:00.000Z",
      },
      {
        id: "user-larissa",
        name: "Larissa Melo",
        email: "larissa@empresa.com",
        role: "USER",
        company: "RH",
        department: "FINANCEIRO",
        drCoins: 0,
        score: 1890,
        isActive: true,
        approvalStatus: "APPROVED",
        approvedAtIso: "2026-04-01T09:00:00.000Z",
        groupIds: ["group-clube-livro"],
        createdAtIso: "2026-04-01T09:00:00.000Z",
      },
      {
        id: "user-amanda",
        name: "Amanda Costa",
        email: "amanda@empresa.com",
        role: "USER",
        company: "Produto",
        department: "COMERCIAL",
        drCoins: 0,
        score: 2430,
        isActive: true,
        approvalStatus: "APPROVED",
        approvedAtIso: "2026-04-01T09:00:00.000Z",
        groupIds: ["group-ingles"],
        createdAtIso: "2026-04-01T09:00:00.000Z",
      },
      {
        id: "professional-camila",
        name: "Camila Rocha",
        email: "camila@empresa.com",
        role: "PROFESSIONAL",
        company: "Saúde e bem-estar",
        department: null,
        drCoins: 0,
        score: 0,
        isActive: true,
        approvalStatus: "APPROVED",
        approvedAtIso: "2026-04-01T09:00:00.000Z",
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
        department: null,
        drCoins: 0,
        score: 0,
        isActive: true,
        approvalStatus: "APPROVED",
        approvedAtIso: "2026-04-01T09:00:00.000Z",
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
  const groupMap = new Map(getDemoGroups().map((group) => [group.id, group.name]));
  const groupIds = user.groupIds ?? [];

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    approvalStatus: user.approvalStatus,
    approvedAtIso: user.approvedAtIso ?? null,
    rejectedAtIso: user.rejectedAtIso ?? null,
    company: user.company,
    department: user.department ?? null,
    drCoins: user.drCoins ?? 0,
    score: user.score,
    createdAtIso: user.createdAtIso,
    groupIds,
    groupNames: groupIds.map((groupId) => groupMap.get(groupId)).filter((name): name is string => Boolean(name)),
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
    responsibleName: event.responsibleName ?? null,
    accessGroupId: null,
    accessGroupName: null,
  };
}

function toAdminGroupView(group: DemoGroup): AdminGroupView {
  const memberCount = getDemoUsers().filter((user) => user.groupIds?.includes(group.id)).length;

  return {
    id: group.id,
    name: group.name,
    slug: group.slug,
    description: group.description,
    kind: group.kind,
    isRestricted: group.isRestricted,
    isActive: group.isActive,
    memberCount,
  };
}

async function syncUserGroups(userId: string, groupIds: string[] = []) {
  const uniqueGroupIds = uniqueStrings(groupIds);

  await prisma.userGroupMembership.deleteMany({
    where: { userId },
  });

  if (!uniqueGroupIds.length) {
    return;
  }

  await prisma.userGroupMembership.createMany({
    data: uniqueGroupIds.map((groupId) => ({
      userId,
      groupId,
    })),
    skipDuplicates: true,
  });
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
      (user.company ?? "").toLowerCase().includes(search) ||
      (user.department ?? "").toLowerCase().includes(search)
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
    include: {
      groupMemberships: {
        include: {
          group: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    approvalStatus: user.approvalStatus,
    approvedAtIso: user.approvedAt?.toISOString() ?? null,
    rejectedAtIso: user.rejectedAt?.toISOString() ?? null,
    company: user.company,
    department: user.department,
    drCoins: user.drCoins,
    score: user.score,
    createdAtIso: user.createdAt.toISOString(),
    groupIds: user.groupMemberships.map((membership) => membership.group.id),
    groupNames: user.groupMemberships.map((membership) => membership.group.name),
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
      department: input.department ?? null,
      drCoins: 0,
      score: 0,
      isActive: true,
      approvalStatus: "APPROVED",
      approvedAtIso: nowIso(),
      groupIds: uniqueStrings(input.groupIds),
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
      department: input.department ?? null,
      approvalStatus: "APPROVED",
      approvedAt: new Date(),
      approvedById: actorId,
      groupMemberships: input.groupIds?.length
        ? {
            create: uniqueStrings(input.groupIds).map((groupId) => ({
              groupId,
            })),
          }
        : undefined,
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
    approvalStatus: created.approvalStatus,
    approvedAtIso: created.approvedAt?.toISOString() ?? null,
    rejectedAtIso: created.rejectedAt?.toISOString() ?? null,
    company: created.company,
    department: created.department,
    drCoins: created.drCoins,
    score: created.score,
    createdAtIso: created.createdAt.toISOString(),
    groupIds: uniqueStrings(input.groupIds),
    groupNames: [],
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
      ...(input.department !== undefined ? { department: input.department } : {}),
      ...(input.score !== undefined ? { score: input.score } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.approvalStatus
        ? {
            approvalStatus: input.approvalStatus,
            approvedAtIso: input.approvalStatus === "APPROVED" ? nowIso() : target.approvedAtIso,
            rejectedAtIso: input.approvalStatus === "REJECTED" ? nowIso() : null,
            approvalNote: input.approvalNote ?? target.approvalNote ?? null,
            isActive:
              input.approvalStatus === "APPROVED"
                ? true
                : input.approvalStatus === "REJECTED"
                  ? false
                  : target.isActive,
          }
        : {}),
      ...(input.groupIds ? { groupIds: uniqueStrings(input.groupIds) } : {}),
    });

    return toAdminUserView(target);
  }

  const approvalData =
    input.approvalStatus === "APPROVED"
      ? {
          approvalStatus: input.approvalStatus,
          approvedAt: new Date(),
          approvedById: actorId,
          rejectedAt: null,
          approvalNote: input.approvalNote?.trim() || null,
          isActive: true,
        }
      : input.approvalStatus === "REJECTED"
        ? {
            approvalStatus: input.approvalStatus,
            rejectedAt: new Date(),
            approvalNote: input.approvalNote?.trim() || null,
            isActive: false,
          }
        : input.approvalStatus === "PENDING"
          ? {
              approvalStatus: input.approvalStatus,
              approvedAt: null,
              approvedById: null,
              rejectedAt: null,
              approvalNote: input.approvalNote?.trim() || null,
              isActive: false,
            }
          : {};

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.email ? { email: input.email.trim().toLowerCase() } : {}),
      ...(input.role ? { role: input.role } : {}),
      ...(input.company !== undefined ? { company: input.company?.trim() || null } : {}),
      ...(input.department !== undefined ? { department: input.department } : {}),
      ...(input.score !== undefined ? { score: input.score } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...approvalData,
    },
    include: {
      groupMemberships: {
        include: {
          group: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (input.groupIds) {
    await syncUserGroups(updated.id, input.groupIds);
  }

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
    approvalStatus: updated.approvalStatus,
    approvedAtIso: updated.approvedAt?.toISOString() ?? null,
    rejectedAtIso: updated.rejectedAt?.toISOString() ?? null,
    company: updated.company,
    department: updated.department,
    drCoins: updated.drCoins,
    score: updated.score,
    createdAtIso: updated.createdAt.toISOString(),
    groupIds: input.groupIds ?? updated.groupMemberships.map((membership) => membership.group.id),
    groupNames: input.groupIds ? [] : updated.groupMemberships.map((membership) => membership.group.name),
  };
}

async function ensureDefaultGroups() {
  const defaults: AdminCreateGroupInput[] = [
    {
      name: "Turma de inglês",
      slug: "turma-de-ingles",
      description: "Grupo fechado para alunos da turma de inglês.",
      kind: "CLASS",
      isRestricted: true,
    },
    {
      name: "Turma da Maísa",
      slug: "turma-da-maisa",
      description: "Participantes selecionados para as ações da Maísa.",
      kind: "COHORT",
      isRestricted: true,
    },
    {
      name: "Clube do livro",
      slug: "clube-do-livro",
      description: "Grupo do clube do livro.",
      kind: "CLASS",
      isRestricted: true,
    },
  ];

  await prisma.accessGroup.createMany({
    data: defaults.map((group) => ({
      name: group.name,
      slug: group.slug ?? normalizeSlug(group.name),
      description: group.description,
      kind: group.kind ?? "COHORT",
      isRestricted: group.isRestricted ?? true,
    })),
    skipDuplicates: true,
  });
}

export async function listAdminGroups() {
  if (isDemoMode()) {
    return getDemoGroups().map(toAdminGroupView);
  }

  const count = await prisma.accessGroup.count();

  if (count === 0) {
    await ensureDefaultGroups();
  }

  const groups = await prisma.accessGroup.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          memberships: true,
        },
      },
    },
  });

  return groups.map((group) => ({
    id: group.id,
    name: group.name,
    slug: group.slug,
    description: group.description,
    kind: group.kind,
    isRestricted: group.isRestricted,
    isActive: group.isActive,
    memberCount: group._count.memberships,
  }));
}

export async function createAdminGroup(actorId: string, input: AdminCreateGroupInput) {
  const slug = normalizeSlug(input.slug || input.name);

  if (!slug) {
    throw new Error("Informe um nome válido para o grupo.");
  }

  if (isDemoMode()) {
    const groups = getDemoGroups();

    if (groups.some((group) => group.slug === slug)) {
      throw new Error("Já existe um grupo com este slug.");
    }

    const created: DemoGroup = {
      id: generateId("group"),
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      kind: input.kind ?? "COHORT",
      isRestricted: input.isRestricted ?? true,
      isActive: true,
    };

    groups.push(created);
    return toAdminGroupView(created);
  }

  const existing = await prisma.accessGroup.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existing) {
    throw new Error("Já existe um grupo com este slug.");
  }

  const created = await prisma.accessGroup.create({
    data: {
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      kind: input.kind ?? "COHORT",
      isRestricted: input.isRestricted ?? true,
    },
  });

  await writeAuditLog(actorId, "CREATE", "ACCESS_GROUP", created.id, {
    name: created.name,
    kind: created.kind,
  });

  return {
    id: created.id,
    name: created.name,
    slug: created.slug,
    description: created.description,
    kind: created.kind,
    isRestricted: created.isRestricted,
    isActive: created.isActive,
    memberCount: 0,
  };
}

export async function updateAdminGroup(actorId: string, groupId: string, input: AdminUpdateGroupInput) {
  if (isDemoMode()) {
    const groups = getDemoGroups();
    const target = groups.find((group) => group.id === groupId);

    if (!target) {
      throw new Error("Grupo não encontrado.");
    }

    const nextSlug = input.slug ? normalizeSlug(input.slug) : undefined;

    if (nextSlug && groups.some((group) => group.id !== groupId && group.slug === nextSlug)) {
      throw new Error("Já existe outro grupo com este slug.");
    }

    Object.assign(target, {
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(nextSlug ? { slug: nextSlug } : {}),
      ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
      ...(input.kind ? { kind: input.kind } : {}),
      ...(input.isRestricted !== undefined ? { isRestricted: input.isRestricted } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });

    return toAdminGroupView(target);
  }

  const nextSlug = input.slug ? normalizeSlug(input.slug) : undefined;

  if (nextSlug) {
    const conflicting = await prisma.accessGroup.findUnique({
      where: { slug: nextSlug },
      select: { id: true },
    });

    if (conflicting && conflicting.id !== groupId) {
      throw new Error("Já existe outro grupo com este slug.");
    }
  }

  const updated = await prisma.accessGroup.update({
    where: { id: groupId },
    data: {
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(nextSlug ? { slug: nextSlug } : {}),
      ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
      ...(input.kind ? { kind: input.kind } : {}),
      ...(input.isRestricted !== undefined ? { isRestricted: input.isRestricted } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
    include: {
      _count: {
        select: {
          memberships: true,
        },
      },
    },
  });

  await writeAuditLog(actorId, "UPDATE", "ACCESS_GROUP", updated.id, input);

  return {
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    description: updated.description,
    kind: updated.kind,
    isRestricted: updated.isRestricted,
    isActive: updated.isActive,
    memberCount: updated._count.memberships,
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
    include: {
      accessGroup: {
        select: { name: true },
      },
    },
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
    responsibleName: event.responsibleName,
    accessGroupId: event.accessGroupId,
    accessGroupName: event.accessGroup?.name ?? null,
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
      responsibleName: input.responsibleName ?? null,
      accessGroupId: input.accessGroupId ?? null,
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
      responsibleName: input.responsibleName?.trim() || null,
      accessGroupId: input.accessGroupId ?? null,
    },
    include: {
      accessGroup: {
        select: { name: true },
      },
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
    responsibleName: created.responsibleName,
    accessGroupId: created.accessGroupId,
    accessGroupName: created.accessGroup?.name ?? null,
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
      ...(input.responsibleName !== undefined
        ? { responsibleName: input.responsibleName?.trim() || null }
        : {}),
      ...(input.accessGroupId !== undefined
        ? { accessGroupId: input.accessGroupId }
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
      ...(input.responsibleName !== undefined
        ? { responsibleName: input.responsibleName?.trim() || null }
        : {}),
      ...(input.accessGroupId !== undefined
        ? { accessGroupId: input.accessGroupId }
        : {}),
    },
    include: {
      accessGroup: {
        select: { name: true },
      },
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
    responsibleName: updated.responsibleName,
    accessGroupId: updated.accessGroupId,
    accessGroupName: updated.accessGroup?.name ?? null,
  };
}
