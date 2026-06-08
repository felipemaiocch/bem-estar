"use client";

import {
  BookOpen,
  CheckCircle2,
  FileText,
  GraduationCap,
  Loader2,
  Pencil,
  PlayCircle,
  Power,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { BackofficeShell } from "@/components/layout/backoffice-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { departmentOptions, type DepartmentCode } from "@/lib/departments";
import { cn } from "@/lib/utils";

type LessonKind = "VIDEO" | "PDF" | "TUTORIAL";
type ResourceKind = "PDF" | "DOCUMENT" | "LINK" | "VIDEO";

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
  sortOrder: number;
  completionCount: number;
  ratingCount: number;
  averageRating: number | null;
  lowRatingComments: Array<{
    rating: number;
    comment: string;
    userName: string;
    departmentLabel: string;
    createdAtIso: string;
  }>;
}

interface AdminEadResource {
  id: string;
  title: string;
  description: string | null;
  kind: ResourceKind;
  url: string;
  department: DepartmentCode;
  departmentLabel: string;
  allowedDepartments: DepartmentCode[];
  allowedDepartmentLabels: string[];
  isGlobal: boolean;
  isPublished: boolean;
  courseId: string | null;
  courseTitle?: string | null;
  lessonId: string | null;
  lessonTitle?: string | null;
  sortOrder: number;
  createdByName?: string | null;
  createdAtIso: string;
}

interface AdminEadCourse {
  id: string;
  title: string;
  description: string;
  department: DepartmentCode;
  departmentLabel: string;
  isGlobal: boolean;
  allowedDepartments: DepartmentCode[];
  allowedDepartmentLabels: string[];
  isPublished: boolean;
  sortOrder: number;
  createdAtIso: string;
  lessonCount: number;
  lessons: AdminEadLesson[];
  resources: AdminEadResource[];
}

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-[#0264af] focus:bg-white";

const defaultCourseForm = {
  title: "",
  description: "",
  department: "COMERCIAL" as DepartmentCode,
  isGlobal: false,
  allowedDepartments: [] as DepartmentCode[],
  sortOrder: "",
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
  sortOrder: "",
};

const defaultResourceForm = {
  title: "",
  description: "",
  kind: "PDF" as ResourceKind,
  url: "",
  department: "COMERCIAL" as DepartmentCode,
  isGlobal: false,
  allowedDepartments: [] as DepartmentCode[],
  courseId: "",
  lessonId: "",
  sortOrder: "",
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

function splitQuizOptions(options: string) {
  return options
    .split("\n")
    .map((option) => option.trim())
    .filter(Boolean);
}

function optionalNumber(value: string) {
  return value.trim() ? Number(value) : undefined;
}

function nullableNumber(value: string) {
  return value.trim() ? Number(value) : null;
}

export function AdminEadScreen() {
  const [courses, setCourses] = useState<AdminEadCourse[]>([]);
  const [resources, setResources] = useState<AdminEadResource[]>([]);
  const [courseForm, setCourseForm] = useState(defaultCourseForm);
  const [lessonForm, setLessonForm] = useState(defaultLessonForm);
  const [resourceForm, setResourceForm] = useState(defaultResourceForm);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentCode | "TODOS">("TODOS");
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [courseEditForm, setCourseEditForm] = useState(defaultCourseForm);
  const [lessonEditForm, setLessonEditForm] = useState(defaultLessonForm);

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
      setResources((data.resources ?? []) as AdminEadResource[]);
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

  const coursesByDepartment = useMemo(() => {
    return departmentOptions.reduce(
      (acc, department) => ({
        ...acc,
        [department.value]: courses.filter((course) => course.department === department.value),
      }),
      {} as Record<DepartmentCode, AdminEadCourse[]>,
    );
  }, [courses]);

  const visibleDepartmentSections = useMemo(() => {
    return departmentOptions
      .filter((department) => departmentFilter === "TODOS" || department.value === departmentFilter)
      .map((department) => ({
        ...department,
        courses: coursesByDepartment[department.value] ?? [],
      }));
  }, [coursesByDepartment, departmentFilter]);

  const eadReport = useMemo(() => {
    const lessons = courses.flatMap((course) => course.lessons);
    const completionCount = lessons.reduce((sum, lesson) => sum + lesson.completionCount, 0);
    const ratedLessons = lessons.filter((lesson) => lesson.averageRating !== null);
    const averageRating = ratedLessons.length
      ? Math.round(
          (ratedLessons.reduce((sum, lesson) => sum + (lesson.averageRating ?? 0), 0) /
            ratedLessons.length) *
            10,
        ) / 10
      : null;

    return {
      courses: courses.length,
      lessons: lessons.length,
      completionCount,
      ratingCount: lessons.reduce((sum, lesson) => sum + lesson.ratingCount, 0),
      averageRating,
      resources: resources.length,
    };
  }, [courses, resources]);

  function toggleDepartmentSelection(
    current: DepartmentCode[],
    department: DepartmentCode,
  ) {
    return current.includes(department)
      ? current.filter((item) => item !== department)
      : [...current, department];
  }

  function startEditCourse(course: AdminEadCourse) {
    setEditingCourseId(course.id);
    setEditingLessonId(null);
    setCourseEditForm({
      title: course.title,
      description: course.description,
      department: course.department,
      isGlobal: course.isGlobal,
      allowedDepartments: course.allowedDepartments ?? [],
      sortOrder: String(course.sortOrder),
    });
    setFeedback(null);
  }

  function startEditLesson(courseId: string, lesson: AdminEadLesson) {
    setEditingLessonId(lesson.id);
    setEditingCourseId(null);
    setLessonEditForm({
      courseId,
      title: lesson.title,
      description: lesson.description,
      kind: lesson.kind,
      videoUrl: lesson.videoUrl ?? "",
      materialUrl: lesson.materialUrl ?? "",
      durationMinutes: lesson.durationMinutes ? String(lesson.durationMinutes) : "",
      quizQuestion: lesson.quizQuestion ?? "",
      quizOptions: lesson.quizOptions.join("\n"),
      correctAnswerIndex:
        lesson.correctAnswerIndex !== null ? String(lesson.correctAnswerIndex) : "",
      pointsReward: String(lesson.pointsReward),
      coinsReward: String(lesson.coinsReward),
      sortOrder: String(lesson.sortOrder),
    });
    setFeedback(null);
  }

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
          isGlobal: courseForm.isGlobal,
          allowedDepartments: courseForm.allowedDepartments,
          sortOrder: optionalNumber(courseForm.sortOrder),
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

    const quizOptions = splitQuizOptions(lessonForm.quizOptions);

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
          sortOrder: optionalNumber(lessonForm.sortOrder),
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

  async function createResource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyAction) return;

    setBusyAction("create-resource");
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/ead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          type: "resource",
          title: resourceForm.title,
          description: resourceForm.description || undefined,
          kind: resourceForm.kind,
          url: resourceForm.url,
          department: resourceForm.department,
          isGlobal: resourceForm.isGlobal,
          allowedDepartments: resourceForm.allowedDepartments,
          courseId: resourceForm.courseId || null,
          lessonId: resourceForm.lessonId || null,
          sortOrder: optionalNumber(resourceForm.sortOrder),
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFeedback(getAdminEadErrorMessage(response, data.error, "Nao foi possivel criar documento."));
        return;
      }

      setResourceForm(defaultResourceForm);
      setFeedback("Documento adicionado ao acervo.");
      await loadEad();
    } catch {
      setFeedback("Falha de conexao ao criar documento.");
    } finally {
      setBusyAction(null);
    }
  }

  async function togglePublished(entity: "course" | "lesson" | "resource", id: string, isPublished: boolean) {
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

  async function updateCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyAction || !editingCourseId) return;

    setBusyAction(`edit-course-${editingCourseId}`);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/ead", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          entity: "course",
          id: editingCourseId,
          title: courseEditForm.title,
          description: courseEditForm.description,
          department: courseEditForm.department,
          isGlobal: courseEditForm.isGlobal,
          allowedDepartments: courseEditForm.allowedDepartments,
          sortOrder: optionalNumber(courseEditForm.sortOrder),
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFeedback(getAdminEadErrorMessage(response, data.error, "Nao foi possivel editar curso."));
        return;
      }

      setEditingCourseId(null);
      setFeedback("Curso atualizado com sucesso.");
      await loadEad();
    } catch {
      setFeedback("Falha de conexao ao editar curso.");
    } finally {
      setBusyAction(null);
    }
  }

  async function updateLesson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyAction || !editingLessonId) return;

    const quizOptions = splitQuizOptions(lessonEditForm.quizOptions);

    setBusyAction(`edit-lesson-${editingLessonId}`);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/ead", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          entity: "lesson",
          id: editingLessonId,
          courseId: lessonEditForm.courseId,
          title: lessonEditForm.title,
          description: lessonEditForm.description,
          kind: lessonEditForm.kind,
          videoUrl: lessonEditForm.videoUrl || null,
          materialUrl: lessonEditForm.materialUrl || null,
          durationMinutes: nullableNumber(lessonEditForm.durationMinutes),
          quizQuestion: lessonEditForm.quizQuestion || null,
          quizOptions: quizOptions.length ? quizOptions : null,
          correctAnswerIndex: nullableNumber(lessonEditForm.correctAnswerIndex),
          pointsReward: Number(lessonEditForm.pointsReward),
          coinsReward: Number(lessonEditForm.coinsReward),
          sortOrder: optionalNumber(lessonEditForm.sortOrder),
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFeedback(getAdminEadErrorMessage(response, data.error, "Nao foi possivel editar aula."));
        return;
      }

      setEditingLessonId(null);
      setFeedback("Aula atualizada com sucesso.");
      await loadEad();
    } catch {
      setFeedback("Falha de conexao ao editar aula.");
    } finally {
      setBusyAction(null);
    }
  }

  async function removeEadItem(entity: "course" | "lesson" | "resource", id: string, label: string) {
    if (busyAction) return;

    const confirmed = window.confirm(
      `Remover "${label}"? Essa acao so funciona para itens sem conclusao registrada.`,
    );

    if (!confirmed) {
      return;
    }

    setBusyAction(`remove-${entity}-${id}`);
    setFeedback(null);

    try {
      const params = new URLSearchParams({ entity, id });
      const response = await fetch(`/api/admin/ead?${params.toString()}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFeedback(getAdminEadErrorMessage(response, data.error, "Nao foi possivel remover EAD."));
        return;
      }

      if (entity === "course" && editingCourseId === id) {
        setEditingCourseId(null);
      }
      if (entity === "lesson" && editingLessonId === id) {
        setEditingLessonId(null);
      }

      setFeedback(entity === "course" ? "Curso removido com sucesso." : "Aula removida com sucesso.");
      await loadEad();
    } catch {
      setFeedback("Falha de conexao ao remover EAD.");
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

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {[
            ["Cursos", eadReport.courses],
            ["Aulas", eadReport.lessons],
            ["Conclusoes", eadReport.completionCount],
            ["Avaliacoes", eadReport.ratingCount],
            ["NPS medio", eadReport.averageRating ?? "-"],
            ["Acervo", eadReport.resources],
          ].map(([label, value]) => (
            <Card key={label} className="p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
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
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3">
                <span>
                  <span className="block text-sm font-bold text-slate-900">Liberar curso para todos</span>
                  <span className="block text-xs text-slate-500">Quando ativo, usuarios de qualquer departamento conseguem ver este curso.</span>
                </span>
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-[#0264af]"
                  checked={courseForm.isGlobal}
                  onChange={(event) =>
                    setCourseForm((current) => ({ ...current, isGlobal: event.target.checked }))
                  }
                />
              </label>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Departamentos extras que tambem podem assistir
                </p>
                <div className="flex flex-wrap gap-2">
                  {departmentOptions
                    .filter((department) => department.value !== courseForm.department)
                    .map((department) => {
                      const selected = courseForm.allowedDepartments.includes(department.value);
                      return (
                        <button
                          key={department.value}
                          type="button"
                          onClick={() =>
                            setCourseForm((current) => ({
                              ...current,
                              allowedDepartments: toggleDepartmentSelection(
                                current.allowedDepartments,
                                department.value,
                              ),
                            }))
                          }
                          className={cn(
                            "rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors",
                            selected
                              ? "border-[#0264af] bg-[#0264af] text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:border-[#0264af]/30",
                          )}
                        >
                          {department.label}
                        </button>
                      );
                    })}
                </div>
              </div>
              <input
                className={inputClassName}
                placeholder="Ordem na trilha: 1, 2, 3..."
                type="number"
                value={courseForm.sortOrder}
                onChange={(event) =>
                  setCourseForm((current) => ({ ...current, sortOrder: event.target.value }))
                }
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
                placeholder="URL do video ou YouTube nao listado"
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
              <input
                className={inputClassName}
                placeholder="Ordem da aula"
                type="number"
                value={lessonForm.sortOrder}
                onChange={(event) =>
                  setLessonForm((current) => ({ ...current, sortOrder: event.target.value }))
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

          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#0264af]" />
              <h2 className="text-lg font-bold text-slate-950">Novo documento da biblioteca</h2>
            </div>
            <form className="space-y-3" onSubmit={(event) => void createResource(event)}>
              <input
                className={inputClassName}
                placeholder="Titulo do documento"
                value={resourceForm.title}
                onChange={(event) =>
                  setResourceForm((current) => ({ ...current, title: event.target.value }))
                }
                required
              />
              <textarea
                className={cn(inputClassName, "min-h-20 resize-none")}
                placeholder="Descricao opcional"
                value={resourceForm.description}
                onChange={(event) =>
                  setResourceForm((current) => ({ ...current, description: event.target.value }))
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  className={inputClassName}
                  value={resourceForm.kind}
                  onChange={(event) =>
                    setResourceForm((current) => ({
                      ...current,
                      kind: event.target.value as ResourceKind,
                    }))
                  }
                >
                  <option value="PDF">PDF</option>
                  <option value="DOCUMENT">Documento</option>
                  <option value="LINK">Link</option>
                  <option value="VIDEO">Video</option>
                </select>
                <select
                  className={inputClassName}
                  value={resourceForm.department}
                  onChange={(event) =>
                    setResourceForm((current) => ({
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
              </div>
              <input
                className={inputClassName}
                placeholder="URL do PDF ou documento"
                value={resourceForm.url}
                onChange={(event) =>
                  setResourceForm((current) => ({ ...current, url: event.target.value }))
                }
                required
              />
              <select
                className={inputClassName}
                value={resourceForm.courseId}
                onChange={(event) =>
                  setResourceForm((current) => ({ ...current, courseId: event.target.value, lessonId: "" }))
                }
              >
                <option value="">Biblioteca geral do departamento</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.departmentLabel} - {course.title}
                  </option>
                ))}
              </select>
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3">
                <span>
                  <span className="block text-sm font-bold text-slate-900">Liberar documento para todos</span>
                  <span className="block text-xs text-slate-500">Quando ativo, aparece no acervo de qualquer usuário.</span>
                </span>
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-[#0264af]"
                  checked={resourceForm.isGlobal}
                  onChange={(event) =>
                    setResourceForm((current) => ({ ...current, isGlobal: event.target.checked }))
                  }
                />
              </label>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Departamentos extras
                </p>
                <div className="flex flex-wrap gap-2">
                  {departmentOptions
                    .filter((department) => department.value !== resourceForm.department)
                    .map((department) => {
                      const selected = resourceForm.allowedDepartments.includes(department.value);
                      return (
                        <button
                          key={department.value}
                          type="button"
                          onClick={() =>
                            setResourceForm((current) => ({
                              ...current,
                              allowedDepartments: toggleDepartmentSelection(
                                current.allowedDepartments,
                                department.value,
                              ),
                            }))
                          }
                          className={cn(
                            "rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors",
                            selected
                              ? "border-[#0264af] bg-[#0264af] text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:border-[#0264af]/30",
                          )}
                        >
                          {department.label}
                        </button>
                      );
                    })}
                </div>
              </div>
              <Button type="submit" disabled={busyAction === "create-resource"}>
                {busyAction === "create-resource" ? "Salvando..." : "Adicionar ao acervo"}
              </Button>
            </form>
          </Card>
        </div>

        <Card className="p-6">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Biblioteca cadastrada</h2>
              <p className="text-sm text-slate-500">Documentos visíveis no EAD por departamento. O usuário lê em modal dentro da plataforma.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {resources.length} item{resources.length === 1 ? "" : "s"}
            </span>
          </div>

          {resources.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              Nenhum documento cadastrado no acervo.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {resources.map((resource) => (
                <div key={resource.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-950">{resource.title}</h3>
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                          {resource.kind}
                        </span>
                        <span className={cn(
                          "rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wider",
                          resource.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-500",
                        )}>
                          {resource.isPublished ? "Publicado" : "Oculto"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {resource.description || "Sem descricao."}
                      </p>
                      <p className="mt-2 text-xs font-bold text-slate-400">
                        {resource.departmentLabel}
                        {resource.isGlobal ? " · todos usuarios" : ""}
                        {resource.allowedDepartmentLabels.length > 0
                          ? ` · extra: ${resource.allowedDepartmentLabels.join(", ")}`
                          : ""}
                      </p>
                      {resource.courseTitle ? (
                        <p className="mt-1 text-xs font-semibold text-[#0264af]">
                          Vinculado ao curso: {resource.courseTitle}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center justify-center rounded-xl bg-white px-3 text-xs font-semibold text-[#0264af] ring-1 ring-slate-200 hover:bg-blue-50"
                    >
                      Abrir
                    </a>
                    <Button
                      size="sm"
                      variant={resource.isPublished ? "outline" : "secondary"}
                      onClick={() => void togglePublished("resource", resource.id, resource.isPublished)}
                      disabled={busyAction === `resource-${resource.id}`}
                    >
                      <Power size={14} />
                      {resource.isPublished ? "Ocultar" : "Publicar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => void removeEadItem("resource", resource.id, resource.title)}
                      disabled={busyAction === `remove-resource-${resource.id}`}
                    >
                      <Trash2 size={14} />
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

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

          <div className="space-y-6">
            {visibleDepartmentSections.map((section) => (
              <section key={section.value} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-950">{section.label}</h3>
                    <p className="text-sm text-slate-500">
                      {section.courses.length} curso{section.courses.length === 1 ? "" : "s"} cadastrado{section.courses.length === 1 ? "" : "s"}.
                    </p>
                  </div>
                </div>

                {section.courses.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
                    Nenhum curso cadastrado neste departamento.
                  </div>
                ) : null}

                <div className="space-y-4">
                  {section.courses.map((course, courseIndex) => {
                    const isEditingCourse = editingCourseId === course.id;
                    const courseHasCompletions = course.lessons.some(
                      (lesson) => lesson.completionCount > 0,
                    );

                    return (
                      <div key={course.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                        {isEditingCourse ? (
                          <form className="grid gap-3 md:grid-cols-2" onSubmit={(event) => void updateCourse(event)}>
                            <select
                              className={inputClassName}
                              value={courseEditForm.department}
                              onChange={(event) =>
                                setCourseEditForm((current) => ({
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
                              placeholder="Ordem"
                              type="number"
                              value={courseEditForm.sortOrder}
                              onChange={(event) =>
                                setCourseEditForm((current) => ({
                                  ...current,
                                  sortOrder: event.target.value,
                                }))
                              }
                            />
                            <input
                              className={cn(inputClassName, "md:col-span-2")}
                              placeholder="Titulo do curso"
                              value={courseEditForm.title}
                              onChange={(event) =>
                                setCourseEditForm((current) => ({ ...current, title: event.target.value }))
                              }
                              required
                            />
                            <textarea
                              className={cn(inputClassName, "min-h-20 resize-none md:col-span-2")}
                              placeholder="Descricao"
                              value={courseEditForm.description}
                              onChange={(event) =>
                                setCourseEditForm((current) => ({
                                  ...current,
                                  description: event.target.value,
                                }))
                              }
                              required
                            />
                            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 md:col-span-2">
                              <span>
                                <span className="block text-sm font-bold text-slate-900">Liberar curso para todos</span>
                                <span className="block text-xs text-slate-500">Mantem o departamento para organizacao, mas libera acesso geral.</span>
                              </span>
                              <input
                                type="checkbox"
                                className="h-5 w-5 accent-[#0264af]"
                                checked={courseEditForm.isGlobal}
                                onChange={(event) =>
                                  setCourseEditForm((current) => ({
                                    ...current,
                                    isGlobal: event.target.checked,
                                  }))
                                }
                              />
                            </label>
                            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 md:col-span-2">
                              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                                Departamentos extras que tambem podem assistir
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {departmentOptions
                                  .filter((department) => department.value !== courseEditForm.department)
                                  .map((department) => {
                                    const selected = courseEditForm.allowedDepartments.includes(department.value);
                                    return (
                                      <button
                                        key={department.value}
                                        type="button"
                                        onClick={() =>
                                          setCourseEditForm((current) => ({
                                            ...current,
                                            allowedDepartments: toggleDepartmentSelection(
                                              current.allowedDepartments,
                                              department.value,
                                            ),
                                          }))
                                        }
                                        className={cn(
                                          "rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors",
                                          selected
                                            ? "border-[#0264af] bg-[#0264af] text-white"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-[#0264af]/30",
                                        )}
                                      >
                                        {department.label}
                                      </button>
                                    );
                                  })}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 md:col-span-2">
                              <Button type="submit" size="sm" disabled={busyAction === `edit-course-${course.id}`}>
                                <Save size={14} />
                                Salvar curso
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingCourseId(null)}
                              >
                                <X size={14} />
                                Cancelar
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-bold text-slate-950">{course.title}</h4>
                                <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[#0264af]">
                                  Curso {courseIndex + 1} de {section.courses.length}
                                </span>
                                <span className={cn(
                                  "rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wider",
                                  course.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-500",
                                )}>
                                  {course.isPublished ? "Publicado" : "Oculto"}
                                </span>
                                {course.isGlobal ? (
                                  <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[#0264af]">
                                    Todos os usuarios
                                  </span>
                                ) : null}
                                {course.allowedDepartmentLabels.length > 0 ? (
                                  <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-700">
                                    Extra: {course.allowedDepartmentLabels.join(", ")}
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-sm text-slate-500">{course.description}</p>
                              <p className="mt-2 text-xs font-bold text-slate-400">
                                Ordem {course.sortOrder} · {course.lessons.length} aula{course.lessons.length === 1 ? "" : "s"}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEditCourse(course)}
                              >
                                <Pencil size={14} />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant={course.isPublished ? "outline" : "secondary"}
                                onClick={() => void togglePublished("course", course.id, course.isPublished)}
                                disabled={busyAction === `course-${course.id}`}
                              >
                                <Power size={14} />
                                {course.isPublished ? "Ocultar" : "Publicar"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => void removeEadItem("course", course.id, course.title)}
                                disabled={busyAction === `remove-course-${course.id}` || courseHasCompletions}
                                title={courseHasCompletions ? "Curso com conclusoes deve ser ocultado." : undefined}
                              >
                                <Trash2 size={14} />
                                Remover
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 grid gap-3">
                          {course.lessons.map((lesson, lessonIndex) => {
                            const Icon = lessonKindIcon[lesson.kind];
                            const isEditingLesson = editingLessonId === lesson.id;

                            return (
                              <div key={lesson.id} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                                {isEditingLesson ? (
                                  <form className="grid gap-3 md:grid-cols-2" onSubmit={(event) => void updateLesson(event)}>
                                    <select
                                      className={cn(inputClassName, "md:col-span-2")}
                                      value={lessonEditForm.courseId}
                                      onChange={(event) =>
                                        setLessonEditForm((current) => ({
                                          ...current,
                                          courseId: event.target.value,
                                        }))
                                      }
                                    >
                                      {courses.map((courseOption) => (
                                        <option key={courseOption.id} value={courseOption.id}>
                                          {courseOption.departmentLabel} - {courseOption.title}
                                        </option>
                                      ))}
                                    </select>
                                    <select
                                      className={inputClassName}
                                      value={lessonEditForm.kind}
                                      onChange={(event) =>
                                        setLessonEditForm((current) => ({
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
                                      placeholder="Ordem"
                                      type="number"
                                      value={lessonEditForm.sortOrder}
                                      onChange={(event) =>
                                        setLessonEditForm((current) => ({
                                          ...current,
                                          sortOrder: event.target.value,
                                        }))
                                      }
                                    />
                                    <input
                                      className={cn(inputClassName, "md:col-span-2")}
                                      placeholder="Titulo da aula"
                                      value={lessonEditForm.title}
                                      onChange={(event) =>
                                        setLessonEditForm((current) => ({
                                          ...current,
                                          title: event.target.value,
                                        }))
                                      }
                                      required
                                    />
                                    <textarea
                                      className={cn(inputClassName, "min-h-20 resize-none md:col-span-2")}
                                      placeholder="Descricao"
                                      value={lessonEditForm.description}
                                      onChange={(event) =>
                                        setLessonEditForm((current) => ({
                                          ...current,
                                          description: event.target.value,
                                        }))
                                      }
                                      required
                                    />
                                    <input
                                      className={inputClassName}
                                      placeholder="URL do video ou YouTube nao listado"
                                      value={lessonEditForm.videoUrl}
                                      onChange={(event) =>
                                        setLessonEditForm((current) => ({
                                          ...current,
                                          videoUrl: event.target.value,
                                        }))
                                      }
                                    />
                                    <input
                                      className={inputClassName}
                                      placeholder="URL do PDF/material"
                                      value={lessonEditForm.materialUrl}
                                      onChange={(event) =>
                                        setLessonEditForm((current) => ({
                                          ...current,
                                          materialUrl: event.target.value,
                                        }))
                                      }
                                    />
                                    <input
                                      className={inputClassName}
                                      placeholder="Duracao em minutos"
                                      type="number"
                                      value={lessonEditForm.durationMinutes}
                                      onChange={(event) =>
                                        setLessonEditForm((current) => ({
                                          ...current,
                                          durationMinutes: event.target.value,
                                        }))
                                      }
                                    />
                                    <input
                                      className={inputClassName}
                                      placeholder="Indice da resposta correta"
                                      type="number"
                                      value={lessonEditForm.correctAnswerIndex}
                                      onChange={(event) =>
                                        setLessonEditForm((current) => ({
                                          ...current,
                                          correctAnswerIndex: event.target.value,
                                        }))
                                      }
                                    />
                                    <input
                                      className={cn(inputClassName, "md:col-span-2")}
                                      placeholder="Pergunta"
                                      value={lessonEditForm.quizQuestion}
                                      onChange={(event) =>
                                        setLessonEditForm((current) => ({
                                          ...current,
                                          quizQuestion: event.target.value,
                                        }))
                                      }
                                    />
                                    <textarea
                                      className={cn(inputClassName, "min-h-20 resize-none md:col-span-2")}
                                      placeholder="Opcoes da pergunta, uma por linha"
                                      value={lessonEditForm.quizOptions}
                                      onChange={(event) =>
                                        setLessonEditForm((current) => ({
                                          ...current,
                                          quizOptions: event.target.value,
                                        }))
                                      }
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                      <input
                                        className={inputClassName}
                                        placeholder="Pontos"
                                        type="number"
                                        value={lessonEditForm.pointsReward}
                                        onChange={(event) =>
                                          setLessonEditForm((current) => ({
                                            ...current,
                                            pointsReward: event.target.value,
                                          }))
                                        }
                                      />
                                      <input
                                        className={inputClassName}
                                        placeholder="Drcoins"
                                        type="number"
                                        value={lessonEditForm.coinsReward}
                                        onChange={(event) =>
                                          setLessonEditForm((current) => ({
                                            ...current,
                                            coinsReward: event.target.value,
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="flex flex-wrap gap-2 md:col-span-2">
                                      <Button type="submit" size="sm" disabled={busyAction === `edit-lesson-${lesson.id}`}>
                                        <Save size={14} />
                                        Salvar aula
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setEditingLessonId(null)}
                                      >
                                        <X size={14} />
                                        Cancelar
                                      </Button>
                                    </div>
                                  </form>
                                ) : (
                                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Icon className="h-4 w-4 text-[#0264af]" />
                                        <p className="font-bold text-slate-800">{lesson.title}</p>
                                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                          Aula {lessonIndex + 1} de {course.lessons.length}
                                        </span>
                                        {lesson.isPublished ? (
                                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        ) : null}
                                      </div>
                                      <p className="mt-1 text-xs leading-5 text-slate-500">{lesson.description}</p>
                                      <p className="mt-2 text-xs font-bold text-slate-400">
                                        Ordem {lesson.sortOrder} · {lesson.completionCount} conclusao{lesson.completionCount === 1 ? "" : "es"} · +{lesson.pointsReward} pts · +{lesson.coinsReward} drcoins
                                        {lesson.averageRating !== null ? ` · NPS ${lesson.averageRating}/5` : " · sem NPS"}
                                      </p>
                                      {lesson.lowRatingComments.length > 0 ? (
                                        <p className="mt-1 text-xs font-semibold text-amber-700">
                                          {lesson.lowRatingComments.length} comentario(s) de nota baixa no relatorio.
                                        </p>
                                      ) : null}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => startEditLesson(course.id, lesson)}
                                      >
                                        <Pencil size={14} />
                                        Editar
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={lesson.isPublished ? "outline" : "secondary"}
                                        onClick={() => void togglePublished("lesson", lesson.id, lesson.isPublished)}
                                        disabled={busyAction === `lesson-${lesson.id}`}
                                      >
                                        {lesson.isPublished ? "Ocultar" : "Publicar"}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700"
                                        onClick={() => void removeEadItem("lesson", lesson.id, lesson.title)}
                                        disabled={busyAction === `remove-lesson-${lesson.id}` || lesson.completionCount > 0}
                                        title={lesson.completionCount > 0 ? "Aula com conclusoes deve ser ocultada." : undefined}
                                      >
                                        <Trash2 size={14} />
                                        Remover
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </Card>
      </div>
    </BackofficeShell>
  );
}
