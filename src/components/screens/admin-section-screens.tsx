"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BookOpen,
  CalendarDays,
  Download,
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
  Trophy,
  UserX,
  X,
  UserCheck,
  Users,
} from "lucide-react";

import { BackofficeShell } from "@/components/layout/backoffice-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { adminPermissionOptions } from "@/lib/admin-permission-options";
import { departmentOptions, getDepartmentLabel, type DepartmentCode } from "@/lib/departments";
import { cn } from "@/lib/utils";
import type { AdminPermission } from "@prisma/client";

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
  adminPermissions: AdminPermission[];
};

type UserDepartmentTab = "TODOS" | "SEM_DEPARTAMENTO" | "PENDING" | DepartmentCode;

type UserEditForm = {
  name: string;
  email: string;
  role: AdminUser["role"];
  company: string;
  department: DepartmentCode | "";
  score: string;
  adminPermissions: AdminPermission[];
};

const defaultCreateUserForm = {
  name: "",
  email: "",
  role: "USER" as AdminUser["role"],
  department: "COMERCIAL" as DepartmentCode,
  company: "",
  specialty: "",
  password: "",
  adminPermissions: [] as AdminPermission[],
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

type MasterReport = {
  generatedAt: string;
  period: {
    from: string | null;
    to: string | null;
    department: string;
    departmentLabel: string;
  };
  modules: {
    users: {
      total: number;
      active: number;
      pending: number;
      newInPeriod: number;
      byDepartment: Array<{ department: string; departmentLabel: string; count: number }>;
    };
    professionals: {
      total: number;
      sessions: number;
      scheduled: number;
      confirmed: number;
      completed: number;
      missed: number;
      completionRate: number;
    };
    events: {
      total: number;
      published: number;
      upcoming: number;
      participations: number;
      checkins: number;
      presenceRate: number;
    };
    wellness: {
      checkins: number;
      uniqueUsers: number;
      avgEnergy: number;
      alertCount: number;
      alertRate: number;
      moodCounts: Array<{ mood: string; count: number }>;
      byDepartment: Array<{ department: string; departmentLabel: string; checkins: number; alerts: number; alertRate: number }>;
    };
    ead: {
      courses: number;
      lessons: number;
      completions: number;
      resources: number;
      ratings: number;
      averageRating: number;
    };
    library: {
      items: number;
      reservations: number;
      borrowed: number;
      overdue: number;
      consultations: number;
    };
    content: {
      cardsActive: number;
      feedPosts: number;
      feedPending: number;
      openReports: number;
    };
    communication: {
      notificationsSent: number;
      notificationsFailed: number;
      acceptances: number;
    };
    gamification: {
      totalScore: number;
      totalCoins: number;
      topUsers: Array<{ id: string; name: string; email: string; department: string | null; departmentLabel: string; score: number; drCoins: number }>;
    };
  };
};

type MasterReportMode = "dashboard" | "reports";

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

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function defaultFromDate() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return toInputDate(date);
}

function formatReportDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

function reportPeriodLabel(report: MasterReport | null) {
  if (!report?.period.from && !report?.period.to) return "Todo o histórico";
  return `${formatReportDate(report.period.from)} até ${formatReportDate(report.period.to)}`;
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function MasterReportPanel({ mode }: { mode: MasterReportMode }) {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<MasterReport | null>(null);
  const [from, setFrom] = useState(defaultFromDate);
  const [to, setTo] = useState(() => toInputDate(new Date()));
  const [department, setDepartment] = useState("ALL");
  const isReports = mode === "reports";

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("from", from);
      params.set("to", to);
      params.set("department", department);
      const response = await fetch(`/api/admin/master-report?${params.toString()}`, { cache: "no-store" });
      const data = await response.json();
      if (data.ok) setReport(data.report);
    } finally {
      setLoading(false);
    }
  }, [department, from, to]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const executiveCards = useMemo(() => {
    if (!report) return [];
    return [
      { icon: Users, label: "Usuários ativos", value: report.modules.users.active, detail: `${report.modules.users.pending} pendente(s) de aprovação` },
      { icon: Activity, label: "Check-ins", value: report.modules.wellness.checkins, detail: `${report.modules.wellness.alertRate}% em atenção` },
      { icon: CalendarDays, label: "Eventos", value: report.modules.events.published, detail: `${report.modules.events.presenceRate}% presença` },
      { icon: Stethoscope, label: "Atendimentos", value: report.modules.professionals.sessions, detail: `${report.modules.professionals.completionRate}% concluídos` },
      { icon: BookOpen, label: "Biblioteca", value: report.modules.library.items, detail: `${report.modules.library.overdue} atraso(s)` },
      { icon: FileText, label: "EAD", value: report.modules.ead.completions, detail: `${report.modules.ead.averageRating || 0}/5 avaliação média` },
      { icon: Trophy, label: "Pontuação", value: compactNumber(report.modules.gamification.totalScore), detail: `${compactNumber(report.modules.gamification.totalCoins)} drcoins` },
      { icon: Shield, label: "Moderação", value: report.modules.content.openReports + report.modules.content.feedPending, detail: "itens no radar" },
    ];
  }, [report]);

  async function downloadMasterPdf() {
    if (!report) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    let y = 44;

    function line(text: string, size = 10, bold = false) {
      if (y > 770) {
        doc.addPage();
        y = 44;
      }
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text, 515) as string[];
      doc.text(lines, margin, y);
      y += lines.length * (size + 4);
    }

    line("Relatório Master da Plataforma", 18, true);
    line(`Período: ${reportPeriodLabel(report)} · Departamento: ${report.period.departmentLabel}`);
    line(`Gerado em: ${formatReportDate(report.generatedAt)}`);
    y += 8;

    executiveCards.forEach((card) => line(`${card.label}: ${card.value} (${card.detail})`, 11, true));
    y += 8;
    line("Usuários por departamento", 13, true);
    report.modules.users.byDepartment.forEach((item) => line(`${item.departmentLabel}: ${item.count}`));
    y += 8;
    line("Check-ins por departamento", 13, true);
    report.modules.wellness.byDepartment.forEach((item) => line(`${item.departmentLabel}: ${item.checkins} check-ins · ${item.alertRate}% atenção`));
    y += 8;
    line("Top pontuação", 13, true);
    report.modules.gamification.topUsers.forEach((user, index) => line(`${index + 1}. ${user.name} · ${user.departmentLabel} · ${user.score} pts · ${user.drCoins} drcoins`));
    y += 8;
    line("Módulos operacionais", 13, true);
    line(`EAD: ${report.modules.ead.courses} curso(s), ${report.modules.ead.lessons} aula(s), ${report.modules.ead.completions} conclusão(ões), ${report.modules.ead.averageRating}/5 avaliação média.`);
    line(`Biblioteca: ${report.modules.library.items} item(ns), ${report.modules.library.reservations} reserva(s), ${report.modules.library.borrowed} empréstimo(s), ${report.modules.library.overdue} atraso(s).`);
    line(`Eventos: ${report.modules.events.published} publicado(s), ${report.modules.events.upcoming} futuro(s), ${report.modules.events.participations} participação(ões), ${report.modules.events.presenceRate}% presença.`);
    line(`Profissionais: ${report.modules.professionals.total} cadastrado(s), ${report.modules.professionals.sessions} atendimento(s), ${report.modules.professionals.completionRate}% concluídos.`);
    line(`Comunicação: ${report.modules.communication.notificationsSent} notificação(ões) enviada(s), ${report.modules.communication.notificationsFailed} falha(s), ${report.modules.communication.acceptances} aceite(s).`);

    doc.save(`relatorio-master-${from}-${to}.pdf`);
  }

  async function downloadMasterExcel() {
    if (!report) return;
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Pulse Hub";
    workbook.created = new Date();

    function sheet(name: string, columns: Array<{ header: string; key: string; width?: number }>, rows: Array<Record<string, string | number | null>>) {
      const ws = workbook.addWorksheet(name);
      ws.columns = columns.map((column) => ({ ...column, width: column.width ?? 18 }));
      ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0264AF" } };
      ws.addRows(rows);
      ws.views = [{ state: "frozen", ySplit: 1 }];
      ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
    }

    sheet("Indicadores", [
      { header: "Módulo", key: "module", width: 24 },
      { header: "Indicador", key: "label", width: 32 },
      { header: "Valor", key: "value", width: 18 },
      { header: "Observação", key: "detail", width: 42 },
    ], executiveCards.map((card) => ({ module: "Master", label: card.label, value: String(card.value), detail: card.detail })));

    sheet("Usuários por área", [
      { header: "Departamento", key: "departmentLabel", width: 28 },
      { header: "Usuários", key: "count", width: 14 },
    ], report.modules.users.byDepartment);

    sheet("Check-ins por área", [
      { header: "Departamento", key: "departmentLabel", width: 28 },
      { header: "Check-ins", key: "checkins", width: 14 },
      { header: "Alertas", key: "alerts", width: 14 },
      { header: "% atenção", key: "alertRate", width: 14 },
    ], report.modules.wellness.byDepartment);

    sheet("Humor", [
      { header: "Humor", key: "mood", width: 24 },
      { header: "Quantidade", key: "count", width: 14 },
    ], report.modules.wellness.moodCounts);

    sheet("Top ranking", [
      { header: "Nome", key: "name", width: 30 },
      { header: "E-mail", key: "email", width: 38 },
      { header: "Departamento", key: "departmentLabel", width: 24 },
      { header: "Pontos", key: "score", width: 14 },
      { header: "Drcoins", key: "drCoins", width: 14 },
    ], report.modules.gamification.topUsers);

    sheet("Módulos", [
      { header: "Módulo", key: "module", width: 22 },
      { header: "Indicador", key: "label", width: 34 },
      { header: "Valor", key: "value", width: 18 },
    ], [
      { module: "Usuários", label: "Total", value: report.modules.users.total },
      { module: "Usuários", label: "Ativos", value: report.modules.users.active },
      { module: "Usuários", label: "Novos no período", value: report.modules.users.newInPeriod },
      { module: "Profissionais", label: "Cadastrados", value: report.modules.professionals.total },
      { module: "Profissionais", label: "Atendimentos", value: report.modules.professionals.sessions },
      { module: "Profissionais", label: "Atendimentos concluídos", value: report.modules.professionals.completed },
      { module: "Profissionais", label: "Atendimentos faltados", value: report.modules.professionals.missed },
      { module: "Eventos", label: "Total", value: report.modules.events.total },
      { module: "Eventos", label: "Publicados", value: report.modules.events.published },
      { module: "Eventos", label: "Próximos", value: report.modules.events.upcoming },
      { module: "Eventos", label: "Participações", value: report.modules.events.participations },
      { module: "Eventos", label: "Check-ins", value: report.modules.events.checkins },
      { module: "EAD", label: "Cursos", value: report.modules.ead.courses },
      { module: "EAD", label: "Aulas", value: report.modules.ead.lessons },
      { module: "EAD", label: "Conclusões", value: report.modules.ead.completions },
      { module: "EAD", label: "Materiais", value: report.modules.ead.resources },
      { module: "EAD", label: "Avaliações", value: report.modules.ead.ratings },
      { module: "EAD", label: "Avaliação média", value: report.modules.ead.averageRating },
      { module: "Biblioteca", label: "Itens catalogados", value: report.modules.library.items },
      { module: "Biblioteca", label: "Reservas", value: report.modules.library.reservations },
      { module: "Biblioteca", label: "Empréstimos", value: report.modules.library.borrowed },
      { module: "Biblioteca", label: "Atrasos", value: report.modules.library.overdue },
      { module: "Biblioteca", label: "Consultas", value: report.modules.library.consultations },
      { module: "Conteúdo", label: "Cards ativos", value: report.modules.content.cardsActive },
      { module: "Conteúdo", label: "Posts no feed", value: report.modules.content.feedPosts },
      { module: "Conteúdo", label: "Posts pendentes", value: report.modules.content.feedPending },
      { module: "Conteúdo", label: "Denúncias abertas", value: report.modules.content.openReports },
      { module: "Comunicação", label: "Notificações enviadas", value: report.modules.communication.notificationsSent },
      { module: "Comunicação", label: "Notificações com falha", value: report.modules.communication.notificationsFailed },
      { module: "Compliance", label: "Aceites", value: report.modules.communication.acceptances },
    ]);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-master-${from}-${to}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {loading ? <LoadingState /> : null}
      {isReports ? (
        <Card className="mb-5 p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto_auto_auto]">
            <input className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            <input className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
            <select className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" value={department} onChange={(event) => setDepartment(event.target.value)}>
              <option value="ALL">Todos os departamentos</option>
              <option value="SEM_DEPARTAMENTO">Sem departamento</option>
              {departmentOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <Button variant="outline" onClick={() => void loadReport()}>Filtrar</Button>
            <Button onClick={() => void downloadMasterPdf()} disabled={!report}><Download size={16} /> PDF</Button>
            <Button variant="outline" onClick={() => void downloadMasterExcel()} disabled={!report}><Download size={16} /> Excel</Button>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {executiveCards.map((card) => <MetricCard key={card.label} icon={card.icon} label={card.label} value={card.value} detail={card.detail} />)}
      </div>

      {report ? (
        <>
        <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
          <Card className="p-5">
            <h2 className="text-lg font-black text-slate-950">Operação por departamento</h2>
            <p className="mb-4 text-sm font-semibold text-slate-500">Usuários, check-ins e alertas por área.</p>
            <div className="space-y-3">
              {report.modules.users.byDepartment.slice(0, 8).map((item) => {
                const checkin = report.modules.wellness.byDepartment.find((row) => row.department === item.department);
                return (
                  <div key={item.department} className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-950">{item.departmentLabel}</p>
                        <p className="text-sm font-semibold text-slate-500">{item.count} usuário(s) · {checkin?.checkins ?? 0} check-in(s)</p>
                      </div>
                      <span className={cn("rounded-full px-3 py-1 text-xs font-black", (checkin?.alertRate ?? 0) >= 40 ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700")}>
                        {checkin?.alertRate ?? 0}% atenção
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-black text-slate-950">Ranking e riscos</h2>
            <p className="mb-4 text-sm font-semibold text-slate-500">Participação, gamificação e itens pendentes.</p>
            <div className="space-y-3">
              {report.modules.gamification.topUsers.slice(0, 6).map((user, index) => (
                <div key={user.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3">
                  <div>
                    <p className="text-sm font-black text-slate-950">{index + 1}. {user.name}</p>
                    <p className="text-xs font-semibold text-slate-500">{user.departmentLabel}</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">{user.score} pts</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <Card className="p-5">
            <h2 className="text-lg font-black text-slate-950">EAD e capacitação</h2>
            <p className="mb-4 text-sm font-semibold text-slate-500">Cursos, aulas, materiais e avaliação.</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoStat label="Cursos" value={report.modules.ead.courses} />
              <InfoStat label="Aulas" value={report.modules.ead.lessons} />
              <InfoStat label="Conclusões" value={report.modules.ead.completions} />
              <InfoStat label="Avaliação média" value={`${report.modules.ead.averageRating}/5`} />
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="text-lg font-black text-slate-950">Biblioteca</h2>
            <p className="mb-4 text-sm font-semibold text-slate-500">Acervo, reservas e pendências.</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoStat label="Itens" value={report.modules.library.items} />
              <InfoStat label="Reservas" value={report.modules.library.reservations} />
              <InfoStat label="Emprestados" value={report.modules.library.borrowed} />
              <InfoStat label="Atrasados" value={report.modules.library.overdue} tone={report.modules.library.overdue > 0 ? "danger" : "default"} />
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="text-lg font-black text-slate-950">Humor da equipe</h2>
            <p className="mb-4 text-sm font-semibold text-slate-500">Distribuição dos check-ins no período.</p>
            <div className="space-y-2">
              {report.modules.wellness.moodCounts.map((mood) => (
                <div key={mood.mood} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                  <span className="text-sm font-bold text-slate-600">{mood.mood}</span>
                  <span className="text-sm font-black text-slate-950">{mood.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <Card className="p-5">
            <h2 className="text-lg font-black text-slate-950">Eventos</h2>
            <p className="mb-4 text-sm font-semibold text-slate-500">Publicação, agenda e presença.</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoStat label="Publicados" value={report.modules.events.published} />
              <InfoStat label="Próximos" value={report.modules.events.upcoming} />
              <InfoStat label="Participações" value={report.modules.events.participations} />
              <InfoStat label="Presença" value={`${report.modules.events.presenceRate}%`} />
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="text-lg font-black text-slate-950">Profissionais</h2>
            <p className="mb-4 text-sm font-semibold text-slate-500">Atendimentos e comparecimento.</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoStat label="Cadastrados" value={report.modules.professionals.total} />
              <InfoStat label="Atendimentos" value={report.modules.professionals.sessions} />
              <InfoStat label="Concluídos" value={report.modules.professionals.completed} />
              <InfoStat label="Faltas" value={report.modules.professionals.missed} tone={report.modules.professionals.missed > 0 ? "danger" : "default"} />
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="text-lg font-black text-slate-950">Comunicação e compliance</h2>
            <p className="mb-4 text-sm font-semibold text-slate-500">Notificações, aceite e moderação.</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoStat label="Enviadas" value={report.modules.communication.notificationsSent} />
              <InfoStat label="Falhas" value={report.modules.communication.notificationsFailed} tone={report.modules.communication.notificationsFailed > 0 ? "danger" : "default"} />
              <InfoStat label="Aceites" value={report.modules.communication.acceptances} />
              <InfoStat label="Pendências" value={report.modules.content.feedPending + report.modules.content.openReports} />
            </div>
          </Card>
        </div>
        </>
      ) : null}
    </>
  );
}

function InfoStat({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "danger" }) {
  return (
    <div className={cn("rounded-2xl border px-3 py-3", tone === "danger" ? "border-rose-100 bg-rose-50" : "border-slate-100 bg-slate-50")}>
      <p className={cn("text-[11px] font-black uppercase tracking-[0.14em]", tone === "danger" ? "text-rose-500" : "text-slate-400")}>{label}</p>
      <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

export function AdminOverviewScreen() {
  return (
    <BackofficeShell badge="Dashboard" title="Dashboard Master" description="Visão executiva de usuários, engajamento, EAD, biblioteca, eventos, conteúdo, humor e riscos operacionais.">
      <MasterReportPanel mode="dashboard" />
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
  const [createForm, setCreateForm] = useState(defaultCreateUserForm);

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

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("create-user");

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          email: createForm.email,
          role: createForm.role,
          department: createForm.role === "USER" ? createForm.department : undefined,
          company: createForm.role === "PROFESSIONAL" ? undefined : createForm.company || undefined,
          specialty: createForm.role === "PROFESSIONAL" ? createForm.specialty || undefined : undefined,
          password: createForm.password || undefined,
          adminPermissions: createForm.role === "ADMIN" ? createForm.adminPermissions : undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Não foi possível cadastrar usuário.");
      }

      setCreateForm(defaultCreateUserForm);
      await loadUsers();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Não foi possível cadastrar usuário.");
    } finally {
      setBusyAction(null);
    }
  }

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
      adminPermissions: user.adminPermissions ?? [],
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
        adminPermissions: editForm.role === "ADMIN" ? editForm.adminPermissions : [],
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

      <Card className="mt-6 p-5">
        <h2 className="mb-4 text-lg font-black text-slate-950">Cadastrar usuário, profissional ou admin</h2>
        <form className="grid gap-3 lg:grid-cols-6" onSubmit={(event) => void createUser(event)}>
          <input
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-[#0264af] focus:bg-white"
            placeholder="Nome"
            value={createForm.name}
            onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))}
            required
          />
          <input
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-[#0264af] focus:bg-white"
            placeholder="E-mail"
            type="email"
            value={createForm.email}
            onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))}
            required
          />
          <select
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-[#0264af] focus:bg-white"
            value={createForm.role}
            onChange={(event) =>
              setCreateForm((current) => ({ ...current, role: event.target.value as AdminUser["role"] }))
            }
          >
            <option value="USER">Usuário</option>
            <option value="PROFESSIONAL">Profissional</option>
            <option value="ADMIN">Admin</option>
          </select>
          {createForm.role === "USER" ? (
            <select
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-[#0264af] focus:bg-white"
              value={createForm.department}
              onChange={(event) => setCreateForm((current) => ({ ...current, department: event.target.value as DepartmentCode }))}
            >
              {departmentOptions.map((department) => (
                <option key={department.value} value={department.value}>
                  {department.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-[#0264af] focus:bg-white"
              placeholder={createForm.role === "PROFESSIONAL" ? "Especialidade" : "Área/empresa"}
              value={createForm.role === "PROFESSIONAL" ? createForm.specialty : createForm.company}
              onChange={(event) =>
                setCreateForm((current) =>
                  current.role === "PROFESSIONAL"
                    ? { ...current, specialty: event.target.value }
                    : { ...current, company: event.target.value },
                )
              }
            />
          )}
          <input
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-[#0264af] focus:bg-white"
            placeholder="Senha inicial"
            type="password"
            value={createForm.password}
            onChange={(event) => setCreateForm((current) => ({ ...current, password: event.target.value }))}
          />
          <Button type="submit" disabled={busyAction === "create-user"}>
            {busyAction === "create-user" ? "Salvando..." : "Cadastrar"}
          </Button>
          {createForm.role === "ADMIN" ? (
            <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3 lg:col-span-6">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-purple-700">
                Permissões do admin
              </p>
              <p className="mb-3 text-xs text-slate-500">Sem permissões marcadas = admin master com acesso total.</p>
              <div className="flex flex-wrap gap-2">
                {adminPermissionOptions.map((permission) => {
                  const selected = createForm.adminPermissions.includes(permission.value);
                  return (
                    <button
                      key={permission.value}
                      type="button"
                      onClick={() =>
                        setCreateForm((current) => ({
                          ...current,
                          adminPermissions: selected
                            ? current.adminPermissions.filter((item) => item !== permission.value)
                            : [...current.adminPermissions, permission.value],
                        }))
                      }
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors",
                        selected
                          ? "border-purple-600 bg-purple-600 text-white"
                          : "border-purple-100 bg-white text-purple-700 hover:border-purple-300",
                      )}
                    >
                      {permission.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </form>
      </Card>

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
                  {editForm.role === "ADMIN" ? (
                    <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3 lg:col-span-12">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-purple-700">
                        Permissões do admin
                      </p>
                      <p className="mb-3 text-xs text-slate-500">
                        Sem permissões marcadas = admin master com acesso total.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {adminPermissionOptions.map((permission) => {
                          const selected = editForm.adminPermissions.includes(permission.value);
                          return (
                            <button
                              key={permission.value}
                              type="button"
                              onClick={() =>
                                setEditForm((current) =>
                                  current
                                    ? {
                                        ...current,
                                        adminPermissions: selected
                                          ? current.adminPermissions.filter((item) => item !== permission.value)
                                          : [...current.adminPermissions, permission.value],
                                      }
                                    : current,
                                )
                              }
                              className={cn(
                                "rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors",
                                selected
                                  ? "border-purple-600 bg-purple-600 text-white"
                                  : "border-purple-100 bg-white text-purple-700 hover:border-purple-300",
                              )}
                            >
                              {permission.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
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
    <BackofficeShell badge="Relatórios" title="Central de relatórios" description="Indicadores consolidados por período e departamento, com exportação em PDF e Excel.">
      <MasterReportPanel mode="reports" />
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
