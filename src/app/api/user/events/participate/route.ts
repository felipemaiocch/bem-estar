import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const auth = await requireSession(request, "USER");
  if (auth.response) return auth.response;

  try {
    const { eventId } = await request.json();
    
    if (!eventId) {
      return NextResponse.json({ ok: false, error: "ID do evento é obrigatório." }, { status: 400 });
    }

    // Check if it's an Event or Card logic?
    // Actually, EventAttendance table is for Event model.
    // If it's a card, we might need another table, but let's focus on Event first.
    
    const event = await prisma.event.findUnique({
       where: { id: eventId }
    });

    if (!event) {
       return NextResponse.json({ ok: false, error: "Evento não encontrado." }, { status: 404 });
    }

    const attendance = await prisma.eventAttendance.upsert({
      where: {
        eventId_userId: {
          eventId: eventId,
          userId: auth.session.sub,
        }
      },
      update: {
        confirmedAt: new Date(),
      },
      create: {
        eventId: eventId,
        userId: auth.session.sub,
        confirmedAt: new Date(),
      }
    });

    return NextResponse.json({ ok: true, attendance });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Falha ao registrar participação." }, { status: 500 });
  }
}
