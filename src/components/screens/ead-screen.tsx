"use client";

import {
  BookOpen,
  CheckCircle2,
  Coins,
  FileText,
  GraduationCap,
  Loader2,
  PlayCircle,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type LessonKind = "VIDEO" | "PDF" | "TUTORIAL";

interface EadLesson {
  id: string;
  title: string;
  description: string;
  kind: LessonKind;
  videoUrl: string | null;
  materialUrl: string | null;
  durationMinutes: number | null;
  quizQuestion: string | null;
  quizOptions: string[];
  pointsReward: number;
  coinsReward: number;
  completed: boolean;
  completion: {
    completedAtIso: string;
    pointsAwarded: number;
    coinsAwarded: number;
    isCorrect: boolean;
  } | null;
}

interface EadCourse {
  id: string;
  title: string;
  description: string;
  departmentLabel: string;
  progress: number;
  lessons: EadLesson[];
}

interface EadPayload {
  ok: boolean;
  error?: string;
  user: {
    department: string | null;
    departmentLabel: string;
    departmentDescription: string;
    score: number;
    drCoins: number;
  };
  courses: EadCourse[];
  summary: {
    totalLessons: number;
    completedLessons: number;
    availablePoints: number;
    availableCoins: number;
  };
}

const kindLabel: Record<LessonKind, string> = {
  VIDEO: "Videoaula",
  PDF: "PDF",
  TUTORIAL: "Tutorial",
};

const kindIcon = {
  VIDEO: PlayCircle,
  PDF: FileText,
  TUTORIAL: BookOpen,
};

export function EadScreen() {
  const [data, setData] = useState<EadPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [videoEnded, setVideoEnded] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadEad() {
    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/user/ead", { cache: "no-store" });
      const payload = (await response.json()) as EadPayload;

      if (!response.ok || !payload.ok) {
        setFeedback(payload.error ?? "Nao foi possivel carregar o EAD.");
        return;
      }

      setData(payload);
      const firstCourse = payload.courses[0] ?? null;
      const firstLesson = firstCourse?.lessons[0] ?? null;
      setSelectedCourseId((current) => current ?? firstCourse?.id ?? null);
      setSelectedLessonId((current) => current ?? firstLesson?.id ?? null);
    } catch {
      setFeedback("Falha de conexao ao carregar o EAD.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEad();
  }, []);

  const selectedCourse = useMemo(() => {
    return data?.courses.find((course) => course.id === selectedCourseId) ?? data?.courses[0] ?? null;
  }, [data, selectedCourseId]);

  const selectedLesson = useMemo(() => {
    return selectedCourse?.lessons.find((lesson) => lesson.id === selectedLessonId) ?? selectedCourse?.lessons[0] ?? null;
  }, [selectedCourse, selectedLessonId]);

  const mustWatchVideo =
    selectedLesson?.kind === "VIDEO" &&
    Boolean(selectedLesson.videoUrl) &&
    !selectedLesson.completed;
  const canAnswerLesson =
    selectedLesson !== null &&
    !selectedLesson.completed &&
    (!mustWatchVideo || videoEnded[selectedLesson.id]);
  const requiresQuiz = Boolean(selectedLesson?.quizQuestion && selectedLesson.quizOptions.length > 0);
  const canSubmit =
    canAnswerLesson &&
    (!requiresQuiz || selectedAnswerIndex !== null) &&
    !busy;

  async function completeLesson() {
    if (!selectedLesson || !canSubmit) {
      return;
    }

    setBusy(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/user/ead/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: selectedLesson.id,
          selectedAnswerIndex: selectedAnswerIndex ?? undefined,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        setFeedback(payload.error ?? "Nao foi possivel concluir a aula.");
        return;
      }

      setFeedback(payload.message ?? "Aula concluida.");
      setSelectedAnswerIndex(null);
      await loadEad();
    } catch {
      setFeedback("Falha de conexao ao concluir aula.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando EAD...
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="p-6">
        <p className="text-sm text-slate-500">{feedback ?? "EAD indisponivel."}</p>
      </Card>
    );
  }

  if (!data.user.department) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0264af]">EAD</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Departamento pendente</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Seu cadastro ainda nao possui departamento. Peça para o administrador definir Comercial,
            Financeiro ou Atendimento para liberar os cursos corretos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#0264af]">
            <GraduationCap size={16} />
            EAD
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Trilha de {data.user.departmentLabel}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {data.user.departmentDescription}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:min-w-[420px]">
          <Card className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Aulas</p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {data.summary.completedLessons}/{data.summary.totalLessons}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pontos</p>
            <p className="mt-2 flex items-center gap-1 text-2xl font-black text-[#0264af]">
              <Trophy size={18} />
              {data.user.score}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Drcoins</p>
            <p className="mt-2 flex items-center gap-1 text-2xl font-black text-amber-600">
              <Coins size={18} />
              {data.user.drCoins}
            </p>
          </Card>
        </div>
      </div>

      {feedback ? (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
          {feedback}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          {data.courses.map((course) => (
            <Card
              key={course.id}
              className={cn(
                "p-4 transition-colors",
                selectedCourse?.id === course.id ? "border-[#0264af]/40 bg-blue-50/40" : "",
              )}
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => {
                  setSelectedCourseId(course.id);
                  setSelectedLessonId(course.lessons[0]?.id ?? null);
                  setSelectedAnswerIndex(null);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-slate-950">{course.title}</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{course.description}</p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-[#0264af]">
                    {course.progress}%
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-[#0264af]" style={{ width: `${course.progress}%` }} />
                </div>
              </button>

              {selectedCourse?.id === course.id ? (
                <div className="mt-4 space-y-2">
                  {course.lessons.map((lesson) => {
                    const Icon = kindIcon[lesson.kind];
                    const active = selectedLesson?.id === lesson.id;
                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => {
                          setSelectedLessonId(lesson.id);
                          setSelectedAnswerIndex(null);
                          setFeedback(null);
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm transition-colors",
                          active
                            ? "border-[#0264af] bg-white text-[#0264af]"
                            : "border-slate-100 bg-white text-slate-600 hover:border-slate-200",
                        )}
                      >
                        <Icon size={18} />
                        <span className="flex-1 font-semibold">{lesson.title}</span>
                        {lesson.completed ? <CheckCircle2 className="text-emerald-500" size={18} /> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden">
          {selectedLesson ? (
            <div>
              <div className="border-b border-slate-100 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                      {kindLabel[selectedLesson.kind]}
                    </span>
                    <h2 className="mt-3 text-2xl font-black text-slate-950">{selectedLesson.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{selectedLesson.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-black text-[#0264af]">
                      +{selectedLesson.pointsReward} pts
                    </span>
                    <span className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-black text-amber-700">
                      +{selectedLesson.coinsReward} drcoins
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-5">
                {selectedLesson.kind === "VIDEO" ? (
                  selectedLesson.videoUrl ? (
                    <video
                      className="aspect-video w-full rounded-2xl bg-slate-950"
                      controls
                      controlsList="nodownload noplaybackrate"
                      disablePictureInPicture
                      preload="metadata"
                      onEnded={() =>
                        setVideoEnded((current) => ({ ...current, [selectedLesson.id]: true }))
                      }
                      onContextMenu={(event) => event.preventDefault()}
                    >
                      <source src={selectedLesson.videoUrl} />
                      Seu navegador nao suporta reproducao de video.
                    </video>
                  ) : (
                    <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
                      <PlayCircle className="mb-3 h-10 w-10 text-slate-300" />
                      <p className="text-sm font-bold text-slate-600">Videoaula ainda sem arquivo vinculado.</p>
                      <p className="mt-1 text-xs text-slate-400">O admin pode adicionar a URL do video no EAD.</p>
                    </div>
                  )
                ) : null}

                {selectedLesson.kind !== "VIDEO" ? (
                  selectedLesson.materialUrl ? (
                    <iframe
                      className="h-[460px] w-full rounded-2xl border border-slate-200"
                      src={selectedLesson.materialUrl}
                      title={selectedLesson.title}
                    />
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                      <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                      <p className="text-sm font-bold text-slate-600">Material ainda sem arquivo vinculado.</p>
                      <p className="mt-1 text-xs text-slate-400">O admin pode adicionar a URL do PDF ou tutorial no EAD.</p>
                    </div>
                  )
                ) : null}

                {selectedLesson.completed ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                    Aula concluida. Recompensa ja registrada no seu historico.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    {mustWatchVideo && !videoEnded[selectedLesson.id] ? (
                      <p className="mb-4 text-sm font-semibold text-slate-500">
                        Assista ao video ate o fim para liberar a pergunta.
                      </p>
                    ) : null}

                    {requiresQuiz ? (
                      <div>
                        <h3 className="font-bold text-slate-950">{selectedLesson.quizQuestion}</h3>
                        <div className="mt-3 grid gap-2">
                          {selectedLesson.quizOptions.map((option, index) => (
                            <button
                              key={option}
                              type="button"
                              disabled={!canAnswerLesson}
                              onClick={() => setSelectedAnswerIndex(index)}
                              className={cn(
                                "rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                                selectedAnswerIndex === index
                                  ? "border-[#0264af] bg-blue-50 text-[#0264af]"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                              )}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-slate-500">
                        Esta aula nao possui pergunta cadastrada. Voce pode concluir apos revisar o conteudo.
                      </p>
                    )}

                    <Button className="mt-4" disabled={!canSubmit} onClick={() => void completeLesson()}>
                      {busy ? "Registrando..." : "Concluir aula"}
                      <CheckCircle2 size={18} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">Nenhuma aula cadastrada para esta trilha.</div>
          )}
        </Card>
      </div>
    </div>
  );
}
