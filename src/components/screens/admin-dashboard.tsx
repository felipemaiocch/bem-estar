"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Calendar, ChevronRight, Megaphone, Send, Star, Stethoscope, Users } from "lucide-react";

import Link from "next/link";
import { BackofficeShell } from "@/components/layout/backoffice-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: "USER" | "PROFESSIONAL" | "ADMIN";
  isActive: boolean;
  company: string | null;
  score: number;
  createdAtIso: string;
}

interface AdminProfessionalItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  specialty: string;
  licenseCode: string | null;
  attendanceRate: number;
  isActive: boolean;
}

interface AdminEventItem {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  kind: "EVENT" | "CULTURE" | "PARTY";
  startsAtIso: string;
  endsAtIso: string;
  points: number;
  status: "DRAFT" | "PUBLISHED" | "COMPLETED" | "CANCELED";
  maxAttendees: number | null;
}

const defaultUserForm = {
  name: "",
  email: "",
  role: "USER" as "USER" | "PROFESSIONAL" | "ADMIN",
  company: "",
  specialty: "",
  password: "",
};

const defaultProfessionalForm = {
  name: "",
  email: "",
  specialty: "",
  licenseCode: "",
  password: "",
};

const defaultEventForm = {
  title: "",
  description: "",
  location: "",
  category: "Agenda dr",
  kind: "EVENT" as const,
  startsAtIso: "",
  endsAtIso: "",
  points: 0,
  maxAttendees: "",
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-[#0264af] focus:bg-white";

export function AdminDashboardScreen() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [professionals, setProfessionals] = useState<AdminProfessionalItem[]>([]);
  const [events, setEvents] = useState<AdminEventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [message, setMessage] = useState(
    "Novo desafio de bem-estar liberado. Participe e ganhe pontos extras nesta semana.",
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [userForm, setUserForm] = useState(defaultUserForm);
  const [professionalForm, setProfessionalForm] = useState(defaultProfessionalForm);
  const [eventForm, setEventForm] = useState(defaultEventForm);

  const activeUsers = users.filter((user) => user.isActive).length;
  const monthlyEngagement = useMemo(() => {
    if (!users.length) {
      return 0;
    }

    const averageScore =
      users.reduce((accumulator, user) => accumulator + user.score, 0) / users.length;

    return Math.min(Math.round((averageScore / 2500) * 100), 100);
  }, [users]);
  const publishedEvents = events.filter((event) => event.status === "PUBLISHED").length;
  const averageAttendance =
    professionals.length > 0
      ? professionals.reduce((accumulator, professional) => accumulator + professional.attendanceRate, 0) /
      professionals.length
      : 0;

  async function loadAdminData() {
    setLoading(true);
    setFeedback(null);

    try {
      const [usersResponse, professionalsResponse, eventsResponse] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/professionals"),
        fetch("/api/admin/events"),
      ]);

      const usersData = (await usersResponse.json()) as {
        ok?: boolean;
        error?: string;
        users?: AdminUserItem[];
      };
      const professionalsData = (await professionalsResponse.json()) as {
        ok?: boolean;
        error?: string;
        professionals?: AdminProfessionalItem[];
      };
      const eventsData = (await eventsResponse.json()) as {
        ok?: boolean;
        error?: string;
        events?: AdminEventItem[];
      };

      if (!usersResponse.ok || !usersData.ok) {
        setFeedback(usersData.error ?? "Falha ao carregar usuários.");
      } else {
        setUsers(usersData.users ?? []);
      }

      if (!professionalsResponse.ok || !professionalsData.ok) {
        setFeedback((current) => current ?? professionalsData.error ?? "Falha ao carregar profissionais.");
      } else {
        setProfessionals(professionalsData.professionals ?? []);
      }

      if (!eventsResponse.ok || !eventsData.ok) {
        setFeedback((current) => current ?? eventsData.error ?? "Falha ao carregar eventos.");
      } else {
        setEvents(eventsData.events ?? []);
      }
    } catch {
      setFeedback("Falha de conexão ao carregar dados do admin.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAdminData();
  }, []);

  async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busyAction) {
      return;
    }

    setBusyAction("create-user");
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: userForm.name,
          email: userForm.email,
          role: userForm.role,
          company: userForm.company || undefined,
          specialty: userForm.role === "PROFESSIONAL" ? userForm.specialty || undefined : undefined,
          password: userForm.password || undefined,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        setFeedback(data.error ?? "Não foi possível criar usuário.");
        return;
      }

      setUserForm(defaultUserForm);
      setFeedback("Usuário criado com sucesso.");
      await loadAdminData();
    } catch {
      setFeedback("Falha de conexão ao criar usuário.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCreateProfessional(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busyAction) {
      return;
    }

    setBusyAction("create-professional");
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/professionals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: professionalForm.name,
          email: professionalForm.email,
          specialty: professionalForm.specialty,
          licenseCode: professionalForm.licenseCode || undefined,
          password: professionalForm.password || undefined,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        setFeedback(data.error ?? "Não foi possível criar profissional.");
        return;
      }

      setProfessionalForm(defaultProfessionalForm);
      setFeedback("Profissional criado com sucesso.");
      await loadAdminData();
    } catch {
      setFeedback("Falha de conexão ao criar profissional.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCreateEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busyAction) {
      return;
    }

    setBusyAction("create-event");
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: eventForm.title,
          description: eventForm.description,
          location: eventForm.location,
          category: eventForm.category,
          kind: eventForm.kind,
          startsAtIso: eventForm.startsAtIso,
          endsAtIso: eventForm.endsAtIso,
          points: eventForm.points,
          maxAttendees: eventForm.maxAttendees ? Number(eventForm.maxAttendees) : undefined,
          status: "PUBLISHED",
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        setFeedback(data.error ?? "Não foi possível criar evento.");
        return;
      }

      setEventForm(defaultEventForm);
      setFeedback("Evento criado com sucesso.");
      await loadAdminData();
    } catch {
      setFeedback("Falha de conexão ao criar evento.");
    } finally {
      setBusyAction(null);
    }
  }

  async function toggleUserStatus(user: AdminUserItem) {
    if (busyAction) {
      return;
    }

    setBusyAction(`toggle-user-${user.id}`);
    setFeedback(null);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !user.isActive,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        setFeedback(data.error ?? "Não foi possível atualizar o usuário.");
        return;
      }

      setFeedback(`Usuário ${user.name} atualizado.`);
      await loadAdminData();
    } catch {
      setFeedback("Falha de conexão ao atualizar usuário.");
    } finally {
      setBusyAction(null);
    }
  }

  async function publishOrDraftEvent(event: AdminEventItem) {
    if (busyAction) {
      return;
    }

    const nextStatus = event.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setBusyAction(`toggle-event-${event.id}`);
    setFeedback(null);

    try {
      const response = await fetch(`/api/admin/events/${event.id}`, {
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
      };

      if (!response.ok || !data.ok) {
        setFeedback(data.error ?? "Não foi possível atualizar o evento.");
        return;
      }

      setFeedback(`Evento ${event.title} atualizado para ${nextStatus}.`);
      await loadAdminData();
    } catch {
      setFeedback("Falha de conexão ao atualizar evento.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <BackofficeShell
      badge="Painel administrativo"
      title="Governança, relatórios e crescimento"
      description="Visão consolidada de engajamento, sessões, agenda dr e regras da operação."
    >
      <div className="flex flex-col gap-6">
        <div className="mb-2 mt-2">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Visão geral</h1>
          <p className="mt-1 text-sm text-gray-500 md:text-base">
            Métricas de bem-estar, participação e retenção da empresa.
          </p>
        </div>

        {feedback ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {feedback}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {[
            {
              title: "Usuários ativos",
              value: String(activeUsers),
              detail: `${users.length} no total`,
              icon: Users,
              color: "border-l-blue-500 text-blue-500",
            },
            {
              title: "Engajamento mensal",
              value: `${monthlyEngagement}%`,
              detail: "Com base na pontuação",
              icon: Activity,
              color: "border-l-emerald-500 text-emerald-500",
            },
            {
              title: "Eventos publicados",
              value: String(publishedEvents),
              detail: `${events.length} eventos cadastrados`,
              icon: Calendar,
              color: "border-l-purple-500 text-purple-500",
            },
            {
              title: "Avaliação de comparecimento",
              value: `${Math.round(averageAttendance > 1 ? averageAttendance : averageAttendance * 100)}%`,
              detail: "Média dos profissionais",
              icon: Star,
              color: "border-l-amber-500 text-amber-500",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className={`border-l-4 p-5 ${item.color}`}>
                <div className="mb-3 flex justify-between">
                  <Icon size={24} />
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                    {item.detail}
                  </span>
                </div>
                <p className="text-3xl font-black text-gray-900">{item.value}</p>
                <p className="mt-1 text-sm font-medium text-gray-500">{item.title}</p>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-2">
          {/* ROI Calculator Mock */}
          <Card className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/50 p-0 shadow-sm">
            <div className="p-6">
              <div className="mb-2 flex items-center gap-2 text-emerald-700">
                <Activity size={20} />
                <h3 className="font-bold uppercase tracking-wider text-sm">Retorno de Investimento (ROI) Saúde</h3>
              </div>
              <p className="text-4xl font-black text-emerald-600 tracking-tight">R$ 142.500</p>
              <p className="mt-1 text-sm font-medium text-emerald-800">Economia estimada em absenteísmo no trimestre atual</p>
            </div>
            <div className="bg-emerald-600 px-6 py-4 text-emerald-50">
              <p className="text-sm font-medium leading-relaxed">
                Baseado na redução de 14% nos acionamentos médicos indevidos e aumento expressivo no engajamento ativo na plataforma dr.monitora.
              </p>
            </div>
          </Card>

          {/* Burnout Heatmap Mock */}
          <Card className="p-6 border-rose-100 shadow-sm bg-gradient-to-br from-white to-rose-50/30">
            <h3 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
              Mapa de Calor: Alerta de Burnout
            </h3>
            <div className="space-y-4">
              {[
                { dep: "Comercial / Vendas", risk: 85, color: "bg-rose-500" },
                { dep: "Tecnologia / Eng", risk: 65, color: "bg-orange-400" },
                { dep: "Recursos Humanos", risk: 30, color: "bg-emerald-400" },
              ].map((item) => (
                <div key={item.dep}>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-slate-700">{item.dep}</span>
                    <span className="text-slate-500">{item.risk}% de Risco</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-200/50 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.risk}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-slate-500 uppercase tracking-widest font-semibold text-center text-rose-500/80">Dados cruciais anonimizados</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Gestão de usuários</h3>
            <form className="grid gap-3 md:grid-cols-5" onSubmit={(event) => void handleCreateUser(event)}>
              <input
                className={inputClassName}
                placeholder="Nome"
                value={userForm.name}
                onChange={(event) =>
                  setUserForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
              <input
                className={inputClassName}
                placeholder="E-mail"
                type="email"
                value={userForm.email}
                onChange={(event) =>
                  setUserForm((current) => ({ ...current, email: event.target.value }))
                }
                required
              />
              <select
                className={inputClassName}
                value={userForm.role}
                onChange={(event) =>
                  setUserForm((current) => ({
                    ...current,
                    role: event.target.value as typeof current.role,
                  }))
                }
              >
                <option value="USER">USER</option>
                <option value="PROFESSIONAL">PROFESSIONAL</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <input
                className={inputClassName}
                placeholder={userForm.role === "PROFESSIONAL" ? "Especialidade" : "Área/empresa"}
                value={userForm.role === "PROFESSIONAL" ? userForm.specialty : userForm.company}
                onChange={(event) =>
                  setUserForm((current) =>
                    current.role === "PROFESSIONAL"
                      ? { ...current, specialty: event.target.value }
                      : { ...current, company: event.target.value },
                  )
                }
              />
              <Button type="submit" disabled={busyAction === "create-user"}>
                {busyAction === "create-user" ? "Salvando..." : "Criar"}
              </Button>
            </form>

            <div className="mt-4 space-y-3">
              {loading ? (
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Carregando usuários...
                </div>
              ) : null}
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {user.name} · {user.role}
                    </p>
                    <p className="text-sm text-slate-500">
                      {user.email} {user.company ? `· ${user.company}` : ""}
                    </p>
                  </div>
                  <Button
                    variant={user.isActive ? "outline" : "secondary"}
                    onClick={() => void toggleUserStatus(user)}
                    disabled={busyAction === `toggle-user-${user.id}`}
                  >
                    {busyAction === `toggle-user-${user.id}`
                      ? "Atualizando..."
                      : user.isActive
                        ? "Inativar"
                        : "Ativar"}
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Ações rápidas</h3>
            <div className="space-y-3">
              <Link href="/admin/conteudos" className="block cursor-pointer p-5 transition-all hover:border-blue-300 hover:shadow-md rounded-xl border bg-card text-card-foreground shadow">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0264af]">
                    Gerenciar Cards de Conteúdo
                  </span>
                  <ChevronRight size={20} className="text-[#0264af]" />
                </div>
              </Link>
              {[
                "Gerenciar prestadores",
                "Aprovar profissionais",
                "Configurar gamificação",
                "Relatórios mensais",
                "Disparar comunicado",
              ].map((action) => (
                <Card
                  key={action}
                  className="group cursor-pointer p-5 transition-all hover:border-blue-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-700 group-hover:text-[#0264af]">
                      {action}
                    </span>
                    <ChevronRight
                      size={20}
                      className="text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-[#0264af]"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Gestão de profissionais</h3>
            <form className="grid gap-3 md:grid-cols-2" onSubmit={(event) => void handleCreateProfessional(event)}>
              <input
                className={inputClassName}
                placeholder="Nome"
                value={professionalForm.name}
                onChange={(event) =>
                  setProfessionalForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
              <input
                className={inputClassName}
                placeholder="E-mail"
                type="email"
                value={professionalForm.email}
                onChange={(event) =>
                  setProfessionalForm((current) => ({ ...current, email: event.target.value }))
                }
                required
              />
              <input
                className={inputClassName}
                placeholder="Especialidade"
                value={professionalForm.specialty}
                onChange={(event) =>
                  setProfessionalForm((current) => ({ ...current, specialty: event.target.value }))
                }
                required
              />
              <input
                className={inputClassName}
                placeholder="Registro profissional (opcional)"
                value={professionalForm.licenseCode}
                onChange={(event) =>
                  setProfessionalForm((current) => ({ ...current, licenseCode: event.target.value }))
                }
              />
              <Button type="submit" disabled={busyAction === "create-professional"} className="md:col-span-2">
                {busyAction === "create-professional" ? "Salvando..." : "Cadastrar profissional"}
              </Button>
            </form>

            <div className="mt-4 space-y-3">
              {professionals.map((professional) => (
                <div
                  key={professional.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <p className="font-semibold text-slate-900">
                    {professional.name} · {professional.specialty}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {professional.email} · Comparecimento {Math.round(professional.attendanceRate * 100)}%
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Gestão de eventos e cultura</h3>
            <form className="grid gap-3" onSubmit={(event) => void handleCreateEvent(event)}>
              <input
                className={inputClassName}
                placeholder="Título"
                value={eventForm.title}
                onChange={(event) =>
                  setEventForm((current) => ({ ...current, title: event.target.value }))
                }
                required
              />
              <textarea
                className={inputClassName}
                placeholder="Descrição"
                value={eventForm.description}
                onChange={(event) =>
                  setEventForm((current) => ({ ...current, description: event.target.value }))
                }
                required
              />
              <div className="grid gap-3 md:grid-cols-3">
                <input
                  className={inputClassName}
                  placeholder="Local"
                  value={eventForm.location}
                  onChange={(event) =>
                    setEventForm((current) => ({ ...current, location: event.target.value }))
                  }
                  required
                />
                <input
                  className={inputClassName}
                  placeholder="Categoria"
                  value={eventForm.category}
                  onChange={(event) =>
                    setEventForm((current) => ({ ...current, category: event.target.value }))
                  }
                  required
                />
                <select
                  className={inputClassName}
                  value={eventForm.kind}
                  onChange={(event) =>
                    setEventForm((current) => ({ ...current, kind: event.target.value as typeof current.kind }))
                  }
                >
                  <option value="EVENT">EVENT</option>
                  <option value="CULTURE">CULTURE</option>
                  <option value="PARTY">PARTY</option>
                </select>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Início
                  <input
                    className={inputClassName}
                    type="datetime-local"
                    value={eventForm.startsAtIso}
                    onChange={(event) =>
                      setEventForm((current) => ({ ...current, startsAtIso: event.target.value }))
                    }
                    required
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Fim
                  <input
                    className={inputClassName}
                    type="datetime-local"
                    value={eventForm.endsAtIso}
                    onChange={(event) =>
                      setEventForm((current) => ({ ...current, endsAtIso: event.target.value }))
                    }
                    required
                  />
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className={inputClassName}
                  type="number"
                  min={0}
                  value={eventForm.points}
                  onChange={(event) =>
                    setEventForm((current) => ({ ...current, points: Number(event.target.value) }))
                  }
                  placeholder="Pontos"
                />
                <input
                  className={inputClassName}
                  type="number"
                  min={1}
                  value={eventForm.maxAttendees}
                  onChange={(event) =>
                    setEventForm((current) => ({ ...current, maxAttendees: event.target.value }))
                  }
                  placeholder="Capacidade"
                />
              </div>
              <Button type="submit" disabled={busyAction === "create-event"}>
                {busyAction === "create-event" ? "Salvando..." : "Criar evento"}
              </Button>
            </form>

            <div className="mt-4 space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {event.title} · {event.kind}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {event.location} · {event.status} · {event.points} pts
                    </p>
                  </div>
                  <Button
                    variant={event.status === "PUBLISHED" ? "outline" : "secondary"}
                    onClick={() => void publishOrDraftEvent(event)}
                    disabled={busyAction === `toggle-event-${event.id}`}
                  >
                    {busyAction === `toggle-event-${event.id}`
                      ? "Atualizando..."
                      : event.status === "PUBLISHED"
                        ? "Mover p/ rascunho"
                        : "Publicar"}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-bold text-gray-900">Notificações em massa</h3>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="min-h-40 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm outline-none focus:border-[#0264af] focus:bg-white"
          />
          <div className="mt-4">
            <Button className="w-full md:w-auto">
              <Send size={16} />
              Enviar comunicado
            </Button>
          </div>
        </Card>

        {/* Conexão End-to-end: Publicação e Cadastro */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Publicar Conteúdo */}
          <Card className="p-6 border-indigo-100 shadow-sm bg-white">
            <h3 className="mb-1 text-lg font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="text-indigo-500 h-5 w-5" />
              Publicar Conteúdo Institucional
            </h3>
            <p className="text-sm text-slate-500 mb-5">Adicione cards e comunicados oficiais nas categorias fixas da Home dos colaboradores.</p>
            <div className="space-y-4">
              <select className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors">
                <option>Selecione a Categoria de Destino...</option>
                <option>Saúde e Bem-Estar</option>
                <option>Cultura Organizacional</option>
                <option>Agenda Dr. Monitora</option>
              </select>
              <input type="text" placeholder="Título do Card (ex: Nova Parceria de Academias)" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors" />
              <textarea placeholder="Descrição ou link do programa..." rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"></textarea>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11">
                Disparar para a Home
              </Button>
            </div>
          </Card>

          {/* Cadastrar Profissional */}
          <Card className="p-6 border-sky-100 shadow-sm bg-white">
            <h3 className="mb-1 text-lg font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="text-sky-500 h-5 w-5" />
              Credenciar Novo Especialista
            </h3>
            <p className="text-sm text-slate-500 mb-5">Cadastre profissionais (que atuarão na Agenda e poderão postar no Feed de Saúde).</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Nome Completo do Profissional" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors" />
                <input type="text" placeholder="Registro (Ex: CRP / CRM)" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors" />
              </div>
              <select className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors">
                <option>Especialidade de Atendimento...</option>
                <option>Psicologia Clínica</option>
                <option>Nutrição</option>
                <option>Medicina Preventiva</option>
                <option>Educador Físico / Fisioterapia</option>
              </select>
              <input type="text" placeholder="Email de Acesso (para login do médico)" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors" />
              <Button className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold h-11">
                Cadastrar Perfil
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </BackofficeShell>
  );
}
