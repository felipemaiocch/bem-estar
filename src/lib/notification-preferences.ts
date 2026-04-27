import type { NotificationPreferenceKey } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { notificationPreferences as seedPreferences } from "@/lib/mock-data";
import { isDemoMode } from "@/lib/runtime-mode";

export interface NotificationPreferenceItem {
  key: NotificationPreferenceKey;
  label: string;
  description: string;
  enabled: boolean;
}

const preferenceMeta: Record<
  NotificationPreferenceKey,
  { label: string; description: string; defaultEnabled: boolean }
> = {
  REMINDER_DAY_BEFORE: {
    label: "Lembrete 1 dia antes",
    description: "Receba um push com resumo da sessão e material de apoio.",
    defaultEnabled: true,
  },
  REMINDER_HOUR_BEFORE: {
    label: "Lembrete 1 hora antes",
    description: "Aviso rápido para reduzir faltas e atrasos.",
    defaultEnabled: true,
  },
  SLOT_RELEASED: {
    label: "Vaga liberada",
    description: "Se um horário lotado abrir, você entra na frente da fila.",
    defaultEnabled: true,
  },
  AGENDA_NEWS: {
    label: "Novidades da agenda dr",
    description: "Avisos de novos encontros, campanhas e benefícios.",
    defaultEnabled: false,
  },
};

const preferenceOrder: NotificationPreferenceKey[] = [
  "REMINDER_DAY_BEFORE",
  "REMINDER_HOUR_BEFORE",
  "SLOT_RELEASED",
  "AGENDA_NEWS",
];

declare global {
  var semonitoraDemoNotificationPreferences:
    | Record<string, NotificationPreferenceItem[]>
    | undefined;
}

function normalizePreferenceItems(
  input: Partial<Record<NotificationPreferenceKey, boolean>>,
): NotificationPreferenceItem[] {
  return preferenceOrder.map((key) => ({
    key,
    label: preferenceMeta[key].label,
    description: preferenceMeta[key].description,
    enabled: input[key] ?? preferenceMeta[key].defaultEnabled,
  }));
}

function getDemoStore() {
  if (!global.semonitoraDemoNotificationPreferences) {
    const seededEntries = Object.fromEntries(
      preferenceOrder.map((key, index) => [
        key,
        seedPreferences[index]?.enabled ?? preferenceMeta[key].defaultEnabled,
      ]),
    ) as Partial<Record<NotificationPreferenceKey, boolean>>;

    global.semonitoraDemoNotificationPreferences = {
      "user-felipe": normalizePreferenceItems(seededEntries),
    };
  }

  return global.semonitoraDemoNotificationPreferences;
}

export async function listNotificationPreferences(userId: string) {
  if (isDemoMode()) {
    const store = getDemoStore();

    if (!store[userId]) {
      store[userId] = normalizePreferenceItems({});
    }

    return store[userId];
  }

  const existing = await prisma.notificationPreference.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (!existing.length) {
    await prisma.notificationPreference.createMany({
      data: preferenceOrder.map((key) => ({
        userId,
        key,
        enabled: preferenceMeta[key].defaultEnabled,
      })),
      skipDuplicates: true,
    });

    return listNotificationPreferences(userId);
  }

  const mapped = new Map(existing.map((entry) => [entry.key, entry.enabled]));

  return preferenceOrder.map((key) => ({
    key,
    label: preferenceMeta[key].label,
    description: preferenceMeta[key].description,
    enabled: mapped.get(key) ?? preferenceMeta[key].defaultEnabled,
  }));
}

export async function updateNotificationPreference(
  userId: string,
  key: NotificationPreferenceKey,
  enabled: boolean,
) {
  if (isDemoMode()) {
    const store = getDemoStore();
    const current = store[userId] ?? normalizePreferenceItems({});

    const next = current.map((item) =>
      item.key === key ? { ...item, enabled } : item,
    );

    store[userId] = next;
    return next;
  }

  await prisma.notificationPreference.upsert({
    where: {
      userId_key: {
        userId,
        key,
      },
    },
    update: {
      enabled,
    },
    create: {
      userId,
      key,
      enabled,
    },
  });

  return listNotificationPreferences(userId);
}
