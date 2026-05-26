import type { Prisma } from "@prisma/client";

export function normalizeQuizOptions(value: Prisma.JsonValue | null) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((option): option is string => typeof option === "string");
}

export function isLessonAnswerCorrect(
  correctAnswerIndex: number | null,
  selectedAnswerIndex: number | null | undefined,
) {
  if (correctAnswerIndex === null) {
    return true;
  }

  return selectedAnswerIndex === correctAnswerIndex;
}
