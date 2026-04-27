import { NextResponse } from "next/server";

import { appMeta } from "@/lib/constants";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: appMeta.name,
    demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
    databaseConfigured: Boolean(process.env.DATABASE_URL),
    timestamp: new Date().toISOString(),
  });
}
