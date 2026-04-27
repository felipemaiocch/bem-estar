"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Calendar, ChevronRight, Megaphone, Send, Star, Stethoscope, Trash2, Users } from "lucide-react";

import Link from "next/link";
import { BackofficeShell } from "@/components/layout/backoffice-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
  responsibleName: "",
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-[#0264af] focus:bg-white";

export function AdminDashboardScreen() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [professionals, setProfessionals] = useState<AdminProfessionalItem[]>([]);
  const [events, setEvents] = useState<AdminEventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingProfessionalId, setEditingProfessionalId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [message, setMessage] = useState(
    "Novo desafio de bem-estar liberado. Participe e ganhe pontos extras nesta semana.",
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [userForm, setUserForm] = useState(defaultUserForm);
  const [professionalForm, setProfessionalForm] = useState(defaultProfessionalForm);
  const [eventForm, setEventForm] = useState(defaultEventForm);
  const [cardCount, setCardCount] = useState(0);
  const [globalSlots, setGlobalSlots] = useState("");
  const [moodStats, setMoodStats] = useState<any[]>([]);

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
      const [usersResponse, professionalsResponse, eventsResponse, cardsResponse, agendaConfigResponse, moodStatsResponse] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/professionals"),
        fetch("/api/admin/events"),
        fetch("/api/admin/cards"),
        fetch("/api/admin/agenda-config"),
        fetch("/api/admin/stats/moods"),
      ]);

      const [usersData, professionalsData, eventsData, cardsData, agendaData, moodData] = await Promise.all([
        usersResponse.json(),
        professionalsResponse.json(),
        eventsResponse.json(),
        cardsResponse.json(),
        agendaConfigResponse.json(),
        moodStatsResponse.json(),
      ]);

      if (usersData.ok) setUsers(usersData.users ?? []);
      if (professionalsData.ok) setProfessionals(professionalsData.professionals ?? []);
      if (eventsData.ok) setEvents(eventsData.events ?? []);
      if (cardsData.ok) setCardCount(cardsData.cards?.length ?? 0);
      if (agendaData.ok) setGlobalSlots(agendaData.slots || "");
      if (moodData.ok) setMoodStats(moodData.stats ?? []);

      if (!usersData.ok) setFeedback(usersData.error || "Falha ao carregar usuários.");
    } catch (error) {
      console.error(error);
      setFeedback("Falha de conexão ao carregar dados administrativos.");
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
      if (editingProfessionalId) {
        // Mode UPDATE professional
        const resp = await fetch(`/api/admin/professionals`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingProfessionalId,
            name: professionalForm.name,
            specialty: professionalForm.specialty,
            licenseCode: professionalForm.licenseCode,
          })
        });
        const d = await resp.json();
        if(!resp.ok || !d.ok) throw new Error(d.error || "Erro ao atualizar profissional");
        setFeedback("Profissional atualizado com sucesso.");
        setEditingProfessionalId(null);
      } else {
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
        setFeedback("Profissional criado com sucesso.");
      }

      setProfessionalForm(defaultProfessionalForm);
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
          responsibleName: eventForm.responsibleName,
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

  async function handleDeleteUser(id: string) {
    if (!confirm("Tem certeza que deseja excluir este usuário/profissional?")) {
      return;
    }

    setBusyAction(`delete-user-${id}`);
    try {
      const response = await fetch(`/api/admin/users?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setFeedback("Usuário excluído com sucesso.");
        await loadAdminData();
      } else {
        setFeedback("Falha ao excluir.");
      }
    } catch {
      setFeedback("Erro de conexão.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDeleteEvent(id: string) {
    if (!confirm("Tem certeza que deseja excluir permanentemente este evento?")) {
      return;
    }

    setBusyAction(`delete-event-${id}`);
    try {
      const response = await fetch(`/api/admin/events?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadAdminData();
      } else {
        setFeedback("Falha ao excluir evento.");
      }
    } catch {
      setFeedback("Erro de conexão ao excluir.");
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

  async function handleSaveAgendaConfig() {
    if (!globalSlots.trim() || busyAction) return;
    setBusyAction("save-agenda");
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/agenda-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: globalSlots }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error);
      setFeedback("Configuração da agenda salva!");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Falha ao salvar horários.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSendGlobalAlert() {
    if (!message.trim() || busyAction) return;
    setBusyAction("send-alert");
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/global-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error();
      setFeedback("Comunicado enviado para todos os usuários!");
      setMessage("");
    } catch {
      setFeedback("Falha ao enviar comunicado.");
    } finally {
      setBusyAction(null);
    }
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "Gerenciar prestadores":
      case "Aprovar profissionais":
        document.getElementById("gestao-profissionais")?.scrollIntoView({ behavior: "smooth" });
        break;
      case "Configurar gamificação":
        setFeedback("Configurações de Gamificação: Os pontos são atribuídos automaticamente via API (Mecânica de Check-in e Streaks ativa).");
        window.scrollTo({ top: 0, behavior: "smooth" });
        break;
      case "Relatórios mensais":
        setFeedback("Relatórios: A exportação de dados (CSV/PDF) será liberada no fechamento do ciclo mensal.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        break;
      case "Disparar comunicado":
        document.getElementById("notificacoes-massa")?.scrollIntoView({ behavior: "smooth" });
        break;
      default:
        break;
    }
  };

  return (
    <BackofficeShell
      badge=""
      title=""
      description=""
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
              title: "Publicações totais",
              value: String(events.length + cardCount),
              detail: `${cardCount} cards e ${events.length} eventos`,
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


          {/* Burnout Heatmap Mock */}
          <Card className="p-6 border-rose-100 shadow-sm bg-gradient-to-br from-white to-rose-50/30">
            <h3 className="mb-4 text-lg font-bold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              Mapa de Calor: Bem-estar da Equipe
            </h3>
            <div className="space-y-5">
              {(moodStats.length > 0 ? moodStats : [
                { area: "Sob pressão (Alerta)", risk: 0, color: "bg-rose-500" },
                { area: "Cansado (Atenção)", risk: 0, color: "bg-amber-500" },
                { area: "Equilibrado", risk: 100, color: "bg-blue-500" },
                { area: "Energizado", risk: 0, color: "bg-emerald-500" },
              ]).map((item) => (
                <div key={item.area} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-slate-700">{item.area}</span>
                    <span className="text-slate-500">{item.risk}% do time</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn("h-full rounded-full transition-all duration-1000", item.color)}
                      style={{ width: `${item.risk}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Dados cruciais anonimizados em tempo real
            </p>
          </Card>

          {/* Notificações em Massa */}
          <Card id="notificacoes-massa" className="p-6 border-blue-100 shadow-sm bg-white">
            <h3 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
               <Megaphone className="text-blue-500 h-5 w-5" />
               Notificações em massa
            </h3>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Digite o comunicado oficial para todos os usuários..."
              className="min-h-32 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm outline-none focus:border-[#0264af] focus:bg-white resize-none"
            />
            <div className="mt-4">
              <Button 
                className="w-full" 
                onClick={() => void handleSendGlobalAlert()}
                disabled={busyAction === "send-alert"}
              >
                <Send size={16} />
                {busyAction === "send-alert" ? "Enviando..." : "Enviar comunicado"}
              </Button>
            </div>
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
                  onClick={() => handleQuickAction(action)}
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
          <Card id="gestao-profissionais" className="p-6">
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
              <Button type="submit" disabled={busyAction === "create-professional"} className={cn("md:col-span-2", editingProfessionalId && "bg-amber-600 hover:bg-amber-700")}>
                {busyAction === "create-professional" ? "Salvando..." : editingProfessionalId ? "Atualizar profissional" : "Cadastrar profissional"}
              </Button>
              {editingProfessionalId && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="md:col-span-2"
                  onClick={() => {
                    setEditingProfessionalId(null);
                    setProfessionalForm(defaultProfessionalForm);
                  }}
                >
                  Cancelar Edição
                </Button>
              )}
            </form>

            <div className="mt-4 space-y-3">
              {professionals.map((professional) => (
                <div
                  key={professional.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {professional.name} · {professional.specialty}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {professional.email} · Status: {professional.isActive ? "Ativo" : "Inativo"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                       <Button 
                         variant="ghost"
                         size="sm"
                         className="text-blue-600 hover:bg-blue-50"
                         onClick={() => {
                           setEditingProfessionalId(professional.id);
                           setProfessionalForm({
                             name: professional.name,
                             email: professional.email,
                             specialty: professional.specialty,
                             licenseCode: professional.licenseCode || "",
                             password: "", // Don't edit password here
                           });
                           document.getElementById("gestao-profissionais")?.scrollIntoView({ behavior: "smooth" });
                         }}
                       >
                         Editar
                       </Button>
                       <Button 
                         variant={professional.isActive ? "outline" : "secondary"}
                         size="sm"
                         onClick={() => void toggleUserStatus({ id: professional.userId, name: professional.name, isActive: professional.isActive } as AdminUserItem)}
                         disabled={busyAction === `toggle-user-${professional.userId}`}
                       >
                         {professional.isActive ? "Desativar" : "Ativar"}
                       </Button>
                       <Button 
                         variant="ghost"
                         size="sm"
                         className="text-rose-600 hover:bg-rose-50"
                         onClick={() => void handleDeleteUser(professional.userId)}
                         disabled={busyAction === `delete-user-${professional.userId}`}
                       >
                         <Trash2 size={16} />
                       </Button>
                    </div>
                  </div>
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

               <input
                 className={inputClassName}
                 placeholder="Nome do Responsável (Ex: Prof. Silva)"
                 value={eventForm.responsibleName}
                 onChange={(event) =>
                   setEventForm((current) => ({ ...current, responsibleName: event.target.value }))
                 }
               />
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
                  <div className="flex gap-2">
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
                    <Button
                      variant="ghost"
                      className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => void handleDeleteEvent(event.id)}
                      disabled={busyAction === `delete-event-${event.id}`}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>


      </div>
    </BackofficeShell>
  );
}
