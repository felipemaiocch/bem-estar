import { NextResponse, type NextRequest } from "next/server";

import { requireSession } from "@/lib/api-auth";
import { getDepartmentLabel } from "@/lib/departments";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.session.sub },
    select: {
      department: true,
    },
  });

  const courses = await prisma.eadCourse.findMany({
    where: {
      OR: [
        ...(user?.department ? [{ department: user.department }] : []),
        { isGlobal: true },
      ],
      isPublished: true,
    },
    select: {
      department: true,
      _count: {
        select: {
          lessons: true,
        },
      },
    },
  });

  const departments = Array.from(
    courses.reduce((acc, course) => {
      const current = acc.get(course.department) ?? { courseCount: 0, lessonCount: 0 };
      acc.set(course.department, {
        courseCount: current.courseCount + 1,
        lessonCount: current.lessonCount + course._count.lessons,
      });
      return acc;
    }, new Map<string, { courseCount: number; lessonCount: number }>()),
  ).map(([department, counts]) => ({
    department,
    label: getDepartmentLabel(department),
    ...counts,
  }));

  return NextResponse.json({
    ok: true,
    departments,
  });
}
