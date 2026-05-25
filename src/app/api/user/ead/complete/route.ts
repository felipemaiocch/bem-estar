import { Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import { isLessonAnswerCorrect, normalizeQuizOptions } from "@/lib/ead";
import { prisma } from "@/lib/prisma";

const completeLessonSchema = z.object({
  lessonId: z.string().min(1),
  selectedAnswerIndex: z.number().int().min(0).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  const parsed = completeLessonSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Dados invalidos para concluir aula.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.session.sub },
    select: {
      id: true,
      department: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Usuario nao encontrado." },
      { status: 404 },
    );
  }

  if (!user.department) {
    return NextResponse.json(
      { ok: false, error: "Defina um departamento antes de acessar o EAD." },
      { status: 403 },
    );
  }

  const lesson = await prisma.eadLesson.findUnique({
    where: { id: parsed.data.lessonId },
    include: {
      course: {
        select: {
          id: true,
          department: true,
          isPublished: true,
        },
      },
    },
  });

  if (!lesson || !lesson.isPublished || !lesson.course.isPublished) {
    return NextResponse.json(
      { ok: false, error: "Aula nao encontrada." },
      { status: 404 },
    );
  }

  if (lesson.course.department !== user.department) {
    return NextResponse.json(
      { ok: false, error: "Esta aula pertence a outro departamento." },
      { status: 403 },
    );
  }

  const departmentCourses = await prisma.eadCourse.findMany({
    where: {
      department: user.department,
      isPublished: true,
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      lessons: {
        where: { isPublished: true },
        select: {
          id: true,
          completions: {
            where: { userId: user.id },
            select: { id: true },
          },
        },
      },
    },
  });

  const currentCourseIndex = departmentCourses.findIndex(
    (course) => course.id === lesson.course.id,
  );
  const previousCoursesCompleted = departmentCourses
    .slice(0, Math.max(currentCourseIndex, 0))
    .every(
      (course) =>
        course.lessons.length === 0 ||
        course.lessons.every((courseLesson) => courseLesson.completions.length > 0),
    );

  if (!previousCoursesCompleted) {
    return NextResponse.json(
      {
        ok: false,
        error: "Conclua o curso anterior antes de avancar para esta aula.",
      },
      { status: 403 },
    );
  }

  const quizOptions = normalizeQuizOptions(lesson.quizOptions);
  const requiresAnswer = Boolean(lesson.quizQuestion && quizOptions.length > 0);

  if (requiresAnswer && parsed.data.selectedAnswerIndex === undefined) {
    return NextResponse.json(
      { ok: false, error: "Responda a pergunta da aula para concluir." },
      { status: 400 },
    );
  }

  const isCorrect = isLessonAnswerCorrect(
    lesson.correctAnswerIndex,
    parsed.data.selectedAnswerIndex,
  );

  if (requiresAnswer && !isCorrect) {
    return NextResponse.json(
      {
        ok: false,
        incorrect: true,
        error: "Resposta incorreta. Revise a aula e tente novamente.",
      },
      { status: 422 },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.eadLessonCompletion.findUnique({
        where: {
          lessonId_userId: {
            lessonId: lesson.id,
            userId: user.id,
          },
        },
      });

      if (existing) {
        const currentUser = await tx.user.findUnique({
          where: { id: user.id },
          select: { score: true, drCoins: true },
        });

        return {
          alreadyCompleted: true,
          completion: existing,
          user: currentUser,
        };
      }

      const completion = await tx.eadLessonCompletion.create({
        data: {
          lessonId: lesson.id,
          userId: user.id,
          selectedAnswerIndex: parsed.data.selectedAnswerIndex ?? null,
          isCorrect,
          pointsAwarded: lesson.pointsReward,
          coinsAwarded: lesson.coinsReward,
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          score: {
            increment: lesson.pointsReward,
          },
          drCoins: {
            increment: lesson.coinsReward,
          },
        },
        select: {
          score: true,
          drCoins: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "COMPLETE",
          entity: "EAD_LESSON",
          entityId: lesson.id,
          metadata: {
            pointsAwarded: lesson.pointsReward,
            coinsAwarded: lesson.coinsReward,
            courseId: lesson.courseId,
          } as Prisma.InputJsonObject,
        },
      });

      return {
        alreadyCompleted: false,
        completion,
        user: updatedUser,
      };
    });

    return NextResponse.json({
      ok: true,
      alreadyCompleted: result.alreadyCompleted,
      completion: {
        id: result.completion.id,
        completedAtIso: result.completion.completedAt.toISOString(),
        pointsAwarded: result.completion.pointsAwarded,
        coinsAwarded: result.completion.coinsAwarded,
        isCorrect: result.completion.isCorrect,
      },
      user: result.user,
      message: result.alreadyCompleted
        ? "Aula ja concluida anteriormente."
        : `Aula concluida. +${lesson.pointsReward} pontos e +${lesson.coinsReward} drcoins.`,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({
        ok: true,
        alreadyCompleted: true,
        message: "Aula ja concluida anteriormente.",
      });
    }

    return NextResponse.json(
      { ok: false, error: "Nao foi possivel concluir a aula." },
      { status: 500 },
    );
  }
}
