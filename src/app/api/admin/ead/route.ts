import { Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import { departmentValues, getDepartmentLabel } from "@/lib/departments";
import { normalizeQuizOptions } from "@/lib/ead";
import { prisma } from "@/lib/prisma";

const departmentSchema = z.enum(departmentValues);
const lessonKindSchema = z.enum(["VIDEO", "PDF", "TUTORIAL"]);
const resourceKindSchema = z.enum(["PDF", "DOCUMENT", "LINK", "VIDEO"]);

const createCourseSchema = z.object({
  type: z.literal("course"),
  department: departmentSchema,
  title: z.string().min(2).max(160),
  description: z.string().min(2).max(500),
  isGlobal: z.boolean().optional(),
  allowedDepartments: z.array(departmentSchema).optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
});

const createLessonSchema = z.object({
  type: z.literal("lesson"),
  courseId: z.string().min(1),
  title: z.string().min(2).max(160),
  description: z.string().min(2).max(800),
  kind: lessonKindSchema,
  videoUrl: z.string().max(1000).optional(),
  materialUrl: z.string().max(1000).optional(),
  durationMinutes: z.number().int().min(1).max(600).optional(),
  quizQuestion: z.string().max(300).optional(),
  quizOptions: z.array(z.string().min(1).max(160)).max(6).optional(),
  correctAnswerIndex: z.number().int().min(0).max(5).optional(),
  pointsReward: z.number().int().min(0).max(5000).optional(),
  coinsReward: z.number().int().min(0).max(5000).optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
});

const createResourceSchema = z.object({
  type: z.literal("resource"),
  title: z.string().min(2).max(160),
  description: z.string().max(500).optional(),
  kind: resourceKindSchema,
  url: z.string().min(3).max(1000),
  department: departmentSchema,
  allowedDepartments: z.array(departmentSchema).optional(),
  isGlobal: z.boolean().optional(),
  courseId: z.string().min(1).nullable().optional(),
  lessonId: z.string().min(1).nullable().optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
});

const createEadSchema = z.union([createCourseSchema, createLessonSchema, createResourceSchema]);

const updateCourseSchema = z.object({
  entity: z.literal("course"),
  id: z.string().min(1),
  department: departmentSchema.optional(),
  title: z.string().min(2).max(160).optional(),
  description: z.string().min(2).max(500).optional(),
  isGlobal: z.boolean().optional(),
  allowedDepartments: z.array(departmentSchema).optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
  isPublished: z.boolean().optional(),
});

const updateLessonSchema = z.object({
  entity: z.literal("lesson"),
  id: z.string().min(1),
  courseId: z.string().min(1).optional(),
  title: z.string().min(2).max(160).optional(),
  description: z.string().min(2).max(800).optional(),
  kind: lessonKindSchema.optional(),
  videoUrl: z.string().max(1000).nullable().optional(),
  materialUrl: z.string().max(1000).nullable().optional(),
  durationMinutes: z.number().int().min(1).max(600).nullable().optional(),
  quizQuestion: z.string().max(300).nullable().optional(),
  quizOptions: z.array(z.string().min(1).max(160)).max(6).nullable().optional(),
  correctAnswerIndex: z.number().int().min(0).max(5).nullable().optional(),
  pointsReward: z.number().int().min(0).max(5000).optional(),
  coinsReward: z.number().int().min(0).max(5000).optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
  isPublished: z.boolean().optional(),
});

const updateResourceSchema = z.object({
  entity: z.literal("resource"),
  id: z.string().min(1),
  title: z.string().min(2).max(160).optional(),
  description: z.string().max(500).nullable().optional(),
  kind: resourceKindSchema.optional(),
  url: z.string().min(3).max(1000).optional(),
  department: departmentSchema.optional(),
  allowedDepartments: z.array(departmentSchema).optional(),
  isGlobal: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  courseId: z.string().min(1).nullable().optional(),
  lessonId: z.string().min(1).nullable().optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
});

const updateEadSchema = z.union([updateCourseSchema, updateLessonSchema, updateResourceSchema]);

const deleteEadSchema = z.object({
  entity: z.enum(["course", "lesson", "resource"]),
  id: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const courses = await prisma.eadCourse.findMany({
    orderBy: [{ department: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      lessons: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          ratings: {
            select: {
              rating: true,
              comment: true,
              createdAt: true,
              user: {
                select: {
                  name: true,
                  department: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          _count: {
            select: {
              completions: true,
              ratings: true,
            },
          },
        },
      },
      resources: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      _count: {
        select: {
          lessons: true,
        },
      },
    },
  });

  const resources = await prisma.eadResource.findMany({
    orderBy: [{ department: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      course: {
        select: {
          title: true,
        },
      },
      lesson: {
        select: {
          title: true,
        },
      },
      createdBy: {
        select: {
          name: true,
        },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    courses: courses.map((course) => ({
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
      isPublished: course.isPublished,
      sortOrder: course.sortOrder,
      createdAtIso: course.createdAt.toISOString(),
      lessonCount: course._count.lessons,
      lessons: course.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        kind: lesson.kind,
        videoUrl: lesson.videoUrl,
        materialUrl: lesson.materialUrl,
        durationMinutes: lesson.durationMinutes,
        quizQuestion: lesson.quizQuestion,
        quizOptions: normalizeQuizOptions(lesson.quizOptions),
        correctAnswerIndex: lesson.correctAnswerIndex,
        pointsReward: lesson.pointsReward,
        coinsReward: lesson.coinsReward,
        isPublished: lesson.isPublished,
        sortOrder: lesson.sortOrder,
        completionCount: lesson._count.completions,
        ratingCount: lesson._count.ratings,
        averageRating:
          lesson.ratings.length > 0
            ? Math.round(
                (lesson.ratings.reduce((sum, rating) => sum + rating.rating, 0) /
                  lesson.ratings.length) *
                  10,
              ) / 10
            : null,
        lowRatingComments: lesson.ratings
          .filter((rating) => rating.rating <= 2 && rating.comment)
          .slice(0, 5)
          .map((rating) => ({
            rating: rating.rating,
            comment: rating.comment,
            userName: rating.user.name,
            departmentLabel: getDepartmentLabel(rating.user.department),
            createdAtIso: rating.createdAt.toISOString(),
          })),
      })),
      resources: course.resources.map((resource) => ({
        id: resource.id,
        title: resource.title,
        description: resource.description,
        kind: resource.kind,
        url: resource.url,
        department: resource.department,
        departmentLabel: getDepartmentLabel(resource.department),
        allowedDepartments: resource.allowedDepartments,
        allowedDepartmentLabels: resource.allowedDepartments.map((department) =>
          getDepartmentLabel(department),
        ),
        isGlobal: resource.isGlobal,
        isPublished: resource.isPublished,
        courseId: resource.courseId,
        lessonId: resource.lessonId,
        sortOrder: resource.sortOrder,
        createdAtIso: resource.createdAt.toISOString(),
      })),
    })),
    resources: resources.map((resource) => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      kind: resource.kind,
      url: resource.url,
      department: resource.department,
      departmentLabel: getDepartmentLabel(resource.department),
      allowedDepartments: resource.allowedDepartments,
      allowedDepartmentLabels: resource.allowedDepartments.map((department) =>
        getDepartmentLabel(department),
      ),
      isGlobal: resource.isGlobal,
      isPublished: resource.isPublished,
      courseId: resource.courseId,
      courseTitle: resource.course?.title ?? null,
      lessonId: resource.lessonId,
      lessonTitle: resource.lesson?.title ?? null,
      sortOrder: resource.sortOrder,
      createdByName: resource.createdBy?.name ?? null,
      createdAtIso: resource.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const parsed = createEadSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Dados invalidos para o EAD.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    if (parsed.data.type === "course") {
      const course = await prisma.eadCourse.create({
        data: {
          department: parsed.data.department,
          title: parsed.data.title.trim(),
          description: parsed.data.description.trim(),
          isGlobal: parsed.data.isGlobal ?? false,
          allowedDepartments: parsed.data.allowedDepartments ?? [],
          sortOrder: parsed.data.sortOrder ?? 0,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorId: auth.session.sub,
          action: "CREATE",
          entity: "EAD_COURSE",
          entityId: course.id,
          metadata: {
            department: course.department,
            isGlobal: course.isGlobal,
            allowedDepartments: course.allowedDepartments,
            title: course.title,
          } as Prisma.InputJsonObject,
        },
      });

      return NextResponse.json({ ok: true, course });
    }

    if (parsed.data.type === "resource") {
      const resource = await prisma.eadResource.create({
        data: {
          title: parsed.data.title.trim(),
          description: parsed.data.description?.trim() || null,
          kind: parsed.data.kind,
          url: parsed.data.url.trim(),
          department: parsed.data.department,
          allowedDepartments: parsed.data.allowedDepartments ?? [],
          isGlobal: parsed.data.isGlobal ?? false,
          courseId: parsed.data.courseId ?? null,
          lessonId: parsed.data.lessonId ?? null,
          sortOrder: parsed.data.sortOrder ?? 0,
          createdById: auth.session.sub,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorId: auth.session.sub,
          action: "CREATE",
          entity: "EAD_RESOURCE",
          entityId: resource.id,
          metadata: {
            department: resource.department,
            isGlobal: resource.isGlobal,
            allowedDepartments: resource.allowedDepartments,
            title: resource.title,
          } as Prisma.InputJsonObject,
        },
      });

      return NextResponse.json({ ok: true, resource });
    }

    const lastLesson = await prisma.eadLesson.findFirst({
      where: { courseId: parsed.data.courseId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const lesson = await prisma.eadLesson.create({
      data: {
        courseId: parsed.data.courseId,
        title: parsed.data.title.trim(),
        description: parsed.data.description.trim(),
        kind: parsed.data.kind,
        videoUrl: parsed.data.videoUrl?.trim() || null,
        materialUrl: parsed.data.materialUrl?.trim() || null,
        durationMinutes: parsed.data.durationMinutes ?? null,
        quizQuestion: parsed.data.quizQuestion?.trim() || null,
        quizOptions: parsed.data.quizOptions?.length
          ? (parsed.data.quizOptions as Prisma.InputJsonArray)
          : Prisma.JsonNull,
        correctAnswerIndex:
          parsed.data.correctAnswerIndex !== undefined
            ? parsed.data.correctAnswerIndex
            : null,
        pointsReward: parsed.data.pointsReward ?? 20,
        coinsReward: parsed.data.coinsReward ?? 5,
        sortOrder: parsed.data.sortOrder ?? (lastLesson?.sortOrder ?? 0) + 1,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: auth.session.sub,
        action: "CREATE",
        entity: "EAD_LESSON",
        entityId: lesson.id,
        metadata: {
          courseId: lesson.courseId,
          kind: lesson.kind,
          pointsReward: lesson.pointsReward,
          coinsReward: lesson.coinsReward,
        } as Prisma.InputJsonObject,
      },
    });

    return NextResponse.json({ ok: true, lesson });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { ok: false, error: "Ja existe um item de EAD com este titulo." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { ok: false, error: "Nao foi possivel salvar o item de EAD." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const parsed = updateEadSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Dados invalidos para atualizar EAD.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    if (parsed.data.entity === "course") {
      const course = await prisma.eadCourse.update({
        where: { id: parsed.data.id },
        data: {
          ...(parsed.data.department !== undefined
            ? { department: parsed.data.department }
            : {}),
          ...(parsed.data.title !== undefined
            ? { title: parsed.data.title.trim() }
            : {}),
          ...(parsed.data.description !== undefined
            ? { description: parsed.data.description.trim() }
            : {}),
          ...(parsed.data.isGlobal !== undefined
            ? { isGlobal: parsed.data.isGlobal }
            : {}),
          ...(parsed.data.allowedDepartments !== undefined
            ? { allowedDepartments: parsed.data.allowedDepartments }
            : {}),
          ...(parsed.data.sortOrder !== undefined
            ? { sortOrder: parsed.data.sortOrder }
            : {}),
          ...(parsed.data.isPublished !== undefined
            ? { isPublished: parsed.data.isPublished }
            : {}),
        },
      });

      return NextResponse.json({ ok: true, course });
    }

    if (parsed.data.entity === "resource") {
      const resource = await prisma.eadResource.update({
        where: { id: parsed.data.id },
        data: {
          ...(parsed.data.title !== undefined
            ? { title: parsed.data.title.trim() }
            : {}),
          ...(parsed.data.description !== undefined
            ? { description: parsed.data.description?.trim() || null }
            : {}),
          ...(parsed.data.kind !== undefined ? { kind: parsed.data.kind } : {}),
          ...(parsed.data.url !== undefined ? { url: parsed.data.url.trim() } : {}),
          ...(parsed.data.department !== undefined
            ? { department: parsed.data.department }
            : {}),
          ...(parsed.data.allowedDepartments !== undefined
            ? { allowedDepartments: parsed.data.allowedDepartments }
            : {}),
          ...(parsed.data.isGlobal !== undefined
            ? { isGlobal: parsed.data.isGlobal }
            : {}),
          ...(parsed.data.isPublished !== undefined
            ? { isPublished: parsed.data.isPublished }
            : {}),
          ...(parsed.data.courseId !== undefined
            ? { courseId: parsed.data.courseId }
            : {}),
          ...(parsed.data.lessonId !== undefined
            ? { lessonId: parsed.data.lessonId }
            : {}),
          ...(parsed.data.sortOrder !== undefined
            ? { sortOrder: parsed.data.sortOrder }
            : {}),
        },
      });

      return NextResponse.json({ ok: true, resource });
    }

    const lesson = await prisma.eadLesson.update({
      where: { id: parsed.data.id },
      data: {
        ...(parsed.data.courseId !== undefined
          ? { courseId: parsed.data.courseId }
          : {}),
        ...(parsed.data.title !== undefined
          ? { title: parsed.data.title.trim() }
          : {}),
        ...(parsed.data.description !== undefined
          ? { description: parsed.data.description.trim() }
          : {}),
        ...(parsed.data.kind !== undefined
          ? { kind: parsed.data.kind }
          : {}),
        ...(parsed.data.videoUrl !== undefined
          ? { videoUrl: parsed.data.videoUrl?.trim() || null }
          : {}),
        ...(parsed.data.materialUrl !== undefined
          ? { materialUrl: parsed.data.materialUrl?.trim() || null }
          : {}),
        ...(parsed.data.durationMinutes !== undefined
          ? { durationMinutes: parsed.data.durationMinutes }
          : {}),
        ...(parsed.data.quizQuestion !== undefined
          ? { quizQuestion: parsed.data.quizQuestion?.trim() || null }
          : {}),
        ...(parsed.data.quizOptions !== undefined
          ? {
              quizOptions: parsed.data.quizOptions?.length
                ? (parsed.data.quizOptions as Prisma.InputJsonArray)
                : Prisma.JsonNull,
            }
          : {}),
        ...(parsed.data.correctAnswerIndex !== undefined
          ? { correctAnswerIndex: parsed.data.correctAnswerIndex }
          : {}),
        ...(parsed.data.pointsReward !== undefined
          ? { pointsReward: parsed.data.pointsReward }
          : {}),
        ...(parsed.data.coinsReward !== undefined
          ? { coinsReward: parsed.data.coinsReward }
          : {}),
        ...(parsed.data.sortOrder !== undefined
          ? { sortOrder: parsed.data.sortOrder }
          : {}),
        ...(parsed.data.isPublished !== undefined
          ? { isPublished: parsed.data.isPublished }
          : {}),
      },
    });

    return NextResponse.json({ ok: true, lesson });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { ok: false, error: "Ja existe um item de EAD com este titulo." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { ok: false, error: "Nao foi possivel atualizar EAD." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const parsed = deleteEadSchema.safeParse({
    entity: request.nextUrl.searchParams.get("entity"),
    id: request.nextUrl.searchParams.get("id"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Dados invalidos para remover EAD.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    if (parsed.data.entity === "resource") {
      const resource = await prisma.eadResource.delete({
        where: { id: parsed.data.id },
      });

      await prisma.auditLog.create({
        data: {
          actorId: auth.session.sub,
          action: "DELETE",
          entity: "EAD_RESOURCE",
          entityId: resource.id,
          metadata: {
            department: resource.department,
            title: resource.title,
          } as Prisma.InputJsonObject,
        },
      });

      return NextResponse.json({ ok: true, resource });
    }

    if (parsed.data.entity === "course") {
      const completionCount = await prisma.eadLessonCompletion.count({
        where: {
          lesson: {
            courseId: parsed.data.id,
          },
        },
      });

      if (completionCount > 0) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Este curso ja possui conclusoes. Oculte o curso para preservar o historico dos usuarios.",
          },
          { status: 409 },
        );
      }

      const course = await prisma.eadCourse.delete({
        where: { id: parsed.data.id },
      });

      await prisma.auditLog.create({
        data: {
          actorId: auth.session.sub,
          action: "DELETE",
          entity: "EAD_COURSE",
          entityId: course.id,
          metadata: {
            department: course.department,
            isGlobal: course.isGlobal,
            title: course.title,
          } as Prisma.InputJsonObject,
        },
      });

      return NextResponse.json({ ok: true, course });
    }

    const completionCount = await prisma.eadLessonCompletion.count({
      where: { lessonId: parsed.data.id },
    });

    if (completionCount > 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Esta aula ja possui conclusoes. Oculte a aula para preservar o historico dos usuarios.",
        },
        { status: 409 },
      );
    }

    const lesson = await prisma.eadLesson.delete({
      where: { id: parsed.data.id },
    });

    await prisma.auditLog.create({
      data: {
        actorId: auth.session.sub,
        action: "DELETE",
        entity: "EAD_LESSON",
        entityId: lesson.id,
        metadata: {
          courseId: lesson.courseId,
          title: lesson.title,
        } as Prisma.InputJsonObject,
      },
    });

    return NextResponse.json({ ok: true, lesson });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { ok: false, error: "Item de EAD nao encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { ok: false, error: "Nao foi possivel remover EAD." },
      { status: 500 },
    );
  }
}
