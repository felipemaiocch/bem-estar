import type { Department, EadLessonKind, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type DefaultLesson = {
  title: string;
  description: string;
  kind: EadLessonKind;
  durationMinutes?: number;
  quizQuestion: string;
  quizOptions: string[];
  correctAnswerIndex: number;
  pointsReward: number;
  coinsReward: number;
  sortOrder: number;
};

const defaultEadCatalog: Array<{
  department: Department;
  title: string;
  description: string;
  sortOrder: number;
  lessons: DefaultLesson[];
}> = [
  {
    department: "COMERCIAL",
    title: "Fundamentos comerciais",
    description: "Trilha inicial para padronizar abordagem, proposta e passagem de bastao.",
    sortOrder: 1,
    lessons: [
      {
        title: "Como registrar uma oportunidade",
        description: "Passo a passo para organizar dados do cliente e proximo contato.",
        kind: "VIDEO",
        durationMinutes: 8,
        quizQuestion: "Qual e o primeiro registro obrigatorio de uma oportunidade?",
        quizOptions: ["Nome do cliente e contexto", "Apenas o telefone", "Somente o valor estimado"],
        correctAnswerIndex: 0,
        pointsReward: 30,
        coinsReward: 10,
        sortOrder: 1,
      },
      {
        title: "Checklist de proposta comercial",
        description: "Material de apoio para revisar proposta antes do envio.",
        kind: "PDF",
        durationMinutes: 5,
        quizQuestion: "Antes de enviar uma proposta, o time deve validar:",
        quizOptions: ["Escopo, prazo e proximo passo", "Apenas o layout", "Somente a assinatura"],
        correctAnswerIndex: 0,
        pointsReward: 20,
        coinsReward: 6,
        sortOrder: 2,
      },
    ],
  },
  {
    department: "FINANCEIRO",
    title: "Rotina financeira segura",
    description: "Treinamentos para conferencia, lancamentos e fluxo de solicitacoes.",
    sortOrder: 2,
    lessons: [
      {
        title: "Conferencia de lancamentos",
        description: "Como conferir dados essenciais antes de finalizar um lancamento.",
        kind: "VIDEO",
        durationMinutes: 7,
        quizQuestion: "O que precisa ser conferido antes de finalizar um lancamento?",
        quizOptions: ["Valor, centro de custo e comprovante", "Apenas o nome", "Somente a data"],
        correctAnswerIndex: 0,
        pointsReward: 30,
        coinsReward: 10,
        sortOrder: 1,
      },
      {
        title: "Tutorial de reembolso",
        description: "Fluxo padrao para solicitar, validar e registrar reembolsos.",
        kind: "TUTORIAL",
        durationMinutes: 6,
        quizQuestion: "Uma solicitacao de reembolso deve ter:",
        quizOptions: ["Comprovante e justificativa", "Mensagem informal", "Apenas aprovacao verbal"],
        correctAnswerIndex: 0,
        pointsReward: 20,
        coinsReward: 6,
        sortOrder: 2,
      },
    ],
  },
  {
    department: "ATENDIMENTO",
    title: "Padrao de atendimento",
    description: "Base para suporte, tom de voz, retorno e registro de demandas.",
    sortOrder: 3,
    lessons: [
      {
        title: "Primeira resposta ao cliente",
        description: "Como acolher, registrar e direcionar uma demanda de atendimento.",
        kind: "VIDEO",
        durationMinutes: 6,
        quizQuestion: "Na primeira resposta, o atendimento deve priorizar:",
        quizOptions: ["Acolhimento, registro e proximo passo", "Encerrar rapido", "Evitar registrar detalhes"],
        correctAnswerIndex: 0,
        pointsReward: 30,
        coinsReward: 10,
        sortOrder: 1,
      },
      {
        title: "Material de escalonamento",
        description: "Quando e como direcionar uma demanda para outra area.",
        kind: "PDF",
        durationMinutes: 5,
        quizQuestion: "Uma demanda deve ser escalonada quando:",
        quizOptions: ["Exige decisao ou area responsavel especifica", "Sempre que for simples", "Nunca"],
        correctAnswerIndex: 0,
        pointsReward: 20,
        coinsReward: 6,
        sortOrder: 2,
      },
    ],
  },
];

export async function ensureDefaultEadContent() {
  const count = await prisma.eadCourse.count();

  if (count > 0) {
    return;
  }

  for (const course of defaultEadCatalog) {
    const createdCourse = await prisma.eadCourse.upsert({
      where: {
        department_title: {
          department: course.department,
          title: course.title,
        },
      },
      update: {},
      create: {
        department: course.department,
        title: course.title,
        description: course.description,
        sortOrder: course.sortOrder,
      },
    });

    await prisma.eadLesson.createMany({
      data: course.lessons.map((lesson) => ({
        courseId: createdCourse.id,
        title: lesson.title,
        description: lesson.description,
        kind: lesson.kind,
        durationMinutes: lesson.durationMinutes,
        quizQuestion: lesson.quizQuestion,
        quizOptions: lesson.quizOptions as Prisma.InputJsonArray,
        correctAnswerIndex: lesson.correctAnswerIndex,
        pointsReward: lesson.pointsReward,
        coinsReward: lesson.coinsReward,
        sortOrder: lesson.sortOrder,
      })),
      skipDuplicates: true,
    });
  }
}

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
