"use client";

import { BookOpen, CheckCircle2, FileText, GraduationCap, Loader2, PlayCircle, Power } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { BackofficeShell } from "@/components/layout/backoffice-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { departmentOptions, type DepartmentCode } from "@/lib/departments";
import { cn } from "@/lib/utils";

type LessonKind = "VIDEO" | "PDF" | "TUTORIAL";

interface AdminEadLesson {
  id: string;
  title: string;
  description: string;
  kind: LessonKind;
  videoUrl: string | null;
  materialUrl: string | null;
  durationMinutes: number | null;
  quizQuestion: string | null;
  quizOptions: string[];
  correctAnswerIndex: number | null;
  pointsReward: number;
  coinsReward: number;
  isPublished: boolean;
  completionCount: number;
}

interface AdminEadCourse {
  id: string;
  title: string;
  description: string;
  department: DepartmentCode;
  departmentLabel: string;
  isPublished: boolean;
  lessonCount: number;
  lessons: AdminEadLesson[];
}

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-[#0264af] focus:bg-white";

const defaultCourseForm = {
  title: "",
  description: "",
  department: "COMERCIAL" as DepartmentCode,
};

const defaultLessonForm = {
  courseId: "",
  title: "",
  description: "",
  kind: "VIDEO" as LessonKind,
  videoUrl: "",
  materialUrl: "",
  durationMinutes: "",
  quizQuestion: "",
  quizOptions: "Sim\nNao\nNao sei",
  correctAnswerIndex: "0",
  pointsReward: "20",
  coinsReward: "5",
};

const lessonKindIcon = {
  VIDEO: PlayCircle,
  PDF: FileText,
  TUTORIAL: BookOpen,
};

function getAdminEadErrorMessage(
  response: Response,
  error: string | undefined,
  fallback: string,
) {
  if (response.status === 401 || response.status === 403) {
    return "Sua sessão atual não é de administrador. Se você testou como colaborador em outra aba, entre novamente como admin ou use uma janela anônima para testar o usuário.";
  }

  return error ?? fallback;
}

export function AdminEadScreen() {
  const [courses, setCourses] = useState<AdminEadCourse[]>([]);
  const [courseForm, setCourseForm] = useState(defaultCourseForm);
  const [lessonForm, setLessonForm] = useState(defaultLessonForm);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentCode | "TODOS">("TODOS");

  async function loadEad() {
    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/ead", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFeedback(getAdminEadErrorMessage(response, data.error, "Nao foi possivel carregar o EAD."));
        return;
      }

      const loadedCourses = (data.courses ?? []) as AdminEadCourse[];
      setCourses(loadedCourses);
      setLessonForm((current) => ({
        ...current,
        courseId: current.courseId || loadedCourses[0]?.id || "",
      }));
    } catch {
      setFeedback("Falha de conexao ao carregar EAD.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEad();
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => departmentFilter === "TODOS" || course.department === departmentFilter);
  }, [courses, departmentFilter]);

  const coursesByDepartment = useMemo(() => {
    return departmentOptions.reduce(
      (acc, department) => ({
        ...acc,
        [department.value]: courses.filter((course) => course.department === department.value),
      }),
      {} as Record<DepartmentCode, AdminEadCourse[]>,
    );
  }, [courses]);

  async function createCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyAction) return;

    setBusyAction("create-course");
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/ead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          type: "course",
          title: courseForm.title,
          description: courseForm.description,
          department: courseForm.department,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFeedback(getAdminEadErrorMessage(response, data.error, "Nao foi possivel criar curso."));
        return;
      }

      setCourseForm(defaultCourseForm);
      setFeedback("Curso criado com sucesso.");
      await loadEad();
    } catch {
      setFeedback("Falha de conexao ao criar curso.");
    } finally {
      setBusyAction(null);
    }
  }

  async function createLesson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyAction) return;

    const quizOptions = lessonForm.quizOptions
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean);

    setBusyAction("create-lesson");
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/ead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          type: "lesson",
          courseId: lessonForm.courseId,
          title: lessonForm.title,
          description: lessonForm.description,
          kind: lessonForm.kind,
          videoUrl: lessonForm.videoUrl || undefined,
          materialUrl: lessonForm.materialUrl || undefined,
          durationMinutes: lessonForm.durationMinutes ? Number(lessonForm.durationMinutes) : undefined,
          quizQuestion: lessonForm.quizQuestion || undefined,
          quizOptions,
          correctAnswerIndex: Number(lessonForm.correctAnswerIndex),
          pointsReward: Number(lessonForm.pointsReward),
          coinsReward: Number(lessonForm.coinsReward),
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFeedback(getAdminEadErrorMessage(response, data.error, "Nao foi possivel criar aula."));
        return;
      }

      setLessonForm((current) => ({
        ...defaultLessonForm,
        courseId: current.courseId,
      }));
      setFeedback("Aula criada com sucesso.");
      await loadEad();
    } catch {
      setFeedback("Falha de conexao ao criar aula.");
    } finally {
      setBusyAction(null);
    }
  }

  async function togglePublished(entity: "course" | "lesson", id: string, isPublished: boolean) {
    if (busyAction) return;

    setBusyAction(`${entity}-${id}`);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/ead", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          entity,
          id,
          isPublished: !isPublished,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFeedback(getAdminEadErrorMessage(response, data.error, "Nao foi possivel atualizar EAD."));
        return;
      }

      await loadEad();
    } catch {
      setFeedback("Falha de conexao ao atualizar EAD.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <BackofficeShell
      badge="EAD"
      title="Cursos internos"
      description="Gerencie cursos, videoaulas, PDFs e tutoriais por departamento."
    >
      <div className="space-y-6">
        {feedback ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {feedback}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-[#0264af]" />
              <h2 className="text-lg font-bold text-slate-950">Novo curso</h2>
            </div>
            <form className="space-y-3" onSubmit={(event) => void createCourse(event)}>
              <select
                className={inputClassName}
                value={courseForm.department}
                onChange={(event) =>
                  setCourseForm((current) => ({
                    ...current,
                    department: event.target.value as DepartmentCode,
                  }))
                }
              >
                {departmentOptions.map((department) => (
                  <option key={department.value} value={department.value}>
                    {department.label}
                  </option>
                ))}
              </select>
              <input
                className={inputClassName}
                placeholder="Titulo do curso"
                value={courseForm.title}
                onChange={(event) =>
                  setCourseForm((current) => ({ ...current, title: event.target.value }))
                }
                required
              />
              <textarea
                className={cn(inputClassName, "min-h-24 resize-none")}
                placeholder="Descricao"
                value={courseForm.description}
                onChange={(event) =>
                  setCourseForm((current) => ({ ...current, description: event.target.value }))
                }
                required
              />
              <Button type="submit" disabled={busyAction === "create-course"}>
                {busyAction === "create-course" ? "Criando..." : "Criar curso"}
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-[#0264af]" />
              <h2 className="text-lg font-bold text-slate-950">Nova aula/material</h2>
            </div>
            <form className="grid gap-3 md:grid-cols-2" onSubmit={(event) => void createLesson(event)}>
              <select
                className={cn(inputClassName, "md:col-span-2")}
                value={lessonForm.courseId}
                onChange={(event) =>
                  setLessonForm((current) => ({ ...current, courseId: event.target.value }))
                }
                required
              >
                <option value="">Selecione o curso</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.departmentLabel} - {course.title}
                  </option>
                ))}
              </select>
              <select
                className={inputClassName}
                value={lessonForm.kind}
                onChange={(event) =>
                  setLessonForm((current) => ({
                    ...current,
                    kind: event.target.value as LessonKind,
                  }))
                }
              >
                <option value="VIDEO">Videoaula</option>
                <option value="PDF">PDF</option>
                <option value="TUTORIAL">Tutorial</option>
              </select>
              <input
                className={inputClassName}
                placeholder="Duracao em minutos"
                type="number"
                value={lessonForm.durationMinutes}
                onChange={(event) =>
                  setLessonForm((current) => ({ ...current, durationMinutes: event.target.value }))
                }
              />
              <input
                className={cn(inputClassName, "md:col-span-2")}
                placeholder="Titulo da aula"
                value={lessonForm.title}
                onChange={(event) =>
                  setLessonForm((current) => ({ ...current, title: event.target.value }))
                }
                required
              />
              <textarea
                className={cn(inputClassName, "min-h-20 resize-none md:col-span-2")}
                placeholder="Descricao"
                value={lessonForm.description}
                onChange={(event) =>
                  setLessonForm((current) => ({ ...current, description: event.target.value }))
                }
                required
              />
              <input
                className={inputClassName}
                placeholder="URL do video"
                value={lessonForm.videoUrl}
                onChange={(event) =>
                  setLessonForm((current) => ({ ...current, videoUrl: event.target.value }))
                }
              />
              <input
                className={inputClassName}
                placeholder="URL do PDF/material"
                value={lessonForm.materialUrl}
                onChange={(event) =>
                  setLessonForm((current) => ({ ...current, materialUrl: event.target.value }))
                }
              />
              <input
                className={cn(inputClassName, "md:col-span-2")}
                placeholder="Pergunta para liberar recompensa"
                value={lessonForm.quizQuestion}
                onChange={(event) =>
                  setLessonForm((current) => ({ ...current, quizQuestion: event.target.value }))
                }
              />
              <textarea
                className={cn(inputClassName, "min-h-24 resize-none md:col-span-2")}
                placeholder="Opcoes da pergunta, uma por linha"
                value={lessonForm.quizOptions}
                onChange={(event) =>
                  setLessonForm((current) => ({ ...current, quizOptions: event.target.value }))
                }
              />
              <input
                className={inputClassName}
                placeholder="Indice da resposta correta: 0, 1, 2..."
                type="number"
                value={lessonForm.correctAnswerIndex}
                onChange={(event) =>
                  setLessonForm((current) => ({ ...current, correctAnswerIndex: event.target.value }))
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  className={inputClassName}
                  placeholder="Pontos"
                  type="number"
                  value={lessonForm.pointsReward}
                  onChange={(event) =>
                    setLessonForm((current) => ({ ...current, pointsReward: event.target.value }))
                  }
                />
                <input
                  className={inputClassName}
                  placeholder="Drcoins"
                  type="number"
                  value={lessonForm.coinsReward}
                  onChange={(event) =>
                    setLessonForm((current) => ({ ...current, coinsReward: event.target.value }))
                  }
                />
              </div>
              <Button type="submit" disabled={busyAction === "create-lesson"}>
                {busyAction === "create-lesson" ? "Criando..." : "Criar aula"}
              </Button>
            </form>
          </Card>
        </div>

        <Card className="p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Cursos cadastrados</h2>
              <p className="text-sm text-slate-500">Somente usuarios do departamento correspondente veem esses cursos.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {departmentOptions.map((department) => (
                  <span
                    key={department.value}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"
                  >
                    {department.label}: {coursesByDepartment[department.value]?.length ?? 0}
                  </span>
                ))}
              </div>
            </div>
            <select
              className={cn(inputClassName, "md:w-56")}
              value={departmentFilter}
              onChange={(event) =>
                setDepartmentFilter(event.target.value as DepartmentCode | "TODOS")
              }
            >
              <option value="TODOS">Todos</option>
              {departmentOptions.map((department) => (
                <option key={department.value} value={department.value}>
                  {department.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex items-center rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Carregando cursos...
            </div>
          ) : null}

          <div className="space-y-4">
            {filteredCourses.map((course) => {
              const departmentCourses = coursesByDepartment[course.department] ?? [];
              const coursePosition = departmentCourses.findIndex((item) => item.id === course.id) + 1;

              return (
                <div key={course.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-950">{course.title}</h3>
                        <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[#0264af]">
                          {course.departmentLabel}
                        </span>
                        <span className={cn(
                          "rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wider",
                          course.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-500",
                        )}>
                          {course.isPublished ? "Publicado" : "Oculto"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{course.description}</p>
                      <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Curso {coursePosition} de {departmentCourses.length} em {course.departmentLabel}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={course.isPublished ? "outline" : "secondary"}
                      onClick={() => void togglePublished("course", course.id, course.isPublished)}
                      disabled={busyAction === `course-${course.id}`}
                    >
                      <Power size={14} />
                      {course.isPublished ? "Ocultar" : "Publicar"}
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {course.lessons.map((lesson) => {
                      const Icon = lessonKindIcon[lesson.kind];
                      return (
                        <div key={lesson.id} className="rounded-xl border border-white bg-white px-4 py-3">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Icon className="h-4 w-4 text-[#0264af]" />
                                <p className="font-bold text-slate-800">{lesson.title}</p>
                                {lesson.isPublished ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                ) : null}
                              </div>
                              <p className="mt-1 text-xs leading-5 text-slate-500">{lesson.description}</p>
                              <p className="mt-2 text-xs font-bold text-slate-400">
                                {lesson.completionCount} conclusao{lesson.completionCount === 1 ? "" : "es"} · +{lesson.pointsReward} pts · +{lesson.coinsReward} drcoins
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant={lesson.isPublished ? "outline" : "secondary"}
                              onClick={() => void togglePublished("lesson", lesson.id, lesson.isPublished)}
                              disabled={busyAction === `lesson-${lesson.id}`}
                            >
                              {lesson.isPublished ? "Ocultar" : "Publicar"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </BackofficeShell>
  );
}
