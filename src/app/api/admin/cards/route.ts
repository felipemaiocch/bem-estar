import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const cardSchema = z.object({
  category: z.string().min(1),
  title: z.string().min(1),
  date: z.string().optional().or(z.literal("")),
  location: z.string().min(1),
  status: z.string().min(1),
  points: z.number().int().nonnegative(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  responsibleName: z.string().optional(),
  responsibleId: z.string().optional(),
  slots: z.string().optional(),
  availableDays: z.string().optional(),
  accessGroupId: z.string().optional().nullable().or(z.literal("")),
});

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const category = request.nextUrl.searchParams.get("category");

  const cards = await prisma.engagementCard.findMany({
    where: category ? { category } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      publishedBy: {
        select: {
          name: true,
        },
      },
      responsible: {
        select: {
          specialty: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      },
      accessGroup: {
        select: {
          name: true,
        },
      },
    },
  });

  return NextResponse.json({ ok: true, cards });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const body = await request.json();
  const parsed = cardSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const card = await prisma.engagementCard.create({
    data: {
      category: parsed.data.category,
      title: parsed.data.title,
      date: parsed.data.date || "",
      location: parsed.data.location,
      status: parsed.data.status,
      points: parsed.data.points,
      imageUrl: parsed.data.imageUrl || null,
      responsibleName: parsed.data.responsibleName || null,
      responsibleId: parsed.data.responsibleId || null,
      slots: parsed.data.slots || null,
      availableDays: parsed.data.availableDays || null,
      accessGroupId: parsed.data.accessGroupId || null,
      publishedById: auth.session.sub,
    },
    include: {
      accessGroup: {
        select: { name: true },
      },
    },
  });

  return NextResponse.json({ ok: true, card });
}
