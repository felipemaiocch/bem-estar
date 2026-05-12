import { prisma } from "@/lib/prisma";

export const requiredPlatformTerms = {
  kind: "PLATFORM_TERMS" as const,
  version: "2026-05-12",
  title: "Termo de uso e consentimento de saúde",
};

function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export async function hasAcceptedRequiredTerms(userId: string) {
  if (isDemoMode()) {
    return true;
  }

  const acceptedTerms = await prisma.userAcceptance.count({
    where: {
      userId,
      kind: requiredPlatformTerms.kind,
      version: requiredPlatformTerms.version,
    },
  });

  return acceptedTerms > 0;
}

export async function getAcceptanceStatus(userId: string) {
  if (isDemoMode()) {
    return {
      requiredVersion: requiredPlatformTerms.version,
      platformTermsAccepted: true,
      imagePublicationConsent: null,
    };
  }

  const [platformTermsAccepted, imagePublicationConsent] = await Promise.all([
    hasAcceptedRequiredTerms(userId),
    prisma.imageConsent.findUnique({
      where: { userId },
      select: {
        granted: true,
        grantedAt: true,
        revokedAt: true,
        source: true,
      },
    }),
  ]);

  return {
    requiredVersion: requiredPlatformTerms.version,
    platformTermsAccepted,
    imagePublicationConsent,
  };
}

export async function recordRequiredAcceptances(input: {
  userId: string;
  acceptPlatformTerms: boolean;
  acceptImagePublication: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  if (!input.acceptPlatformTerms) {
    throw new Error("REQUIRED_TERMS_NOT_ACCEPTED");
  }

  if (isDemoMode()) {
    return getAcceptanceStatus(input.userId);
  }

  const now = new Date();
  const imageGrantedAt = input.acceptImagePublication ? now : null;
  const imageRevokedAt = input.acceptImagePublication ? null : now;

  await prisma.$transaction([
    prisma.userAcceptance.upsert({
      where: {
        userId_kind_version: {
          userId: input.userId,
          kind: requiredPlatformTerms.kind,
          version: requiredPlatformTerms.version,
        },
      },
      create: {
        userId: input.userId,
        kind: requiredPlatformTerms.kind,
        version: requiredPlatformTerms.version,
        acceptedAt: now,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        source: "first-login",
      },
      update: {
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        source: "first-login",
      },
    }),
    prisma.imageConsent.upsert({
      where: { userId: input.userId },
      create: {
        userId: input.userId,
        granted: input.acceptImagePublication,
        grantedAt: imageGrantedAt,
        revokedAt: imageRevokedAt,
        source: "first-login",
      },
      update: {
        granted: input.acceptImagePublication,
        grantedAt: imageGrantedAt,
        revokedAt: imageRevokedAt,
        source: "first-login",
      },
    }),
  ]);

  return getAcceptanceStatus(input.userId);
}
