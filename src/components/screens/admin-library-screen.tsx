"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, BookOpen, CalendarDays, CheckCircle2, Clock3, Download, Library, Plus, Search, Tags, Trash2, Undo2 } from "lucide-react";

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
  issn: string | null;
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
  callNumber: string | null;
  totalCopies: number;
  availableCopies: number;
  isDigital: boolean;
  isReservable: boolean;
  status: string;
  reservationsCount: number;
  consultationCount: number;
  copies?: Array<{
    id: string;
    code: string;
    callNumber: string | null;
    location: string | null;
    status: string;
    discardReason: string | null;
  }>;
  contributors?: Array<{
    id: string;
    name: string;
    type: string;
    relationTerm: string | null;
    isPrimary: boolean;
  }>;
};

type AdminReservation = {
  id: string;
  status: string;
  statusLabel: string;
  reservedAt: string;
  dueAt: string | null;
  borrowedAt?: string | null;
  returnedAt?: string | null;
  renewedCount?: number;
  copy?: {
    code: string;
    callNumber: string | null;
  } | null;
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
    consultationCount: number;
    reservationsInPeriod: number;
    uniqueUsers: number;
    borrowedInPeriod: number;
    returnedInPeriod: number;
    renewedInPeriod: number;
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
  loansByDepartment: Array<{ department: string; count: number }>;
  readerHistory: Array<{
    id: string;
    name: string;
    email: string;
    department: string | null;
    reservations: number;
    borrowed: number;
    returned: number;
    overdue: number;
    canceled: number;
    lastItemTitle: string | null;
    lastReservedAt: string | null;
  }>;
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
  issn: "",
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
  callNumber: "",
  secondaryRelationTerm: "",
  secondaryEntityRelationTerm: "",
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
  const [lookupLoading, setLookupLoading] = useState(false);

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
      ["Documentos catalogados", libraryReport.metrics.totalItems],
      ["Documentos ativos", libraryReport.metrics.activeItems],
      ["Entradas no periodo", libraryReport.metrics.itemsAdded],
      ["Consultados", libraryReport.metrics.consultationCount],
      ["Reservas no periodo", libraryReport.metrics.reservationsInPeriod],
      ["Leitores com reservas", libraryReport.metrics.uniqueUsers],
      ["Emprestimos no periodo", libraryReport.metrics.borrowedInPeriod],
      ["Devolucoes no periodo", libraryReport.metrics.returnedInPeriod],
      ["Renovados no periodo", libraryReport.metrics.renewedInPeriod],
      ["Reservas canceladas", libraryReport.metrics.canceled],
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

    addSection("Titulos mais emprestados");
    if (libraryReport.topBorrowedItems.length) {
      libraryReport.topBorrowedItems.forEach((item, index) => {
        addLine(`${index + 1}. ${item.title} - ${item.borrowedCount} retirada(s)`);
      });
    } else {
      addLine("Nenhum documento emprestado no periodo.");
    }

    addSection("Emprestimos por setor");
    if (libraryReport.loansByDepartment.length) {
      libraryReport.loansByDepartment.forEach((item) => {
        addLine(`${item.department}: ${item.count} empréstimo(s)`);
      });
    } else {
      addLine("Nenhum empréstimo com setor no periodo.");
    }

    addSection("Leitores no periodo");
    if (libraryReport.readerHistory.length) {
      libraryReport.readerHistory.slice(0, 30).forEach((reader) => {
        addLine(`${reader.name} - ${reader.department ?? "Sem departamento"} - ${reader.reservations} movimentação(ões) - ${reader.returned} devolução(ões) - ${reader.overdue} atraso(s)`);
      });
    } else {
      addLine("Nenhum leitor no periodo.");
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

  async function downloadLabelsPdf(item: AdminLibraryItem) {
    const copies = item.copies?.filter((copy) => copy.status !== "DISCARDED") ?? [];

    if (!copies.length) {
      setFeedback("Este material não possui exemplares físicos ativos para etiqueta.");
      return;
    }

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 36;
    const labelWidth = 245;
    const labelHeight = 96;
    const gap = 16;

    copies.forEach((copy, index) => {
      const perPage = 10;
      if (index > 0 && index % perPage === 0) doc.addPage();

      const pageIndex = index % perPage;
      const col = pageIndex % 2;
      const row = Math.floor(pageIndex / 2);
      const x = margin + col * (labelWidth + gap);
      const y = margin + row * (labelHeight + gap);

      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(x, y, labelWidth, labelHeight, 8, 8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(doc.splitTextToSize(item.title, labelWidth - 24), x + 12, y + 22);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Autor: ${item.mainAuthor ?? item.author ?? "Sem autor"}`, x + 12, y + 52);
      doc.text(`Chamada: ${copy.callNumber ?? item.callNumber ?? "-"}`, x + 12, y + 66);
      doc.text(`Exemplar: ${copy.code}`, x + 12, y + 80);
      doc.text(`Local: ${copy.location ?? item.location ?? "Biblioteca"}`, x + 130, y + 80);
    });

    doc.save(`etiquetas-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}.pdf`);
  }

  async function lookupIsbn() {
    const code = form.isbn.trim();

    if (!code) {
      setFeedback("Informe o ISBN antes de buscar.");
      return;
    }

    setLookupLoading(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/admin/library/isbn?code=${encodeURIComponent(code)}`, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFeedback(data.error ?? "Não foi possível buscar este ISBN.");
        return;
      }

      setForm((current) => {
        const book = data.book as Partial<typeof defaultForm> & { year?: number };
        return {
          ...current,
          title: current.title || book.title || "",
          author: current.author || book.author || book.mainAuthor || "",
          mainAuthor: current.mainAuthor || book.mainAuthor || book.author || "",
          publisher: current.publisher || book.publisher || "",
          publicationPlace: current.publicationPlace || book.publicationPlace || "",
          year: current.year || (book.year ? String(book.year) : ""),
          isbn: book.isbn || current.isbn,
          category: current.category || book.category || "",
          subject: current.subject || book.subject || "",
          description: current.description || book.description || "",
          physicalDescription: current.physicalDescription || book.physicalDescription || "",
          coverUrl: current.coverUrl || book.coverUrl || "",
          originalLanguage: current.originalLanguage || book.originalLanguage || "",
        };
      });
      setFeedback("Dados encontrados e aplicados ao formulário.");
    } catch {
      setFeedback("Falha de conexão ao buscar ISBN.");
    } finally {
      setLookupLoading(false);
    }
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
          issn: form.issn || undefined,
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
          callNumber: form.callNumber || undefined,
          contributors: [
            form.mainAuthor ? { name: form.mainAuthor, type: "PERSON", relationTerm: "autor", isPrimary: true } : null,
            form.entityAuthor ? { name: form.entityAuthor, type: "ENTITY", relationTerm: "autor entidade", isPrimary: true } : null,
            form.secondaryAuthor ? { name: form.secondaryAuthor, type: "PERSON", relationTerm: form.secondaryRelationTerm || undefined } : null,
            form.secondaryEntity ? { name: form.secondaryEntity, type: "ENTITY", relationTerm: form.secondaryEntityRelationTerm || undefined } : null,
          ].filter(Boolean),
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

  async function discardCopy(copyId: string) {
    const reason = window.prompt("Informe o motivo do descarte deste exemplar:");

    if (!reason?.trim()) return;

    setBusyAction(copyId);

    try {
      const response = await fetch(`/api/admin/library/copies/${copyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DISCARDED", discardReason: reason.trim() }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFeedback(data.error ?? "Não foi possível descartar exemplar.");
        return;
      }

      setFeedback("Exemplar descartado e acervo atualizado.");
      await loadLibrary();
    } catch {
      setFeedback("Falha de conexão ao descartar exemplar.");
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
            { label: "Documentos", value: report.totalItems, icon: Library, color: "text-blue-600" },
            { label: "Reservas", value: report.totalReservations, icon: BookOpen, color: "text-purple-600" },
            { label: "Emprestados", value: report.borrowed, icon: Clock3, color: "text-amber-600" },
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
                  Entradas, reservas, emprestimos, devolucoes, leitores e documentos mais movimentados.
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
              { label: "Entradas", value: libraryReport?.metrics.itemsAdded ?? 0 },
              { label: "Consultados", value: libraryReport?.metrics.consultationCount ?? 0 },
              { label: "Reservas", value: libraryReport?.metrics.reservationsInPeriod ?? 0 },
              { label: "Leitores", value: libraryReport?.metrics.uniqueUsers ?? 0 },
              { label: "Emprestimos", value: libraryReport?.metrics.borrowedInPeriod ?? 0 },
              { label: "Devolvidos", value: libraryReport?.metrics.returnedInPeriod ?? 0 },
              { label: "Renovados", value: libraryReport?.metrics.renewedInPeriod ?? 0 },
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
              title="Titulos mais emprestados"
              empty="Nenhum emprestimo no periodo."
              items={(libraryReport?.topBorrowedItems ?? []).map((item) => ({
                id: item.id,
                title: item.title,
                subtitle: `${item.kindLabel} · ${item.category}`,
                value: `${item.borrowedCount} empréstimo(s)`,
              }))}
            />
            <ReportList
              title="Classificacoes mais catalogadas"
              empty="Nenhuma entrada no periodo."
              items={(libraryReport?.categoryCounts ?? []).map((item) => ({
                id: item.category,
                title: item.category,
                subtitle: "Documentos catalogados",
                value: `${item.count}`,
              }))}
            />
            <ReportList
              title="Emprestimos por setor"
              empty="Nenhum emprestimo com setor no periodo."
              items={(libraryReport?.loansByDepartment ?? []).map((item) => ({
                id: item.department,
                title: item.department,
                subtitle: "Setor / departamento",
                value: `${item.count}`,
              }))}
            />
            <ReportList
              title="Leitores mais ativos"
              empty="Nenhum leitor no periodo."
              items={(libraryReport?.readerHistory ?? []).map((reader) => ({
                id: reader.id,
                title: reader.name,
                subtitle: `${reader.department ?? "Sem departamento"} · ${reader.email}`,
                value: `${reader.reservations} mov.`,
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
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]">
                <input className={inputClassName} placeholder="ISBN" value={form.isbn} onChange={(event) => setForm((current) => ({ ...current, isbn: event.target.value }))} />
                <input className={inputClassName} placeholder="ISSN" value={form.issn} onChange={(event) => setForm((current) => ({ ...current, issn: event.target.value }))} />
                <Button type="button" variant="outline" onClick={() => void lookupIsbn()} disabled={lookupLoading}>
                  <Search size={15} />
                  {lookupLoading ? "Buscando..." : "Buscar ISBN"}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClassName} placeholder="Edição" value={form.edition} onChange={(event) => setForm((current) => ({ ...current, edition: event.target.value }))} />
                <input className={inputClassName} placeholder="Chamada / etiqueta da lombada" value={form.callNumber} onChange={(event) => setForm((current) => ({ ...current, callNumber: event.target.value }))} />
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
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClassName} placeholder="Termo de relação do autor secundário (coautor, tradutor...)" value={form.secondaryRelationTerm} onChange={(event) => setForm((current) => ({ ...current, secondaryRelationTerm: event.target.value }))} />
                <input className={inputClassName} placeholder="Termo de relação da entidade secundária" value={form.secondaryEntityRelationTerm} onChange={(event) => setForm((current) => ({ ...current, secondaryEntityRelationTerm: event.target.value }))} />
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
                <input className={inputClassName} placeholder="Classificação" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} required />
              </div>
              <input className={inputClassName} placeholder="Assunto" value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} />

              <p className="pt-2 text-xs font-black uppercase tracking-wider text-slate-400">Descrição física e notas</p>
              <input className={inputClassName} placeholder="Descrição física (paginação, ilustração, dimensão)" value={form.physicalDescription} onChange={(event) => setForm((current) => ({ ...current, physicalDescription: event.target.value }))} />
              <input className={inputClassName} placeholder="Série ou Coleção" value={form.seriesCollection} onChange={(event) => setForm((current) => ({ ...current, seriesCollection: event.target.value }))} />
              <textarea className={cn(inputClassName, "min-h-20 resize-none")} placeholder="Nota geral" value={form.generalNote} onChange={(event) => setForm((current) => ({ ...current, generalNote: event.target.value }))} />
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
                        {item.mainAuthor ?? item.author ?? "Sem autor"} · {item.category} · {item.availableCopies}/{item.totalCopies} disponível(is) · {item.reservationsCount} reserva(s) · {item.consultationCount} consulta(s)
                      </p>
                      {item.callNumber ? (
                        <p className="mt-1 text-xs font-bold text-slate-400">Chamada: {item.callNumber}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <Button variant="outline" size="sm" onClick={() => void downloadLabelsPdf(item)}>
                        <Tags size={14} />
                        Etiquetas
                      </Button>
                      <Button variant="outline" size="sm" disabled={busyAction === item.id} onClick={() => void archiveItem(item.id)}>
                        Arquivar
                      </Button>
                    </div>
                    {item.copies?.length ? (
                      <div className="lg:col-span-2 rounded-xl bg-slate-50 p-3">
                        <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400">Exemplares</p>
                        <div className="grid gap-2 md:grid-cols-2">
                          {item.copies.map((copy) => (
                            <div key={copy.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2">
                              <div className="min-w-0">
                                <p className="truncate text-xs font-black text-slate-800">
                                  {copy.code} · {copy.callNumber ?? item.callNumber ?? "Sem chamada"}
                                </p>
                                <p className="truncate text-[11px] font-semibold text-slate-500">
                                  {copy.status}
                                  {copy.discardReason ? ` · ${copy.discardReason}` : ""}
                                </p>
                              </div>
                              {!["BORROWED", "RESERVED", "DISCARDED"].includes(copy.status) ? (
                                <Button size="sm" variant="outline" disabled={busyAction === copy.id} onClick={() => void discardCopy(copy.id)}>
                                  <Trash2 size={13} />
                                  Descartar
                                </Button>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
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
                <h2 className="text-lg font-black text-slate-950">Reservas, empréstimos e devoluções</h2>
              </div>
              <div className="space-y-3">
                {reservations.map((reservation) => (
                  <div key={reservation.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-black text-slate-950">{reservation.item.title}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {reservation.user.name} · {reservation.user.email} · {reservation.statusLabel}
                          {reservation.copy?.code ? ` · Exemplar ${reservation.copy.code}` : ""}
                          {reservation.copy?.callNumber ? ` · ${reservation.copy.callNumber}` : ""}
                          {reservation.renewedCount ? ` · ${reservation.renewedCount} renovação(ões)` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" disabled={busyAction === reservation.id} onClick={() => void updateReservation(reservation.id, "BORROWED")}>
                          <Clock3 size={14} />
                          Emprestar
                        </Button>
                        <Button size="sm" variant="outline" disabled={busyAction === reservation.id} onClick={() => void updateReservation(reservation.id, "RENEWED")}>
                          <Clock3 size={14} />
                          Renovar
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
