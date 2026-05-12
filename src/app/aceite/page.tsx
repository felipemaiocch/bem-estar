import { redirect } from "next/navigation";

import { TermsAcceptanceScreen } from "@/components/compliance/terms-acceptance-screen";
import { getCurrentSession, getSafeNextPath } from "@/lib/acceptance-gate";
import {
  getAcceptanceStatus,
  hasAcceptedRequiredTerms,
  requiredPlatformTerms,
} from "@/lib/compliance";

export const dynamic = "force-dynamic";

interface AceitePageProps {
  searchParams: Promise<{
    next?: string;
  }>;
}

export default async function AceitePage({ searchParams }: AceitePageProps) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/");
  }

  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next, session.role);
  const acceptedTerms = await hasAcceptedRequiredTerms(session.sub);

  if (acceptedTerms) {
    redirect(nextPath);
  }

  const acceptanceStatus = await getAcceptanceStatus(session.sub);

  return (
    <TermsAcceptanceScreen
      userName={session.name}
      nextPath={nextPath}
      requiredVersion={requiredPlatformTerms.version}
      initialImageConsent={acceptanceStatus.imagePublicationConsent?.granted ?? false}
    />
  );
}
