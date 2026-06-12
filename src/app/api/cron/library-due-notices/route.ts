import { NextResponse, type NextRequest } from "next/server";

import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.NODE_ENV !== "production") return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function notifyReservation(
  reservation: Awaited<ReturnType<typeof prisma.libraryReservation.findMany>>[number] & {
    dueAt: Date;
    item: { title: string };
    user: { id: string; name: string; email: string };
    copy: { code: string; callNumber: string | null } | null;
  },
  kind: "DUE_SOON" | "OVERDUE",
) {
  const isOverdue = kind === "OVERDUE";
  const title = isOverdue ? "Biblioteca: empréstimo em atraso" : "Biblioteca: vencimento amanhã";
  const message = isOverdue
    ? `O empréstimo de "${reservation.item.title}" venceu em ${formatDate(reservation.dueAt)}. Procure a biblioteca para regularizar.`
    : `O empréstimo de "${reservation.item.title}" vence amanhã, ${formatDate(reservation.dueAt)}.`;
  const copyLine = reservation.copy?.code
    ? `Exemplar: ${reservation.copy.code}${reservation.copy.callNumber ? ` - ${reservation.copy.callNumber}` : ""}`
    : "";

  const email = await sendEmail({
    to: reservation.user.email,
    subject: title,
    text: `${message}\n${copyLine}`.trim(),
    html: `<p>Olá, ${reservation.user.name}.</p><p>${message}</p>${copyLine ? `<p>${copyLine}</p>` : ""}`,
  });

  await prisma.notification.create({
    data: {
      userId: reservation.user.id,
      title,
      message,
      type: "SYSTEM",
      channel: "EMAIL",
      deliveryStatus: email.ok ? "SENT" : "FAILED",
      sentAt: email.ok ? new Date() : null,
    },
  });

  if (email.ok) {
    await prisma.libraryReservation.update({
      where: { id: reservation.id },
      data: isOverdue ? { overdueNotifiedAt: new Date(), status: "OVERDUE" } : { dueSoonNotifiedAt: new Date() },
    });
  } else if (isOverdue) {
    await prisma.libraryReservation.update({
      where: { id: reservation.id },
      data: { status: "OVERDUE" },
    });
  }

  return email.ok;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const include = {
    item: { select: { title: true } },
    user: { select: { id: true, name: true, email: true } },
    copy: { select: { code: true, callNumber: true } },
  } as const;

  const [dueSoon, overdue] = await Promise.all([
    prisma.libraryReservation.findMany({
      where: {
        status: "BORROWED",
        dueAt: { gte: startOfDay(tomorrow), lte: endOfDay(tomorrow) },
        dueSoonNotifiedAt: null,
      },
      include,
      take: 100,
    }),
    prisma.libraryReservation.findMany({
      where: {
        status: { in: ["BORROWED", "OVERDUE"] },
        dueAt: { lt: startOfDay(now) },
        overdueNotifiedAt: null,
      },
      include,
      take: 100,
    }),
  ]);

  let sent = 0;
  let failed = 0;

  for (const reservation of dueSoon) {
    if (!reservation.dueAt) continue;
    const ok = await notifyReservation({ ...reservation, dueAt: reservation.dueAt }, "DUE_SOON");
    if (ok) sent += 1;
    else failed += 1;
  }

  for (const reservation of overdue) {
    if (!reservation.dueAt) continue;
    const ok = await notifyReservation({ ...reservation, dueAt: reservation.dueAt }, "OVERDUE");
    if (ok) sent += 1;
    else failed += 1;
  }

  return NextResponse.json({
    ok: true,
    checked: dueSoon.length + overdue.length,
    sent,
    failed,
  });
}
