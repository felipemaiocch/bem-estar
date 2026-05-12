export interface RankingSourceUser {
  id: string;
  name: string;
  company: string | null;
  score: number;
  showInRanking: boolean;
}

export interface RankingEntry {
  id: string;
  position: number;
  name: string;
  area: string;
  points: number;
  isMe: boolean;
  isAnonymous: boolean;
  showInRanking: boolean;
}

export function buildRankingEntry(
  user: RankingSourceUser,
  position: number,
  viewerId: string,
): RankingEntry {
  const isMe = user.id === viewerId;
  const canShowIdentity = user.showInRanking || isMe;

  return {
    id: user.id,
    position,
    name: canShowIdentity
      ? user.name
      : `Participante #${position}`,
    area: canShowIdentity ? user.company || "Geral" : "Identidade privada",
    points: user.score,
    isMe,
    isAnonymous: !canShowIdentity,
    showInRanking: user.showInRanking,
  };
}
