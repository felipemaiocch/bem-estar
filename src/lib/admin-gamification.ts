import { type ScoringAction } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function listScoringRules() {
  const rules = await prisma.scoringRule.findMany({
    orderBy: { createdAt: "desc" },
  });

  return rules.map((rule) => ({
    id: rule.id,
    name: rule.name,
    action: rule.action,
    points: rule.points,
    isActive: rule.isActive,
    startsAtIso: rule.startsAt?.toISOString() ?? null,
    endsAtIso: rule.endsAt?.toISOString() ?? null,
  }));
}

export async function createScoringRule(adminId: string, data: {
  name: string;
  action: ScoringAction;
  points: number;
  isActive?: boolean;
  startsAt?: Date;
  endsAt?: Date;
}) {
  const existing = await prisma.scoringRule.findUnique({
    where: { name: data.name },
  });

  if (existing) {
    throw new Error("Já existe uma regra de pontuação com este nome.");
  }

  const created = await prisma.scoringRule.create({
    data: {
      name: data.name,
      action: data.action,
      points: data.points,
      isActive: data.isActive ?? true,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action: "CREATE_SCORING_RULE",
      entity: "ScoringRule",
      entityId: created.id,
      metadata: { name: created.name, action: created.action, points: created.points },
    },
  });

  return {
    id: created.id,
    name: created.name,
    action: created.action,
    points: created.points,
    isActive: created.isActive,
    startsAtIso: created.startsAt?.toISOString() ?? null,
    endsAtIso: created.endsAt?.toISOString() ?? null,
  };
}

export async function updateScoringRule(adminId: string, ruleId: string, data: {
  name?: string;
  points?: number;
  isActive?: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
}) {
  const existing = await prisma.scoringRule.findUnique({
    where: { id: ruleId },
  });

  if (!existing) {
    throw new Error("Regra de pontuação não encontrada.");
  }

  if (data.name && data.name !== existing.name) {
    const conflicting = await prisma.scoringRule.findUnique({
      where: { name: data.name },
    });
    if (conflicting) {
      throw new Error("Já existe outra regra com este nome.");
    }
  }

  const updated = await prisma.scoringRule.update({
    where: { id: ruleId },
    data: {
      name: data.name,
      points: data.points,
      isActive: data.isActive,
      startsAt: data.startsAt !== undefined ? data.startsAt : undefined,
      endsAt: data.endsAt !== undefined ? data.endsAt : undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action: "UPDATE_SCORING_RULE",
      entity: "ScoringRule",
      entityId: updated.id,
      metadata: { changes: Object.keys(data) },
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    action: updated.action,
    points: updated.points,
    isActive: updated.isActive,
    startsAtIso: updated.startsAt?.toISOString() ?? null,
    endsAtIso: updated.endsAt?.toISOString() ?? null,
  };
}
