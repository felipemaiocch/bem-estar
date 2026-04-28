"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Calendar, ChevronRight, Lock, Megaphone, Search, Send, Settings, Star, Stethoscope, Trash2, Users } from "lucide-react";

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
  const [activeUserTab, setActiveUserTab] = useState<"TODOS" | "USER" | "PROFESSIONAL" | "ADMIN">("TODOS");
  const [userSearch, setUserSearch] = useState("");
  const [allowUserPosting, setAllowUserPosting] = useState(true);
  const [feedModerationPosts, setFeedModerationPosts] = useState<any[]>([]);
  const [loadingModeration, setLoadingModeration] = useState(false);

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
      const [usersResponse, professionalsResponse, eventsResponse, cardsResponse, agendaConfigResponse, moodStatsResponse, settingsResponse, feedResponse] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/professionals"),
        fetch("/api/admin/events"),
        fetch("/api/admin/cards"),
        fetch("/api/admin/agenda-config"),
        fetch("/api/admin/stats/moods"),
        fetch("/api/admin/platform-settings"),
        fetch("/api/admin/feed-moderation"),
      ]);

      const [usersData, professionalsData, eventsData, cardsData, agendaData, moodData, settingsData, feedData] = await Promise.all([
        usersResponse.json(),
        professionalsResponse.json(),
        eventsResponse.json(),
        cardsResponse.json(),
        agendaConfigResponse.json(),
        moodStatsResponse.json(),
        settingsResponse.json(),
        feedResponse.json(),
      ]);

      if (usersData.ok) setUsers(usersData.users ?? []);
      if (professionalsData.ok) setProfessionals(professionalsData.professionals ?? []);
      if (eventsData.ok) setEvents(eventsData.events ?? []);
      if (cardsData.ok) setCardCount(cardsData.cards?.length ?? 0);
      if (agendaData.ok) setGlobalSlots(agendaData.slots || "");
      if (moodData.ok) setMoodStats(moodData.stats ?? []);
      if (settingsData.ok) setAllowUserPosting(settingsData.settings.allowUserPosting);
      if (feedData.ok) setFeedModerationPosts(feedData.posts ?? []);

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
      case "Moderar feed":
        document.getElementById("moderacao-feed")?.scrollIntoView({ behavior: "smooth" });
        break;
      default:
        break;
    }
  };

  async function handleTogglePosting() {
    setBusyAction("toggle-posting");
    try {
      const resp = await fetch("/api/admin/platform-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowUserPosting: !allowUserPosting }),
      });
      const data = await resp.json();
      if (data.ok) {
        const nextValue = data.settings.allowUserPosting;
        setAllowUserPosting(nextValue);
        setFeedback(`Publicação no feed ${nextValue ? "ativada" : "desativada"} com sucesso.`);
        
        // Notificar outras abas instantaneamente
        const channel = new BroadcastChannel("platform-settings");
        channel.postMessage({ type: "SETTINGS_UPDATED", allowUserPosting: nextValue });
        channel.close();
      }
    } catch {
      setFeedback("Falha ao atualizar permissão de postagem.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleAdminDeletePost(id: string) {
    if (!confirm("Deseja realmente excluir este post permanentemente?")) return;
    setBusyAction(`delete-post-${id}`);
    try {
      const resp = await fetch(`/api/admin/feed-moderation?id=${id}`, { method: "DELETE" });
      const data = await resp.json();
      if (data.ok) {
        setFeedModerationPosts(prev => prev.filter(p => p.id !== id));
        setFeedback("Post removido com sucesso.");
      }
    } catch {
      setFeedback("Erro ao remover post.");
    } finally {
      setBusyAction(null);
    }
  }

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
            <form className="grid gap-3 md:grid-cols-6" onSubmit={(event) => void handleCreateUser(event)}>
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
              <input
                className={inputClassName}
                placeholder="Senha inicial"
                type="password"
                value={userForm.password}
                onChange={(event) =>
                  setUserForm((current) => ({ ...current, password: event.target.value }))
                }
                required
              />
              <Button type="submit" disabled={busyAction === "create-user"}>
                {busyAction === "create-user" ? "Salvando..." : "Criar"}
              </Button>
            </form>

            <div className="mt-8 space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-6">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                  {(["TODOS", "USER", "PROFESSIONAL", "ADMIN"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveUserTab(tab)}
                      className={cn(
                        "whitespace-nowrap px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all rounded-lg",
                        activeUserTab === tab
                          ? "bg-[#0264af] text-white"
                          : "text-slate-500 hover:bg-slate-100"
                      )}
                    >
                      {tab === "TODOS" ? "Todos" : tab === "USER" ? "Pacientes" : tab === "PROFESSIONAL" ? "Pro" : "Admins"}
                    </button>
                  ))}
                </div>
                <div className="relative w-full sm:w-64">
                  <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    className={cn(inputClassName, "pl-10 py-2")}
                    placeholder="Buscar por nome ou e-mail..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {loading ? (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    Carregando usuários...
                  </div>
                ) : null}
                
                {users
                  .filter((u) => activeUserTab === "TODOS" || u.role === activeUserTab)
                  .filter((u) => 
                    userSearch === "" || 
                    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                    u.email.toLowerCase().includes(userSearch.toLowerCase())
                  )
                  .map((user) => (
                    <div
                      key={user.id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between transition-all hover:border-slate-200 hover:bg-white"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900">{user.name}</p>
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                            user.role === "ADMIN" ? "bg-purple-100 text-purple-700" :
                            user.role === "PROFESSIONAL" ? "bg-amber-100 text-amber-700" :
                            "bg-blue-100 text-blue-700"
                          )}>
                            {user.role}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">
                          {user.email} {user.company ? `· ${user.company}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-bold text-slate-400 mr-2">{user.score} pts</span>
                        <Button
                          variant={user.isActive ? "outline" : "secondary"}
                          size="sm"
                          onClick={() => void toggleUserStatus(user)}
                          disabled={busyAction === `toggle-user-${user.id}`}
                          className="h-8 text-xs"
                        >
                          {busyAction === `toggle-user-${user.id}`
                            ? "..."
                            : user.isActive
                              ? "Inativar"
                              : "Ativar"}
                        </Button>
                        <button 
                          onClick={() => void handleDeleteUser(user.id)}
                          className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}

                {users.length > 0 && users.filter((u) => (activeUserTab === "TODOS" || u.role === activeUserTab) && (userSearch === "" || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))).length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-sm italic">
                    Nenhum usuário encontrado com esses filtros.
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Ações rápidas</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {[
                "Gerenciar prestadores",
                "Aprovar profissionais",
                "Disparar comunicado",
                "Configurar gamificação",
                "Relatórios mensais",
                "Moderar feed",
              ].map((action) => (
                <button
                  key={action}
                  onClick={() => handleQuickAction(action)}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white p-4 text-center transition-all hover:border-[#0264af]/20 hover:bg-[#0264af]/5 hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600 transition-colors">
                    {action === "Gerenciar prestadores" && <Users size={18} />}
                    {action === "Aprovar profissionais" && <Stethoscope size={18} />}
                    {action === "Disparar comunicado" && <Megaphone size={18} />}
                    {action === "Configurar gamificação" && <Star size={18} />}
                    {action === "Relatórios mensais" && <Activity size={18} />}
                    {action === "Moderar feed" && <Settings size={18} />}
                  </div>
                  <span className="text-xs font-bold text-slate-700">{action}</span>
                </button>
              ))}
            </div>

            <div className="space-y-3 mt-6">
              <Link href="/admin/conteudos" className="block cursor-pointer p-5 transition-all hover:border-blue-300 hover:shadow-md rounded-xl border bg-card text-card-foreground shadow">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0264af]">
                    Gerenciar Cards de Conteúdo
                  </span>
                  <ChevronRight size={20} className="text-[#0264af]" />
                </div>
              </Link>
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
        </div>

        <div id="moderacao-feed" className="grid grid-cols-1 gap-6 lg:grid-cols-[0.7fr_1.3fr] mt-2 mb-12">
          {/* Controle Global */}
          <Card className="p-6 border-indigo-100 shadow-sm bg-indigo-50/20">
            <h3 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
              <Settings className="text-indigo-600 h-5 w-5" />
              Configurações do Feed
            </h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Ative ou desative a capacidade dos usuários (pacientes) de criarem novas publicações no feed da plataforma.
            </p>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-indigo-100">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  allowUserPosting ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                )}>
                  {allowUserPosting ? <Send size={18} /> : <Lock size={18} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Postagem de Usuários</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {allowUserPosting ? "Liberado" : "Bloqueado"}
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => void handleTogglePosting()}
                disabled={busyAction === "toggle-posting"}
                variant={allowUserPosting ? "outline" : "primary"}
                size="sm"
                className="rounded-xl px-6"
              >
                {busyAction === "toggle-posting" ? "..." : allowUserPosting ? "Desativar" : "Ativar"}
              </Button>
            </div>
          </Card>

          {/* Moderação de Posts */}
          <Card className="p-6 border-slate-100 shadow-sm bg-white">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="text-slate-500 h-5 w-5" />
                  Moderação do Feed
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {feedModerationPosts.length} posts recentes
                </span>
             </div>

             <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                {feedModerationPosts.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400 italic">
                    Nenhum post para moderar no momento.
                  </div>
                ) : (
                  feedModerationPosts.map((post) => (
                    <div key={post.id} className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white transition-all">
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                             <p className="text-sm font-bold text-slate-900 truncate">{post.author.name}</p>
                             <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                                {post.author.email}
                             </span>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2">{post.caption || "Sem legenda"}</p>
                          <div className="mt-2 flex items-center gap-2">
                             <span className="text-[10px] font-medium text-slate-400">
                                {new Date(post.createdAt).toLocaleDateString("pt-BR")}
                             </span>
                          </div>
                       </div>
                       <Button 
                          onClick={() => void handleAdminDeletePost(post.id)}
                          disabled={busyAction === `delete-post-${post.id}`}
                          variant="outline" 
                          size="sm" 
                          className="h-9 w-9 p-0 rounded-xl border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={16} />
                       </Button>
                    </div>
                  ))
                )}
             </div>
          </Card>
        </div>
      </div>
    </BackofficeShell>
  );
}
