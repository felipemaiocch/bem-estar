import { NextResponse, type NextRequest } from "next/server";

import { requireSession } from "@/lib/api-auth";
import { getDepartmentDescription, getDepartmentLabel } from "@/lib/departments";
import { ensureDefaultEadContent, normalizeQuizOptions } from "@/lib/ead";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  await ensureDefaultEadContent();

  const user = await prisma.user.findUnique({
    where: { id: auth.session.sub },
    select: {
      id: true,
      department: true,
      score: true,
      drCoins: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Usuario nao encontrado." },
      { status: 404 },
    );
  }

  if (!user.department) {
    return NextResponse.json({
      ok: true,
      user: {
        department: null,
        departmentLabel: getDepartmentLabel(null),
        departmentDescription: getDepartmentDescription(null),
        score: user.score,
        drCoins: user.drCoins,
      },
      courses: [],
      summary: {
        totalLessons: 0,
        completedLessons: 0,
        availablePoints: 0,
        availableCoins: 0,
      },
    });
  }

  const courses = await prisma.eadCourse.findMany({
    where: {
      department: user.department,
      isPublished: true,
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      lessons: {
        where: { isPublished: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          completions: {
            where: { userId: user.id },
            select: {
              id: true,
              completedAt: true,
              pointsAwarded: true,
              coinsAwarded: true,
              isCorrect: true,
            },
          },
        },
      },
    },
  });

  let totalLessons = 0;
  let completedLessons = 0;
  let availablePoints = 0;
  let availableCoins = 0;

  const courseViews = courses.map((course) => {
    const lessons = course.lessons.map((lesson) => {
      const completion = lesson.completions[0] ?? null;
      const completed = Boolean(completion);

      totalLessons += 1;
      if (completed) {
        completedLessons += 1;
      } else {
        availablePoints += lesson.pointsReward;
        availableCoins += lesson.coinsReward;
      }

      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        kind: lesson.kind,
        videoUrl: lesson.videoUrl,
        materialUrl: lesson.materialUrl,
        durationMinutes: lesson.durationMinutes,
        quizQuestion: lesson.quizQuestion,
        quizOptions: normalizeQuizOptions(lesson.quizOptions),
        pointsReward: lesson.pointsReward,
        coinsReward: lesson.coinsReward,
        completed,
        completion: completion
          ? {
              completedAtIso: completion.completedAt.toISOString(),
              pointsAwarded: completion.pointsAwarded,
              coinsAwarded: completion.coinsAwarded,
              isCorrect: completion.isCorrect,
            }
          : null,
      };
    });

    const completedInCourse = lessons.filter((lesson) => lesson.completed).length;

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      department: course.department,
      departmentLabel: getDepartmentLabel(course.department),
      lessons,
      progress:
        lessons.length > 0
          ? Math.round((completedInCourse / lessons.length) * 100)
          : 0,
    };
  });

  return NextResponse.json({
    ok: true,
    user: {
      department: user.department,
      departmentLabel: getDepartmentLabel(user.department),
      departmentDescription: getDepartmentDescription(user.department),
      score: user.score,
      drCoins: user.drCoins,
    },
    courses: courseViews,
    summary: {
      totalLessons,
      completedLessons,
      availablePoints,
      availableCoins,
    },
  });
}
