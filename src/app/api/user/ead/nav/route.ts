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

  if (!user?.department) {
    return NextResponse.json({
      ok: true,
      departments: [],
    });
  }

  const courses = await prisma.eadCourse.findMany({
    where: {
      department: user.department,
      isPublished: true,
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
    },
  });

  return NextResponse.json({
    ok: true,
    departments:
      courses.length > 0
        ? [
            {
              department: user.department,
              label: getDepartmentLabel(user.department),
              courseCount: courses.length,
              courses,
            },
          ]
        : [],
  });
}
