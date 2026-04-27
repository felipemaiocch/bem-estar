import { prisma } from "@/lib/prisma";
import { isDemoMode } from "@/lib/runtime-mode";

export interface WellnessInput {
  weightKg?: number;
  moodLabel?: string;
  notes?: string;
  habitsScore?: number;
}

export interface WellnessView {
  id: string;
  weightKg: number | null;
  moodLabel: string | null;
  notes: string | null;
  habitsScore: number | null;
  createdAtIso: string;
  createdAtLabel: string;
}

declare global {
  var semonitoraDemoWellnessEntries:
    | Record<string, WellnessView[]>
    | undefined;
}

function formatLabel(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function getDemoStore() {
  if (!global.semonitoraDemoWellnessEntries) {
    const now = new Date();

    global.semonitoraDemoWellnessEntries = {
      "user-felipe": [
        {
          id: "wellness-seed-1",
          weightKg: 79.4,
          moodLabel: "Equilibrado",
          notes: "Hidratação ok, pausas ativas concluídas, meditação de 10 minutos feita.",
          habitsScore: 80,
          createdAtIso: now.toISOString(),
          createdAtLabel: formatLabel(now),
        },
      ],
    };
  }

  return global.semonitoraDemoWellnessEntries;
}

export async function listWellnessEntries(userId: string, limit = 30) {
  if (isDemoMode()) {
    const store = getDemoStore();
    return (store[userId] ?? []).slice(0, limit);
  }

  const entries = await prisma.wellnessEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return entries.map((entry) => ({
    id: entry.id,
    weightKg: entry.weightKg,
    moodLabel: entry.moodLabel,
    notes: entry.notes,
    habitsScore: entry.habitsScore,
    createdAtIso: entry.createdAt.toISOString(),
    createdAtLabel: formatLabel(entry.createdAt),
  }));
}

export async function createWellnessEntry(userId: string, input: WellnessInput) {
  if (isDemoMode()) {
    const store = getDemoStore();
    const now = new Date();

    const entry: WellnessView = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `wellness-${now.getTime()}`,
      weightKg: input.weightKg ?? null,
      moodLabel: input.moodLabel ?? null,
      notes: input.notes?.trim() || null,
      habitsScore: input.habitsScore ?? null,
      createdAtIso: now.toISOString(),
      createdAtLabel: formatLabel(now),
    };

    const existing = store[userId] ?? [];
    store[userId] = [entry, ...existing].slice(0, 60);
    return entry;
  }

  const created = await prisma.wellnessEntry.create({
    data: {
      userId,
      weightKg: input.weightKg,
      moodLabel: input.moodLabel,
      notes: input.notes?.trim() || null,
      habitsScore: input.habitsScore,
      moodScore: null,
    },
  });

  return {
    id: created.id,
    weightKg: created.weightKg,
    moodLabel: created.moodLabel,
    notes: created.notes,
    habitsScore: created.habitsScore,
    createdAtIso: created.createdAt.toISOString(),
    createdAtLabel: formatLabel(created.createdAt),
  };
}
