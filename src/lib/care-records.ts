import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { isDemoMode } from "@/lib/runtime-mode";
import { monitoredUsers, seedCareRecords } from "@/lib/mock-data";
import type { CareRecordCategory, CareRecordMetric, UserCareRecord } from "@/types";

export interface CareRecordInput {
  userId: string;
  professionalUserId: string;
  professionalName?: string;
  professionalRole?: string;
  category: CareRecordCategory;
  title: string;
  summary: string;
  delivery: string;
  nextStep?: string;
  metrics: CareRecordMetric[];
}

export interface MonitoredUserItem {
  id: string;
  name: string;
  email: string;
  area: string;
  objective: string;
}

type CareRecordWithRelations = Prisma.CareRecordGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        company: true;
      };
    };
    professional: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

declare global {
  var semonitoraDemoCareRecords: UserCareRecord[] | undefined;
}

function getDemoStore() {
  if (!global.semonitoraDemoCareRecords) {
    global.semonitoraDemoCareRecords = [...seedCareRecords].sort((left, right) =>
      right.recordedAtIso.localeCompare(left.recordedAtIso),
    );
  }

  return global.semonitoraDemoCareRecords;
}

function formatTimestamp(value: Date) {
  const day = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  })
    .format(value)
    .replace(".", "");

  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);

  return `${day} · ${time}`;
}

function normalizeMetrics(metrics: CareRecordMetric[]) {
  return metrics
    .map((metric) => ({
      label: metric.label.trim(),
      value: metric.value.trim(),
    }))
    .filter((metric) => metric.label.length > 0 || metric.value.length > 0);
}

function parseMetrics(value: Prisma.JsonValue | null): CareRecordMetric[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item !== "object" || item === null || Array.isArray(item)) {
        return null;
      }

      const metricRecord = item as Record<string, unknown>;

      return {
        label: typeof metricRecord.label === "string" ? metricRecord.label : "",
        value: typeof metricRecord.value === "string" ? metricRecord.value : "",
      };
    })
    .filter((item): item is CareRecordMetric => item !== null)
    .filter((item) => item.label.trim().length > 0 || item.value.trim().length > 0);
}

function toViewModel(record: CareRecordWithRelations): UserCareRecord {
  const metrics = parseMetrics(record.metrics);

  return {
    id: record.id,
    userId: record.user.id,
    userName: record.user.name,
    userArea: record.user.company ?? "Operações",
    category: record.category as CareRecordCategory,
    professional: record.professional.name,
    professionalRole: record.professionalRole ?? "Profissional",
    title: record.title,
    summary: record.summary,
    delivery: record.delivery,
    nextStep: record.nextStep ?? "",
    metrics,
    recordedAtIso: record.recordedAt.toISOString(),
    recordedAtLabel: formatTimestamp(record.recordedAt),
  };
}

export async function listMonitoredUsers(): Promise<MonitoredUserItem[]> {
  if (isDemoMode()) {
    return monitoredUsers;
  }

  const users = await prisma.user.findMany({
    where: {
      role: "USER",
      isActive: true,
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      currentGoal: true,
    },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    area: user.company ?? "Operações",
    objective: user.currentGoal ?? "Bem-estar contínuo",
  }));
}

export async function listCareRecordsForUser(userId: string) {
  if (isDemoMode()) {
    return getDemoStore()
      .filter((record) => record.userId === userId)
      .sort((left, right) => right.recordedAtIso.localeCompare(left.recordedAtIso));
  }

  const records = await prisma.careRecord.findMany({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          company: true,
        },
      },
      professional: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { recordedAt: "desc" },
  });

  return records.map(toViewModel);
}

export async function listCareRecordsByProfessional(professionalUserId: string) {
  if (isDemoMode()) {
    return getDemoStore().sort((left, right) => right.recordedAtIso.localeCompare(left.recordedAtIso));
  }

  const records = await prisma.careRecord.findMany({
    where: { professionalUserId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          company: true,
        },
      },
      professional: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { recordedAt: "desc" },
  });

  return records.map(toViewModel);
}

export async function listCareRecordsForPatient(
  professionalUserId: string,
  userId: string,
) {
  if (isDemoMode()) {
    return getDemoStore()
      .filter((record) => record.userId === userId)
      .sort((left, right) => right.recordedAtIso.localeCompare(left.recordedAtIso));
  }

  const records = await prisma.careRecord.findMany({
    where: {
      professionalUserId,
      userId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          company: true,
        },
      },
      professional: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { recordedAt: "desc" },
  });

  return records.map(toViewModel);
}

export async function createCareRecord(input: CareRecordInput): Promise<UserCareRecord> {
  const metrics = normalizeMetrics(input.metrics);

  if (isDemoMode()) {
    const users = await listMonitoredUsers();
    const selectedUser = users.find((user) => user.id === input.userId) ?? users[0];
    const professionalName = input.professionalName ?? "Camila Rocha";
    const now = new Date();

    const record: UserCareRecord = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `record-${now.getTime()}`,
      userId: selectedUser.id,
      userName: selectedUser.name,
      userArea: selectedUser.area,
      category: input.category,
      professional: professionalName,
      professionalRole: input.professionalRole ?? "Profissional",
      title: input.title.trim(),
      summary: input.summary.trim(),
      delivery: input.delivery.trim(),
      nextStep: input.nextStep?.trim() ?? "",
      metrics,
      recordedAtIso: now.toISOString(),
      recordedAtLabel: formatTimestamp(now),
    };

    const nextRecords = [record, ...getDemoStore()].sort((left, right) =>
      right.recordedAtIso.localeCompare(left.recordedAtIso),
    );

    global.semonitoraDemoCareRecords = nextRecords;

    return record;
  }

  const [user, professional] = await Promise.all([
    prisma.user.findUnique({
      where: { id: input.userId },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: input.professionalUserId },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  if (!user) {
    throw new Error("Usuário de destino não encontrado.");
  }

  if (!professional) {
    throw new Error("Profissional não encontrado para registrar o atendimento.");
  }

  const created = await prisma.careRecord.create({
    data: {
      userId: input.userId,
      professionalUserId: input.professionalUserId,
      professionalRole: input.professionalRole,
      category: input.category,
      title: input.title.trim(),
      summary: input.summary.trim(),
      delivery: input.delivery.trim(),
      nextStep: input.nextStep?.trim() || null,
      metrics,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          company: true,
        },
      },
      professional: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return toViewModel(created);
}
