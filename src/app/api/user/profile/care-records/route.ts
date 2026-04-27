import { NextResponse, type NextRequest } from "next/server";

import { listCareRecordsForUser } from "@/lib/care-records";
import { requireSession } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  const records = await listCareRecordsForUser(auth.session.sub);

  return NextResponse.json({
    ok: true,
    records,
  });
}
