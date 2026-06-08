"use client";

import {
  BookOpen,
  CheckCircle2,
  Coins,
  FileText,
  GraduationCap,
  Loader2,
  Lock,
  PlayCircle,
  Star,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type LessonKind = "VIDEO" | "PDF" | "TUTORIAL";
type ResourceKind = "PDF" | "DOCUMENT" | "LINK" | "VIDEO";

interface EadResource {
  id: string;
  title: string;
  description: string | null;
  kind: ResourceKind;
  url: string;
  department?: string;
  departmentLabel?: string;
  isGlobal?: boolean;
  courseId?: string | null;
  lessonId?: string | null;
}

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
  isLocked: boolean;
  completed: boolean;
  completion: {
    completedAtIso: string;
    pointsAwarded: number;
    coinsAwarded: number;
    isCorrect: boolean;
  } | null;
  rating: {
    rating: number;
    comment: string | null;
  } | null;
  resources: EadResource[];
}

interface EadCourse {
  id: string;
  title: string;
  description: string;
  department: string;
  departmentLabel: string;
  isGlobal: boolean;
  allowedDepartments: string[];
  allowedDepartmentLabels: string[];
  isLocked: boolean;
  completedLessons: number;
  totalLessons: number;
  progress: number;
  resources: EadResource[];
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
    totalCourses: number;
    completedCourses: number;
    totalLessons: number;
    completedLessons: number;
    availablePoints: number;
    availableCoins: number;
  };
  resources: EadResource[];
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
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [ratingValue, setRatingValue] = useState<number | null>(null);
  const [ratingComment, setRatingComment] = useState("");
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
      setSelectedDepartment(null);
      setSelectedCourseId(null);
      setSelectedLessonId(null);
      setRatingValue(null);
      setRatingComment("");
    } catch {
      setFeedback("Falha de conexao ao carregar o EAD.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEad();
  }, []);

  const departmentSections = useMemo(() => {
    if (!data) return [];

    const sections = new Map<
      string,
      {
        department: string;
        label: string;
        courseCount: number;
        lessonCount: number;
        resourceCount: number;
        globalCount: number;
      }
    >();

    data.courses.forEach((course) => {
      const current = sections.get(course.department) ?? {
        department: course.department,
        label: course.departmentLabel,
        courseCount: 0,
        lessonCount: 0,
        resourceCount: 0,
        globalCount: 0,
      };

      sections.set(course.department, {
        ...current,
        courseCount: current.courseCount + 1,
        lessonCount: current.lessonCount + course.totalLessons,
        resourceCount: current.resourceCount,
        globalCount: current.globalCount + (course.isGlobal ? 1 : 0),
      });
    });

    data.resources.forEach((resource) => {
      if (!resource.department || !resource.departmentLabel) return;
      const current = sections.get(resource.department) ?? {
        department: resource.department,
        label: resource.departmentLabel,
        courseCount: 0,
        lessonCount: 0,
        resourceCount: 0,
        globalCount: 0,
      };

      sections.set(resource.department, {
        ...current,
        resourceCount: current.resourceCount + 1,
      });
    });

    return Array.from(sections.values());
  }, [data]);

  const visibleCourses = useMemo(() => {
    if (!data || !selectedDepartment) return [];
    return data.courses.filter((course) => course.department === selectedDepartment);
  }, [data, selectedDepartment]);

  const visibleResources = useMemo(() => {
    if (!data || !selectedDepartment) return [];
    return data.resources.filter((resource) => resource.department === selectedDepartment);
  }, [data, selectedDepartment]);

  const selectedCourse = useMemo(() => {
    return (
      visibleCourses.find((course) => course.id === selectedCourseId && !course.isLocked) ??
      visibleCourses.find((course) => !course.isLocked) ??
      null
    );
  }, [visibleCourses, selectedCourseId]);

  const selectedLesson = useMemo(() => {
    return selectedCourse?.lessons.find((lesson) => lesson.id === selectedLessonId) ?? selectedCourse?.lessons[0] ?? null;
  }, [selectedCourse, selectedLessonId]);

  useEffect(() => {
    setRatingValue(selectedLesson?.rating?.rating ?? null);
    setRatingComment(selectedLesson?.rating?.comment ?? "");
  }, [selectedLesson?.id, selectedLesson?.rating?.comment, selectedLesson?.rating?.rating]);

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

  async function rateLesson() {
    if (!selectedLesson || ratingValue === null) return;

    setBusy(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/user/ead/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: selectedLesson.id,
          rating: ratingValue,
          comment: ratingComment || undefined,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        setFeedback(payload.error ?? "Nao foi possivel avaliar a aula.");
        return;
      }

      setFeedback(payload.message ?? "Avaliacao registrada.");
      await loadEad();
    } catch {
      setFeedback("Falha de conexao ao avaliar aula.");
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#0264af]">
            <GraduationCap size={16} />
            EAD
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            {selectedDepartment
              ? `Trilha de ${departmentSections.find((section) => section.department === selectedDepartment)?.label ?? "EAD"}`
              : "Departamentos EAD"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {selectedDepartment
              ? "Escolha um curso para acessar as aulas e materiais disponíveis."
              : data.user.department
                ? "Selecione um departamento para ver os cursos liberados para o seu perfil."
                : "Seu cadastro ainda nao possui departamento. Voce ainda pode acessar cursos liberados para todos os usuarios."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:min-w-[520px] md:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Cursos</p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {data.summary.completedCourses}/{data.summary.totalCourses}
            </p>
          </Card>
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

      {!selectedDepartment ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {departmentSections.map((section) => (
            <Card key={section.department} className="p-5 transition-all hover:border-[#0264af]/40 hover:shadow-lg">
              <button
                type="button"
                className="w-full text-left"
                onClick={() => {
                  const firstCourse =
                    data.courses.find((course) => course.department === section.department && !course.isLocked && course.progress < 100) ??
                    data.courses.find((course) => course.department === section.department && !course.isLocked) ??
                    null;

                  setSelectedDepartment(section.department);
                  setSelectedCourseId(firstCourse?.id ?? null);
                  setSelectedLessonId(firstCourse?.lessons[0]?.id ?? null);
                  setSelectedAnswerIndex(null);
                  setFeedback(null);
                }}
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0264af]">
                  <GraduationCap size={22} />
                </div>
                <h2 className="text-xl font-black text-slate-950">{section.label}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {section.courseCount} curso{section.courseCount === 1 ? "" : "s"} · {section.lessonCount} aula{section.lessonCount === 1 ? "" : "s"} · {section.resourceCount} documento{section.resourceCount === 1 ? "" : "s"}
                </p>
                {section.globalCount > 0 ? (
                  <span className="mt-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#0264af]">
                    {section.globalCount} liberado{section.globalCount === 1 ? "" : "s"} para todos
                  </span>
                ) : null}
              </button>
            </Card>
          ))}

          {departmentSections.length === 0 ? (
            <Card className="p-6 md:col-span-2 xl:col-span-3">
              <p className="text-sm text-slate-500">Nenhum curso EAD liberado para o seu perfil neste momento.</p>
            </Card>
          ) : null}
        </div>
      ) : null}

      {selectedDepartment ? (
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              setSelectedDepartment(null);
              setSelectedCourseId(null);
              setSelectedLessonId(null);
              setSelectedAnswerIndex(null);
            }}
          >
            Voltar aos departamentos
          </Button>
          {visibleCourses.map((course, courseIndex) => (
            <Card
              key={course.id}
              className={cn(
                "p-4 transition-colors",
                course.isLocked ? "bg-slate-50 opacity-80" : "",
                selectedCourse?.id === course.id ? "border-[#0264af]/40 bg-blue-50/40" : "",
              )}
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => {
                  if (course.isLocked) {
                    setFeedback("Conclua o curso anterior para liberar este curso.");
                    return;
                  }

                  setSelectedCourseId(course.id);
                  setSelectedLessonId(course.lessons[0]?.id ?? null);
                  setSelectedAnswerIndex(null);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-slate-950">{course.title}</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{course.description}</p>
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Curso {courseIndex + 1} de {visibleCourses.length} · {course.completedLessons}/{course.totalLessons} aulas
                    </p>
                    {course.isGlobal ? (
                      <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[#0264af]">
                        Liberado para todos
                      </span>
                    ) : null}
                  </div>
                  {course.isLocked ? (
                    <span className="flex items-center gap-1 rounded-full bg-slate-200 px-2 py-1 text-xs font-black text-slate-500">
                      <Lock size={12} />
                      Bloqueado
                    </span>
                  ) : (
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-[#0264af]">
                      {course.progress}%
                    </span>
                  )}
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-[#0264af]" style={{ width: `${course.progress}%` }} />
                </div>
              </button>

              {selectedCourse?.id === course.id && !course.isLocked ? (
                <div className="mt-4 space-y-2">
                  {course.lessons.map((lesson) => {
                    const Icon = kindIcon[lesson.kind];
                    const active = selectedLesson?.id === lesson.id;
                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => {
                          if (lesson.isLocked) {
                            setFeedback("Conclua a aula anterior para liberar esta aula.");
                            return;
                          }
                          setSelectedLessonId(lesson.id);
                          setSelectedAnswerIndex(null);
                          setFeedback(null);
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm transition-colors",
                          active
                            ? "border-[#0264af] bg-white text-[#0264af]"
                            : lesson.isLocked
                              ? "border-slate-100 bg-slate-50 text-slate-400"
                            : "border-slate-100 bg-white text-slate-600 hover:border-slate-200",
                        )}
                      >
                        <Icon size={18} />
                        <span className="flex-1 font-semibold">{lesson.title}</span>
                        {lesson.isLocked ? <Lock className="text-slate-400" size={16} /> : null}
                        {lesson.completed ? <CheckCircle2 className="text-emerald-500" size={18} /> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </Card>
          ))}

          <Card className="p-4">
            <h2 className="font-bold text-slate-950">Acervo</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Documentos e materiais liberados para este departamento.
            </p>
            <div className="mt-4 space-y-2">
              {visibleResources.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-[#0264af]/30 hover:text-[#0264af]"
                >
                  <FileText size={18} />
                  <span className="flex-1">{resource.title}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-500">
                    {resource.kind}
                  </span>
                </a>
              ))}
              {visibleResources.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-500">
                  Nenhum documento liberado ainda.
                </p>
              ) : null}
            </div>
          </Card>
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

                {selectedLesson.resources.length > 0 ? (
                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <h3 className="font-bold text-slate-950">Materiais desta aula</h3>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {selectedLesson.resources.map((resource) => (
                        <a
                          key={resource.id}
                          href={resource.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-[#0264af]/30 hover:text-[#0264af]"
                        >
                          <FileText size={18} />
                          <span className="flex-1">{resource.title}</span>
                          <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase text-slate-500">
                            {resource.kind}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                {selectedLesson.completed ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                      Aula concluida. Recompensa ja registrada no seu historico.
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <h3 className="font-bold text-slate-950">Avalie esta aula</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Sua nota ajuda a melhorar os proximos conteudos.
                      </p>
                      <div className="mt-3 flex gap-1">
                        {[0, 1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setRatingValue(value)}
                            className={cn(
                              "flex h-10 min-w-10 items-center justify-center rounded-xl border text-sm font-black transition-colors",
                              ratingValue === value
                                ? "border-amber-300 bg-amber-50 text-amber-600"
                                : "border-slate-200 bg-white text-slate-400 hover:border-amber-200 hover:text-amber-500",
                            )}
                          >
                            {value === 0 ? "0" : <Star size={17} className={ratingValue !== null && value <= ratingValue ? "fill-current" : ""} />}
                          </button>
                        ))}
                      </div>
                      {ratingValue !== null && ratingValue <= 2 ? (
                        <textarea
                          className="mt-3 min-h-20 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-[#0264af]"
                          maxLength={200}
                          placeholder="Conte em ate 200 caracteres o motivo da nota baixa."
                          value={ratingComment}
                          onChange={(event) => setRatingComment(event.target.value)}
                        />
                      ) : null}
                      <Button
                        className="mt-3"
                        disabled={ratingValue === null || busy || (ratingValue <= 2 && !ratingComment.trim())}
                        onClick={() => void rateLesson()}
                      >
                        Salvar avaliacao
                      </Button>
                    </div>
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
      ) : null}
    </div>
  );
}
