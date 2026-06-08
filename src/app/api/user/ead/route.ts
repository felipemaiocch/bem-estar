import { NextResponse, type NextRequest } from "next/server";
import type { Department } from "@prisma/client";

import { requireSession } from "@/lib/api-auth";
import { getDepartmentDescription, getDepartmentLabel } from "@/lib/departments";
import { normalizeQuizOptions } from "@/lib/ead";
import { prisma } from "@/lib/prisma";

function visibleEadWhere(userDepartment?: Department | null) {
  return {
    OR: [
      ...(userDepartment ? [{ department: userDepartment }] : []),
      ...(userDepartment ? [{ allowedDepartments: { has: userDepartment } }] : []),
      { isGlobal: true },
    ],
    isPublished: true,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

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

  const courses = await prisma.eadCourse.findMany({
    where: visibleEadWhere(user.department),
    orderBy: [{ department: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      resources: {
        where: { isPublished: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
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
          ratings: {
            where: { userId: user.id },
            select: {
              rating: true,
              comment: true,
            },
          },
          resources: {
            where: { isPublished: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });

  const resources = await prisma.eadResource.findMany({
    where: visibleEadWhere(user.department),
    orderBy: [{ department: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  let totalLessons = 0;
  let completedLessons = 0;
  let availablePoints = 0;
  let availableCoins = 0;
  let completedCourses = 0;
  let previousCoursesCompleted = true;

  const courseViews = courses.map((course) => {
    const courseUnlocked = previousCoursesCompleted;
    let previousLessonsCompleted = true;
    const lessons = course.lessons.map((lesson) => {
      const completion = lesson.completions[0] ?? null;
      const completed = Boolean(completion);
      const lessonUnlocked = courseUnlocked && previousLessonsCompleted;
      const rating = lesson.ratings[0] ?? null;

      totalLessons += 1;
      if (completed) {
        completedLessons += 1;
      } else {
        availablePoints += lesson.pointsReward;
        availableCoins += lesson.coinsReward;
      }

      const lessonView = {
        id: lesson.id,
        title: lessonUnlocked ? lesson.title : "Aula bloqueada",
        description: lessonUnlocked
          ? lesson.description
          : courseUnlocked
            ? "Conclua a aula anterior para liberar este conteudo."
            : "Conclua o curso anterior para liberar este conteudo.",
        kind: lesson.kind,
        videoUrl: lessonUnlocked ? lesson.videoUrl : null,
        materialUrl: lessonUnlocked ? lesson.materialUrl : null,
        durationMinutes: lesson.durationMinutes,
        quizQuestion: lessonUnlocked ? lesson.quizQuestion : null,
        quizOptions: lessonUnlocked ? normalizeQuizOptions(lesson.quizOptions) : [],
        pointsReward: lesson.pointsReward,
        coinsReward: lesson.coinsReward,
        isLocked: !lessonUnlocked,
        completed,
        completion: completion
          ? {
              completedAtIso: completion.completedAt.toISOString(),
              pointsAwarded: completion.pointsAwarded,
              coinsAwarded: completion.coinsAwarded,
              isCorrect: completion.isCorrect,
            }
          : null,
        rating: rating
          ? {
              rating: rating.rating,
              comment: rating.comment,
            }
          : null,
        resources: lesson.resources.map((resource) => ({
          id: resource.id,
          title: resource.title,
          description: resource.description,
          kind: resource.kind,
          url: resource.url,
        })),
      };

      previousLessonsCompleted = previousLessonsCompleted && completed;
      return lessonView;
    });

    const completedInCourse = lessons.filter((lesson) => lesson.completed).length;
    const courseCompleted = lessons.length === 0 || completedInCourse === lessons.length;

    if (courseCompleted) {
      completedCourses += 1;
    }

    previousCoursesCompleted = previousCoursesCompleted && courseCompleted;

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      department: course.department,
      departmentLabel: getDepartmentLabel(course.department),
      isGlobal: course.isGlobal,
      allowedDepartments: course.allowedDepartments,
      allowedDepartmentLabels: course.allowedDepartments.map((department) =>
        getDepartmentLabel(department),
      ),
      isLocked: !courseUnlocked,
      completedLessons: completedInCourse,
      totalLessons: lessons.length,
      resources: course.resources.map((resource) => ({
        id: resource.id,
        title: resource.title,
        description: resource.description,
        kind: resource.kind,
        url: resource.url,
      })),
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
      totalCourses: courseViews.length,
      completedCourses,
      totalLessons,
      completedLessons,
      availablePoints,
      availableCoins,
    },
    resources: resources.map((resource) => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      kind: resource.kind,
      url: resource.url,
      department: resource.department,
      departmentLabel: getDepartmentLabel(resource.department),
      isGlobal: resource.isGlobal,
      courseId: resource.courseId,
      lessonId: resource.lessonId,
    })),
  });
}
