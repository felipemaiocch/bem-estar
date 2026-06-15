import { seedCareRecords } from "@/lib/mock-data";
import type { CareRecordMetric, UserCareRecord } from "@/types";

const STORAGE_KEY = "se-monitora:care-records";

export interface NewCareRecordInput {
  userId: string;
  userName: string;
  userArea: string;
  category: UserCareRecord["category"];
  sourceType?: UserCareRecord["sourceType"];
  sourceId?: string | null;
  visibility?: UserCareRecord["visibility"];
  priority?: UserCareRecord["priority"];
  requiresFollowUp?: boolean;
  followUpStatus?: UserCareRecord["followUpStatus"];
  professional: string;
  professionalRole: string;
  title: string;
  summary: string;
  delivery: string;
  nextStep: string;
  metrics: CareRecordMetric[];
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeCareRecords(value: unknown): UserCareRecord[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const parsed = value.filter(
    (item): item is UserCareRecord =>
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      "userId" in item &&
      "category" in item &&
      "title" in item &&
      "recordedAtIso" in item,
  );

  return parsed.length ? parsed : null;
}

export function loadCareRecords(): UserCareRecord[] {
  if (!canUseStorage()) {
    return seedCareRecords;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedCareRecords));
      return seedCareRecords;
    }

    const parsed = normalizeCareRecords(JSON.parse(raw));
    if (!parsed) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedCareRecords));
      return seedCareRecords;
    }

    return parsed.sort((left, right) => right.recordedAtIso.localeCompare(left.recordedAtIso));
  } catch {
    return seedCareRecords;
  }
}

export function saveCareRecords(records: UserCareRecord[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function formatTimestamp(date: Date) {
  const day = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  })
    .format(date)
    .replace(".", "");

  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return `${day} · ${time}`;
}

export function appendCareRecord(input: NewCareRecordInput) {
  const now = new Date();
  const nextRecord: UserCareRecord = {
    ...input,
    sourceType: input.sourceType ?? "manual",
    sourceId: input.sourceId ?? null,
    visibility: input.visibility ?? "user_visible",
    priority: input.priority ?? "normal",
    requiresFollowUp: input.requiresFollowUp ?? false,
    followUpStatus: input.followUpStatus ?? "open",
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `record-${now.getTime()}`,
    metrics: input.metrics.filter((item) => item.label.trim() || item.value.trim()),
    recordedAtIso: now.toISOString(),
    recordedAtLabel: formatTimestamp(now),
  };

  const nextRecords = [nextRecord, ...loadCareRecords()].sort((left, right) =>
    right.recordedAtIso.localeCompare(left.recordedAtIso),
  );

  saveCareRecords(nextRecords);

  return nextRecords;
}
