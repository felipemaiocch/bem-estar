import { cookies } from "next/headers";

export const authCookieName = "pulsehub.session";

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(authCookieName)?.value ?? null;
}
