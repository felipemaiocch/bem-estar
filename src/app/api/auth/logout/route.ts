import { NextResponse } from "next/server";

import { authCookieName, sessionCookieOptions } from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set(authCookieName, "", {
    ...sessionCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  });

  return response;
}
