"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, BookOpen, CalendarDays, CheckCircle2, Clock3, Download, Library, Plus, Search, Undo2 } from "lucide-react";

import { BackofficeShell } from "@/components/layout/backoffice-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type KindOption = {
  value: string;
  label: string;
  description: string;
};

type AdminLibraryItem = {
  id: string;
  title: string;
  author: string | null;
  mainAuthor: string | null;
  entityAuthor: string | null;
  secondaryAuthor: string | null;
  secondaryEntity: string | null;
  originalTitle: string | null;
  translatedTitle: string | null;
  originalLanguage: string | null;
  translationLanguage: string | null;
  edition: string | null;
  publisher: string | null;
  publicationPlace: string | null;
  year: number | null;
  isbn: string | null;
  category: string;
  subject: string | null;
  kind: string;
  kindLabel: string;
  description: string | null;
  physicalDescription: string | null;
  seriesCollection: string | null;
  generalNote: string | null;
  bibliography: string | null;
  summary: string | null;
  coverUrl: string | null;
  materialUrl: string | null;
  location: string | null;
  totalCopies: number;
  availableCopies: number;
  isDigital: boolean;
  isReservable: boolean;
  status: string;
  reservationsCount: number;
};

type AdminReservation = {
  id: string;
  status: string;
  statusLabel: string;
  reservedAt: string;
  dueAt: string | null;
  item: AdminLibraryItem;
  user: {
    name: string;
    email: string;
    department: string | null;
  };
};

type LibraryReport = {
  generatedAt: string;
  period: {
    from: string | null;
    to: string | null;
  };
  metrics: {
    totalItems: number;
    activeItems: number;
    itemsAdded: number;
    reservationsInPeriod: number;
    uniqueUsers: number;
    borrowedInPeriod: number;
    returnedInPeriod: number;
    reserved: number;
    borrowed: number;
    returned: number;
    canceled: number;
    overdue: number;
  };
  topReservedItems: Array<{
    id: string;
    title: string;
    author: string | null;
    category: string;
    kindLabel: string;
    reservationsCount: number;
  }>;
  topBorrowedItems: Array<{
    id: string;
    title: string;
    author: string | null;
    category: string;
    kindLabel: string;
    borrowedCount: number;
  }>;
  kindCounts: Array<{ kind: string; label: string; count: number }>;
  categoryCounts: Array<{ category: string; count: number }>;
  recentItems: Array<{
    id: string;
    title: string;
    author: string | null;
    category: string;
    kindLabel: string;
    createdAt: string;
    creatorName: string | null;
    reservationsCount: number;
  }>;
  recentReservations: Array<{
    id: string;
    status: string;
    statusLabel: string;
    reservedAt: string;
    borrowedAt: string | null;
    returnedAt: string | null;
    itemTitle: string;
    userName: string;
    userEmail: string;
    userDepartment: string | null;
  }>;
};

const defaultForm = {
  title: "",
  author: "",
  mainAuthor: "",
  entityAuthor: "",
  secondaryAuthor: "",
  secondaryEntity: "",
  originalTitle: "",
  translatedTitle: "",
  originalLanguage: "",
  translationLanguage: "",
  edition: "",
  publisher: "",
  publicationPlace: "",
  year: "",
  isbn: "",
  category: "",
  subject: "",
  kind: "BOOK",
  description: "",
  physicalDescription: "",
  seriesCollection: "",
  generalNote: "",
  bibliography: "",
  summary: "",
  coverUrl: "",
  materialUrl: "",
  location: "",
  totalCopies: "1",
  availableCopies: "1",
  isDigital: false,
  isReservable: true,
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-[#0264af] focus:bg-white";

const dateFormatter = new Intl.DateTimeFormat("pt-BR");

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return dateFormatter.format(new Date(value));
}

function reportPeriodLabel(report: LibraryReport | null) {
  if (!report?.period.from && !report?.period.to) return "Todo o histórico";
  return `${formatDate(report.period.from)} até ${formatDate(report.period.to)}`;
}

function ReportList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: Array<{ id: string; title: string; subtitle: string; value: string }>;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <h3 className="mb-3 text-sm font-black text-slate-950">{title}</h3>
      <div className="space-y-2">
        {items.slice(0, 5).map((item, index) => (
          <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-900">
                {index + 1}. {item.title}
              </p>
              <p className="truncate text-xs font-semibold text-slate-500">{item.subtitle}</p>
            </div>
            <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-black text-blue-700">
              {item.value}
            </span>
          </div>
        ))}
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs font-semibold text-slate-500">
            {empty}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AdminLibraryScreen() {
  const [items, setItems] = useState<AdminLibraryItem[]>([]);
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [kindOptions, setKindOptions] = useState<KindOption[]>([]);
  const [report, setReport] = useState({
    totalItems: 0,
    totalReservations: 0,
    activeReservations: 0,
    borrowed: 0,
    returned: 0,
  });
  const [form, setForm] = useState(defaultForm);
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("ALL");
  const [reportFrom, setReportFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return toInputDate(date);
  });
  const [reportTo, setReportTo] = useState(() => toInputDate(new Date()));
  const [libraryReport, setLibraryReport] = useState<LibraryReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (kindFilter !== "ALL") params.set("kind", kindFilter);

      const response = await fetch(`/api/admin/library?${params.toString()}`, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFeedback(data.error ?? "Não foi possível carregar a biblioteca.");
        return;
      }

      setItems(data.items ?? []);
      setReservations(data.reservations ?? []);
      setKindOptions(data.kindOptions ?? []);
      setReport(data.report ?? {
        totalItems: 0,
        totalReservations: 0,
        activeReservations: 0,
        borrowed: 0,
        returned: 0,
      });
    } catch {
      setFeedback("Falha de conexão ao carregar a biblioteca.");
    } finally {
      setLoading(false);
    }
  }, [kindFilter, search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadLibrary();
    }, 250);

    return () => clearTimeout(timeout);
  }, [loadLibrary]);

  const loadReport = useCallback(async () => {
    setReportLoading(true);
    setFeedback(null);

    try {
      const params = new URLSearchParams();
      if (reportFrom) params.set("from", reportFrom);
      if (reportTo) params.set("to", reportTo);

      const response = await fetch(`/api/admin/library/report?${params.toString()}`, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFeedback(data.error ?? "Nao foi possivel carregar o relatorio.");
        return;
      }

      setLibraryReport(data.report);
    } catch {
      setFeedback("Falha de conexao ao carregar relatorio.");
    } finally {
      setReportLoading(false);
    }
  }, [reportFrom, reportTo]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  async function downloadReportPdf() {
    if (!libraryReport) return;

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    let y = 44;

    function addLine(text: string, size = 10, weight: "normal" | "bold" = "normal") {
      if (y > 770) {
        doc.addPage();
        y = 44;
      }
      doc.setFont("helvetica", weight);
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text, pageWidth - margin * 2) as string[];
      doc.text(lines, margin, y);
      y += lines.length * (size + 4);
    }

    function addSection(title: string) {
      y += 10;
      addLine(title, 13, "bold");
    }

    doc.setTextColor(15, 23, 42);
    addLine("Relatorio da Biblioteca e Repositorio", 18, "bold");
    addLine(`Periodo: ${reportPeriodLabel(libraryReport)}`, 10);
    addLine(`Gerado em: ${formatDate(libraryReport.generatedAt)}`, 10);

    addSection("Indicadores");
    [
      ["Materiais no acervo", libraryReport.metrics.totalItems],
      ["Materiais ativos", libraryReport.metrics.activeItems],
      ["Entradas no periodo", libraryReport.metrics.itemsAdded],
      ["Reservas no periodo", libraryReport.metrics.reservationsInPeriod],
      ["Pessoas com reserva", libraryReport.metrics.uniqueUsers],
      ["Retiradas no periodo", libraryReport.metrics.borrowedInPeriod],
      ["Devolucoes no periodo", libraryReport.metrics.returnedInPeriod],
      ["Canceladas", libraryReport.metrics.canceled],
      ["Em atraso", libraryReport.metrics.overdue],
    ].forEach(([label, value]) => addLine(`${label}: ${value}`));

    addSection("Mais reservados");
    if (libraryReport.topReservedItems.length) {
      libraryReport.topReservedItems.forEach((item, index) => {
        addLine(`${index + 1}. ${item.title} - ${item.author ?? "Sem autor"} - ${item.reservationsCount} reserva(s)`);
      });
    } else {
      addLine("Nenhum material reservado no periodo.");
    }

    addSection("Materiais que sairam / retirados");
    if (libraryReport.topBorrowedItems.length) {
      libraryReport.topBorrowedItems.forEach((item, index) => {
        addLine(`${index + 1}. ${item.title} - ${item.borrowedCount} retirada(s)`);
      });
    } else {
      addLine("Nenhum material retirado no periodo.");
    }

    addSection("Entradas recentes");
    if (libraryReport.recentItems.length) {
      libraryReport.recentItems.forEach((item) => {
        addLine(`${formatDate(item.createdAt)} - ${item.title} - ${item.kindLabel} - ${item.category}`);
      });
    } else {
      addLine("Nenhum material entrou no periodo.");
    }

    addSection("Movimentacoes recentes");
    if (libraryReport.recentReservations.length) {
      libraryReport.recentReservations.forEach((reservation) => {
        addLine(`${formatDate(reservation.reservedAt)} - ${reservation.itemTitle} - ${reservation.userName} - ${reservation.statusLabel}`);
      });
    } else {
      addLine("Nenhuma movimentacao no periodo.");
    }

    const suffix = `${reportFrom || "inicio"}-${reportTo || "hoje"}`;
    doc.save(`relatorio-biblioteca-${suffix}.pdf`);
  }

  async function createItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyAction) return;

    setBusyAction("create");
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          author: form.author || undefined,
          mainAuthor: form.mainAuthor || undefined,
          entityAuthor: form.entityAuthor || undefined,
          secondaryAuthor: form.secondaryAuthor || undefined,
          secondaryEntity: form.secondaryEntity || undefined,
          originalTitle: form.originalTitle || undefined,
          translatedTitle: form.translatedTitle || undefined,
          originalLanguage: form.originalLanguage || undefined,
          translationLanguage: form.translationLanguage || undefined,
          edition: form.edition || undefined,
          publisher: form.publisher || undefined,
          publicationPlace: form.publicationPlace || undefined,
          year: form.year ? Number(form.year) : undefined,
          isbn: form.isbn || undefined,
          category: form.category,
          subject: form.subject || undefined,
          kind: form.kind,
          description: form.description || undefined,
          physicalDescription: form.physicalDescription || undefined,
          seriesCollection: form.seriesCollection || undefined,
          generalNote: form.generalNote || undefined,
          bibliography: form.bibliography || undefined,
          summary: form.summary || undefined,
          coverUrl: form.coverUrl || undefined,
          materialUrl: form.materialUrl || undefined,
          location: form.location || undefined,
          totalCopies: Number(form.totalCopies || 0),
          availableCopies: Number(form.availableCopies || 0),
          isDigital: form.isDigital,
          isReservable: form.isReservable,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFeedback(data.error ?? "Não foi possível catalogar material.");
        return;
      }

      setFeedback("Material catalogado com sucesso.");
      setForm(defaultForm);
      await loadLibrary();
    } catch {
      setFeedback("Falha de conexão ao catalogar material.");
    } finally {
      setBusyAction(null);
    }
  }

  async function archiveItem(itemId: string) {
    setBusyAction(itemId);

    try {
      await fetch(`/api/admin/library/items/${itemId}`, { method: "DELETE" });
      await loadLibrary();
    } finally {
      setBusyAction(null);
    }
  }

  async function updateReservation(reservationId: string, status: string) {
    setBusyAction(reservationId);

    try {
      const response = await fetch(`/api/admin/library/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFeedback(data.error ?? "Não foi possível atualizar reserva.");
        return;
      }

      await loadLibrary();
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <BackofficeShell
      badge="Biblioteca"
      title="Biblioteca e repositório"
      description="Catálogo de livros físicos, materiais de capacitação, treinamentos e reservas."
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Materiais", value: report.totalItems, icon: Library, color: "text-blue-600" },
            { label: "Reservas", value: report.totalReservations, icon: BookOpen, color: "text-purple-600" },
            { label: "Retirados", value: report.borrowed, icon: Clock3, color: "text-amber-600" },
            { label: "Devolvidos", value: report.returned, icon: CheckCircle2, color: "text-emerald-600" },
          ].map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.label} className="p-5">
                <Icon className={metric.color} size={24} />
                <p className="mt-4 text-3xl font-black text-slate-950">{metric.value}</p>
                <p className="text-sm font-semibold text-slate-500">{metric.label}</p>
              </Card>
            );
          })}
        </div>

        {feedback ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
            {feedback}
          </div>
        ) : null}

        <Card className="p-6">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-[#0264af]">
                <BarChart3 size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-950">Relatorios da biblioteca</h2>
                <p className="text-sm font-semibold text-slate-500">
                  Entradas, reservas, retiradas, devolucoes, pessoas e materiais mais movimentados.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className={cn(inputClassName, "pl-9")}
                  type="date"
                  value={reportFrom}
                  onChange={(event) => setReportFrom(event.target.value)}
                />
              </div>
              <input
                className={inputClassName}
                type="date"
                value={reportTo}
                onChange={(event) => setReportTo(event.target.value)}
              />
              <Button variant="outline" onClick={() => void loadReport()} disabled={reportLoading}>
                {reportLoading ? "Filtrando..." : "Filtrar"}
              </Button>
              <Button onClick={() => void downloadReportPdf()} disabled={!libraryReport || reportLoading}>
                <Download size={16} />
                Baixar PDF
              </Button>
            </div>
          </div>

          <div className="mb-5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
            Periodo do relatorio: <span className="text-slate-950">{reportPeriodLabel(libraryReport)}</span>
          </div>

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {[
              { label: "Entraram", value: libraryReport?.metrics.itemsAdded ?? 0 },
              { label: "Reservas", value: libraryReport?.metrics.reservationsInPeriod ?? 0 },
              { label: "Pessoas", value: libraryReport?.metrics.uniqueUsers ?? 0 },
              { label: "Retirados", value: libraryReport?.metrics.borrowedInPeriod ?? 0 },
              { label: "Devolvidos", value: libraryReport?.metrics.returnedInPeriod ?? 0 },
              { label: "Atrasos", value: libraryReport?.metrics.overdue ?? 0 },
            ].map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-slate-100 bg-white p-4">
                <p className="text-2xl font-black text-slate-950">{metric.value}</p>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">{metric.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            <ReportList
              title="Mais reservados"
              empty="Nenhuma reserva no periodo."
              items={(libraryReport?.topReservedItems ?? []).map((item) => ({
                id: item.id,
                title: item.title,
                subtitle: `${item.author ?? "Sem autor"} · ${item.category}`,
                value: `${item.reservationsCount} reserva(s)`,
              }))}
            />
            <ReportList
              title="O que saiu"
              empty="Nenhuma retirada no periodo."
              items={(libraryReport?.topBorrowedItems ?? []).map((item) => ({
                id: item.id,
                title: item.title,
                subtitle: `${item.kindLabel} · ${item.category}`,
                value: `${item.borrowedCount} retirada(s)`,
              }))}
            />
            <ReportList
              title="Categorias com entrada"
              empty="Nenhuma entrada no periodo."
              items={(libraryReport?.categoryCounts ?? []).map((item) => ({
                id: item.category,
                title: item.category,
                subtitle: "Materiais catalogados",
                value: `${item.count}`,
              }))}
            />
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <Card className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <Plus className="text-[#0264af]" size={20} />
              <h2 className="text-lg font-black text-slate-950">Catalogar material</h2>
            </div>
            <form className="space-y-3" onSubmit={(event) => void createItem(event)}>
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Identificação</p>
              <input className={inputClassName} placeholder="Título para exibição no card" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClassName} placeholder="SBN / ISBN" value={form.isbn} onChange={(event) => setForm((current) => ({ ...current, isbn: event.target.value }))} />
                <input className={inputClassName} placeholder="Edição" value={form.edition} onChange={(event) => setForm((current) => ({ ...current, edition: event.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClassName} placeholder="Título original" value={form.originalTitle} onChange={(event) => setForm((current) => ({ ...current, originalTitle: event.target.value }))} />
                <input className={inputClassName} placeholder="Título traduzido" value={form.translatedTitle} onChange={(event) => setForm((current) => ({ ...current, translatedTitle: event.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClassName} placeholder="Idioma original" value={form.originalLanguage} onChange={(event) => setForm((current) => ({ ...current, originalLanguage: event.target.value }))} />
                <input className={inputClassName} placeholder="Idioma da tradução" value={form.translationLanguage} onChange={(event) => setForm((current) => ({ ...current, translationLanguage: event.target.value }))} />
              </div>

              <p className="pt-2 text-xs font-black uppercase tracking-wider text-slate-400">Autoria</p>
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClassName} placeholder="Autor principal" value={form.mainAuthor} onChange={(event) => setForm((current) => ({ ...current, mainAuthor: event.target.value, author: event.target.value || current.author }))} />
                <input className={inputClassName} placeholder="Autor entidade" value={form.entityAuthor} onChange={(event) => setForm((current) => ({ ...current, entityAuthor: event.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClassName} placeholder="Autor secundário" value={form.secondaryAuthor} onChange={(event) => setForm((current) => ({ ...current, secondaryAuthor: event.target.value }))} />
                <input className={inputClassName} placeholder="Entidade secundária" value={form.secondaryEntity} onChange={(event) => setForm((current) => ({ ...current, secondaryEntity: event.target.value }))} />
              </div>

              <p className="pt-2 text-xs font-black uppercase tracking-wider text-slate-400">Publicação</p>
              <div className="grid grid-cols-3 gap-3">
                <input className={inputClassName} placeholder="Local" value={form.publicationPlace} onChange={(event) => setForm((current) => ({ ...current, publicationPlace: event.target.value }))} />
                <input className={inputClassName} placeholder="Editora" value={form.publisher} onChange={(event) => setForm((current) => ({ ...current, publisher: event.target.value }))} />
                <input className={inputClassName} placeholder="Ano" value={form.year} onChange={(event) => setForm((current) => ({ ...current, year: event.target.value.replace(/\D/g, "").slice(0, 4) }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select className={inputClassName} value={form.kind} onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value }))}>
                  {kindOptions.map((kind) => (
                    <option key={kind.value} value={kind.value}>{kind.label}</option>
                  ))}
                </select>
                <input className={inputClassName} placeholder="Categoria" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} required />
              </div>
              <input className={inputClassName} placeholder="Assunto" value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} />

              <p className="pt-2 text-xs font-black uppercase tracking-wider text-slate-400">Descrição física e notas</p>
              <input className={inputClassName} placeholder="Descrição física (paginação, ilustração, dimensão)" value={form.physicalDescription} onChange={(event) => setForm((current) => ({ ...current, physicalDescription: event.target.value }))} />
              <input className={inputClassName} placeholder="Série ou Coleção" value={form.seriesCollection} onChange={(event) => setForm((current) => ({ ...current, seriesCollection: event.target.value }))} />
              <textarea className={cn(inputClassName, "min-h-20 resize-none")} placeholder="Nota geral" value={form.generalNote} onChange={(event) => setForm((current) => ({ ...current, generalNote: event.target.value }))} />
              <textarea className={cn(inputClassName, "min-h-20 resize-none")} placeholder="Bibliografia" value={form.bibliography} onChange={(event) => setForm((current) => ({ ...current, bibliography: event.target.value }))} />

              <p className="pt-2 text-xs font-black uppercase tracking-wider text-slate-400">Conteúdo</p>
              <textarea className={cn(inputClassName, "min-h-24 resize-none")} placeholder="Sumário" value={form.summary} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} />
              <textarea className={cn(inputClassName, "min-h-24 resize-none")} placeholder="Resumo" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />

              <p className="pt-2 text-xs font-black uppercase tracking-wider text-slate-400">Capa, link e controle físico</p>
              <input className={inputClassName} placeholder="URL da capa" value={form.coverUrl} onChange={(event) => setForm((current) => ({ ...current, coverUrl: event.target.value }))} />
              <input className={inputClassName} placeholder="URL do arquivo/link do repositório" value={form.materialUrl} onChange={(event) => setForm((current) => ({ ...current, materialUrl: event.target.value }))} />
              <input className={inputClassName} placeholder="Local físico / prateleira" value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClassName} placeholder="Total" value={form.totalCopies} onChange={(event) => setForm((current) => ({ ...current, totalCopies: event.target.value.replace(/\D/g, "") }))} />
                <input className={inputClassName} placeholder="Disponíveis" value={form.availableCopies} onChange={(event) => setForm((current) => ({ ...current, availableCopies: event.target.value.replace(/\D/g, "") }))} />
              </div>
              <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
                <input type="checkbox" checked={form.isDigital} onChange={(event) => setForm((current) => ({ ...current, isDigital: event.target.checked, isReservable: event.target.checked ? false : current.isReservable }))} />
                Material digital/repositório
              </label>
              <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
                <input type="checkbox" checked={form.isReservable} disabled={form.isDigital} onChange={(event) => setForm((current) => ({ ...current, isReservable: event.target.checked }))} />
                Permitir reserva física
              </label>
              <Button type="submit" className="w-full" disabled={busyAction === "create"}>
                {busyAction === "create" ? "Salvando..." : "Catalogar"}
              </Button>
            </form>
          </Card>

          <div className="space-y-6">
            <Card className="p-5">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <h2 className="text-lg font-black text-slate-950">Acervo catalogado</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input className={cn(inputClassName, "pl-9")} placeholder="Buscar" value={search} onChange={(event) => setSearch(event.target.value)} />
                  </div>
                  <select className={inputClassName} value={kindFilter} onChange={(event) => setKindFilter(event.target.value)}>
                    <option value="ALL">Todos</option>
                    {kindOptions.map((kind) => (
                      <option key={kind.value} value={kind.value}>{kind.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="grid gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-slate-950">{item.title}</p>
                        <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black uppercase text-blue-700">{item.kindLabel}</span>
                        {item.isDigital ? <span className="rounded-full bg-purple-50 px-2 py-1 text-[10px] font-black uppercase text-purple-700">Repositório</span> : null}
                      </div>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {item.author ?? "Sem autor"} · {item.category} · {item.availableCopies}/{item.totalCopies} disponível(is) · {item.reservationsCount} reserva(s)
                      </p>
                    </div>
                    <Button variant="outline" size="sm" disabled={busyAction === item.id} onClick={() => void archiveItem(item.id)}>
                      Arquivar
                    </Button>
                  </div>
                ))}
                {items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                    {loading ? "Carregando..." : "Nenhum material catalogado ainda."}
                  </div>
                ) : null}
              </div>
            </Card>

            <Card className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="text-[#0264af]" size={20} />
                <h2 className="text-lg font-black text-slate-950">Reservas e devoluções</h2>
              </div>
              <div className="space-y-3">
                {reservations.map((reservation) => (
                  <div key={reservation.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-black text-slate-950">{reservation.item.title}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {reservation.user.name} · {reservation.user.email} · {reservation.statusLabel}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" disabled={busyAction === reservation.id} onClick={() => void updateReservation(reservation.id, "BORROWED")}>
                          <Clock3 size={14} />
                          Retirou
                        </Button>
                        <Button size="sm" variant="outline" disabled={busyAction === reservation.id} onClick={() => void updateReservation(reservation.id, "RETURNED")}>
                          <Undo2 size={14} />
                          Devolveu
                        </Button>
                        <Button size="sm" variant="outline" disabled={busyAction === reservation.id} onClick={() => void updateReservation(reservation.id, "CANCELED")}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {reservations.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                    Nenhuma reserva registrada ainda.
                  </div>
                ) : null}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </BackofficeShell>
  );
}
