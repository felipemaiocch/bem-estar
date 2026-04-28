"use client";

import { useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import {
  BriefcaseMedical,
  CalendarPlus2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Clock3,
  FileText,
  ImagePlus,
  MessageCircleMore,
  NotebookPen,
  Save,
  Search,
  SendHorizontal,
  Sparkles,
  ThumbsUp,
  Trash2,
  Users,
} from "lucide-react";

import { GoalAreaChart } from "@/components/charts/goal-area-chart";
import { BackofficeShell } from "@/components/layout/backoffice-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  careRecordCategoryOptions,
  goalEvolution,
  monitoredUsers as seedMonitoredUsers,
} from "@/lib/mock-data";
import type { CareRecordCategory, CareRecordMetric, MonitoredUser, UserCareRecord } from "@/types";
import { cn } from "@/lib/utils";

interface RecordFormState {
  userId: string;
  category: CareRecordCategory;
  professional: string;
  professionalRole?: string;
  title: string;
  summary: string;
  delivery: string;
  nextStep: string;
  metrics: CareRecordMetric[];
}

interface ProfessionalBooking {
  id: string;
  patientName: string;
  startsAtIso: string;
  endsAtIso: string;
  specialty: string;
  status: "SCHEDULED" | "CONFIRMED" | "WAITLIST" | "COMPLETED" | "MISSED" | "CANCELED";
  notes?: string | null;
  cancellationReason?: string | null;
  waitlistPosition?: number | null;
}

interface FeedPostItem {
  id: string;
  professional: string;
  professionalRole: string;
  activity: string;
  time: string;
  location: string;
  image: string;
  caption: string;
  likes: number;
  likedByUser: boolean;
  comments: { id: string; author: string; text: string }[];
}

interface TeamNote {
  id: string;
  author: string;
  authorRole?: string;
  content: string;
  targetCategory?: string;
  targetProfessionalName?: string;
  createdAt: string;
  dateLabel: string;
}

function buildFormState(
  users: MonitoredUser[],
  category: CareRecordCategory = "geral",
  userId?: string,
): RecordFormState {
  const selectedCategory =
    careRecordCategoryOptions.find((item) => item.value === category) ?? careRecordCategoryOptions[0];

  const fallbackUserId = userId ?? users[0]?.id ?? seedMonitoredUsers[0].id;

  return {
    userId: fallbackUserId,
    category: selectedCategory.value,
    professional: selectedCategory.professionals[0],
    professionalRole: selectedCategory.professionalRole,
    title: selectedCategory.defaultTitle,
    summary: selectedCategory.defaultSummary,
    delivery: selectedCategory.defaultDelivery,
    nextStep: selectedCategory.defaultNextStep,
    metrics: selectedCategory.metricSuggestions.map((label) => ({
      label,
      value: "",
    })),
  };
}

function bookingStatusLabel(status: ProfessionalBooking["status"]) {
  switch (status) {
    case "CONFIRMED":
      return "Confirmado";
    case "COMPLETED":
      return "Concluído";
    case "WAITLIST":
      return "Fila de espera";
    case "MISSED":
      return "Falta";
    case "CANCELED":
      return "Cancelado";
    default:
      return "Agendado";
  }
}

function bookingStatusTone(status: ProfessionalBooking["status"]) {
  switch (status) {
    case "CONFIRMED":
      return "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700";
    case "COMPLETED":
      return "rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700";
    case "WAITLIST":
      return "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700";
    case "MISSED":
      return "rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700";
    case "CANCELED":
      return "rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700";
    default:
      return "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700";
  }
}

function formatBookingHour(startsAtIso: string) {
  const startsAt = new Date(startsAtIso);
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(startsAt);
}

const fieldClassName =
  "w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-[#0264af] focus:bg-white";

export function ProfessionalDashboardScreen() {
  const [records, setRecords] = useState<UserCareRecord[]>([]);
  const [users, setUsers] = useState<MonitoredUser[]>(seedMonitoredUsers);
  const [bookings, setBookings] = useState<ProfessionalBooking[]>([]);
  const [form, setForm] = useState<RecordFormState>(() => buildFormState(seedMonitoredUsers));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);
  const [feedPosts, setFeedPosts] = useState<FeedPostItem[]>([]);
  const [feedForm, setFeedForm] = useState({
    activity: "",
    caption: "",
    location: "",
    imageUrl: "",
  });
  const [publishingFeed, setPublishingFeed] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [feedImageFile, setFeedImageFile] = useState<File | null>(null);
  const [feedImagePreview, setFeedImagePreview] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [teamNotes, setTeamNotes] = useState<TeamNote[]>([]);
  const [allProfessionals, setAllProfessionals] = useState<{ id: string; name: string; specialty: string }[]>([]);
  const [loadingTeamNotes, setLoadingTeamNotes] = useState(false);
  const [newTeamNote, setNewTeamNote] = useState({ content: "", targetCategory: "", targetProfessionalId: "" });
  const [savingTeamNote, setSavingTeamNote] = useState(false);
  const feedFileInputRef = useRef<HTMLInputElement>(null);

  const selectedUser =
    users.find((item) => item.id === form.userId) ?? users[0] ?? seedMonitoredUsers[0];

  const selectedCategory =
    careRecordCategoryOptions.find((item) => item.value === form.category) ?? careRecordCategoryOptions[0];

  const selectedUserRecords = useMemo(
    () =>
      records
        .filter((item) => item.userId === selectedUser.id)
        .sort((left, right) => right.recordedAtIso.localeCompare(left.recordedAtIso)),
    [records, selectedUser.id],
  );

  const completedBookings = bookings.filter((booking) => booking.status === "COMPLETED").length;
  const confirmedBookings = bookings.filter((booking) => booking.status === "CONFIRMED").length;
  const attendanceBase = bookings.filter((booking) =>
    ["COMPLETED", "MISSED", "CANCELED"].includes(booking.status),
  ).length;
  const attendanceRate =
    attendanceBase > 0 ? Math.round((completedBookings / attendanceBase) * 100) : 100;

  useEffect(() => {
    async function loadProfessionalData() {
      setLoadingData(true);
      setFeedback(null);

      try {
        const [recordsResponse, bookingsResponse, feedResponse] = await Promise.all([
          fetch("/api/professional/care-records"),
          fetch("/api/professional/bookings"),
          fetch("/api/professional/feed-posts"),
        ]);

        const recordsData = (await recordsResponse.json()) as {
          ok?: boolean;
          error?: string;
          records?: UserCareRecord[];
          users?: MonitoredUser[];
        };
        const bookingsData = (await bookingsResponse.json()) as {
          ok?: boolean;
          error?: string;
          bookings?: ProfessionalBooking[];
        };
        const feedData = (await feedResponse.json()) as {
          ok?: boolean;
          error?: string;
          posts?: FeedPostItem[];
        };

        if (!recordsResponse.ok || !recordsData.ok) {
          setFeedback(recordsData.error ?? "Não foi possível carregar os atendimentos.");
        } else {
          const nextUsers = recordsData.users?.length
            ? recordsData.users
            : seedMonitoredUsers;
          setUsers(nextUsers);
          setRecords(recordsData.records ?? []);

          setForm((current) => {
            const selectedExists = nextUsers.some((user) => user.id === current.userId);
            if (selectedExists) {
              return current;
            }
            return buildFormState(nextUsers, current.category);
          });
        }

        if (!bookingsResponse.ok || !bookingsData.ok) {
          setFeedback((current) => current ?? bookingsData.error ?? "Falha ao carregar agenda.");
        } else {
          setBookings(bookingsData.bookings ?? []);
        }

        if (!feedResponse.ok || !feedData.ok) {
          setFeedback((current) => current ?? feedData.error ?? "Falha ao carregar feed.");
        } else {
          setFeedPosts(feedData.posts ?? []);
        }
      } catch {
        setFeedback("Falha de conexão ao carregar dados do painel profissional.");
      } finally {
        setLoadingData(false);
      }
    }

    void loadProfessionalData();
  }, []);

  useEffect(() => {
    async function loadTeamNotes() {
      if (!form.userId) return;
      setLoadingTeamNotes(true);
      try {
        const [notesRes, prosRes] = await Promise.all([
          fetch(`/api/professional/team-notes?userId=${form.userId}`),
          fetch("/api/professional/list-pros")
        ]);
        const notesData = await notesRes.json();
        const prosData = await prosRes.json();
        if (notesData.ok) setTeamNotes(notesData.notes);
        if (prosData.ok) setAllProfessionals(prosData.professionals);
      } catch (error) {
        console.error("Error loading team notes:", error);
      } finally {
        setLoadingTeamNotes(false);
      }
    }

    void loadTeamNotes();
  }, [form.userId]);

  const handleCategoryChange = (nextCategory: CareRecordCategory) => {
    setForm(buildFormState(users, nextCategory, form.userId));
    setFeedback(null);
  };

  const handleMetricChange = (index: number, key: keyof CareRecordMetric, value: string) => {
    setForm((current) => ({
      ...current,
      metrics: current.metrics.map((metric, metricIndex) =>
        metricIndex === index ? { ...metric, [key]: value } : metric,
      ),
    }));
  };

  const handleSelectAppointment = (id: string) => {
    setSelectedAppointmentId((current) => (current === id ? null : id));
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (savingRecord) return;

    const category =
      careRecordCategoryOptions.find((item) => item.value === form.category) ?? careRecordCategoryOptions[0];

    setSavingRecord(true);
    setFeedback(null);

    try {
      const isEditing = Boolean(editingRecordId);
      const url = isEditing 
        ? `/api/professional/care-records/${editingRecordId}` 
        : "/api/professional/care-records";
        
      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: form.userId,
          category: category.value,
          professionalRole: form.professionalRole || category.professionalRole,
          title: form.title,
          summary: form.summary,
          delivery: String(form.summary),
          nextStep: "",
          metrics: [],
        }),
      });

      const data = (await response.json()) as { ok?: boolean; error?: string; record?: UserCareRecord };

      if (!response.ok || !data.ok || !data.record) {
        setFeedback(data.error ?? "Não foi possível salvar o registro.");
        return;
      }

      if (isEditing) {
        setRecords(prev => prev.map(r => r.id === data.record!.id ? data.record! : r));
        setFeedback("Registro atualizado com sucesso!");
      } else {
        setRecords((current) => [data.record!, ...current]);
        setFeedback(`Registro salvo no perfil de ${data.record.userName}.`);
      }
      
      setForm(buildFormState(users, form.category, form.userId));
      setEditingRecordId(null);
    } catch {
      setFeedback("Falha de conexão ao salvar atendimento.");
    } finally {
      setSavingRecord(false);
    }
  }

  function handleEditRecord(record: UserCareRecord) {
    setEditingRecordId(record.id);
    setForm({
      userId: record.userId,
      category: record.category,
      professional: record.professional,
      professionalRole: record.professionalRole,
      title: record.title,
      summary: record.summary,
      delivery: record.delivery,
      nextStep: record.nextStep,
      metrics: record.metrics || [],
    });
    setPatientSearch("");
    window.scrollTo({ top: 400, behavior: "smooth" });
  }

  async function handleDeleteRecord(id: string) {
    if (!confirm("Deseja realmente excluir este registro de atendimento?")) return;
    
    setFeedback(null);
    try {
      const response = await fetch(`/api/professional/care-records/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.ok) {
        setRecords(prev => prev.filter(r => r.id !== id));
        setFeedback("Registro removido com sucesso!");
      } else {
        setFeedback(data.error || "Erro ao remover registro.");
      }
    } catch {
      setFeedback("Erro de conexão ao remover registro.");
    }
  }

  async function handleSaveTeamNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newTeamNote.content || savingTeamNote) return;
    setSavingTeamNote(true);
    try {
      const response = await fetch("/api/professional/team-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: form.userId,
          content: newTeamNote.content,
          targetCategory: newTeamNote.targetCategory || null,
          targetProfessionalId: newTeamNote.targetProfessionalId || null,
          authorRole: selectedCategory.professionalRole
        }),
      });
      const data = await response.json();
      if (data.ok) {
        setTeamNotes(prev => [data.note, ...prev]);
        setNewTeamNote({ content: "", targetCategory: "" });
      }
    } catch (error) {
      console.error("Error saving team note:", error);
    } finally {
      setSavingTeamNote(false);
    }
  }

  async function handleBookingStatus(
    booking: ProfessionalBooking,
    nextStatus: ProfessionalBooking["status"],
  ) {
    if (pendingBookingId) {
      return;
    }

    setPendingBookingId(booking.id);
    setFeedback(null);

    try {
      const response = await fetch(`/api/professional/bookings/${booking.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        booking?: ProfessionalBooking;
      };

      if (!response.ok || !data.ok || !data.booking) {
        setFeedback(data.error ?? "Não foi possível atualizar o agendamento.");
        return;
      }

      setBookings((current) =>
        current.map((item) => (item.id === booking.id ? data.booking! : item)),
      );
      setFeedback(`Agendamento de ${booking.patientName} atualizado.`);
    } catch {
      setFeedback("Falha de conexão ao atualizar agendamento.");
    } finally {
      setPendingBookingId(null);
    }
  }

  async function handlePublishFeedPost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (publishingFeed) {
      return;
    }

    setPublishingFeed(true);
    setFeedback(null);

    let finalImageUrl = feedForm.imageUrl;

    if (feedImageFile) {
        // Converter para base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(feedImageFile);
        });
        finalImageUrl = await base64Promise;
    }

    try {
      const url = editingPostId 
        ? `/api/professional/feed-posts/${editingPostId}`
        : "/api/professional/feed-posts";
      
      const response = await fetch(url, {
        method: editingPostId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activity: feedForm.activity,
          caption: feedForm.caption,
          location: feedForm.location || undefined,
          imageUrl: finalImageUrl || undefined,
          professionalRole: "Profissional",
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        post?: FeedPostItem;
      };

      if (!response.ok || !data.ok || !data.post) {
        setFeedback(data.error ?? "Não foi possível publicar no feed.");
        return;
      }

      if (editingPostId) {
        setFeedPosts((current) => current.map(p => p.id === editingPostId ? data.post! : p));
        setFeedback("Publicação atualizada com sucesso.");
      } else {
        setFeedPosts((current) => [data.post!, ...current]);
        setFeedback("Post publicado no feed com sucesso.");
      }

      setFeedForm({
        activity: "",
        caption: "",
        location: "",
        imageUrl: "",
      });
      setFeedImageFile(null);
      setFeedImagePreview(null);
      setEditingPostId(null);
    } catch {
      setFeedback("Falha de conexão.");
    } finally {
      setPublishingFeed(false);
    }
  }

  function handleEditPost(post: FeedPostItem) {
    setEditingPostId(post.id);
    setFeedForm({
      activity: post.activity,
      caption: post.caption,
      location: post.location || "",
      imageUrl: post.image || "",
    });
    setFeedImagePreview(post.image || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDeleteFeedPost(id: string) {
    if (!confirm("Deseja realmente excluir esta dica?")) return;
    
    setFeedback(null);
    try {
      const response = await fetch(`/api/professional/feed-posts/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.ok) {
        setFeedPosts(prev => prev.filter(p => p.id !== id));
        setFeedback("Dica removida!");
      } else {
        setFeedback(data.error || "Erro ao remover dica.");
      }
    } catch {
      setFeedback("Erro de conexão ao remover dica.");
    }
  }

  return (
    <BackofficeShell
      badge="Profissional"
      title="Bem-vindo ao seu painel"
      description="Gerencie seus atendimentos e compartilhe dicas com a comunidade."
    >
      <div className="space-y-6">
        <section className="grid gap-4 xl:grid-cols-4">
          {[
            {
              title: "Atendimentos hoje",
              value: String(bookings.length).padStart(2, "0"),
              detail: `${confirmedBookings} confirmados agora`,
              icon: BriefcaseMedical,
            },
            {
              title: "Taxa de comparecimento",
              value: `${attendanceRate}%`,
              detail: "Sessões concluídas no ciclo atual",
              icon: CheckCircle2,
            },
            {
              title: "Usuários ativos",
              value: String(users.length).padStart(2, "0"),
              detail: "Base disponível para acompanhamento",
              icon: Users,
            },
            {
              title: "Registros lançados",
              value: String(records.length).padStart(2, "0"),
              detail: "Histórico visível no perfil",
              icon: NotebookPen,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title}>
                <CardContent className="space-y-4 px-5 pb-5 pt-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{item.title}</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                      {item.value}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Agenda do dia</CardTitle>
                <CardDescription>Fluxo direto para confirmar presença e abrir histórico.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingData ? (
                  <div className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                    Carregando agenda...
                  </div>
                ) : null}

                {!loadingData && bookings.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                    <p className="font-medium text-slate-950">Sem atendimentos na agenda.</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Assim que houver reservas dos usuários, elas aparecem aqui.
                    </p>
                  </div>
                ) : null}

                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-semibold tracking-tight text-slate-950">
                            {formatBookingHour(booking.startsAtIso)} · {booking.patientName}
                          </p>
                          {booking.status !== "COMPLETED" && (
                            <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700 border border-rose-200">
                              Falta provável
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Foco em {booking.specialty.toLowerCase()} e acompanhamento contínuo.
                        </p>
                        {booking.cancellationReason ? (
                          <p className="mt-2 text-xs text-rose-600">
                            Motivo do cancelamento: {booking.cancellationReason}
                          </p>
                        ) : null}
                      </div>
                      <span className={bookingStatusTone(booking.status)}>
                        {bookingStatusLabel(booking.status)}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <Button
                        variant="secondary"
                        onClick={() =>
                          void handleBookingStatus(
                            booking,
                            booking.status === "CONFIRMED" ? "COMPLETED" : "CONFIRMED",
                          )
                        }
                        disabled={
                          pendingBookingId === booking.id ||
                          booking.status === "COMPLETED" ||
                          booking.status === "CANCELED"
                        }
                      >
                        {pendingBookingId === booking.id
                          ? "Salvando..."
                          : booking.status === "CONFIRMED"
                            ? "Marcar concluída"
                            : booking.status === "COMPLETED"
                              ? "Concluída"
                              : "Confirmar presença"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "w-full text-blue-600 hover:bg-blue-50 hover:text-blue-700",
                          selectedAppointmentId === booking.id && "bg-blue-100/50"
                        )}
                        onClick={() => handleSelectAppointment(booking.id)}
                      >
                        Ver detalhes da sessão
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Connect Workflow: Publicar no Feed do Usuário */}
            <Card className="p-6 border-blue-100 shadow-sm">
              <h3 className="mb-1 text-lg font-bold text-slate-900 flex items-center gap-2">
                <MessageCircleMore className="text-blue-500 h-5 w-5" />
                Publicar Dica no Feed dos Colaboradores
              </h3>
              <p className="text-sm text-slate-500 mb-5">Compartilhe insights em formato de pílulas diárias. Eles aparecerão no app do paciente (User Dashboard).</p>
              <form onSubmit={(e) => void handlePublishFeedPost(e)} className="space-y-3">
                <input
                  type="text"
                  placeholder="Título (ex: Benefícios do alongamento matinal)"
                  value={feedForm.activity}
                  onChange={e => setFeedForm(prev => ({ ...prev, activity: e.target.value }))}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <textarea
                  placeholder="Escreva sua dica ou artigo aqui..."
                  rows={3}
                  value={feedForm.caption}
                  onChange={e => setFeedForm(prev => ({ ...prev, caption: e.target.value }))}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                ></textarea>
                <div className="flex flex-col gap-3 pt-1">
                  {feedImagePreview && (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 bg-black/5">
                      <img src={feedImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => {
                          setFeedImageFile(null);
                          setFeedImagePreview(null);
                          setFeedForm(prev => ({ ...prev, imageUrl: "" }));
                        }}
                        className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-white rounded-full shadow-md text-rose-500 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <button 
                        type="button"
                        onClick={() => feedFileInputRef.current?.click()}
                        className={cn(
                          "flex items-center gap-1.5 text-sm font-semibold transition-colors",
                          feedImageFile ? "text-emerald-600" : "text-slate-500 hover:text-blue-600"
                        )}
                      >
                        <ImagePlus className="h-4 w-4" /> 
                        {feedImageFile ? "Imagem selecionada" : "Anexar Mídia"}
                      </button>
                      {editingPostId && (
                        <button 
                          type="button"
                          onClick={() => {
                            setEditingPostId(null);
                            setFeedForm({ activity: "", caption: "", location: "", imageUrl: "" });
                            setFeedImageFile(null);
                            setFeedImagePreview(null);
                          }}
                          className="text-sm font-semibold text-rose-500 hover:underline"
                        >
                          Cancelar Edição
                        </button>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={feedFileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFeedImageFile(file);
                          setFeedImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                    <Button 
                      type="submit"
                      disabled={publishingFeed}
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold px-6"
                    >
                      {publishingFeed ? "Salvando..." : editingPostId ? "Salvar Alterações" : "Publicar"} 
                      <SendHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </form>
            </Card>

            {/* Minhas publicações */}
            <Card className="p-6 h-[450px] flex flex-col">
               <h3 className="mb-4 text-lg font-bold text-slate-900">Minhas publicações</h3>
               <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {feedPosts.length === 0 && <p className="text-sm text-slate-400 italic">Você ainda não publicou nenhuma dica.</p>}
                  {feedPosts.map(post => (
                    <div key={post.id} className="flex gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 items-start hover:bg-white transition-colors">
                      {post.image && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                          <img src={post.image} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate">{post.activity}</p>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">{post.caption}</p>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleEditPost(post)}
                          className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                        >
                          <NotebookPen size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteFeedPost(post.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
               </div>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lançar atendimento no perfil do usuário</CardTitle>
              <CardDescription>
                Tudo o que for salvo aqui aparece na aba correspondente do perfil.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Buscar Paciente</span>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                      <input
                        type="text"
                        placeholder="Nome ou e-mail..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        className={cn(fieldClassName, "pl-10 h-11")}
                      />
                    </div>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Selecionar da lista</span>
                    <select
                      value={form.userId}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, userId: event.target.value }))
                      }
                      className={cn(fieldClassName, "h-11")}
                    >
                      {users
                        .filter(u => 
                          patientSearch === "" || 
                          u.name.toLowerCase().includes(patientSearch.toLowerCase()) || 
                          u.email.toLowerCase().includes(patientSearch.toLowerCase())
                        )
                        .map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} · {user.area}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>

                {/* Removidos campos de Área e Papel conforme solicitação */}

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Título do Atendimento</span>
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, title: event.target.value }))
                    }
                    className={cn(fieldClassName, "h-11")}
                    placeholder="Ex: Evolução Semanal"
                    required
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Comentários e Evolução</span>
                  <textarea
                    value={form.summary}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, summary: event.target.value }))
                    }
                    placeholder="Descreva aqui o que foi conversado ou realizado com o usuário..."
                    className={cn(fieldClassName, "min-h-[160px] resize-none py-4")}
                    required
                  />
                </label>

                <div className="flex items-center justify-between pt-2">
                  {feedback ? <p className="text-sm font-medium text-emerald-600">{feedback}</p> : <span />}
                  <Button className="bg-[#0264af] hover:bg-[#02548f] text-white px-8" type="submit" disabled={savingRecord}>
                    {savingRecord ? "Salvando..." : "Salvar no perfil"}
                    <Save className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.98fr_1.02fr]">
          <Card>
            <CardHeader>
              <CardTitle>Histórico do usuário selecionado</CardTitle>
              <CardDescription>
                Prévia do que {selectedUser.name} já consegue visualizar no perfil.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedUserRecords.length ? (
                selectedUserRecords.slice(0, 4).map((record, index) => (
                  <div
                    key={record.id}
                    className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-slate-950">{record.title}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {record.professional} · {record.professionalRole}
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                          {record.recordedAtLabel}
                        </span>
                        <button 
                          onClick={() => handleEditRecord(record)}
                          className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                        >
                          <NotebookPen size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteRecord(record.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{record.summary}</p>

                    {/* Removidas as métricas genéricas que estavam confundindo (ex: 4: 200) */}
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                  <p className="font-medium text-slate-950">Nenhum registro lançado ainda.</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Salve o primeiro atendimento para que o histórico apareça no perfil do usuário.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-indigo-100 bg-indigo-50/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                <CardTitle>Central de Alinhamento Multidisciplinar</CardTitle>
              </div>
              <CardDescription>
                Notas internas compartilhadas apenas entre profissionais sobre {selectedUser.name}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="space-y-2 block">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trocar Paciente no Mural</span>
                  <select
                    value={form.userId}
                    onChange={(e) => setForm(prev => ({ ...prev, userId: e.target.value }))}
                    className={cn(fieldClassName, "h-10 bg-white border-indigo-100 text-sm")}
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} · {u.area}</option>
                    ))}
                  </select>
                </label>
              </div>

              <form onSubmit={(e) => void handleSaveTeamNote(e)} className="space-y-3">
                <textarea
                  value={newTeamNote.content}
                  onChange={(e) => setNewTeamNote(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Compartilhe uma observação ou recomendação interna..."
                  className={cn(fieldClassName, "min-h-[100px] bg-white border-indigo-100 focus:border-indigo-500")}
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={newTeamNote.targetCategory}
                    onChange={(e) => setNewTeamNote(prev => ({ ...prev, targetCategory: e.target.value }))}
                    className={cn(fieldClassName, "h-10 bg-white border-indigo-100 text-[10px]")}
                  >
                    <option value="">Área (Todas)</option>
                    <option value="nutricao">Nutrição</option>
                    <option value="fisioterapia">Fisioterapia</option>
                    <option value="psicologia">Psicologia</option>
                  </select>
                  <select
                    value={newTeamNote.targetProfessionalId}
                    onChange={(e) => setNewTeamNote(prev => ({ ...prev, targetProfessionalId: e.target.value }))}
                    className={cn(fieldClassName, "h-10 bg-white border-indigo-100 text-[10px]")}
                  >
                    <option value="">Para: Qualquer Profissional</option>
                    {allProfessionals.map(p => (
                      <option key={p.id} value={p.id}>Para: {p.name}</option>
                    ))}
                  </select>
                </div>
                <Button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white w-full h-11"
                  disabled={savingTeamNote}
                >
                  {savingTeamNote ? "Postando..." : "Postar no Mural"}
                  <SendHorizontal className="ml-2 h-4 w-4" />
                </Button>
              </form>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {loadingTeamNotes ? (
                  <p className="text-center py-4 text-slate-400 text-sm">Carregando mural...</p>
                ) : teamNotes.length > 0 ? (
                  teamNotes.map((note) => (
                    <div key={note.id} className="bg-white p-3 rounded-2xl border border-indigo-50 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{note.author}</p>
                          <p className="text-[10px] text-indigo-600 font-medium">{note.authorRole}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">{note.dateLabel}</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed italic">"{note.content}"</p>
                      {note.targetCategory && (
                        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20 mr-2">
                          <Sparkles className="h-3 w-3" />
                          RECOMENDAÇÃO: {note.targetCategory.toUpperCase()}
                        </div>
                      )}
                      {note.targetProfessionalName && (
                        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 ring-1 ring-inset ring-blue-600/20">
                          PARA: {note.targetProfessionalName.toUpperCase()}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 opacity-60">
                    <MessageCircleMore className="h-8 w-8 mx-auto text-indigo-200 mb-2" />
                    <p className="text-xs text-slate-500 font-medium">Nenhuma nota interna registrada para este paciente.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </BackofficeShell>
  );
}
