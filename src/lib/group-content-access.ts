import { prisma } from "@/lib/prisma";

interface AccessGroupSummary {
  id: string;
  name: string;
}

export interface GroupRestrictedRecord {
  accessGroupId: string | null;
  accessGroup?: AccessGroupSummary | null;
}

export async function getActiveUserGroupIds(userId: string) {
  const memberships = await prisma.userGroupMembership.findMany({
    where: {
      userId,
      group: { isActive: true },
    },
    select: { groupId: true },
  });

  return memberships.map((membership) => membership.groupId);
}

export function userCanAccessGroup(record: GroupRestrictedRecord, groupIds: string[]) {
  return !record.accessGroupId || groupIds.includes(record.accessGroupId);
}

export function getRestrictedGroupName(record: GroupRestrictedRecord) {
  return record.accessGroup?.name ?? "turma fechada";
}

export function buildRestrictedContentState(
  record: GroupRestrictedRecord,
  groupIds: string[],
) {
  const isRestricted = Boolean(record.accessGroupId);
  const userHasAccess = userCanAccessGroup(record, groupIds);

  return {
    isRestricted,
    userHasAccess,
    isLocked: isRestricted && !userHasAccess,
    accessGroupName: record.accessGroup?.name ?? null,
  };
}

export function lockedContentCopy(record: GroupRestrictedRecord) {
  const groupName = getRestrictedGroupName(record);

  return {
    title: `Turma fechada: ${groupName}`,
    description: "Conteúdo disponível apenas para participantes selecionados.",
    location: "Participantes selecionados",
    status: "Próxima turma em breve",
  };
}
