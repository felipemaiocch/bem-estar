"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  FileText,
  Loader2,
  Megaphone,
  Pencil,
  Save,
  Search,
  Send,
  Shield,
  Stethoscope,
  Trash2,
  UserX,
  X,
  UserCheck,
  Users,
} from "lucide-react";

import { BackofficeShell } from "@/components/layout/backoffice-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { departmentOptions, getDepartmentLabel, type DepartmentCode } from "@/lib/departments";
import { cn } from "@/lib/utils";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "PROFESSIONAL" | "ADMIN";
  isActive: boolean;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  company: string | null;
  department: string | null;
  score: number;
  drCoins: number;
  groupNames?: string[];
};

type UserDepartmentTab = "TODOS" | "SEM_DEPARTAMENTO" | "PENDING" | DepartmentCode;

type UserEditForm = {
  name: string;
  email: string;
  role: AdminUser["role"];
  company: string;
  department: DepartmentCode | "";
  score: string;
};

type AdminProfessional = {
  id: string;
  name: string;
  email: string;
  specialty: string;
  attendanceRate: number;
  isActive: boolean;
};

type AdminEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  startsAtIso: string;
  status: "DRAFT" | "PUBLISHED" | "COMPLETED" | "CANCELED";
  points: number;
};

type FeedPost = {
  id: string;
  caption: string | null;
  createdAt: string;
  author: {
    name: string;
    email: string;
  };
};

const statusClassName: Record<string, string> = {
  APPROVED: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-amber-50 text-amber-700",
  REJECTED: "bg-red-50 text-red-700",
  PUBLISHED: "bg-emerald-50 text-emerald-700",
  DRAFT: "bg-slate-100 text-slate-600",
  COMPLETED: "bg-blue-50 text-blue-700",
  CANCELED: "bg-red-50 text-red-700",
};

function StatusPill({ value }: { value: string }) {
  return (
    <span className={cn("rounded-full px-2 py-1 text-[10px] font-black uppercase", statusClassName[value] ?? "bg-slate-100 text-slate-600")}>
      {value}
    </span>
  );
}

function LoadingState() {
  return (
    <Card className="flex items-center gap-2 p-5 text-sm font-medium text-slate-500">
      <Loader2 className="h-4 w-4 animate-spin" />
      Carregando dados...
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card className="border-dashed p-6 text-sm text-slate-500">
      {text}
    </Card>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{detail}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0264af]">
          <Icon size={22} />
        </div>
      </div>
    </Card>
  );
}

export function AdminOverviewScreen() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [professionals, setProfessionals] = useState<AdminProfessional[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [cardsCount, setCardsCount] = useState(0);
  const [moderationCount, setModerationCount] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [usersResponse, professionalsResponse, eventsResponse, cardsResponse, feedResponse] = await Promise.all([
          fetch("/api/admin/users", { cache: "no-store" }),
          fetch("/api/admin/professionals", { cache: "no-store" }),
          fetch("/api/admin/events", { cache: "no-store" }),
          fetch("/api/admin/cards", { cache: "no-store" }),
          fetch("/api/admin/feed-moderation?limit=10", { cache: "no-store" }),
        ]);
        const [usersData, professionalsData, eventsData, cardsData, feedData] = await Promise.all([
          usersResponse.json(),
          professionalsResponse.json(),
          eventsResponse.json(),
          cardsResponse.json(),
          feedResponse.json(),
        ]);

        if (usersData.ok) setUsers(usersData.users ?? []);
        if (professionalsData.ok) setProfessionals(professionalsData.professionals ?? []);
        if (eventsData.ok) setEvents(eventsData.events ?? []);
        if (cardsData.ok) setCardsCount(cardsData.cards?.length ?? 0);
        if (feedData.ok) setModerationCount(feedData.posts?.length ?? 0);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const pendingUsers = users.filter((user) => user.approvalStatus === "PENDING").length;
  const publishedEvents = events.filter((event) => event.status === "PUBLISHED").length;

  return (
    <BackofficeShell badge="Dashboard" title="Visão geral" description="Resumo operacional da plataforma. Cada módulo agora fica na sua própria tela.">
      {loading ? <LoadingState /> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} label="Usuários" value={users.length} detail={`${pendingUsers} pendente(s)`} />
        <MetricCard icon={Stethoscope} label="Profissionais" value={professionals.length} detail="Equipe cadastrada" />
        <MetricCard icon={CalendarDays} label="Eventos" value={publishedEvents} detail="Publicados" />
        <MetricCard icon={FileText} label="Conteúdos" value={cardsCount} detail="Cards ativos" />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <MetricCard icon={Activity} label="Moderação" value={moderationCount} detail="Posts recentes no radar" />
        <MetricCard icon={Shield} label="Status" value="OK" detail="Vercel + Neon conectados" />
      </div>
    </BackofficeShell>
  );
}

export function AdminUsersScreen() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<UserDepartmentTab>("TODOS");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UserEditForm | null>(null);

  async function loadUsers() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const data = await response.json();
      if (data.ok) setUsers(data.users ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  const groupedUsers = useMemo(
    () => ({
      pending: users.filter((user) => user.approvalStatus === "PENDING"),
      active: users.filter((user) => user.approvalStatus === "APPROVED"),
      inactive: users.filter((user) => !user.isActive),
    }),
    [users],
  );

  const departmentTabs = useMemo(
    () => [
      { value: "TODOS" as const, label: "Todos", count: users.length },
      ...departmentOptions.map((department) => ({
        value: department.value,
        label: department.label,
        count: users.filter((user) => user.department === department.value).length,
      })),
      {
        value: "SEM_DEPARTAMENTO" as const,
        label: "Sem departamento",
        count: users.filter((user) => !user.department).length,
      },
      {
        value: "PENDING" as const,
        label: "Pendentes",
        count: groupedUsers.pending.length,
      },
    ],
    [groupedUsers.pending.length, users],
  );

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesTab =
        activeTab === "TODOS" ||
        (activeTab === "SEM_DEPARTAMENTO" && !user.department) ||
        (activeTab === "PENDING" && user.approvalStatus === "PENDING") ||
        user.department === activeTab;

      if (!matchesTab) return false;
      if (!normalizedSearch) return true;

      return (
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        (user.company ?? "").toLowerCase().includes(normalizedSearch) ||
        getDepartmentLabel(user.department).toLowerCase().includes(normalizedSearch)
      );
    });
  }, [activeTab, search, users]);

  function startEditUser(user: AdminUser) {
    setEditingUserId(user.id);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company ?? "",
      department: (user.department as DepartmentCode | null) ?? "",
      score: String(user.score),
    });
  }

  function cancelEditUser() {
    setEditingUserId(null);
    setEditForm(null);
  }

  async function patchUser(userId: string, payload: Record<string, unknown>, actionKey: string) {
    setBusyAction(actionKey);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Não foi possível atualizar usuário.");
      }

      setUsers((current) =>
        current.map((user) => (user.id === userId ? { ...user, ...data.user } : user)),
      );
      return true;
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Não foi possível atualizar usuário.");
      return false;
    } finally {
      setBusyAction(null);
    }
  }

  async function saveEditUser(userId: string) {
    if (!editForm) return;

    const score = Number.parseInt(editForm.score || "0", 10);
    const saved = await patchUser(
      userId,
      {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        company: editForm.company,
        department: editForm.department || null,
        score: Number.isFinite(score) ? score : 0,
      },
      `save-user-${userId}`,
    );

    if (saved) {
      cancelEditUser();
    }
  }

  async function updateUserApproval(user: AdminUser, approvalStatus: "APPROVED" | "REJECTED") {
    await patchUser(user.id, { approvalStatus }, `${approvalStatus.toLowerCase()}-user-${user.id}`);
  }

  async function toggleUserStatus(user: AdminUser) {
    await patchUser(user.id, { isActive: !user.isActive }, `toggle-user-${user.id}`);
  }

  async function deleteUser(user: AdminUser) {
    const confirmed = window.confirm(`Excluir o usuário ${user.name}? Essa ação não pode ser desfeita.`);
    if (!confirmed) return;

    setBusyAction(`delete-user-${user.id}`);
    try {
      const response = await fetch(`/api/admin/users?id=${user.id}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Não foi possível excluir usuário.");
      }

      setUsers((current) => current.filter((item) => item.id !== user.id));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Não foi possível excluir usuário.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <BackofficeShell badge="Usuários" title="Gestão de usuários" description="Cadastros, aprovação, departamentos e pontuação dos usuários.">
      {loading ? <LoadingState /> : null}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={Users} label="Total" value={users.length} detail="Cadastros no sistema" />
        <MetricCard icon={UserCheck} label="Aprovados" value={groupedUsers.active.length} detail="Liberados para acesso" />
        <MetricCard icon={Shield} label="Pendentes" value={groupedUsers.pending.length} detail="Aguardando aprovação" />
        <MetricCard icon={UserX} label="Inativos" value={groupedUsers.inactive.length} detail="Bloqueados no acesso" />
      </div>

      <Card className="mt-6 p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {departmentTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider transition-colors",
                  activeTab === tab.value
                    ? "bg-[#0264af] text-white shadow-[0_10px_24px_-16px_rgba(2,100,175,0.75)]"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100",
                )}
              >
                {tab.label} · {tab.count}
              </button>
            ))}
          </div>
          <div className="relative w-full xl:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-semibold text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0264af] focus:bg-white"
              placeholder="Pesquisar por nome, e-mail ou setor..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-3">
        {users.length === 0 && !loading ? <EmptyState text="Nenhum usuário cadastrado." /> : null}
        {filteredUsers.map((user) => {
          const isEditing = editingUserId === user.id && editForm;

          return (
            <Card key={user.id} className="p-4">
              {isEditing ? (
                <div className="grid gap-3 lg:grid-cols-12">
                  <input
                    className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-[#0264af] focus:bg-white lg:col-span-2"
                    value={editForm.name}
                    onChange={(event) => setEditForm((current) => current ? { ...current, name: event.target.value } : current)}
                    placeholder="Nome"
                  />
                  <input
                    className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-[#0264af] focus:bg-white lg:col-span-3"
                    value={editForm.email}
                    onChange={(event) => setEditForm((current) => current ? { ...current, email: event.target.value } : current)}
                    placeholder="E-mail"
                    type="email"
                  />
                  <select
                    className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-[#0264af] focus:bg-white lg:col-span-2"
                    value={editForm.role}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current ? { ...current, role: event.target.value as AdminUser["role"] } : current,
                      )
                    }
                  >
                    <option value="USER">Usuário</option>
                    <option value="PROFESSIONAL">Profissional</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <select
                    className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-[#0264af] focus:bg-white lg:col-span-2"
                    value={editForm.department}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current ? { ...current, department: event.target.value as DepartmentCode | "" } : current,
                      )
                    }
                  >
                    <option value="">Sem departamento</option>
                    {departmentOptions.map((department) => (
                      <option key={department.value} value={department.value}>
                        {department.label}
                      </option>
                    ))}
                  </select>
                  <input
                    className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-[#0264af] focus:bg-white lg:col-span-2"
                    value={editForm.company}
                    onChange={(event) => setEditForm((current) => current ? { ...current, company: event.target.value } : current)}
                    placeholder="Empresa/área"
                  />
                  <input
                    className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-[#0264af] focus:bg-white lg:col-span-1"
                    value={editForm.score}
                    onChange={(event) => setEditForm((current) => current ? { ...current, score: event.target.value } : current)}
                    placeholder="Pontos"
                    inputMode="numeric"
                  />
                  <div className="flex flex-wrap gap-2 lg:col-span-12">
                    <Button size="sm" onClick={() => void saveEditUser(user.id)} disabled={busyAction === `save-user-${user.id}`}>
                      <Save size={14} />
                      Salvar
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEditUser}>
                      <X size={14} />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-slate-950">{user.name}</h2>
                      <StatusPill value={user.approvalStatus} />
                      <span className={cn(
                        "rounded-full px-2 py-1 text-[10px] font-black uppercase",
                        user.role === "ADMIN"
                          ? "bg-purple-50 text-purple-700"
                          : user.role === "PROFESSIONAL"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-blue-50 text-blue-700",
                      )}>
                        {user.role}
                      </span>
                      {!user.isActive ? (
                        <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-black uppercase text-rose-700">
                          Inativo
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {user.email}
                      {user.company ? ` · ${user.company}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                      <span className={cn(
                        "rounded-lg px-2 py-1",
                        user.department ? "bg-[#0264af]/10 text-[#0264af]" : "bg-amber-50 text-amber-700",
                      )}>
                        EAD: {getDepartmentLabel(user.department)}
                      </span>
                      <span className="rounded-lg bg-slate-50 px-2 py-1 text-slate-500">
                        {user.score} pts
                      </span>
                      <span className="rounded-lg bg-orange-50 px-2 py-1 text-orange-600">
                        {user.drCoins} drcoins
                      </span>
                    </div>
                    {user.groupNames?.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {user.groupNames.map((groupName) => (
                          <span key={groupName} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {groupName}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {user.approvalStatus === "PENDING" ? (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => void updateUserApproval(user, "APPROVED")}
                          disabled={busyAction === `approved-user-${user.id}`}
                        >
                          <UserCheck size={14} />
                          Aprovar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void updateUserApproval(user, "REJECTED")}
                          disabled={busyAction === `rejected-user-${user.id}`}
                          className="text-rose-600 hover:text-rose-600"
                        >
                          <UserX size={14} />
                          Rejeitar
                        </Button>
                      </>
                    ) : null}
                    <Button size="sm" variant="outline" onClick={() => startEditUser(user)}>
                      <Pencil size={14} />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant={user.isActive ? "outline" : "secondary"}
                      onClick={() => void toggleUserStatus(user)}
                      disabled={busyAction === `toggle-user-${user.id}`}
                    >
                      {user.isActive ? "Inativar" : "Ativar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void deleteUser(user)}
                      disabled={busyAction === `delete-user-${user.id}`}
                      className="text-rose-600 hover:text-rose-600"
                    >
                      <Trash2 size={14} />
                      Excluir
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {filteredUsers.length === 0 && users.length > 0 && !loading ? (
          <EmptyState text="Nenhum usuário encontrado com esses filtros." />
        ) : null}
      </div>
    </BackofficeShell>
  );
}

export function AdminEventsScreen() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/admin/events", { cache: "no-store" });
      const data = await response.json();
      if (data.ok) setEvents(data.events ?? []);
      setLoading(false);
    }

    void load();
  }, []);

  return (
    <BackofficeShell badge="Eventos" title="Eventos e aulas presenciais" description="Agenda, presença, pontuação e próximas turmas.">
      {loading ? <LoadingState /> : null}
      <div className="grid gap-3">
        {events.length === 0 && !loading ? <EmptyState text="Nenhum evento cadastrado." /> : null}
        {events.map((event) => (
          <Card key={event.id} className="p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold text-slate-950">{event.title}</h2>
                  <StatusPill value={event.status} />
                </div>
                <p className="mt-1 text-sm text-slate-500">{event.description}</p>
                <p className="mt-2 text-xs font-bold text-slate-400">{event.category} · {event.location}</p>
              </div>
              <div className="text-sm font-black text-[#0264af]">+{event.points} pts</div>
            </div>
          </Card>
        ))}
      </div>
    </BackofficeShell>
  );
}

export function AdminProfessionalsScreen() {
  const [professionals, setProfessionals] = useState<AdminProfessional[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/admin/professionals", { cache: "no-store" });
      const data = await response.json();
      if (data.ok) setProfessionals(data.professionals ?? []);
      setLoading(false);
    }

    void load();
  }, []);

  return (
    <BackofficeShell badge="Profissionais" title="Profissionais" description="Especialidades, agenda e acompanhamento dos profissionais.">
      {loading ? <LoadingState /> : null}
      <div className="grid gap-3">
        {professionals.length === 0 && !loading ? <EmptyState text="Nenhum profissional cadastrado." /> : null}
        {professionals.map((professional) => (
          <Card key={professional.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-bold text-slate-950">{professional.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{professional.email}</p>
            </div>
            <div className="text-sm font-semibold text-slate-500">
              {professional.specialty} · {Math.round(professional.attendanceRate)}% presença
            </div>
          </Card>
        ))}
      </div>
    </BackofficeShell>
  );
}

export function AdminReportsScreen() {
  return (
    <BackofficeShell badge="Relatórios" title="Relatórios" description="Indicadores consolidados por período, área e profissional.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={BarChart3} label="Engajamento" value="Em análise" detail="Base para relatórios mensais" />
        <MetricCard icon={Users} label="Usuários" value="Por área" detail="Filtros por departamento" />
        <MetricCard icon={CalendarDays} label="Eventos" value="Presença" detail="Comparecimento e faltas" />
        <MetricCard icon={Activity} label="Humor" value="Mapa" detail="Check-ins e risco futuro" />
      </div>
    </BackofficeShell>
  );
}

export function AdminComplianceScreen() {
  return (
    <BackofficeShell badge="Compliance" title="Termos e aceite" description="Controle de aceite obrigatório, LGPD e termos da plataforma.">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={Shield} label="Termo obrigatório" value="Ativo" detail="Bloqueia acesso sem aceite" />
        <MetricCard icon={FileText} label="Imagem/publicação" value="Mapeado" detail="Aceites por módulo" />
        <MetricCard icon={Users} label="Usuários" value="Auditoria" detail="Histórico de aceite" />
      </div>
    </BackofficeShell>
  );
}

export function AdminModerationScreen() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [allowUserPosting, setAllowUserPosting] = useState(true);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function loadModeration() {
      const [settingsResponse, postsResponse] = await Promise.all([
        fetch("/api/admin/platform-settings", { cache: "no-store" }),
        fetch("/api/admin/feed-moderation?limit=50", { cache: "no-store" }),
      ]);
      const [settingsData, postsData] = await Promise.all([
        settingsResponse.json(),
        postsResponse.json(),
      ]);
      if (settingsData.ok) setAllowUserPosting(Boolean(settingsData.settings.allowUserPosting));
      if (postsData.ok) setPosts(postsData.posts ?? []);
      setLoading(false);
    }

    void loadModeration();
  }, []);

  async function togglePosting() {
    const nextValue = !allowUserPosting;
    const response = await fetch("/api/admin/platform-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allowUserPosting: nextValue }),
    });
    const data = await response.json();
    if (data.ok) {
      setAllowUserPosting(nextValue);
      setFeedback(nextValue ? "Postagens liberadas." : "Postagens bloqueadas.");
    }
  }

  return (
    <BackofficeShell badge="Moderação" title="Moderação do feed" description="Controle de postagem e acompanhamento de publicações recentes.">
      {feedback ? <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">{feedback}</div> : null}
      <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
        <Card className="p-5">
          <h2 className="font-bold text-slate-950">Postagem de usuários</h2>
          <p className="mt-2 text-sm text-slate-500">Abre ou fecha a postagem no feed para usuários.</p>
          <Button className="mt-4" variant={allowUserPosting ? "outline" : "primary"} onClick={() => void togglePosting()}>
            {allowUserPosting ? "Bloquear postagens" : "Liberar postagens"}
          </Button>
        </Card>
        <div className="space-y-3">
          {loading ? <LoadingState /> : null}
          {posts.length === 0 && !loading ? <EmptyState text="Nenhuma publicação recente." /> : null}
          {posts.map((post) => (
            <Card key={post.id} className="p-4">
              <p className="text-sm font-semibold text-slate-950">{post.author.name}</p>
              <p className="mt-1 text-sm text-slate-500">{post.caption ?? "Publicação sem legenda."}</p>
            </Card>
          ))}
        </div>
      </div>
    </BackofficeShell>
  );
}

export function AdminNotificationsScreen() {
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendNotification(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/global-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setFeedback(data.error ?? "Não foi possível enviar o comunicado.");
        return;
      }
      setMessage("");
      setFeedback("Comunicado enviado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <BackofficeShell badge="Notificações" title="Comunicados" description="Envie avisos internos e mensagens globais para os usuários.">
      {feedback ? <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">{feedback}</div> : null}
      <Card className="p-6">
        <form className="space-y-4" onSubmit={(event) => void sendNotification(event)}>
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-[#0264af]" />
              <h2 className="font-bold text-slate-950">Novo comunicado</h2>
            </div>
            <textarea
              className="min-h-36 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#0264af] focus:bg-white"
              placeholder="Escreva o comunicado..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Enviando..." : "Enviar comunicado"}
            <Send size={16} />
          </Button>
        </form>
      </Card>
    </BackofficeShell>
  );
}
