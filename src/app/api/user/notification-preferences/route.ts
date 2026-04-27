import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import {
  listNotificationPreferences,
  updateNotificationPreference,
} from "@/lib/notification-preferences";

const updatePreferenceSchema = z.object({
  key: z.enum([
    "REMINDER_DAY_BEFORE",
    "REMINDER_HOUR_BEFORE",
    "SLOT_RELEASED",
    "AGENDA_NEWS",
  ]),
  enabled: z.boolean(),
});

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  const preferences = await listNotificationPreferences(auth.session.sub);

  return NextResponse.json({
    ok: true,
    preferences,
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  const body = await request.json();
  const parsed = updatePreferenceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Dados inválidos para atualizar preferência.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const preferences = await updateNotificationPreference(
    auth.session.sub,
    parsed.data.key,
    parsed.data.enabled,
  );

  return NextResponse.json({
    ok: true,
    preferences,
  });
}
