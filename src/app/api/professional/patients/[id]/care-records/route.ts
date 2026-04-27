import { NextResponse, type NextRequest } from "next/server";

import { listCareRecordsForPatient } from "@/lib/care-records";
import { requireSession } from "@/lib/api-auth";

function getPatientId(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const patientIndex = segments.findIndex((segment) => segment === "patients");

  if (patientIndex < 0) {
    return "";
  }

  return segments[patientIndex + 1] ?? "";
}

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "PROFESSIONAL");

  if (auth.response) {
    return auth.response;
  }

  const patientId = getPatientId(request.nextUrl.pathname);

  if (!patientId) {
    return NextResponse.json(
      { ok: false, error: "Paciente não informado." },
      { status: 400 },
    );
  }

  const records = await listCareRecordsForPatient(auth.session.sub, patientId);

  return NextResponse.json({
    ok: true,
    records,
  });
}
