"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, BookOpen, CalendarDays, CheckCircle2, Clock3, Download, Edit3, Library, Plus, Search, Tags, Trash2, Undo2, X } from "lucide-react";

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

type LibraryAdminView = "catalog" | "create" | "moves" | "reports";

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

function formFromItem(item: AdminLibraryItem) {
  return {
    title: item.title ?? "",
    author: item.author ?? "",
    mainAuthor: item.mainAuthor ?? "",
    entityAuthor: item.entityAuthor ?? "",
    secondaryAuthor: item.secondaryAuthor ?? "",
    secondaryEntity: item.secondaryEntity ?? "",
    originalTitle: item.originalTitle ?? "",
    translatedTitle: item.translatedTitle ?? "",
    originalLanguage: item.originalLanguage ?? "",
    translationLanguage: item.translationLanguage ?? "",
    edition: item.edition ?? "",
    publisher: item.publisher ?? "",
    publicationPlace: item.publicationPlace ?? "",
    year: item.year ? String(item.year) : "",
    isbn: item.isbn ?? "",
    issn: item.issn ?? "",
    category: item.category ?? "",
    subject: item.subject ?? "",
    kind: item.kind ?? "BOOK",
    description: item.description ?? "",
    physicalDescription: item.physicalDescription ?? "",
    seriesCollection: item.seriesCollection ?? "",
    generalNote: item.generalNote ?? "",
    bibliography: item.bibliography ?? "",
    summary: item.summary ?? "",
    coverUrl: item.coverUrl ?? "",
    materialUrl: item.materialUrl ?? "",
    location: item.location ?? "",
    callNumber: item.callNumber ?? "",
    secondaryRelationTerm: "",
    secondaryEntityRelationTerm: "",
    totalCopies: String(item.totalCopies ?? 0),
    availableCopies: String(item.availableCopies ?? 0),
    isDigital: item.isDigital,
    isReservable: item.isReservable,
  };
}

function buildItemPayload(values: typeof defaultForm) {
  return {
    title: values.title,
    author: values.author || undefined,
    mainAuthor: values.mainAuthor || undefined,
    entityAuthor: values.entityAuthor || undefined,
    secondaryAuthor: values.secondaryAuthor || undefined,
    secondaryEntity: values.secondaryEntity || undefined,
    originalTitle: values.originalTitle || undefined,
    translatedTitle: values.translatedTitle || undefined,
    originalLanguage: values.originalLanguage || undefined,
    translationLanguage: values.translationLanguage || undefined,
    edition: values.edition || undefined,
    publisher: values.publisher || undefined,
    publicationPlace: values.publicationPlace || undefined,
    year: values.year ? Number(values.year) : undefined,
    isbn: values.isbn || undefined,
    issn: values.issn || undefined,
    category: values.category,
    subject: values.subject || undefined,
    kind: values.kind,
    description: values.description || undefined,
    physicalDescription: values.physicalDescription || undefined,
    seriesCollection: values.seriesCollection || undefined,
    generalNote: values.generalNote || undefined,
    bibliography: values.bibliography || undefined,
    summary: values.summary || undefined,
    coverUrl: values.coverUrl || undefined,
    materialUrl: values.materialUrl || undefined,
    location: values.location || undefined,
    callNumber: values.callNumber || undefined,
    contributors: [
      values.mainAuthor ? { name: values.mainAuthor, type: "PERSON", relationTerm: "autor", isPrimary: true } : null,
      values.entityAuthor ? { name: values.entityAuthor, type: "ENTITY", relationTerm: "autor entidade", isPrimary: true } : null,
      values.secondaryAuthor ? { name: values.secondaryAuthor, type: "PERSON", relationTerm: values.secondaryRelationTerm || undefined } : null,
      values.secondaryEntity ? { name: values.secondaryEntity, type: "ENTITY", relationTerm: values.secondaryEntityRelationTerm || undefined } : null,
    ].filter(Boolean),
    totalCopies: Number(values.totalCopies || 0),
    availableCopies: Number(values.availableCopies || 0),
    isDigital: values.isDigital,
    isReservable: values.isReservable,
  };
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
  const [activeView, setActiveView] = useState<LibraryAdminView>("catalog");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(defaultForm);

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

  async function downloadReportExcel() {
    if (!libraryReport) return;

    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Pulse Hub";
    workbook.created = new Date();

    function addSheet(
      name: string,
      columns: Array<{ header: string; key: string; width?: number }>,
      rows: Array<Record<string, string | number | null | undefined>>,
    ) {
      const sheet = workbook.addWorksheet(name);
      sheet.columns = columns.map((column) => ({
        header: column.header,
        key: column.key,
        width: column.width ?? Math.max(column.header.length + 4, 16),
      }));
      sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      sheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0264AF" },
      };
      sheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };
      sheet.getRow(1).height = 22;
      sheet.addRows(rows);
      sheet.views = [{ state: "frozen", ySplit: 1 }];
      sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: columns.length },
      };
      sheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFE2E8F0" } },
            left: { style: "thin", color: { argb: "FFE2E8F0" } },
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
            right: { style: "thin", color: { argb: "FFE2E8F0" } },
          };
          if (rowNumber > 1) {
            cell.alignment = { vertical: "top", wrapText: true };
          }
        });
      });
    }

    addSheet(
      "Indicadores",
      [
        { header: "Indicador", key: "label", width: 34 },
        { header: "Valor", key: "value", width: 18 },
        { header: "Periodo", key: "period", width: 28 },
      ],
      [
        ["Documentos catalogados", libraryReport.metrics.totalItems],
        ["Documentos ativos", libraryReport.metrics.activeItems],
        ["Entradas no periodo", libraryReport.metrics.itemsAdded],
        ["Consultas no periodo", libraryReport.metrics.consultationCount],
        ["Reservas no periodo", libraryReport.metrics.reservationsInPeriod],
        ["Leitores com reservas", libraryReport.metrics.uniqueUsers],
        ["Emprestimos no periodo", libraryReport.metrics.borrowedInPeriod],
        ["Devolucoes no periodo", libraryReport.metrics.returnedInPeriod],
        ["Renovacoes no periodo", libraryReport.metrics.renewedInPeriod],
        ["Reservas abertas", libraryReport.metrics.reserved],
        ["Emprestimos ativos", libraryReport.metrics.borrowed],
        ["Devolvidos", libraryReport.metrics.returned],
        ["Cancelados", libraryReport.metrics.canceled],
        ["Em atraso", libraryReport.metrics.overdue],
      ].map(([label, value]) => ({ label, value, period: reportPeriodLabel(libraryReport) })),
    );

    addSheet(
      "Mais reservados",
      [
        { header: "Titulo", key: "title", width: 42 },
        { header: "Autor", key: "author", width: 28 },
        { header: "Categoria", key: "category", width: 24 },
        { header: "Tipo", key: "kindLabel", width: 24 },
        { header: "Reservas", key: "reservationsCount", width: 14 },
      ],
      libraryReport.topReservedItems,
    );

    addSheet(
      "Mais emprestados",
      [
        { header: "Titulo", key: "title", width: 42 },
        { header: "Autor", key: "author", width: 28 },
        { header: "Categoria", key: "category", width: 24 },
        { header: "Tipo", key: "kindLabel", width: 24 },
        { header: "Emprestimos", key: "borrowedCount", width: 14 },
      ],
      libraryReport.topBorrowedItems,
    );

    addSheet(
      "Classificacoes",
      [
        { header: "Classificacao", key: "category", width: 34 },
        { header: "Quantidade", key: "count", width: 14 },
      ],
      libraryReport.categoryCounts,
    );

    addSheet(
      "Setores",
      [
        { header: "Setor / Departamento", key: "department", width: 34 },
        { header: "Emprestimos", key: "count", width: 14 },
      ],
      libraryReport.loansByDepartment,
    );

    addSheet(
      "Leitores",
      [
        { header: "Nome", key: "name", width: 30 },
        { header: "E-mail", key: "email", width: 38 },
        { header: "Departamento", key: "department", width: 24 },
        { header: "Movimentacoes", key: "reservations", width: 16 },
        { header: "Emprestados", key: "borrowed", width: 14 },
        { header: "Devolvidos", key: "returned", width: 14 },
        { header: "Atrasos", key: "overdue", width: 12 },
        { header: "Cancelados", key: "canceled", width: 14 },
        { header: "Ultimo material", key: "lastItemTitle", width: 42 },
        { header: "Ultima reserva", key: "lastReservedAt", width: 18 },
      ],
      libraryReport.readerHistory.map((reader) => ({
        ...reader,
        department: reader.department ?? "Sem departamento",
        lastReservedAt: formatDate(reader.lastReservedAt),
      })),
    );

    addSheet(
      "Entradas",
      [
        { header: "Data", key: "createdAt", width: 16 },
        { header: "Titulo", key: "title", width: 42 },
        { header: "Autor", key: "author", width: 28 },
        { header: "Categoria", key: "category", width: 24 },
        { header: "Tipo", key: "kindLabel", width: 24 },
        { header: "Responsavel", key: "creatorName", width: 28 },
        { header: "Reservas", key: "reservationsCount", width: 14 },
      ],
      libraryReport.recentItems.map((item) => ({
        ...item,
        createdAt: formatDate(item.createdAt),
        creatorName: item.creatorName ?? "Nao informado",
      })),
    );

    addSheet(
      "Movimentacoes",
      [
        { header: "Data reserva", key: "reservedAt", width: 16 },
        { header: "Data emprestimo", key: "borrowedAt", width: 18 },
        { header: "Data devolucao", key: "returnedAt", width: 18 },
        { header: "Status", key: "statusLabel", width: 18 },
        { header: "Titulo", key: "itemTitle", width: 42 },
        { header: "Leitor", key: "userName", width: 30 },
        { header: "E-mail", key: "userEmail", width: 38 },
        { header: "Departamento", key: "userDepartment", width: 24 },
      ],
      libraryReport.recentReservations.map((reservation) => ({
        ...reservation,
        reservedAt: formatDate(reservation.reservedAt),
        borrowedAt: formatDate(reservation.borrowedAt),
        returnedAt: formatDate(reservation.returnedAt),
        userDepartment: reservation.userDepartment ?? "Sem departamento",
      })),
    );

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const suffix = `${reportFrom || "inicio"}-${reportTo || "hoje"}`;
    link.href = url;
    link.download = `relatorio-biblioteca-${suffix}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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
        body: JSON.stringify(buildItemPayload(form)),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFeedback(data.error ?? "Não foi possível catalogar material.");
        return;
      }

      setFeedback("Material catalogado com sucesso.");
      setForm(defaultForm);
      setActiveView("catalog");
      await loadLibrary();
    } catch {
      setFeedback("Falha de conexão ao catalogar material.");
    } finally {
      setBusyAction(null);
    }
  }

  function startEditingItem(item: AdminLibraryItem) {
    setEditingItemId(item.id);
    setEditForm(formFromItem(item));
    setFeedback(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditingItem() {
    setEditingItemId(null);
    setEditForm(defaultForm);
  }

  async function updateItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingItemId || busyAction) return;

    setBusyAction(`edit-${editingItemId}`);
    setFeedback(null);

    try {
      const response = await fetch(`/api/admin/library/items/${editingItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildItemPayload(editForm)),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFeedback(data.error ?? "Não foi possível atualizar o material.");
        return;
      }

      setFeedback("Material atualizado com sucesso.");
      cancelEditingItem();
      await loadLibrary();
      await loadReport();
    } catch {
      setFeedback("Falha de conexão ao atualizar material.");
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

        <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
          <Card className="h-fit p-3 xl:sticky xl:top-8">
            {[
              { id: "catalog" as const, label: "Livros cadastrados", description: "Buscar, editar e controlar exemplares", icon: Library },
              { id: "create" as const, label: "Novo material", description: "Catalogar livro ou repositório", icon: Plus },
              { id: "moves" as const, label: "Movimentações", description: "Reservas, empréstimos e devoluções", icon: BookOpen },
              { id: "reports" as const, label: "Relatórios", description: "Indicadores e PDF do acervo", icon: BarChart3 },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeView === item.id;

              return (
                <button
                  key={item.id}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
                    active ? "bg-[#0264af] text-white shadow-lg shadow-[#0264af]/20" : "text-slate-500 hover:bg-slate-50 hover:text-slate-950",
                  )}
                  onClick={() => setActiveView(item.id)}
                >
                  <Icon size={18} className="mt-0.5 shrink-0" />
                  <span>
                    <span className="block text-sm font-black">{item.label}</span>
                    <span className={cn("mt-0.5 block text-xs font-semibold", active ? "text-white/75" : "text-slate-400")}>
                      {item.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </Card>

          <div className="space-y-6">
        {activeView === "reports" ? (
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
              <Button variant="outline" onClick={() => void downloadReportExcel()} disabled={!libraryReport || reportLoading}>
                <Download size={16} />
                Baixar Excel
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
        ) : null}

        {activeView === "create" ? (
        <div className="grid gap-6">
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
        </div>
        ) : null}

        {activeView === "catalog" ? (
          <div className="space-y-6">
            <Card className="p-5">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950">Livros e materiais cadastrados</h2>
                  <p className="text-sm font-semibold text-slate-500">Pesquise pelo título, autor, ISBN, assunto ou classificação e edite o cadastro quando precisar corrigir algo.</p>
                </div>
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

              {editingItemId ? (
                <form className="mb-5 rounded-2xl border border-blue-100 bg-blue-50/40 p-4" onSubmit={(event) => void updateItem(event)}>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-[#0264af]">Editando material</p>
                      <h3 className="text-lg font-black text-slate-950">{editForm.title || "Material sem título"}</h3>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={cancelEditingItem}>
                      <X size={14} />
                      Fechar
                    </Button>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2">
                    <input className={inputClassName} placeholder="Título" value={editForm.title} onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))} required />
                    <input className={inputClassName} placeholder="Autor principal" value={editForm.mainAuthor} onChange={(event) => setEditForm((current) => ({ ...current, mainAuthor: event.target.value, author: event.target.value || current.author }))} />
                    <input className={inputClassName} placeholder="ISBN" value={editForm.isbn} onChange={(event) => setEditForm((current) => ({ ...current, isbn: event.target.value }))} />
                    <input className={inputClassName} placeholder="ISSN" value={editForm.issn} onChange={(event) => setEditForm((current) => ({ ...current, issn: event.target.value }))} />
                    <select className={inputClassName} value={editForm.kind} onChange={(event) => setEditForm((current) => ({ ...current, kind: event.target.value }))}>
                      {kindOptions.map((kind) => (
                        <option key={kind.value} value={kind.value}>{kind.label}</option>
                      ))}
                    </select>
                    <input className={inputClassName} placeholder="Classificação" value={editForm.category} onChange={(event) => setEditForm((current) => ({ ...current, category: event.target.value }))} required />
                    <input className={inputClassName} placeholder="Assunto" value={editForm.subject} onChange={(event) => setEditForm((current) => ({ ...current, subject: event.target.value }))} />
                    <input className={inputClassName} placeholder="URL da capa" value={editForm.coverUrl} onChange={(event) => setEditForm((current) => ({ ...current, coverUrl: event.target.value }))} />
                    <input className={inputClassName} placeholder="Editora" value={editForm.publisher} onChange={(event) => setEditForm((current) => ({ ...current, publisher: event.target.value }))} />
                    <input className={inputClassName} placeholder="Ano" value={editForm.year} onChange={(event) => setEditForm((current) => ({ ...current, year: event.target.value.replace(/\D/g, "").slice(0, 4) }))} />
                    <input className={inputClassName} placeholder="Chamada / etiqueta da lombada" value={editForm.callNumber} onChange={(event) => setEditForm((current) => ({ ...current, callNumber: event.target.value }))} />
                    <input className={inputClassName} placeholder="Local físico / prateleira" value={editForm.location} onChange={(event) => setEditForm((current) => ({ ...current, location: event.target.value }))} />
                    <input className={inputClassName} placeholder="URL do arquivo/link" value={editForm.materialUrl} onChange={(event) => setEditForm((current) => ({ ...current, materialUrl: event.target.value }))} />
                    <input className={inputClassName} placeholder="Série ou Coleção" value={editForm.seriesCollection} onChange={(event) => setEditForm((current) => ({ ...current, seriesCollection: event.target.value }))} />
                  </div>
                  <textarea className={cn(inputClassName, "mt-3 min-h-24 resize-none")} placeholder="Resumo" value={editForm.description} onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))} />
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <textarea className={cn(inputClassName, "min-h-20 resize-none")} placeholder="Sumário" value={editForm.summary} onChange={(event) => setEditForm((current) => ({ ...current, summary: event.target.value }))} />
                    <textarea className={cn(inputClassName, "min-h-20 resize-none")} placeholder="Nota geral" value={editForm.generalNote} onChange={(event) => setEditForm((current) => ({ ...current, generalNote: event.target.value }))} />
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <input className={inputClassName} placeholder="Total" value={editForm.totalCopies} onChange={(event) => setEditForm((current) => ({ ...current, totalCopies: event.target.value.replace(/\D/g, "") }))} />
                    <input className={inputClassName} placeholder="Disponíveis" value={editForm.availableCopies} onChange={(event) => setEditForm((current) => ({ ...current, availableCopies: event.target.value.replace(/\D/g, "") }))} />
                    <label className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-600">
                      <input type="checkbox" checked={editForm.isDigital} onChange={(event) => setEditForm((current) => ({ ...current, isDigital: event.target.checked, isReservable: event.target.checked ? false : current.isReservable }))} />
                      Digital
                    </label>
                    <label className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-600">
                      <input type="checkbox" checked={editForm.isReservable} disabled={editForm.isDigital} onChange={(event) => setEditForm((current) => ({ ...current, isReservable: event.target.checked }))} />
                      Reservável
                    </label>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <Button type="button" variant="outline" onClick={cancelEditingItem}>Cancelar</Button>
                    <Button type="submit" disabled={busyAction === `edit-${editingItemId}`}>
                      {busyAction === `edit-${editingItemId}` ? "Salvando..." : "Salvar alterações"}
                    </Button>
                  </div>
                </form>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-2">
                {items.map((item) => (
                  <div key={item.id} className="grid gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="grid gap-4 sm:grid-cols-[96px_minmax(0,1fr)]">
                      <div className="flex h-36 w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-100 sm:h-32 sm:w-24">
                        {item.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.coverUrl} alt={item.title} className="h-full w-full object-cover" />
                        ) : (
                          <BookOpen className="text-slate-300" size={34} />
                        )}
                      </div>
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
                      <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">
                        {item.description || item.summary || "Sem resumo cadastrado."}
                      </p>
                    </div>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <Button variant="outline" size="sm" onClick={() => startEditingItem(item)}>
                        <Edit3 size={14} />
                        Editar
                      </Button>
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
          </div>
        ) : null}

        {activeView === "moves" ? (
          <div className="space-y-6">
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
        ) : null}
          </div>
        </div>
      </div>
    </BackofficeShell>
  );
}
