import { NextResponse, type NextRequest } from "next/server";
import type { Department } from "@prisma/client";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const ratingSchema = z.object({
  lessonId: z.string().min(1),
  rating: z.number().int().min(0).max(5),
  comment: z.string().max(200).optional(),
});

function hasCourseAccess(
  course: {
    department: Department;
    allowedDepartments: Department[];
    isGlobal: boolean;
  },
  userDepartment?: Department | null,
) {
  return (
    course.isGlobal ||
    course.department === userDepartment ||
    Boolean(userDepartment && course.allowedDepartments.includes(userDepartment))
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  const parsed = ratingSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Dados invalidos para avaliar aula.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.session.sub },
    select: { id: true, department: true },
  });

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Usuario nao encontrado." },
      { status: 404 },
    );
  }

  const lesson = await prisma.eadLesson.findUnique({
    where: { id: parsed.data.lessonId },
    include: {
      course: {
        select: {
          department: true,
          allowedDepartments: true,
          isGlobal: true,
          isPublished: true,
        },
      },
      completions: {
        where: { userId: user.id },
        select: { id: true },
      },
    },
  });

  if (!lesson || !lesson.isPublished || !lesson.course.isPublished) {
    return NextResponse.json(
      { ok: false, error: "Aula nao encontrada." },
      { status: 404 },
    );
  }

  if (!hasCourseAccess(lesson.course, user.department)) {
    return NextResponse.json(
      { ok: false, error: "Esta aula pertence a outro departamento." },
      { status: 403 },
    );
  }

  if (lesson.completions.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Conclua a aula antes de avaliar." },
      { status: 403 },
    );
  }

  if (parsed.data.rating <= 2 && !parsed.data.comment?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Explique em ate 200 caracteres o motivo da nota baixa." },
      { status: 400 },
    );
  }

  const rating = await prisma.eadLessonRating.upsert({
    where: {
      lessonId_userId: {
        lessonId: lesson.id,
        userId: user.id,
      },
    },
    update: {
      rating: parsed.data.rating,
      comment: parsed.data.comment?.trim() || null,
    },
    create: {
      lessonId: lesson.id,
      userId: user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment?.trim() || null,
    },
  });

  return NextResponse.json({
    ok: true,
    rating: {
      rating: rating.rating,
      comment: rating.comment,
    },
    message: "Avaliacao registrada.",
  });
}
